console.log("TextToSpeech.js is running");

function speakText(text) {
  if (!text || text.trim() === '') return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-US') || voices[0];
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}

window.speechSynthesis.onvoiceschanged = () => {};

// Main function called by bouncing.js and speechToText.js
function text2speech(data) {
  const text = typeof data === 'string' ? data : data.inputs;
  speakText(text);
  return Promise.resolve();
}