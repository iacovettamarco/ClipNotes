// Gira sulla pagina di ChatGPT. Se ClipNotes ha lasciato un riassunto in
// attesa, lo scrive nella casella del messaggio e lo invia da solo.
//
// NOTA DI MANUTENZIONE: ChatGPT cambia spesso la struttura della pagina.
// Se l'invio automatico smette di funzionare, i punti da aggiornare sono
// i selettori in findInput() e findSendButton() qui sotto. Nel frattempo il
// testo resta negli appunti, quindi l'utente puo' sempre fare Ctrl+V e Invio.

const PENDING_KEY = "clipnotes_pending";
const MAX_AGE_MS = 90 * 1000; // ignora richieste piu' vecchie di 90 secondi

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function findInput() {
  return (
    document.querySelector("#prompt-textarea") ||
    document.querySelector('div[contenteditable="true"]') ||
    document.querySelector("textarea")
  );
}

function findSendButton() {
  return (
    document.querySelector('button[data-testid="send-button"]') ||
    document.querySelector('button[aria-label*="Send"]') ||
    document.querySelector('button[aria-label*="Invia"]')
  );
}

async function waitForInput(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = findInput();
    if (el) return el;
    await sleep(300);
  }
  return null;
}

function insertText(el, text) {
  el.focus();
  if (el.tagName === "TEXTAREA") {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    setter.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    // casella contenteditable (ProseMirror): svuota e inserisci
    el.focus();
    try {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
    } catch (e) {
      el.textContent = text;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function submit(el) {
  const btn = findSendButton();
  if (btn && !btn.disabled) {
    btn.click();
    return;
  }
  // fallback: simula il tasto Invio
  const opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true };
  el.dispatchEvent(new KeyboardEvent("keydown", opts));
  el.dispatchEvent(new KeyboardEvent("keyup", opts));
}

(async function () {
  const data = await chrome.storage.local.get(PENDING_KEY);
  const pending = data[PENDING_KEY];

  if (!pending || !pending.text) return;

  // Consuma subito la richiesta: cosi' un eventuale refresh della pagina
  // non fa ripartire un secondo invio.
  await chrome.storage.local.remove(PENDING_KEY);

  if (Date.now() - pending.savedAt > MAX_AGE_MS) return;

  const input = await waitForInput();
  if (!input) return; // ChatGPT non pronto (es. non loggato): resta il Ctrl+V

  insertText(input, pending.text);
  await sleep(500); // lascia a ChatGPT il tempo di "vedere" il testo
  submit(input);
})();
