console.log("SpeechToText.js is running");

let recognition = null;
let isListening = false;

function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  rec.onstart = () => {
    isListening = true;
    showListeningIndicator(true);
  };

  rec.onresult = (event) => {
    // Try all alternatives for best match
    let transcript = '';
    for (let i = 0; i < event.results[0].length; i++) {
      transcript = event.results[0][i].transcript.toLowerCase().trim();
      if (handleVoiceCommand(transcript)) return;
    }
    speakText(`Command not recognized: ${transcript}`);
  };

  rec.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    showListeningIndicator(false);
    if (event.error === 'not-allowed') {
      speakText("Microphone access denied. Please allow microphone in browser settings.");
    } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
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
      recognition = null;
    }
  }
}

function stopListening() {
  if (recognition && isListening) recognition.stop();
  isListening = false;
  showListeningIndicator(false);
}

// ── Voice Command Handler — returns true if command was recognized ────────────
function handleVoiceCommand(transcript) {
  console.log("Heard:", transcript);

  // STOP speaking
  if (/\b(stop|quiet|silence|shut up|pause|cancel)\b/.test(transcript)) {
    stopSpeaking();
    return true;
  }

  // READ PAGE
  if (/\b(read page|describe page|what is on this page|read this|what page)\b/.test(transcript)) {
    const title = document.title || 'Untitled page';
    const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
      .map(h => stripURLs(h.textContent).trim())
      .filter(Boolean)
      .slice(0, 5)
      .join('. ');
    speakText(`Page: ${title}. Headings: ${headings || 'none found'}.`);
    return true;
  }

  // CLICK / ACTIVATE
  if (/\b(click|press|activate|open|select|choose)\b/.test(transcript)) {
    const focused = document.activeElement;
    if (focused && focused !== document.body) {
      focused.click();
      speakText(`Activated: ${parserHTML(focused) || 'element'}`);
    } else {
      speakText("No element is focused. Navigate to an element first.");
    }
    return true;
  }

  // NEXT
  if (/\bnext\b/.test(transcript)) {
    moveFocusBy(1);
    return true;
  }

  // PREVIOUS / BACK
  if (/\b(previous|back|prev|before)\b/.test(transcript)) {
    moveFocusBy(-1);
    return true;
  }

  // SCROLL DOWN
  if (/scroll\s*down|page\s*down/.test(transcript)) {
    window.scrollBy({ top: 400, behavior: 'smooth' });
    speakText("Scrolled down");
    return true;
  }

  // SCROLL UP
  if (/scroll\s*up|page\s*up/.test(transcript)) {
    window.scrollBy({ top: -400, behavior: 'smooth' });
    speakText("Scrolled up");
    return true;
  }

  // GO TO TOP
  if (/\b(top|go to top|beginning|start|first)\b/.test(transcript)) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const first = document.querySelector('[data-tabindex]');
    if (first) { first.focus(); speakText(parserHTML(first) || 'Top of page'); }
    else speakText("Top of page");
    return true;
  }

  // GO TO BOTTOM
  if (/\b(bottom|go to bottom|end|last)\b/.test(transcript)) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    speakText("Bottom of page");
    return true;
  }

  // ZOOM IN — increase text size
  if (/\b(zoom in|increase (text|font)|bigger text|larger text|text bigger|font bigger)\b/.test(transcript)) {
    adjustTextSize(1);
    return true;
  }

  // ZOOM OUT — decrease text size
  if (/\b(zoom out|decrease (text|font)|smaller text|reset (text|font|zoom))\b/.test(transcript)) {
    adjustTextSize(-1);
    return true;
  }

  // RESET ZOOM
  if (/\b(reset (text|font|zoom|size)|normal (text|size))\b/.test(transcript)) {
    adjustTextSize(0);
    return true;
  }

  // GO TO ELEMENT NUMBER — "go to 5", "element 5", "number 5", "navigate to five"
  const directNum = transcript.match(/\b(\d{1,3})\b/);
  if (directNum) {
    tabToIndex(parseInt(directNum[1]));
    return true;
  }

  // Word numbers: "go to five", "element twenty three"
  const wordNumMatch = transcript.match(
    /(?:go to|element|number|navigate to|jump to|tab to)?\s*(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:[- ]\w+)?|thirty(?:[- ]\w+)?|forty(?:[- ]\w+)?|fifty(?:[- ]\w+)?)/i
  );
  if (wordNumMatch) {
    const num = textToNumber(wordNumMatch[1]);
    if (num > 0) { tabToIndex(num); return true; }
  }

  return false; // not recognized
}

