// Text to speech utility using gemini-3.1-flash-tts-preview with browser fallback
let currentAudio: HTMLAudioElement | null = null;

export async function speakText(text: string, lang: string = 'vi-VN'): Promise<void> {
  if (!text) return;

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  try {
    const res = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const json = await res.json();
    if (json.success && json.data?.audioBase64) {
      const mime = json.data.mimeType || 'audio/mp3';
      const audioUrl = `data:${mime};base64,${json.data.audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Backend Gemini TTS failed, using browser speech synthesis fallback', err);
  }

  // Browser SpeechSynthesis fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}
