## Recall This · Private Meeting Notes with AI Recaps

![Animated walkthrough of Recall This showing upload, transcript, and summary flows](<recall this features/recall this features.gif>)

A local-first web app for turning any meeting recording into a searchable transcript (with timestamps) and optional AI bullet summary without sending audio to third-party servers.

## Key Features

* 📂 **Drop & Go uploads**: drag audio (MP3, WAV, M4A, FLAC, OGG, WEBM up to 40 MB) straight into the browser.
* 🧠 **On device Whisper**: pick the checkpoint that fits your hardware (`tiny` to `large-v3`); audio is wiped after transcription.
* 🌐 **Language control**: auto-detect by default with manual overrides (English + Bahasa out of the box, extensible).
* ⏱️ **Segmented transcripts**: per-utterance timestamps for quick skim, copy, or downstream edits.
* 📊 **Progress feedback**: clear status and progress bar from upload through transcription.
* 🤖 **AI summaries (optional)**: bring your own OpenAI key and generate concise recap bullets in-app.

## Feature Showcase

![Recall This hero screen showing tagline and privacy note](<recall this features/hero.png>)
*Calm landing screen that explains the privacy-first workflow.*

![Upload form while a recording transcribes with progress bar](<recall this features/record upload.png>)
*Drag in audio, pick a language/model, and watch the upload/progress indicators.*

![Transcript view with timestamped segments](<recall this features/Transcript.png>)
*Live transcript with per-segment timestamps for quick scanning.*

![AI summary module generating bullet notes](<recall this features/AI Summary.png>)
*Optional OpenAI-powered summary for instant meeting recaps.*

## Requirements

* macOS / Linux / Windows
* Python 3.10+
* `ffmpeg` installed and on your `PATH`
* Enough CPU/GPU VRAM for the Whisper model you choose (defaults to `large-v3`)
* First run needs internet to download Whisper weights

## Whisper Background

Recall This runs entirely on [OpenAI's Whisper](https://github.com/openai/whisper), an open-source speech recognition model capable of multilingual transcription and translation. Each dropdown model maps directly to a Whisper checkpoint (`tiny` through `large-v3`), so you can pick the speed/accuracy trade-off that fits your hardware. The official repository above dives into architecture notes, benchmarks, setup tips, and GPU best practices if you need more detail.

## Quick Start

```bash
python3 -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

```bash
# Optional overrides before launch
export WHISPER_MODEL=medium            # default: large-v3
export WHISPER_LANGUAGE=en             # default: auto
export PORT=5050                       # default: 5000

python app.py
```

Visit `http://localhost:<PORT>` and:

1. Upload a meeting recording.
2. (Optional) select language + Whisper model from the dropdowns.
3. Watch the progress indicator; when it hits 100 %, the transcript + segment list appear instantly.
4. (Optional) open **OpenAI key setup**, paste your `sk-…` key (stored locally), then click **Get AI summary**.

## Configuration

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Purpose</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>WHISPER_MODEL</code></td>
      <td>Default checkpoint</td>
      <td>Must exist in <code>WHISPER_MODELS</code>; fallback is recommended model</td>
    </tr>
    <tr>
      <td><code>WHISPER_MODELS</code></td>
      <td>Comma-separated allowlist</td>
      <td>Example: <code>tiny,base,small,medium,large-v2</code></td>
    </tr>
    <tr>
      <td><code>WHISPER_RECOMMENDED_MODEL</code></td>
      <td>Highlighted dropdown choice</td>
      <td>Defaults to <code>medium</code>; controls the UI “recommended” badge</td>
    </tr>
    <tr>
      <td><code>WHISPER_LANGUAGE</code></td>
      <td>Default language hint</td>
      <td><code>auto</code> (or unset) keeps auto-detect</td>
    </tr>
    <tr>
      <td><code>PORT</code></td>
      <td>Flask port</td>
      <td>Default <code>5000</code></td>
    </tr>
    <tr>
      <td><code>OPENAI_API_KEY</code></td>
      <td>Server-side fallback key</td>
      <td>Users can still provide their own in-browser</td>
    </tr>
    <tr>
      <td><code>OPENAI_SUMMARY_MODEL</code></td>
      <td>Model for summaries</td>
      <td>Defaults to <code>gpt-4o-mini</code></td>
    </tr>
    <tr>
      <td><code>OPENAI_API_BASE</code></td>
      <td>Custom OpenAI-compatible endpoint</td>
      <td>Defaults to <code>https://api.openai.com/v1</code></td>
    </tr>
  </tbody>
</table>

Update environment variables before running, or bake them into your process manager.

## AI Summaries

1. Tap **OpenAI key setup** and paste an API key; it lives only in local storage.
2. Generate summaries whenever a transcript is present; only the plain text plus language hint is sent.
3. Want managed keys? Set `OPENAI_API_KEY` server-side and leave the UI field blank; the fallback triggers when users click **Get AI summary**.
4. Adjust `OPENAI_SUMMARY_MODEL` to match your account limits or pricing preferences.

The prompt encourages concise, neutral recaps (sentences or bullets) covering topics, decisions, and follow-ups.

## How It Works

1. **Upload:** the file is written to a temp path and validated for size + extension.
2. **Transcribe:** Whisper runs locally; outputs plain text plus timestamped segments.
3. **Clean-up:** the temp audio file is deleted immediately after transcription completes.
4. **Optional Summary:** when requested, transcript text is sent to OpenAI’s Chat Completions API and the response is rendered in the UI.

All state resets on refresh; nothing is stored server-side beyond transient temp files.

## Tips & Troubleshooting

* **40 MB upload cap**: tweak `app.config["MAX_CONTENT_LENGTH"]` if you need longer calls.
* **On CPUs**: consider smaller models (`medium`, `small`, `base`) for faster runs; disable FP16 to avoid precision issues.
* **First model load**: weights download once (≈1–3 GB depending on model); cached afterward.
* **Language list**: extend `WHISPER_MODELS` plus the front-end dropdowns when adding new languages or checkpoints.
* **Key hygiene**: the server never stores API keys; local storage clears on browser data reset.
* **ffmpeg missing?**: ensure it’s installed and accessible; Whisper relies on it for decoding.

*Capture the conversation, keep it private, and share only the insights.*
