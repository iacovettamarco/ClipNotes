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
  `json3` → XML → lettura del pannello "Mostra trascrizione" dal DOM. Oggi
  `timedtext` risponde vuoto (YouTube vuole un token anti-bot), quindi lavora
  di fatto **solo il pannello**: il pulsante compare qualche secondo dopo il
  caricamento, per questo lo script lo aspetta. I dati nello `<script>` della
  pagina valgono solo se il `videoId` coincide con l'URL (dopo autoplay/cambio
  video sono vecchi). Lo script è caricato su tutto `youtube.com/*` perché
  YouTube cambia pagina senza ricaricare.
- `popup.js` — costruzione prompt: oggetto `STYLES` + caso speciale `traduci` in
  `buildPrompt`. Gli **stili** (titoli+paragrafo, punti chiave, schema di studio,
  TL;DR, spiegazione semplice, Q&A, traduzione integrale) e la spunta "take-away
  finali" (ignorata in traduzione) sono qui; la scelta è ricordata via storage.
  **Lingua di uscita** (oggetto `LANGS`, 6 lingue, default = lingua del
  browser): il prompt resta in italiano, cambia solo la lingua richiesta.
  Il popup è in italiano; README in inglese per la SEO di GitHub.
- `content_chatgpt.js` — content script su `chatgpt.com` che incolla e invia.
- `manifest.json`, `popup.html`, `icons/`.

## Installazione / uso
Caricare come **"estensione non pacchettizzata"** da `chrome://extensions`
(Modalità sviluppatore attiva). Dettagli in [`ISTRUZIONI.txt`](ISTRUZIONI.txt);
panoramica in [`README.md`](README.md).

## Manutenzione
Se ChatGPT o YouTube cambiano il DOM, ritoccare `content_chatgpt.js` (auto-invio)
o `content.js` (estrazione). Il repo GitHub è **pubblico**
(github.com/iacovettamarco/ClipNotes: niente segreti nei file, mai aggiungerne)
e ha un hook che fa
commit+push automatico a ogni modifica di un file ClipNotes.
