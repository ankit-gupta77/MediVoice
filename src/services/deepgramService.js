// Robust Speech Service
// Priority: Deepgram WebSocket → Web Speech API fallback
// Automatically switches to Web Speech API if Deepgram fails

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

// ── State ──────────────────────────────────────────────────────────────────
let dgSocket = null;
let dgMediaRecorder = null;
let dgAudioStream = null;
let wsListeners = null;
let isIntentionalClose = false;

let webSpeechRec = null;

// ── Deepgram WebSocket STT ─────────────────────────────────────────────────
async function startDeepgram({ onInterim, onFinal, onError, onClose }) {
    if (!dgAudioStream || !dgAudioStream.active) {
        try {
            dgAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            throw new Error('mic_denied');
        }
    }

    isIntentionalClose = false;

    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            model: 'nova-3',
            language: 'hi', // Fixed language; we detect later via heuristic
            interim_results: 'true',
            smart_format: 'true',
            endpointing: '500',
            utterance_end_ms: '1500',
            punctuate: 'true',
        });

        const url = `${DEEPGRAM_WS_URL}?${params}`;

        try {
            dgSocket = new WebSocket(url, ['token', DEEPGRAM_API_KEY]);
            dgSocket.binaryType = 'arraybuffer';
        } catch (e) {
            reject(new Error('ws_init_failed'));
            return;
        }

        // Timeout: if socket doesn't open in 4s, reject so we fall back
        const openTimeout = setTimeout(() => {
            dgSocket?.close();
            reject(new Error('ws_timeout'));
        }, 4000);

        dgSocket.onopen = () => {
            clearTimeout(openTimeout);

            try {
                const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : MediaRecorder.isTypeSupported('audio/webm')
                        ? 'audio/webm'
                        : 'audio/ogg';

                dgMediaRecorder = new MediaRecorder(dgAudioStream, { mimeType });
                dgMediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0 && dgSocket?.readyState === WebSocket.OPEN) {
                        dgSocket.send(e.data);
                    }
                };
                dgMediaRecorder.start(200);
                resolve('deepgram');
            } catch (err) {
                console.error("MediaRecorder error:", err);
                dgSocket?.close();
                reject(new Error('media_recorder_failed'));
            }
        };

        dgSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const transcript = data?.channel?.alternatives?.[0]?.transcript;
                if (!transcript) return;
                if (!data.is_final) {
                    onInterim?.(transcript);
                } else if (transcript.trim()) {
                    onFinal?.(transcript.trim(), data?.channel?.detected_language || 'en');
                }
            } catch (_) { }
        };

        dgSocket.onerror = () => {
            clearTimeout(openTimeout);
            const wasIntentional = isIntentionalClose;
            cleanupDG();
            if (!wasIntentional) {
                onError?.('Deepgram connection error');
            }
            reject(new Error('ws_error'));
        };

        dgSocket.onclose = (e) => {
            cleanupDG();
            onClose?.();
        };
    });
}

function cleanupDG() {
    isIntentionalClose = true;
    if (dgMediaRecorder && dgMediaRecorder.state !== 'inactive') {
        try { dgMediaRecorder.stop(); } catch (_) { }
    }
    dgMediaRecorder = null;
    if (dgSocket) {
        try { dgSocket.close(1000); } catch (_) { }
        dgSocket = null;
    }
    // We intentionally DO NOT stop dgAudioStream here to allow reuse and prevent Chrome audio glitches.
}

export function releaseMicrophone() {
    if (dgAudioStream) {
        dgAudioStream.getTracks().forEach(t => t.stop());
        dgAudioStream = null;
    }
}

// ── Web Speech API fallback ────────────────────────────────────────────────
function startWebSpeech({ onInterim, onFinal, onError, onClose }) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        onError?.('Speech recognition not supported. Please use Chrome.');
        return false;
    }

    webSpeechRec = new SR();
    webSpeechRec.continuous = false;
    webSpeechRec.interimResults = true;
    webSpeechRec.lang = 'hi-IN'; // Works for Hindi + English + Hinglish in Chrome
    webSpeechRec.maxAlternatives = 1;

    webSpeechRec.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t;
            else interim += t;
        }
        if (interim) onInterim?.(interim);
        if (final.trim()) onFinal?.(final.trim(), null);
    };

    webSpeechRec.onend = () => { webSpeechRec = null; onClose?.(); };
    webSpeechRec.onerror = (e) => {
        webSpeechRec = null;
        if (e.error === 'not-allowed') {
            onError?.('Microphone permission denied. Please allow microphone access.');
        } else if (e.error !== 'aborted') {
            onClose?.();
        }
    };

    try {
        webSpeechRec.start();
        return true;
    } catch (e) {
        webSpeechRec = null;
        return false;
    }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Start listening — tries Deepgram first, falls back to Web Speech API.
 * Returns a promise that resolves with 'deepgram' | 'webspeech'
 */
export async function startListeningService(callbacks) {
    wsListeners = callbacks;
    const { onError } = callbacks;

    // Try Deepgram if API key is present
    if (DEEPGRAM_API_KEY) {
        try {
            const method = await startDeepgram(callbacks);
            console.info('🎤 Using Deepgram STT');
            return method;
        } catch (err) {
            console.warn('Deepgram failed:', err.message, '— falling back to Web Speech API');
            cleanupDG();
        }
    }

    // Fallback: Web Speech API
    const ok = startWebSpeech(callbacks);
    if (ok) {
        console.info('🎤 Using Web Speech API (fallback)');
        return 'webspeech';
    }

    onError?.('Could not start microphone. Please use Chrome and allow mic access.');
    return null;
}

export function stopListeningService() {
    cleanupDG();
    if (webSpeechRec) {
        try { webSpeechRec.stop(); } catch (_) { }
        webSpeechRec = null;
    }
}

export function isListeningActive() {
    return (
        dgSocket?.readyState === WebSocket.OPEN ||
        webSpeechRec != null
    );
}

// ── Language util (re-exported) ────────────────────────────────────────────
export function mapDeepgramLang(langCode) {
    if (!langCode) return 'en';
    const l = langCode.toLowerCase();
    if (l.startsWith('hi')) return 'hi';
    return 'en';
}
