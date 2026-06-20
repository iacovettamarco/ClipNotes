// Gira sulla pagina del video YouTube. Quando il popup lo chiede,
// estrae la trascrizione e la restituisce.
//
// Prova in ordine tre strade per ottenere la trascrizione, perche' YouTube
// ogni tanto ne rende inutilizzabile una:
//   1. sottotitoli in formato json3
//   2. sottotitoli in formato XML
//   3. lettura diretta del pannello "Mostra trascrizione" dalla pagina

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "getTranscript") {
    getTranscript()
      .then(sendResponse)
      .catch((e) =>
        sendResponse({ ok: false, error: "Errore nel leggere la trascrizione: " + String((e && e.message) || e) })
      );
    return true; // risposta asincrona
  }
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- lettura dei dati del player -------------------------------------------

function extractJsonObject(text, from) {
  const start = text.indexOf("{", from);
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function extractPlayerResponse() {
  const scripts = document.querySelectorAll("script");
  for (const s of scripts) {
    const txt = s.textContent;
    if (!txt || txt.indexOf("ytInitialPlayerResponse") === -1) continue;
    const idx = txt.indexOf("ytInitialPlayerResponse");
    const eq = txt.indexOf("=", idx);
    if (eq === -1) continue;
    const json = extractJsonObject(txt, eq + 1);
    if (json) {
      try {
        return JSON.parse(json);
      } catch (e) {
        // continua a cercare in altri script
      }
    }
  }
  return null;
}

// --- recupero dei sottotitoli ----------------------------------------------

function decodeEntities(s) {
  const ta = document.createElement("textarea");
  ta.innerHTML = s;
  return ta.value;
}

// Scarica una singola traccia di sottotitoli; prova json3, poi XML.
// Restituisce il testo o null (senza mai lanciare errori).
async function fetchCaption(baseUrl) {
  // 1) formato json3
  try {
    const u = baseUrl + (baseUrl.includes("?") ? "&" : "?") + "fmt=json3";
    const r = await fetch(u);
    const t = await r.text();
    if (t && t.trim()) {
      const data = JSON.parse(t);
      const out = (data.events || [])
        .filter((e) => e.segs)
        .map((e) => e.segs.map((s) => s.utf8).join(""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (out) return out;
    }
  } catch (e) {
    // passa al formato successivo
  }

  // 2) formato XML (baseUrl senza fmt)
  try {
    const r = await fetch(baseUrl);
    const t = await r.text();
    if (t && t.trim()) {
      const doc = new DOMParser().parseFromString(t, "text/xml");
      const nodes = doc.querySelectorAll("text");
      if (nodes.length) {
        const out = [...nodes]
          .map((n) => decodeEntities(n.textContent || ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (out) return out;
      }
    }
  } catch (e) {
    // niente
  }

  return null;
}

// --- terza strada: leggere il pannello "Mostra trascrizione" ---------------

function findTranscriptButton() {
  const candidates = document.querySelectorAll(
    "button, tp-yt-paper-button, ytd-button-renderer, yt-button-shape, [role='button']"
  );
  for (const b of candidates) {
    const label =
      ((b.getAttribute && (b.getAttribute("aria-label") || "")) + " " + (b.textContent || "")).toLowerCase();
    if (label.includes("trascrizion") || label.includes("transcript")) {
      if (b.tagName === "BUTTON") return b;
      const inner = b.querySelector && b.querySelector("button");
      return inner || b;
    }
  }
  return null;
}

function readTranscriptSegments() {
  // Due formati possibili:
  //   - nuovo (2024+): <transcript-segment-view-model>, testo in uno
  //     <span role="text">, orario in un div separato da scartare
  //   - vecchio: <ytd-transcript-segment-renderer>, testo in .segment-text
  const segs = document.querySelectorAll(
    "transcript-segment-view-model, ytd-transcript-segment-renderer"
  );
  if (!segs.length) return null;

  const out = [...segs]
    .map((s) => {
      const el =
        s.querySelector('span[role="text"]') ||
        s.querySelector(".segment-text") ||
        s.querySelector("yt-formatted-string");
      // Se non troviamo l'elemento del testo, NON usiamo l'intero segmento
      // (conterrebbe anche l'orario): meglio saltarlo.
      return el ? (el.textContent || "").trim() : "";
    })
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return out || null;
}

// E' gia' aperto il pannello della trascrizione nella pagina?
function isTranscriptPanelOpen() {
  return !!document.querySelector(
    "ytd-transcript-renderer, ytd-transcript-search-panel-renderer, ytd-transcript-segment-list-renderer"
  );
}

async function getTranscriptFromDOM() {
  // Se il pannello e' gia' aperto e leggibile, usalo subito.
  let text = readTranscriptSegments();
  if (text) return text;

  // Apri il pannello SOLO se non e' gia' aperto: altrimenti cliccare il
  // pulsante lo richiuderebbe, sabotando la lettura.
  if (!isTranscriptPanelOpen()) {
    const btn = findTranscriptButton();
    if (btn) btn.click();
  }

  // Aspetta che i segmenti compaiano (fino a ~7,5 secondi).
  for (let i = 0; i < 25; i++) {
    await sleep(300);
    text = readTranscriptSegments();
    if (text) return text;
  }

  return null;
}

// --- orchestrazione --------------------------------------------------------

async function getTranscript() {
  const player = extractPlayerResponse();
  const title = (player && player.videoDetails && player.videoDetails.title) || document.title;

  let transcript = null;

  const tracks =
    player &&
    player.captions &&
    player.captions.playerCaptionsTracklistRenderer &&
    player.captions.playerCaptionsTracklistRenderer.captionTracks;

  if (tracks && tracks.length) {
    // preferisci italiano, poi inglese, poi il resto
    const ordered = [
      ...tracks.filter((t) => t.languageCode === "it"),
      ...tracks.filter((t) => t.languageCode === "en"),
      ...tracks.filter((t) => t.languageCode !== "it" && t.languageCode !== "en"),
    ];
    for (const track of ordered) {
      transcript = await fetchCaption(track.baseUrl);
      if (transcript) break;
    }
  }

  // terza strada: il pannello trascrizione nella pagina
  if (!transcript) {
    transcript = await getTranscriptFromDOM();
  }

  if (!transcript) {
    return {
      ok: false,
      error:
        "Non riesco a leggere la trascrizione di questo video. Prova ad aprire il pannello 'Mostra trascrizione' sotto il video e riprova, oppure il video potrebbe non avere sottotitoli.",
    };
  }

  return { ok: true, title, transcript };
}