// ── Navigation helpers ────────────────────────────────────────────────────────

function moveFocusBy(direction) {
  const all = Array.from(document.querySelectorAll('[data-tabindex]'));
  if (all.length === 0) { speakText("No navigable elements on this page"); return; }

  const current = document.activeElement;
  const currentIdx = all.indexOf(current);
  let nextIdx;

  if (currentIdx === -1) {
    nextIdx = direction > 0 ? 0 : all.length - 1;
  } else {
    nextIdx = currentIdx + direction;
  }

  if (nextIdx < 0 || nextIdx >= all.length) {
    speakText(direction > 0 ? "Reached last element" : "Reached first element");
    return;
  }

  const next = all[nextIdx];
  next.focus();
  next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const desc = parserHTML(next);
  if (desc) speakText(desc);
}

function tabToIndex(index) {
  const elements = document.querySelectorAll('[data-tabindex]');
  if (elements.length === 0) { speakText("No navigable elements on this page"); return; }

  if (index < 1 || index > elements.length) {
    speakText(`Element ${index} not found. Page has ${elements.length} elements.`);
    return;
  }

  const element = elements[index - 1];
  element.focus();
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const description = parserHTML(element);
  speakText(description || `Element ${index}`);
}

// ── Text size control ─────────────────────────────────────────────────────────
// Levels: 0=reset, 1=+1 step, -1=-1 step. Steps: 100%, 115%, 130%, 150%, 170%
const TEXT_SIZES = [100, 115, 130, 150, 170];
let currentSizeIndex = 0;

function adjustTextSize(direction) {
  if (direction === 0) {
    currentSizeIndex = 0;
  } else if (direction > 0) {
    currentSizeIndex = Math.min(currentSizeIndex + 1, TEXT_SIZES.length - 1);
  } else {
    currentSizeIndex = Math.max(currentSizeIndex - 1, 0);
  }
  const pct = TEXT_SIZES[currentSizeIndex];
  document.documentElement.style.fontSize = pct + '%';

  let msg;
  if (direction === 0) msg = "Text size reset to normal";
  else if (pct === TEXT_SIZES[TEXT_SIZES.length - 1] && direction > 0) msg = "Maximum text size reached";
  else if (pct === TEXT_SIZES[0] && direction < 0) msg = "Minimum text size reached";
  else msg = `Text size ${direction > 0 ? 'increased' : 'decreased'} to ${pct} percent`;
  speakText(msg);
}

// Keyboard shortcuts for text size: Alt+Plus / Alt+Minus / Alt+0
document.addEventListener('keydown', (e) => {
  // Toggle voice listening
  if (e.key === 'z' && e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    startListening();
    return;
  }
  // Increase text size: Alt+=  or  Alt++
  if (e.altKey && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    adjustTextSize(1);
    return;
  }
  // Decrease text size: Alt+-
  if (e.altKey && e.key === '-') {
    e.preventDefault();
    adjustTextSize(-1);
    return;
  }
  // Reset text size: Alt+0
  if (e.altKey && e.key === '0') {
    e.preventDefault();
    adjustTextSize(0);
    return;
  }
});

// ── Listening indicator ───────────────────────────────────────────────────────
let indicator = null;

function showListeningIndicator(show) {
  if (show) {
    if (!indicator) {
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

      indicator = document.createElement('div');
      indicator.id = 'blindful-indicator';
      indicator.style.cssText = `
        position: fixed; bottom: 24px; right: 24px;
        background: #1a1a2e; color: #fff;
        padding: 12px 20px; border-radius: 50px;
        font-family: sans-serif; font-size: 15px;
        z-index: 2147483647; display: flex;
        align-items: center; gap: 10px;
        border: 2px solid #e94560;
        animation: blindful-pulse 1s infinite;
      `;
      indicator.innerHTML = `
        <span style="width:12px;height:12px;background:#e94560;border-radius:50%;
          display:inline-block;animation:blindful-blink 1s infinite;"></span>
        <span>Listening...</span>
      `;
      document.body.appendChild(indicator);
    }
    indicator.style.display = 'flex';
  } else {
    if (indicator) indicator.style.display = 'none';
  }
}