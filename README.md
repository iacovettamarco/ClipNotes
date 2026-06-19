# ClipNotes

Estensione Chrome (Manifest V3) che **riassume i video YouTube** con un solo click, usando ChatGPT.

## Cosa fa

Con un click sull'icona dell'estensione mentre guardi un video YouTube:

1. Legge automaticamente la **trascrizione** del video.
2. Apre **ChatGPT** in una chat temporanea (`?temporary-chat=true`).
3. Incolla e invia un **prompt di riassunto in italiano**.

Se l'invio automatico non riesce, il testo resta comunque negli **appunti** per un semplice `Ctrl+V`.

Nessuna API e nessun costo: usa il tuo account ChatGPT web.

## Stili di riassunto

Dal menu nel popup (la scelta viene ricordata):

- Titoli + paragrafo
- Punti chiave
- Schema di studio
- TL;DR
- Spiegazione semplice
- Domande & risposte
- Traduzione integrale

In più, una spunta opzionale per i **take-away finali** (ignorata in modalità traduzione).

## Come funziona dentro

- **Estrazione trascrizione robusta** (`content.js`): tre metodi a cascata — `json3` → XML → lettura del pannello "Mostra trascrizione" dal DOM, perché YouTube a volte svuota le risposte `timedtext`.
- **Costruzione prompt** (`popup.js`): oggetto `STYLES` + caso speciale `traduci` in `buildPrompt`.
- **Auto-invio su ChatGPT** (`content_chatgpt.js`): content script su `chatgpt.com` che incolla e invia il prompt.

## Installazione

Vedi [`ISTRUZIONI.txt`](ISTRUZIONI.txt): in breve, va caricata come **"estensione non pacchettizzata"** da `chrome://extensions` (attiva la *Modalità sviluppatore*).

## Note

Se ChatGPT o YouTube cambiano il DOM, potrebbe servire un piccolo ritocco a `content_chatgpt.js` (auto-invio) o a `content.js` (estrazione trascrizione).
