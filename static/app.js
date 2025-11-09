const form = document.getElementById("upload-form");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const outputSection = document.getElementById("output");
const segmentsDetails = document.getElementById("segments");
const segmentsList = document.getElementById("segments-list");
const audioInput = document.getElementById("audio");
const languageSelect = document.getElementById("language");
const modelSelect = document.getElementById("model");
const copyButton = document.getElementById("copy-transcript");
const copyButtonLabel = copyButton?.querySelector(".ghost-label");
const modelHint = document.getElementById("model-hint");
const progressWrapper = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

let progressInterval = null;
const PROGRESS_MAX_BEFORE_COMPLETE = 92;

const clearProgressInterval = () => {
  if (progressInterval !== null) {
    window.clearInterval(progressInterval);
    progressInterval = null;
  }
};

const setProgressMessage = (message) => {
  if (progressText) {
    progressText.textContent = message;
  }
};

const startProgress = (message = "Processing audio…") => {
  if (!progressWrapper || !progressBar) return;
  clearProgressInterval();
  progressWrapper.hidden = false;
  progressBar.style.width = "0%";
  setProgressMessage(message);

  let current = 0;
  progressInterval = window.setInterval(() => {
    current = Math.min(current + Math.random() * 10, PROGRESS_MAX_BEFORE_COMPLETE);
    progressBar.style.width = `${current}%`;
  }, 450);
};

const finishProgress = (message = "Wrapping up…") => {
  if (!progressWrapper || !progressBar) return;
  setProgressMessage(message);
  clearProgressInterval();
  progressBar.style.width = "100%";
  window.setTimeout(() => {
    progressWrapper.hidden = true;
    progressBar.style.width = "0%";
  }, 650);
};

const failProgress = () => {
  if (!progressWrapper || !progressBar) return;
  clearProgressInterval();
  progressWrapper.hidden = true;
  progressBar.style.width = "0%";
};

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = type ? type : "";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!audioInput.files?.length) {
    setStatus("Choose an audio file first", "error");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  setStatus("Uploading and transcribing…");

  const formData = new FormData();
  formData.append("audio", audioInput.files[0]);
  if (languageSelect) {
    formData.append("language", languageSelect.value || "auto");
  }
  if (modelSelect) {
    formData.append("model", modelSelect.value);
  }

  startProgress("Uploading audio…");

  try {
    const response = await fetch("/transcribe", {
      method: "POST",
      body: formData,
    });
    setProgressMessage("Transcribing audio…");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to transcribe file");
    }

    finishProgress("Transcription complete");
    setStatus("Transcription complete", "success");
    transcriptEl.textContent = data.text || "[No speech detected]";
    outputSection.hidden = false;
    if (copyButton) {
      copyButton.disabled = !data.text;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
      }
    }

    if (data.segments?.length) {
      segmentsList.innerHTML = "";
      const fragment = document.createDocumentFragment();
      data.segments.forEach(({ start, end, text }) => {
        const item = document.createElement("li");
        const range = document.createElement("strong");
        range.textContent = `${start}s → ${end}s:`;
        item.append(range, " ", text);
        fragment.appendChild(item);
      });
      segmentsList.appendChild(fragment);
      segmentsDetails.hidden = false;
    } else {
      segmentsDetails.hidden = true;
      segmentsList.innerHTML = "";
    }
  } catch (error) {
    failProgress();
    setStatus(error.message, "error");
    outputSection.hidden = true;
    if (copyButton) {
      copyButton.disabled = true;
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copy transcript";
      }
    }
  } finally {
    submitButton.disabled = false;
  }
});

if (copyButton) {
  copyButton.disabled = true;
  copyButton.addEventListener("click", async () => {
    if (!transcriptEl.textContent?.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(transcriptEl.textContent);
      if (copyButtonLabel) {
        copyButtonLabel.textContent = "Copied!";
      }
      copyButton.classList.add("copied");
      window.setTimeout(() => {
        copyButton.classList.remove("copied");
        if (copyButtonLabel) {
          copyButtonLabel.textContent = "Copy transcript";
        }
      }, 1500);
    } catch (error) {
      setStatus("Unable to copy transcript", "error");
    }
  });
}

const updateModelHint = () => {
  if (!modelSelect || !modelHint) return;
  const selectedOption = modelSelect.options[modelSelect.selectedIndex];
  const hint = selectedOption?.dataset?.hint;
  const isRecommended = selectedOption?.dataset?.recommended === "True";
  if (!hint) return;
  modelHint.textContent = isRecommended ? `${hint} · 👍 recommended` : hint;
};

if (modelSelect) {
  updateModelHint();
  modelSelect.addEventListener("change", updateModelHint);
}
