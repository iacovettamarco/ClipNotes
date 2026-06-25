# ClipNotes

Estensione Chrome (Manifest V3) che **riassume i video YouTube** con un click,
appoggiandosi all'account ChatGPT web (nessuna API, nessun costo).

## Cosa fa
Click sull'icona mentre guardi un video → legge la trascrizione → apre ChatGPT
in chat temporanea (`?temporary-chat=true`) → incolla e invia un prompt di
riassunto in italiano. Se l'auto-invio fallisce, il testo resta negli appunti
per un `Ctrl+V` manuale.

## File chiave
- `content.js` — **estrazione trascrizione robusta**, tre metodi a cascata:
  `json3` → XML → lettura del pannello "Mostra trascrizione" dal DOM (YouTube a
  volte svuota le risposte `timedtext`).
- `popup.js` — costruzione prompt: oggetto `STYLES` + caso speciale `traduci` in
  `buildPrompt`. Gli **stili** (titoli+paragrafo, punti chiave, schema di studio,
  TL;DR, spiegazione semplice, Q&A, traduzione integrale) e la spunta "take-away
  finali" (ignorata in traduzione) sono qui; la scelta è ricordata via storage.
- `content_chatgpt.js` — content script su `chatgpt.com` che incolla e invia.
- `manifest.json`, `popup.html`, `icons/`.

## Installazione / uso
Caricare come **"estensione non pacchettizzata"** da `chrome://extensions`
(Modalità sviluppatore attiva). Dettagli in [`ISTRUZIONI.txt`](ISTRUZIONI.txt);
panoramica in [`README.md`](README.md).

## Manutenzione
Se ChatGPT o YouTube cambiano il DOM, ritoccare `content_chatgpt.js` (auto-invio)
o `content.js` (estrazione). Il repo GitHub è **privato** e ha un hook che fa
commit+push automatico a ogni modifica di un file ClipNotes.
