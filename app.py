import logging
import os
import tempfile
from pathlib import Path
from typing import Dict, List

import whisper
from flask import Flask, jsonify, render_template, request

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 40 * 1024 * 1024  # 40 MB upload limit
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"}

MODEL_CHOICES_ENV = os.environ.get("WHISPER_MODELS")
if MODEL_CHOICES_ENV:
    MODEL_CHOICES = [item.strip() for item in MODEL_CHOICES_ENV.split(",") if item.strip()]
else:
    MODEL_CHOICES = [
        "tiny",
        "base",
        "small",
        "medium",
        "large-v2",
        "large-v3",
    ]

DEFAULT_MODEL = os.environ.get("WHISPER_MODEL") or MODEL_CHOICES[-1]
if DEFAULT_MODEL not in MODEL_CHOICES:
    MODEL_CHOICES.append(DEFAULT_MODEL)

MODEL_DESCRIPTIONS = {
    "tiny": "Fastest speed · lowest accuracy",
    "base": "Very fast speed · moderate accuracy",
    "small": "Fast speed · good accuracy",
    "medium": "Moderate speed · high accuracy",
    "large-v2": "Slow speed · very high accuracy",
    "large-v3": "Slowest speed · highest accuracy",
}

DEFAULT_LANGUAGE = os.environ.get("WHISPER_LANGUAGE")
_MODEL_CACHE: Dict[str, whisper.Whisper] = {}


def get_model(model_name: str):
    if model_name not in _MODEL_CACHE:
        app.logger.info("Loading Whisper model '%s'…", model_name)
        _MODEL_CACHE[model_name] = whisper.load_model(model_name)
        app.logger.info("Whisper model '%s' ready", model_name)
    return _MODEL_CACHE[model_name]

def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

@app.route("/")
def index():
    model_options = []
    for model_name in MODEL_CHOICES:
        description = MODEL_DESCRIPTIONS.get(model_name, "Balanced performance")
        pretty_name = model_name.replace("-", " ").title()
        label = f"{pretty_name} · {description}"
        display_label = label
        model_options.append(
            {
                "value": model_name,
                "label": display_label,
                "description": description,
                "is_recommended": model_name == "medium",
            }
        )
    return render_template(
        "index.html",
        model_choices=MODEL_CHOICES,
        model_options=model_options,
        default_model=DEFAULT_MODEL,
        default_model_description=MODEL_DESCRIPTIONS.get(DEFAULT_MODEL, "Balanced performance"),
    )

@app.post("/transcribe")
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    upload = request.files["audio"]

    if upload.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(upload.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    suffix = Path(upload.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        upload.save(tmp)
        tmp_path = tmp.name

    model_name = (request.form.get("model") or DEFAULT_MODEL).strip()
    if model_name not in MODEL_CHOICES:
        return jsonify({"error": f"Unsupported model '{model_name}'"}), 400

    language = request.form.get("language") or DEFAULT_LANGUAGE
    if language:
        language = language.strip().lower()
        if language in {"auto", "default"}:
            language = None
        elif language in {"id", "indo", "bahasa"}:
            language = "indonesian"
        elif language in {"en", "eng"}:
            language = "english"

    try:
        app.logger.info("Starting transcription for %s with %s", upload.filename, model_name)
        model = get_model(model_name)
        transcribe_kwargs = dict(fp16=False, verbose=True)
        if language:
            transcribe_kwargs["language"] = language
            app.logger.info("Using language override: %s", language)
        result: Dict = model.transcribe(tmp_path, **transcribe_kwargs)
        app.logger.info("Completed transcription for %s", upload.filename)
    except Exception as exc:  # pragma: no cover - runtime guard
        return jsonify({"error": str(exc)}), 500
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    segments: List[Dict] = [
        {
            "start": round(segment["start"], 2),
            "end": round(segment["end"], 2),
            "text": segment["text"].strip(),
        }
        for segment in result.get("segments", [])
    ]

    return jsonify(
        {
            "text": result.get("text", "").strip(),
            "language": result.get("language"),
            "segments": segments,
        }
    )


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=debug)
