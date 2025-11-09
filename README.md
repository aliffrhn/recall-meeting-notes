# Recall This

![Animated walkthrough of Recall This showing upload, transcript, and summary flows](<recall this features/recall this features.gif>)
*Quick GIF tour of the upload → transcript → AI summary flow.*

Recall This is a lightweight meeting-transcript workspace: drop any recording in the browser, choose the Whisper checkpoint that fits your hardware, and get polished text with timestamps in one go. Everything runs locally on your machine—audio files are deleted as soon as transcription finishes.

## Screenshots

![Recall This hero screen showing tagline and privacy note](<recall this features/hero.png>)
*Calm landing screen that explains the privacy-first workflow.*

![Upload form while a recording transcribes with progress bar](<recall this features/record upload.png>)
*Drag in audio, pick a language/model, and watch the upload/progress indicators.*

![Transcript view with timestamped segments](<recall this features/Transcript.png>)
*Live transcript with per-segment timestamps for quick scanning.*

![AI summary module generating bullet notes](<recall this features/AI Summary.png>)
*Optional OpenAI-powered summary for instant meeting recaps.*

## Highlights

- **Private-by-default** – uploads are written to a temp file, processed with Whisper, then removed immediately.
- **Model picker** – switch between tiny/fast checkpoints and large/high-accuracy ones without redeploying.
- **Language hints** – auto-detect by default, with quick overrides for English and Bahasa Indonesia (extendable).
- **Segment view** – inspect timestamped chunks for rapid skim-throughs or editing.
- **Progress feedback** – see a live status bar while uploads/transcriptions complete.
- **AI summary add-on** – optional OpenAI recap triggered from the transcript view once you provide a key.

### Which model should I start with?

- **Most laptops** – use `medium`. It balances speed and accuracy well for meeting notes without needing a big GPU.
- **High-end GPU / desktop** – use `large-v3` for the best accuracy on long calls or multiple speakers.
- **Quick drafts** – use `tiny` or `base` when you just need a rough recap in seconds.

## Requirements

- macOS / Linux / Windows with Python 3.10+
- `ffmpeg` on your `$PATH` (Whisper uses it to decode audio)
- CPU or GPU VRAM capable of running the chosen Whisper model (defaults to `large-v3`; swap to `base`/`small` if needed)
- First run needs internet access so Whisper can download weights

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Running Recall This locally

```bash
# Optional overrides before launching
export WHISPER_MODEL=medium        # default: large-v3
export WHISPER_LANGUAGE=en         # default: auto
export PORT=5050                   # default: 5000

python app.py
```

Then visit `http://localhost:<PORT>` (e.g., `http://localhost:5050`) and:

1. Upload a meeting recording (`.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.webm`, up to ~40 MB).
2. Optionally pick the language and Whisper model in the form.
3. Watch the progress indicator; once complete, the transcript plus per-segment timestamps appear instantly.
4. (Optional) click **OpenAI key setup**, paste your OpenAI key once, and use **Get AI summary** to generate bullet notes. Nothing is stored server-side after refresh.

## Environment knobs

| Variable | Purpose | Notes |
| --- | --- | --- |
| `WHISPER_MODEL` | Default checkpoint | Any model from `WHISPER_MODELS` list |
| `WHISPER_MODELS` | Comma-delimited allowlist | Example: `tiny,base,small,medium,large-v2` |
| `WHISPER_LANGUAGE` | Default language hint | Use ISO codes (`en`, `id`) or spelled-out names |
| `PORT` | Flask port | Defaults to `5000` |
| `OPENAI_API_KEY` | Default key for summaries | Optional; users can still paste their own per upload |
| `OPENAI_SUMMARY_MODEL` | Model used for summaries | Defaults to `gpt-4o-mini` |

### Summaries with OpenAI

- Open the **OpenAI key setup** modal, paste your `sk-…` key (it stays in your browser), then hit **Get AI summary** once a transcript is ready.
- Alternatively, set `OPENAI_API_KEY` on the server and leave the UI field blank; the fallback key is used whenever a summary is requested.
- Recall This only sends the transcript text and selected language to OpenAI during summary generation and never stores the key or responses.
- Change `OPENAI_SUMMARY_MODEL` if you prefer another model (e.g., `gpt-4o-mini`, `gpt-4o-mini-tts`).

These values populate the UI dropdowns so end users can still override them per upload.

## Notes & tips

- Upload limit is 40 MB (`app.config["MAX_CONTENT_LENGTH"]`); raise it if you need longer calls.
- On CPU-only hardware, `fp16=False` keeps things stable. If you have a GPU with FP16 support, you can enable mixed precision in `app.py` for faster runs.
- The first time you choose a new Whisper model, the weights download (~1 GB for base, ~3 GB for large). Subsequent runs reuse the cached files.
- If you extend the UI with more languages or models, remember to update both `WHISPER_MODELS` (backend) and the dropdown labels (frontend).
