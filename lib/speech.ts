// Text-to-speech via the browser's Web Speech API — no-op where unsupported.

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const prefix = lang.slice(0, 2);
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith(prefix));
  return (
    voices.find((v) => v.lang.replace('_', '-') === lang && v.localService) ??
    voices.find((v) => v.lang.replace('_', '-') === lang) ??
    voices[0]
  );
}

export function speak(text: string, lang = 'de-DE') {
  if (!canSpeak() || !text) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}
