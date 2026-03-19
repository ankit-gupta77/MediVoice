// Murf AI Text-to-Speech Service — GEN2, no fallback
const MURF_API_KEY = import.meta.env.VITE_MURF_API_KEY;
const MURF_GEN_URL = 'https://api.murf.ai/v1/speech/generate';

// Per-language voice configuration — GEN2 with native voices
const VOICE_MAP = {
    'en': {
        voice_id: 'en-US-natalie',
        modelVersion: 'GEN2',
        style: 'Conversational',
        multiNativeLocale: 'en-IN',
    },
    'hi': {
        voice_id: 'hi-IN-shweta',
        modelVersion: 'GEN2',
        style: 'Conversational',
    },
    'hinglish': {
        voice_id: 'hi-IN-shweta',
        modelVersion: 'GEN2',
        style: 'Conversational',
    },
};

let currentAudio = null;
let isSpeaking = false;
let onEndCallback = null;

/**
 * Speak text using Murf AI GEN2 — no fallback.
 * If Murf fails, onError is called and audio is silent.
 */
export async function speakWithMurf(text, { language = 'en', onStart, onEnd, onError } = {}) {
    stopMurfSpeaking();

    // Clean text (strip ASSESSMENT blocks, markdown)
    const cleanText = text
        .replace(/ASSESSMENT_START[\s\S]*?ASSESSMENT_END/g, '')
        .replace(/[*_`#]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    if (!cleanText) { onEnd?.(); return; }

    if (!MURF_API_KEY) {
        console.error('Murf API key missing');
        onError?.('Murf API key not configured');
        onEnd?.();
        return;
    }

    const voiceCfg = VOICE_MAP[language] || VOICE_MAP['en'];

    isSpeaking = true;
    onEndCallback = onEnd;

    try {
        const payload = {
            text: cleanText,
            voiceId: voiceCfg.voice_id,
            style: voiceCfg.style,
            modelVersion: voiceCfg.modelVersion || 'GEN2',
            format: 'MP3',
            sampleRate: 24000,
            channelType: 'MONO',
        };
        // Only include multiNativeLocale if defined
        if (voiceCfg.multiNativeLocale) {
            payload.multiNativeLocale = voiceCfg.multiNativeLocale;
        }

        const response = await fetch(MURF_GEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': MURF_API_KEY,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Murf API ${response.status}: ${errText}`);
        }

        const data = await response.json();

        // Prefer encodedAudio (base64) for instant playback — avoids a 2nd fetch
        let audioSrc;
        if (data?.encodedAudio) {
            audioSrc = `data:audio/mp3;base64,${data.encodedAudio}`;
        } else {
            audioSrc = data?.audioFile || data?.audio_file || data?.url;
        }

        if (!audioSrc) throw new Error('Murf returned no audio');

        currentAudio = new Audio(audioSrc);
        currentAudio.volume = 1.0;
        currentAudio.onplay = () => onStart?.();
        currentAudio.onended = () => {
            isSpeaking = false;
            currentAudio = null;
            onEnd?.();
            onEndCallback = null;
        };
        currentAudio.onerror = () => {
            console.error('Murf audio playback error');
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
        onError?.(err.message);
        onEnd?.();
    }
}

export function stopMurfSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio = null;
    }
    isSpeaking = false;
    if (onEndCallback) {
        onEndCallback();
        onEndCallback = null;
    }
}

export function isMurfSpeaking() {
    return isSpeaking || (currentAudio && !currentAudio.paused);
}
