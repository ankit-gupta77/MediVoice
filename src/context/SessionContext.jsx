import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { detectLanguage, detectEmergency, detectStressKeywords } from '../services/languageDetection';
import { sendToGemini, parseAssessment } from '../services/aiService';
import { speakWithMurf, stopMurfSpeaking, isMurfSpeaking } from '../services/murfService';
import { startDeepgramListening, stopDeepgramListening, mapDeepgramLang } from '../services/deepgramService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | listening | processing | speaking | emergency
    const [interimText, setInterimText] = useState('');
    const [language, setLanguage] = useState('en');
    const [isEmergency, setIsEmergency] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [screen, setScreen] = useState('home'); // home | chat | result
    const [isSpeakingAI, setIsSpeakingAI] = useState(false);
    const [symptoms, setSymptoms] = useState([]);

    const conversationHistoryRef = useRef([]);

    const addMessage = useCallback((role, content, meta = {}) => {
        const msg = { id: Date.now() + Math.random(), role, content, meta, timestamp: new Date() };
        setMessages(prev => [...prev, msg]);
        conversationHistoryRef.current = [
            ...conversationHistoryRef.current,
            { role, content },
        ];
        return msg;
    }, []);

    // ── Core AI pipeline ────────────────────────────────────────────────────────
    const processUserInput = useCallback(async (text, deepgramLang) => {
        if (!text?.trim()) return;

        // Language: prefer Deepgram's detection, fall back to our heuristic
        const detectedLang = deepgramLang
            ? mapDeepgramLang(deepgramLang)
            : detectLanguage(text);

        setLanguage(detectedLang);

        // Emergency detection
        if (detectEmergency(text)) {
            setIsEmergency(true);
            setStatus('emergency');
            addMessage('user', text);
            const emergencyMsg = detectedLang === 'hi'
                ? '🚨 यह आपातकाल हो सकता है। कृपया तुरंत 108 (एम्बुलेंस) या 112 (आपातकाल) पर कॉल करें!'
                : '🚨 This sounds like a medical emergency. Please call 108 (Ambulance) or 112 (Emergency) IMMEDIATELY. Do not wait!';
            addMessage('assistant', emergencyMsg, { isEmergency: true });

            // Speak emergency message via Murf
            speakWithMurf(emergencyMsg, { language: detectedLang });
            return;
        }

        // Move to chat screen
        if (screen === 'home') setScreen('chat');

        const isStressed = detectStressKeywords(text);

        // Collect symptom tokens
        const symptomWords = text.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
        setSymptoms(prev => [...new Set([...prev, ...symptomWords])].slice(0, 8));

        addMessage('user', text, { isStressed });
        setStatus('processing');

        try {
            // ── Step: Gemini AI ───────────────────────────────────────────────────
            const aiResponse = await sendToGemini(
                conversationHistoryRef.current.slice(0, -1),
                text
            );

            const assessmentData = parseAssessment(aiResponse);
            if (assessmentData) setAssessment(assessmentData);

            const displayText = aiResponse
                .replace(/ASSESSMENT_START[\s\S]*?ASSESSMENT_END/g, '')
                .trim();

            const hasFinalAssessment = !!assessmentData;

            addMessage('assistant', aiResponse, {
                isStressed,
                hasAssessment: hasFinalAssessment,
                displayText: displayText || aiResponse,
            });

            // ── Step: Murf AI TTS ─────────────────────────────────────────────────
            const speechText = hasFinalAssessment
                ? `Here is my assessment. ${displayText || 'Please check the result panel for details.'}`
                : aiResponse;

            setStatus('speaking');
            setIsSpeakingAI(true);

            await speakWithMurf(speechText, {
                language: detectedLang,
                onStart: () => { },
                onEnd: () => {
                    setIsSpeakingAI(false);
                    setStatus('idle');
                    if (hasFinalAssessment) {
                        setTimeout(() => setScreen('result'), 800);
                    }
                },
                onError: () => {
                    setIsSpeakingAI(false);
                    setStatus('idle');
                    if (hasFinalAssessment) {
                        setTimeout(() => setScreen('result'), 800);
                    }
                },
            });
        } catch (err) {
            console.error('AI pipeline error:', err);
            addMessage('assistant', "I'm having trouble connecting right now. Please try again.", { isError: true });
            setStatus('idle');
            setIsSpeakingAI(false);
        }
    }, [screen, addMessage]);

    // ── Deepgram microphone control ─────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (status !== 'idle') return;
        setStatus('listening');
        setInterimText('');

        startDeepgramListening({
            onReady: () => {
                // WebSocket connected
            },
            onInterim: (text) => {
                setInterimText(text);
            },
            onFinal: (text, deepgramLang) => {
                setInterimText('');
                stopDeepgramListening();
                processUserInput(text, deepgramLang);
            },
            onError: (errMsg) => {
                console.error('Deepgram error:', errMsg);
                setStatus('idle');
                setInterimText('');
            },
            onClose: () => {
                if (status === 'listening') {
                    setStatus('idle');
                    setInterimText('');
                }
            },
        });
    }, [status, processUserInput]);

    const stopListening = useCallback(() => {
        stopDeepgramListening();
        setStatus('idle');
        setInterimText('');
    }, []);

    const interruptAI = useCallback(() => {
        stopMurfSpeaking();
        setIsSpeakingAI(false);
        setStatus('idle');
    }, []);

    const resetSession = useCallback(() => {
        stopMurfSpeaking();
        stopDeepgramListening();
        setMessages([]);
        setStatus('idle');
        setInterimText('');
        setLanguage('en');
        setIsEmergency(false);
        setAssessment(null);
        setScreen('home');
        setIsSpeakingAI(false);
        setSymptoms([]);
        conversationHistoryRef.current = [];
    }, []);

    const value = {
        messages,
        status,
        interimText,
        language,
        isEmergency,
        assessment,
        screen,
        isSpeakingAI,
        symptoms,
        // Actions
        setStatus,
        setInterimText,
        setScreen,
        startListening,
        stopListening,
        processUserInput,
        interruptAI,
        resetSession,
        addMessage,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}
