import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import AnimatedOrb from '../components/AnimatedOrb';
import WaveformVisualizer from '../components/WaveformVisualizer';

const FEATURES = [
    { icon: '🌐', text: 'Multilingual – EN / HI / Hinglish' },
    { icon: '🔒', text: 'Your data is सुरक्षित / Secure' },
    { icon: '⚡', text: 'Deepgram · Gemini · Murf AI' },
    { icon: '❤️', text: 'Non-diagnostic guidance' },
];

export default function HomeScreen() {
    const {
        status, interimText,
        startListening, stopListening, processUserInput, isSpeakingAI, interruptAI,
    } = useSession();

    const isListening = status === 'listening';

    const handleOrbClick = () => {
        if (isSpeakingAI) {
            interruptAI();
            return;
        }
        if (isListening) {
            stopListening();
            return;
        }
        if (status !== 'idle') return;
        startListening();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-between px-6 py-8">
            {/* Header */}
            <motion.header
                className="w-full max-w-lg flex items-center justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(45,212,191,0.3))', border: '1px solid rgba(56,189,248,0.3)' }}>
                        🩺
                    </div>
                    <span className="font-display font-bold text-xl text-gradient">MediVoice</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AI Ready
                </div>
            </motion.header>

            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-3 leading-tight">
                        <span className="text-gradient">Speak Your</span>
                        <br />
                        <span className="text-white">Symptoms</span>
                    </h1>
                    <p className="text-white/50 text-base sm:text-lg font-light tracking-wide">
                        Get instant AI-powered health guidance
                    </p>
                </motion.div>

                {/* Floating orb */}
                <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <AnimatedOrb size={180} onClick={handleOrbClick} />
                </motion.div>

                {/* Live transcription */}
                <motion.div
                    className="w-full max-w-sm mt-8 text-center min-h-12"
                    animate={{ opacity: interimText ? 1 : 0 }}
                >
                    {interimText && (
                        <motion.div
                            className="px-5 py-3 rounded-2xl glass border border-sky-400/20"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <p className="text-sky-300 text-sm italic">"{interimText}"</p>
                            <p className="text-xs text-white/25 mt-1">Deepgram · live transcription</p>
                        </motion.div>
                    )}
                </motion.div>

                {/* Waveform */}
                <div className="w-full max-w-sm mt-4">
                    <WaveformVisualizer height={50} bars={40} />
                </div>

                {!isListening && !interimText && (
                    <motion.p
                        className="mt-6 text-white/30 text-sm text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        Tap the orb and tell me how you're feeling
                    </motion.p>
                )}

                {/* Quick-start chips */}
                {!isListening && (
                    <motion.div
                        className="mt-6 flex flex-wrap gap-2 justify-center"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        {['I have a headache', 'Mujhe bukhar hai', 'Stomach pain since morning'].map(q => (
                            <button
                                key={q}
                                onClick={() => processUserInput(q, null)}
                                className="px-3.5 py-1.5 rounded-full text-xs text-white/50 glass border border-white/10 hover:border-sky-400/30 hover:text-sky-300 transition-all duration-200"
                            >
                                {q}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Feature badges */}
            <motion.div
                className="w-full max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass border border-white/5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <span className="text-base">{f.icon}</span>
                            <span className="text-xs text-white/40">{f.text}</span>
                        </motion.div>
                    ))}
                </div>
                <p className="text-center text-xs text-white/20 leading-relaxed">
                    ⚕️ Not a medical diagnosis · For guidance only · Always consult a doctor
                </p>
            </motion.div>
        </div>
    );
}
