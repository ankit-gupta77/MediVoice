// Speech service using Web Speech API
let recognition = null;
let synthesis = window.speechSynthesis;
let currentUtterance = null;

// ─── Speech Recognition (STT) ───────────────────────────────────────────────
export function createRecognition({ onResult, onInterim, onEnd, onError, language = 'en-US' }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        onError?.('Speech recognition not supported in this browser. Please use Chrome.');
        return null;
    }

    if (recognition) {
        recognition.abort();
        recognition = null;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getRecognitionLang(language);
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final += transcript;
            } else {
                interim += transcript;
            }
        }
        if (interim) onInterim?.(interim);
        if (final) onResult?.(final);
    };

    recognition.onend = () => {
        recognition = null;
        onEnd?.();
    };

    recognition.onerror = (event) => {
        recognition = null;
        if (event.error !== 'aborted') {
            onError?.(event.error);
        }
        onEnd?.();
    };

    return recognition;
}

export function startListening(recognitionInstance) {
    try {
        recognitionInstance?.start();
    } catch (e) {
        console.warn('Recognition start error:', e);
    }
}

export function stopListening() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

function getRecognitionLang(lang) {
    switch (lang) {
        case 'hi': return 'hi-IN';
        case 'hinglish': return 'hi-IN';
        default: return 'en-US';
    }
}

// ─── Text to Speech (TTS) ────────────────────────────────────────────────────
export function speak(text, { language = 'en', onStart, onEnd, onError } = {}) {
    if (!synthesis) {
        onError?.('Text-to-speech not supported');
        return;
    }

    // Cancel ongoing speech
    stopSpeaking();

    // Clean text for speech (remove markdown, assessment markers)
    const cleanText = text
        .replace(/ASSESSMENT_START[\s\S]*?ASSESSMENT_END/g, '')
        .replace(/[*_`#]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    if (!cleanText) return;

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance.lang = getRecognitionLang(language);
    currentUtterance.rate = 0.92;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Try to use a high-quality voice
    const voices = synthesis.getVoices();
    const preferred = voices.find(v =>
        v.lang.startsWith(currentUtterance.lang.split('-')[0]) && v.localService === false
    ) || voices.find(v => v.lang.startsWith(currentUtterance.lang.split('-')[0]));

    if (preferred) currentUtterance.voice = preferred;

    currentUtterance.onstart = onStart;
    currentUtterance.onend = () => {
        currentUtterance = null;
        onEnd?.();
    };
    currentUtterance.onerror = (e) => {
        currentUtterance = null;
        if (e.error !== 'interrupted') onError?.(e.error);
    };

    synthesis.speak(currentUtterance);
}

export function stopSpeaking() {
    if (synthesis && synthesis.speaking) {
        synthesis.cancel();
        currentUtterance = null;
    }
}

export function isSpeaking() {
    return synthesis?.speaking || false;
}

// Load voices (async on some browsers)
export function loadVoices() {
    return new Promise((resolve) => {
        const voices = synthesis?.getVoices() || [];
        if (voices.length > 0) { resolve(voices); return; }
        synthesis?.addEventListener('voiceschanged', () => resolve(synthesis.getVoices()), { once: true });
    });
}
