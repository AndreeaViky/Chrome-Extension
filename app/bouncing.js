console.log("Bouncing.js is running");

let timeoutId;

// Debounced call to avoid flooding TTS while user navigates quickly
function callFunction(text) {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    text2speech(text);
  }, 600); // 600ms debounce — fast enough to feel responsive
}