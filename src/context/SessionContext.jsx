import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { detectLanguage, detectEmergency, detectStressKeywords } from '../services/languageDetection';
import { sendToGroq, parseAssessment } from '../services/aiService';
import { speakWithMurf, stopMurfSpeaking } from '../services/murfService';
import { startListeningService, stopListeningService, mapDeepgramLang, releaseMicrophone } from '../services/deepgramService';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | listening | processing | speaking | emergency
    const [interimText, setInterimText] = useState('');
    const [language, setLanguage] = useState('en');
    const [isEmergency, setIsEmergency] = useState(false);
    const [assessment, setAssessment] = useState(null);
    const [screen, setScreen] = useState('home');
    const [isSpeakingAI, setIsSpeakingAI] = useState(false);
    const [symptoms, setSymptoms] = useState([]);
    const [micMethod, setMicMethod] = useState(null); // 'deepgram' | 'webspeech'

    const conversationHistoryRef = useRef([]);
    // Use ref for status inside callbacks to avoid stale closures
    const statusRef = useRef('idle');

    const updateStatus = useCallback((s) => {
        statusRef.current = s;
        setStatus(s);
    }, []);

    const addMessage = useCallback((role, content, meta = {}) => {
        const msg = { id: Date.now() + Math.random(), role, content, meta, timestamp: new Date() };
        setMessages(prev => [...prev, msg]);
        conversationHistoryRef.current = [...conversationHistoryRef.current, { role, content }];
        return msg;
    }, []);

    // ── Core AI pipeline ────────────────────────────────────────────────────────
    const processUserInput = useCallback(async (text, deepgramLang) => {
        if (!text?.trim()) return;

        const detectedLang = deepgramLang
            ? mapDeepgramLang(deepgramLang)
            : detectLanguage(text);
        setLanguage(detectedLang);

        // Emergency check
        if (detectEmergency(text)) {
            setIsEmergency(true);
            updateStatus('emergency');
            addMessage('user', text);
            const emergencyMsg = detectedLang === 'hi'
                ? '🚨 यह आपातकाल हो सकता है। कृपया तुरंत 108 (एम्बुलेंस) या 112 (आपातकाल) पर कॉल करें!'
                : '🚨 This sounds like a medical emergency. Please call 108 (Ambulance) or 112 IMMEDIATELY!';
            addMessage('assistant', emergencyMsg, { isEmergency: true });
            speakWithMurf(emergencyMsg, { language: detectedLang });
            return;
        }

        if (screen === 'home') setScreen('chat');

        const isStressed = detectStressKeywords(text);
        const symptomWords = text.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
        setSymptoms(prev => [...new Set([...prev, ...symptomWords])].slice(0, 8));

        addMessage('user', text, { isStressed });
        updateStatus('processing');

        try {
            const aiResponse = await sendToGroq(
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

            updateStatus('speaking');
            setIsSpeakingAI(true);

            speakWithMurf(hasFinalAssessment
                ? `Here is my assessment. ${displayText || 'Please check the result panel.'}`
                : aiResponse,
                {
                    language: detectedLang,
                    onEnd: () => {
                        setIsSpeakingAI(false);
                        updateStatus('idle');
                        if (hasFinalAssessment) setTimeout(() => setScreen('result'), 800);
                    },
                    onError: () => {
                        setIsSpeakingAI(false);
                        updateStatus('idle');
                        if (hasFinalAssessment) setTimeout(() => setScreen('result'), 800);
                    },
                }
            );
        } catch (err) {
            console.error('AI pipeline error:', err);
            addMessage('assistant', `Service error: ${err.message || 'Could not connect. Please check your API keys and try again.'}`, { isError: true });
            updateStatus('idle');
            setIsSpeakingAI(false);
        }
    }, [screen, addMessage, updateStatus]);

    // ── Microphone control ──────────────────────────────────────────────────────
    const startListening = useCallback(async () => {
        if (statusRef.current !== 'idle') return;
        updateStatus('listening');
        setInterimText('');

        const method = await startListeningService({
            onInterim: (text) => setInterimText(text),
            onFinal: (text, deepgramLang) => {
                setInterimText('');
                stopListeningService();
                processUserInput(text, deepgramLang);
            },
            onError: (errMsg) => {
                console.error('Speech error:', errMsg);
                updateStatus('idle');
                setInterimText('');
                // Show a brief notification in chat
                addMessage('assistant', `⚠️ ${errMsg}`, { isError: true });
            },
            onClose: () => {
                if (statusRef.current === 'listening') {
                    updateStatus('idle');
                    setInterimText('');
                }
            },
        });

        setMicMethod(method);

        // If startListeningService returned null, something went wrong
        if (!method) {
            updateStatus('idle');
        }
    }, [processUserInput, updateStatus, addMessage]);

    const stopListening = useCallback(() => {
        stopListeningService();
        updateStatus('idle');
        setInterimText('');
    }, [updateStatus]);

    const interruptAI = useCallback(() => {
        stopMurfSpeaking();
        setIsSpeakingAI(false);
        updateStatus('idle');
    }, [updateStatus]);

    const resetSession = useCallback(() => {
        stopMurfSpeaking();
        stopListeningService();
        releaseMicrophone();
        setMessages([]);
        updateStatus('idle');
        setInterimText('');
        setLanguage('en');
        setIsEmergency(false);
        setAssessment(null);
        setScreen('home');
        setIsSpeakingAI(false);
        setSymptoms([]);
        setMicMethod(null);
        conversationHistoryRef.current = [];
    }, [updateStatus]);

    const value = {
        messages, status, interimText, language, isEmergency,
        assessment, screen, isSpeakingAI, symptoms, micMethod,
        setStatus: updateStatus, setInterimText, setScreen,
        startListening, stopListening, processUserInput,
        interruptAI, resetSession, addMessage,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within SessionProvider');
    return ctx;
}
