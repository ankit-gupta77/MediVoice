// Murf AI Text-to-Speech Service
// Uses the Murf Streaming API (Falcon model) for low-latency audio playback

const MURF_API_KEY = import.meta.env.VITE_MURF_API_KEY;

// Global endpoint — auto-routes to nearest region
const MURF_GEN_URL = 'https://api.murf.ai/v1/speech/generate';
const MURF_STREAM_URL = 'https://api.murf.ai/v1/speech/stream';


// Per-language voice configuration — GEN2 with fastest voices per locale
const VOICE_MAP = {
    'en': {
        voice_id: 'en-US-natalie',
        modelVersion: 'GEN2',
        style: 'Conversational',
        multiNativeLocale: 'en-IN',
    },
    'hi': {
        voice_id: 'hi-IN-shweta',     // Native Hindi female — clear & natural
        modelVersion: 'GEN2',
        style: 'Conversational',
    },
    'hinglish': {
        voice_id: 'hi-IN-shweta',     // Native Hindi voice handles Hinglish well
        modelVersion: 'GEN2',
        style: 'Conversational',
    },
};


let currentAudio = null;
let isSpeaking = false;
let onEndCallback = null;

/**
 * Speak text using Murf AI
 * Returns a promise that resolves when audio finishes or rejects on error.
 */
export async function speakWithMurf(text, { language = 'en', onStart, onEnd, onError } = {}) {
    // Stop any currently playing audio first
    stopMurfSpeaking();

    // Clean text (strip ASSESSMENT blocks, markdown)
    const cleanText = text
        .replace(/ASSESSMENT_START[\s\S]*?ASSESSMENT_END/g, '')
        .replace(/[*_`#]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    if (!cleanText) {
        onEnd?.();
        return;
    }

    const voiceCfg = VOICE_MAP[language] || VOICE_MAP['en'];

    try {
        isSpeaking = true;
        onEndCallback = onEnd;

        // Use Murf generate endpoint (returns audio_file URL)
        // This is simpler and more reliable in the browser than streaming PCM
        const response = await fetch(MURF_GEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MURF_API_KEY,
            },
            body: JSON.stringify({
                text: cleanText,
                voiceId: voiceCfg.voice_id,
                style: voiceCfg.style,
                modelVersion: voiceCfg.modelVersion || 'GEN2',
                multiNativeLocale: voiceCfg.multiNativeLocale || 'en-IN',
                format: 'MP3',
                sampleRate: 24000,
                channelType: 'MONO',
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Murf API ${response.status}: ${errText}`);
        }

        const data = await response.json();

        // Prefer encodedAudio (base64) for zero-latency playback.
        // Avoids a 2nd round-trip to fetch the audioFile URL.
        let audioSrc;
        if (data?.encodedAudio) {
            audioSrc = `data:audio/mp3;base64,${data.encodedAudio}`;
        } else {
            audioSrc = data?.audioFile || data?.audio_file || data?.url;
        }

        if (!audioSrc) {
            throw new Error('Murf returned no audio');
        }

        // Play directly — base64 data URIs start instantly
        currentAudio = new Audio(audioSrc);
        currentAudio.volume = 1.0;

        currentAudio.onplay = () => {
            onStart?.();
        };

        currentAudio.onended = () => {
            isSpeaking = false;
            currentAudio = null;
            onEnd?.();
            onEndCallback = null;
        };

        currentAudio.onerror = (e) => {
            console.error('Murf audio playback error:', e);
            isSpeaking = false;
            currentAudio = null;
            onError?.('Audio playback failed');
            onEndCallback = null;
        };

        await currentAudio.play();

    } catch (err) {
        console.error('Murf TTS error:', err);
        isSpeaking = false;
        currentAudio = null;
        // Gracefully fall back to Web Speech API
        fallbackSpeak(cleanText, { language, onStart, onEnd, onError });
    }
}

export function stopMurfSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
    isSpeaking = false;
    // Also stop Web Speech fallback if running
    if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
    }
    if (onEndCallback) {
        onEndCallback();
        onEndCallback = null;
    }
}

export function isMurfSpeaking() {
    return isSpeaking || (currentAudio && !currentAudio.paused);
}

// ── Fallback: Web Speech API ─────────────────────────────────────────────────
function fallbackSpeak(text, { language = 'en', onStart, onEnd, onError } = {}) {
    const synth = window.speechSynthesis;
    if (!synth) { onEnd?.(); return; }

    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utt.rate = 0.92;
    utt.onstart = onStart;
    utt.onend = () => { isSpeaking = false; onEnd?.(); };
    utt.onerror = (e) => { isSpeaking = false; onEnd?.(); };
    isSpeaking = true;
    synth.speak(utt);
}

/**
 * Get available Murf voices for a given locale
 */
export async function getMurfVoices(locale = 'en-IN') {
    try {
        const res = await fetch(`https://in.api.murf.ai/v1/speech/voices?locale=${locale}`, {
            headers: { 'api-key': MURF_API_KEY },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.voices || data || [];
    } catch {
        return [];
    }
}
