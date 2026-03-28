console.log("SpeechToText.js is running");

// ─── Web Speech API Recognition ──────────────────────────────────────────────
let recognition = null;
let isListening = false;

function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported, using HuggingFace fallback");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onstart = () => {
    isListening = true;
    showListeningIndicator(true);
    speakText("Listening. Say a command.");
  };

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    console.log("Heard:", transcript);
    handleVoiceCommand(transcript);
  };

  rec.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    showListeningIndicator(false);
    if (event.error !== 'aborted') {
      speakText("Could not understand. Please try again.");
    }
  };

  rec.onend = () => {
    isListening = false;
    showListeningIndicator(false);
  };

  return rec;
}

function startListening() {
  if (isListening) {
    stopListening();
    return;
  }

  if (!recognition) recognition = initRecognition();

  if (recognition) {
    try {
      recognition.start();
    } catch (e) {
      console.error("Recognition start error:", e);
    }
  } else {
    // Fallback: MediaRecorder + HuggingFace Whisper
    startRecordingFallback();
  }
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
  }
  isListening = false;
  showListeningIndicator(false);
}

// ─── Voice Command Handler ────────────────────────────────────────────────────
function handleVoiceCommand(transcript) {
  console.log("Processing command:", transcript);

  // Command: "go to number X" / "navigate to X" / "element X" / just a number
  const gotoMatch = transcript.match(/(?:go to|navigate to|element|number|tab to)?\s*(\d+|[a-z\s-]+)/i);

  // Command: "stop" / "be quiet" / "silence"
  if (/\b(stop|quiet|silence|shut up|pause)\b/.test(transcript)) {
    stopSpeaking();
    return;
  }

  // Command: "read page" / "describe page"
  if (/\b(read page|describe page|what is on this page|read this)\b/.test(transcript)) {
    const title = document.title || 'Untitled page';
    const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
      .map(h => h.textContent.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(', ');
    speakText(`Page title: ${title}. Main headings: ${headings || 'none found'}.`);
    return;
  }

  // Command: "click" / "press" / "activate" / "enter"
  if (/\b(click|press|activate|enter|open)\b/.test(transcript)) {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      focused.click();
      speakText(`Clicked: ${parserHTML(focused)}`);
    } else {
      speakText("No element is focused.");
    }
    return;
  }

  // Command: "next" — move to next focusable element
  if (/\bnext\b/.test(transcript)) {
    moveFocusBy(1);
    return;
  }

  // Command: "previous" / "back"
  if (/\b(previous|back|prev)\b/.test(transcript)) {
    moveFocusBy(-1);
    return;
  }

  // Command: "scroll down" / "scroll up"
  if (/scroll down/.test(transcript)) {
    window.scrollBy(0, 300);
    speakText("Scrolled down");
    return;
  }
  if (/scroll up/.test(transcript)) {
    window.scrollBy(0, -300);
    speakText("Scrolled up");
    return;
  }

  // Command: "go to top" / "top of page"
  if (/\b(top|go to top|beginning)\b/.test(transcript)) {
    window.scrollTo(0, 0);
    speakText("Jumped to top of page");
    return;
  }

  // Command: navigate to element number
  const numWord = transcript.match(/\b([a-z][\w\s-]*|\d+)\b/);
  if (numWord) {
    // Try direct number
    const directNum = transcript.match(/\b(\d+)\b/);
    if (directNum) {
      tabToIndex(parseInt(directNum[1]));
      return;
    }
    // Try word-to-number conversion
    const converted = textToNumber(transcript.trim());
    if (converted > 0) {
      tabToIndex(converted);
      return;
    }
  }

  speakText(`Command not recognized: ${transcript}`);
}

function moveFocusBy(direction) {
  const all = Array.from(document.querySelectorAll('[data-tabindex]'));
  const current = document.activeElement;
  const currentIdx = all.indexOf(current);
  const next = all[currentIdx + direction];
  if (next) {
    next.focus();
    speakText(parserHTML(next));
  } else {
    speakText(direction > 0 ? "No more elements forward" : "No more elements backward");
  }
}

function tabToIndex(index) {
  const elements = document.querySelectorAll('[data-tabindex]');
  if (elements.length === 0) {
    speakText("No navigable elements on this page");
    return;
  }
  const element = elements[index - 1];
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const description = `Element ${index}: ${parserHTML(element)}`;
    speakText(description);
  } else {
    speakText(`Element ${index} not found. Page has ${elements.length} elements.`);
  }
}

// ─── Visual Listening Indicator (no audio files) ─────────────────────────────
let indicator = null;

function showListeningIndicator(show) {
  if (show) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'blindful-listening-indicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1a1a2e;
        color: #fff;
        padding: 12px 20px;
        border-radius: 50px;
        font-family: sans-serif;
        font-size: 15px;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        border: 2px solid #e94560;
        animation: blindful-pulse 1s infinite;
      `;
      indicator.innerHTML = `
        <span style="
          width: 12px; height: 12px;
          background: #e94560;
          border-radius: 50%;
          display: inline-block;
          animation: blindful-blink 1s infinite;
        "></span>
        <span>Listening...</span>
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes blindful-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(233,69,96,0.4); }
          50% { box-shadow: 0 4px 30px rgba(233,69,96,0.9); }
        }
        @keyframes blindful-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
  } else {
    if (indicator) indicator.style.display = 'none';
  }
}

// ─── Toggle listening: Ctrl+Shift+Y or Ctrl+Z ────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'z' && e.ctrlKey) {
    e.preventDefault();
    startListening();
  }
});

// ─── HuggingFace Whisper fallback (if Web Speech API unavailable) ─────────────
let mediaRecorder = null;
let chunks = [];

function startRecordingFallback() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    isListening = true;
    showListeningIndicator(true);
    speakText("Listening");

    mediaRecorder = new MediaRecorder(stream);
    chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      isListening = false;
      showListeningIndicator(false);
      const blob = new Blob(chunks, { type: 'audio/webm' });
      try {
        const result = await speech2textFallback(blob);
        const transcript = result.text ? result.text.toLowerCase().trim() : '';
        if (transcript) handleVoiceCommand(transcript);
        else speakText("Could not understand audio");
      } catch (err) {
        console.error("Whisper fallback error:", err);
        speakText("Error processing audio");
      }
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    // Auto-stop after 5 seconds
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 5000);
  }).catch(err => {
    console.error("Microphone error:", err);
    speakText("Microphone not available");
  });
}

async function speech2textFallback(blob) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
    {
      headers: { Authorization: "Bearer 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" },
      method: "POST",
      body: blob,
    }
  );
  return response.json();
}