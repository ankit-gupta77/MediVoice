// Deepgram Live Transcription Service
// Uses WebSocket connection directly from the browser

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

let socket = null;
let mediaRecorder = null;
let audioStream = null;

/**
 * Start Deepgram live transcription
 * @param {Object} options
 * @param {Function} options.onInterim - Called with interim transcript text
 * @param {Function} options.onFinal - Called with final transcript text + detected language
 * @param {Function} options.onError - Called on error
 * @param {Function} options.onReady - Called when connection is established
 * @param {Function} options.onClose - Called when connection closes
 */
export async function startDeepgramListening({ onInterim, onFinal, onError, onReady, onClose } = {}) {
    try {
        // Get microphone access
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

        // Build WebSocket URL with params
        const params = new URLSearchParams({
            model: 'nova-2',
            language: 'multi',          // Multi-language detection (EN + HI)
            detect_language: 'true',    // Auto-detect language
            interim_results: 'true',
            smart_format: 'true',
            utterance_end_ms: '1200',
            endpointing: '400',
            punctuate: 'true',
        });

        const url = `${DEEPGRAM_WS_URL}?${params.toString()}`;

        // Open WebSocket with API key in protocol header (browser-compatible method)
        socket = new WebSocket(url, ['token', DEEPGRAM_API_KEY]);
        socket.binaryType = 'arraybuffer';

        socket.onopen = () => {
            onReady?.();

            // Start MediaRecorder and send audio chunks
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            mediaRecorder = new MediaRecorder(audioStream, { mimeType });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0 && socket?.readyState === WebSocket.OPEN) {
                    socket.send(e.data);
                }
            };

            mediaRecorder.start(250); // Send chunks every 250ms
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Extract transcript
                const transcript = data?.channel?.alternatives?.[0]?.transcript;
                const isFinal = data?.is_final;
                const speechFinal = data?.speech_final;
                const detectedLang = data?.channel?.detected_language || 'en';

                if (!transcript) return;

                if (!isFinal) {
                    // Interim result
                    onInterim?.(transcript);
                } else if (isFinal && transcript.trim()) {
                    // Final result
                    onFinal?.(transcript.trim(), detectedLang);
                }
            } catch (err) {
                console.warn('Deepgram parse error:', err);
            }
        };

        socket.onerror = (err) => {
            console.error('Deepgram WebSocket error:', err);
            onError?.('Deepgram connection error. Please check your API key.');
        };

        socket.onclose = (event) => {
            cleanupMediaRecorder();
            onClose?.();
            if (event.code !== 1000 && event.code !== 1001) {
                console.warn(`Deepgram closed unexpectedly: code=${event.code}`);
            }
        };

    } catch (err) {
        console.error('Deepgram start error:', err);
        if (err.name === 'NotAllowedError') {
            onError?.('Microphone permission denied. Please allow microphone access.');
        } else {
            onError?.(`Could not start microphone: ${err.message}`);
        }
    }
}

export function stopDeepgramListening() {
    // Send close message to Deepgram
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'CloseStream' }));
        socket.close(1000, 'User stopped');
    }
    socket = null;
    cleanupMediaRecorder();
}

function cleanupMediaRecorder() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    mediaRecorder = null;
    if (audioStream) {
        audioStream.getTracks().forEach(t => t.stop());
        audioStream = null;
    }
}

export function isDeepgramConnected() {
    return socket?.readyState === WebSocket.OPEN;
}

/**
 * Map Deepgram-detected language code to our internal language key
 */
export function mapDeepgramLang(langCode) {
    if (!langCode) return 'en';
    const lower = langCode.toLowerCase();
    if (lower.startsWith('hi')) return 'hi';
    if (lower.startsWith('en')) return 'en';
    // Any other code defaults to English
    return 'en';
}
