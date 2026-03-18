import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import ChatBubble from '../components/ChatBubble';
import AnimatedOrb from '../components/AnimatedOrb';
import WaveformVisualizer from '../components/WaveformVisualizer';

export default function ChatScreen() {
    const {
        messages, status, interimText,
        processUserInput, language, symptoms, isSpeakingAI,
        startListening, stopListening, interruptAI, resetSession, setScreen,
    } = useSession();

    const messagesEndRef = useRef(null);
    const isListening = status === 'listening';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, interimText]);

    const handleOrbClick = () => {
        if (isSpeakingAI) { interruptAI(); return; }
        if (isListening) { stopListening(); return; }
        if (status !== 'idle') return;
        startListening();
    };

    const langLabel = { en: '🇬🇧 EN', hi: '🇮🇳 HI', hinglish: '🇮🇳 HIN' }[language] || '🌐';

    return (
        <div className="min-h-screen flex flex-col max-w-lg mx-auto">
            {/* Top bar */}
            <motion.header
                className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
                style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,7,18,0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button onClick={resetSession} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">New</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg text-sm flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.3),rgba(45,212,191,0.3))' }}>
                        🩺
                    </div>
                    <span className="font-display font-bold text-lg text-gradient">MediVoice</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full glass border border-white/10 text-white/40">{langLabel}</span>
            </motion.header>

            {/* Detected symptoms */}
            <AnimatePresence>
                {symptoms.length > 0 && (
                    <motion.div
                        className="px-5 py-2 flex flex-wrap gap-1.5"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <span className="text-xs text-white/30">Detected:</span>
                        {symptoms.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full glass border border-teal-400/20 text-teal-300/70">{s}</span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 no-scrollbar">
                {messages.length === 0 && (
                    <motion.div className="flex justify-start mb-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0 flex items-center justify-center self-end text-lg bg-gradient-to-br from-violet-600 to-sky-600">🤖</div>
                        <div className="max-w-xs px-5 py-3.5 rounded-3xl rounded-tl-sm bubble-ai">
                            <p className="text-sm text-white/85 leading-relaxed">
                                Hello! I'm MediVoice. 👋<br />
                                Tap the mic and tell me how you're feeling.
                            </p>
                        </div>
                    </motion.div>
                )}

                {messages.map((msg, i) => (
                    <ChatBubble key={msg.id} message={msg} isLatest={i === messages.length - 1} />
                ))}

                {/* Interim transcript */}
                <AnimatePresence>
                    {interimText && (
                        <motion.div className="flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="max-w-xs px-4 py-2.5 rounded-3xl rounded-tr-sm" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.15)' }}>
                                <p className="text-sm text-sky-300/70 italic">"{interimText}"</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Thinking indicator */}
                <AnimatePresence>
                    {status === 'processing' && (
                        <motion.div className="flex justify-start" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <div className="w-8 h-8 rounded-full mr-2 flex-shrink-0 flex items-center justify-center self-end text-lg bg-gradient-to-br from-violet-600 to-sky-600">🤖</div>
                            <div className="px-5 py-4 rounded-3xl rounded-tl-sm bubble-ai">
                                <div className="flex gap-1.5 items-center">
                                    {[0, 1, 2].map(i => (
                                        <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-400"
                                            animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }} />
                                    ))}
                                    <span className="text-xs text-purple-300/50 ml-1">Analyzing...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Waveform */}
            <div className="px-5">
                <WaveformVisualizer height={40} bars={48} />
            </div>

            {/* Bottom bar */}
            <div className="sticky bottom-0 z-20 px-5 py-4"
                style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,7,18,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-center gap-4">
                    {isSpeakingAI && (
                        <motion.button onClick={interruptAI}
                            className="px-4 py-2 rounded-2xl text-xs font-medium text-white/60 glass border border-white/10 hover:border-sky-400/30 hover:text-sky-300 transition-all"
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                            ⏹ Stop
                        </motion.button>
                    )}

                    <AnimatedOrb size={72} onClick={handleOrbClick} />

                    <motion.button onClick={() => setScreen('result')}
                        className="px-4 py-2 rounded-2xl text-xs font-medium text-white/40 glass border border-white/10 hover:border-purple-400/30 hover:text-purple-300 transition-all"
                        whileHover={{ scale: 1.05 }}>
                        📊 Results
                    </motion.button>
                </div>

                <p className="text-center text-xs text-white/20 mt-2">
                    {isListening ? '🔴 Listening (Deepgram) — tap to stop'
                        : isSpeakingAI ? '🔊 Speaking (Murf AI) — tap to interrupt'
                            : 'Tap mic to speak'}
                </p>
            </div>
        </div>
    );
}
