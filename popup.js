const btn = document.getElementById("go");
const statusEl = document.getElementById("status");
const styleSel = document.getElementById("style");
const takeawayChk = document.getElementById("takeaway");
const langSel = document.getElementById("lang");

// Lingua in cui ChatGPT deve scrivere il risultato.
const LANGS = {
  it: "italiano",
  en: "inglese (English)",
  es: "spagnolo (español)",
  fr: "francese (français)",
  de: "tedesco (Deutsch)",
  pt: "portoghese (português)",
};

// Default: la lingua del browser, se e' tra quelle disponibili; altrimenti inglese.
const browserLang = (chrome.i18n.getUILanguage() || "en").slice(0, 2);
langSel.value = LANGS[browserLang] ? browserLang : "en";

function setStatus(text) {
  statusEl.textContent = text;
}

// Istruzione specifica per ogni tipo di riassunto.
const STYLES = {
  titoli:
    "Dividi il contenuto in sezioni: per ognuna scrivi un titolo chiaro seguito da un breve paragrafo discorsivo che ne spiega i punti principali.",
  punti:
    "Elenca i concetti principali come punti di un elenco puntato, sintetici e chiari.",
  studio:
    "Crea uno schema gerarchico pensato per lo studio: titoli delle sezioni principali e, sotto ciascuno, sotto-punti puntati con i dettagli importanti. Deve essere comodo da ripassare velocemente.",
  tldr:
    "Scrivi un riassunto molto breve, di 2-3 frasi, che catturi solo il messaggio essenziale del video.",
  semplice:
    "Spiega il contenuto in modo semplice, come a chi non sa nulla dell'argomento: usa parole facili ed esempi o analogie dove aiutano.",
  domande:
    "Individua le domande principali a cui il video risponde e, per ognuna, dai una risposta breve. Usa il formato 'Domanda: ... / Risposta: ...'.",
};

const TAKEAWAY =
  " Alla fine, aggiungi una sezione intitolata \"Take-away\" con i 3-5 punti piu' importanti da ricordare, in forma pratica e azionabile.";

function buildPrompt(title, transcript, style, withTakeaway, lang) {
  const lingua = LANGS[lang] || LANGS.it;

  // Caso speciale: traduzione integrale (non e' un riassunto).
  if (style === "traduci") {
    return `Traduci in ${lingua} il testo seguente, che e' la trascrizione di un video di YouTube. Traduci tutto, senza riassumere e senza tralasciare parti. Rendi il testo scorrevole e leggibile, mantenendo l'ordine originale. Se il testo e' gia' in ${lingua}, limitati a sistemarne la punteggiatura e la leggibilita'.

Titolo del video: ${title}

Testo da tradurre:
${transcript}`;
  }

  const instr = STYLES[style] || STYLES.titoli;
  const extra = withTakeaway ? TAKEAWAY : "";
  return `Riassumi questo video di YouTube. Scrivi tutta la risposta in ${lingua}, anche i titoli delle sezioni. ${instr} Mantieni l'ordine degli argomenti trattati nel video.${extra}

Titolo del video: ${title}

Trascrizione:
${transcript}`;
}

// Ripristina l'ultima scelta fatta, cosi' resta comoda tra un uso e l'altro.
(async function restorePrefs() {
  try {
    const saved = await chrome.storage.local.get(["clipnotes_style", "clipnotes_takeaway"]);
    if (saved.clipnotes_style && STYLES[saved.clipnotes_style]) {
      styleSel.value = saved.clipnotes_style;
    }
    if (typeof saved.clipnotes_takeaway === "boolean") {
      takeawayChk.checked = saved.clipnotes_takeaway;
    }
  } catch (e) {
    // se non riesce, restano i valori di default
  }
})();

btn.addEventListener("click", async () => {
  btn.disabled = true;
  setStatus("Leggo la trascrizione...");

  const style = styleSel.value;
  const withTakeaway = takeawayChk.checked;

  // Ricorda le preferenze per la prossima volta.
  try {
    await chrome.storage.local.set({
      clipnotes_style: style,
      clipnotes_takeaway: withTakeaway,
    });
  } catch (e) {
    // non bloccante
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.includes("youtube.com/watch")) {
    setStatus("Apri prima un video di YouTube, poi riprova.");
    btn.disabled = false;
    return;
  }

  let resp;
  try {
    resp = await chrome.tabs.sendMessage(tab.id, { action: "getTranscript" });
  } catch (e) {
    setStatus("Ricarica la pagina del video (F5) e riprova.");
    btn.disabled = false;
    return;
  }

  if (!resp || !resp.ok) {
    setStatus(resp && resp.error ? resp.error : "Trascrizione non trovata.");
    btn.disabled = false;
    return;
  }

  const prompt = buildPrompt(resp.title, resp.transcript, style, withTakeaway);

  // Salva il prompt: il content script su ChatGPT lo legge, lo incolla e lo invia.
  try {
    await chrome.storage.local.set({
      clipnotes_pending: { text: prompt, savedAt: Date.now() },
    });
  } catch (e) {
    // resta comunque il fallback degli appunti
  }

  // Rete di sicurezza: copia negli appunti per il Ctrl+V manuale.
  try {
    await navigator.clipboard.writeText(prompt);
  } catch (e) {
    // non bloccante
  }

  setStatus("Apro ChatGPT (chat temporanea): il riassunto parte da solo. Se non parte, clicca nella casella e fai Ctrl+V e Invio.");
  chrome.tabs.create({ url: "https://chatgpt.com/?temporary-chat=true" });
  btn.disabled = false;
});
