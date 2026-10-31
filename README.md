# ClipNotes — Free YouTube Video Summarizer with ChatGPT (No API Key)

**ClipNotes** is a free, open-source Chrome extension that **summarizes any YouTube video in one click** using your normal ChatGPT web account. No API key, no subscription, no cost.

Click the icon while watching a video: ClipNotes reads the **YouTube transcript**, opens **ChatGPT in a temporary chat** and sends the summary request automatically.

🇮🇹 [Versione italiana più sotto](#italiano)

## Features

- **One-click YouTube summary**: no copy-paste, no tab juggling.
- **No API key needed**: works with the free ChatGPT web account.
- **Temporary chat**: summaries don't clutter your ChatGPT history.
- **6 output languages**: English, Italiano, Español, Français, Deutsch, Português.
- **Works with any YouTube interface language**.
- **7 summary styles**:
  - Sections with headings and a short paragraph
  - Key points (bullet list)
  - Study outline (great for students and online courses)
  - TL;DR (2-3 sentences)
  - Simple explanation (like you're new to the topic)
  - Questions & answers
  - Full transcript translation (no summary)
- **Optional key takeaways** at the end.
- **Safety net**: the prompt is also copied to the clipboard; if auto-send ever fails, just press `Ctrl+V` and Enter.
- **Private by design**: no servers, no tracking, no data collection. Everything runs in your browser.

## Install

1. Download this repository (**Code → Download ZIP**) and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.
5. Pin ClipNotes to the toolbar, open a YouTube video and click the icon.

Works in Chrome and other Chromium browsers (Edge, Brave, Opera, Arc).

## How it works

- `content.js` reads the video transcript from YouTube (subtitle files first, then the "Show transcript" panel).
- `popup.js` builds the prompt from the chosen style and language.
- `content_chatgpt.js` pastes the prompt into ChatGPT and sends it.

Requirements: the video must have captions (auto-generated ones count). Very long videos may exceed the ChatGPT message limit, especially without a ChatGPT login.

## Contributing

YouTube and ChatGPT change their pages often. If something breaks, open an issue or a pull request: the selectors to fix are in `content.js` (transcript) and `content_chatgpt.js` (auto-send).

---

## Italiano

**ClipNotes** è un'estensione Chrome gratuita e open source che **riassume i video YouTube con un click** usando il tuo account ChatGPT web: niente API, niente costi.

Mentre guardi un video clicchi l'icona: ClipNotes legge la trascrizione, apre ChatGPT in chat temporanea e invia da solo la richiesta di riassunto, nella lingua che scegli e nello stile che preferisci (titoli + paragrafo, punti chiave, schema di studio, TL;DR, spiegazione semplice, domande e risposte, traduzione integrale).

Installazione: vedi [`ISTRUZIONI.txt`](ISTRUZIONI.txt) (in breve: `chrome://extensions` → Modalità sviluppatore → Carica estensione non pacchettizzata).
