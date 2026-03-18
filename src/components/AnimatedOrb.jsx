import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../context/SessionContext';

export default function AnimatedOrb({ size = 180, onClick }) {
    const { status, isSpeakingAI } = useSession();
    const isListening = status === 'listening';
    const isProcessing = status === 'processing';

    const getOrbGradient = () => {
        if (isListening) return 'from-teal-400 via-cyan-400 to-sky-400';
        if (isProcessing) return 'from-purple-400 via-violet-400 to-indigo-400';
        if (isSpeakingAI) return 'from-sky-400 via-cyan-300 to-teal-400';
        return 'from-sky-500 via-cyan-400 to-teal-500';
    };

    const getGlowColor = () => {
        if (isListening) return 'rgba(45,212,191,0.7)';
        if (isProcessing) return 'rgba(167,139,250,0.7)';
        if (isSpeakingAI) return 'rgba(56,189,248,0.7)';
        return 'rgba(56,189,248,0.5)';
    };

    const orbLabel = isListening
        ? 'Listening...'
        : isProcessing
            ? 'Thinking...'
            : isSpeakingAI
                ? 'Speaking...'
                : 'Tap to speak';

    return (
        <div className="relative flex flex-col items-center select-none" style={{ width: size + 120 }}>
            {/* Ripple rings */}
            {(isListening || isSpeakingAI) && (
                <>
                    {[1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full border"
                            style={{
                                width: size + 40 * i,
                                height: size + 40 * i,
                                top: '50%',
                                left: '50%',
                                x: '-50%',
                                y: '-50%',
                                borderColor: isListening ? 'rgba(45,212,191,0.3)' : 'rgba(56,189,248,0.3)',
                            }}
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{
                                duration: 2,
                                delay: i * 0.4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </>
            )}

            {/* Outer glow ring */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: size + 20,
                    height: size + 20,
                    top: '50%',
                    left: '50%',
                    x: '-50%',
                    y: '-50%',
                    background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                }}
                animate={{
                    opacity: isListening ? [0.6, 1, 0.6] : isSpeakingAI ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
                    scale: isListening ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: isListening ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main orb button */}
            <motion.button
                onClick={onClick}
                className={`relative flex items-center justify-center rounded-full cursor-pointer z-10 overflow-hidden`}
                style={{ width: size, height: size }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: isListening
                        ? [`0 0 50px rgba(45,212,191,0.8), 0 0 100px rgba(45,212,191,0.4)`,
                            `0 0 80px rgba(45,212,191,1), 0 0 140px rgba(45,212,191,0.5)`,
                            `0 0 50px rgba(45,212,191,0.8), 0 0 100px rgba(45,212,191,0.4)`]
                        : [`0 0 40px rgba(56,189,248,0.5), 0 0 80px rgba(56,189,248,0.2)`,
                            `0 0 60px rgba(56,189,248,0.7), 0 0 100px rgba(56,189,248,0.3)`,
                            `0 0 40px rgba(56,189,248,0.5), 0 0 80px rgba(56,189,248,0.2)`],
                }}
                transition={{ duration: isListening ? 0.7 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
                aria-label={orbLabel}
            >
                {/* Orb gradient background */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${getOrbGradient()} opacity-20 rounded-full`}
                />

                {/* Glass surface */}
                <div className="absolute inset-0 rounded-full glass" />

                {/* Inner glow layer */}
                <div
                    className="absolute inset-2 rounded-full opacity-30"
                    style={{
                        background: `radial-gradient(circle at 35% 30%, white 0%, transparent 60%)`,
                    }}
                />

                {/* Mic icon */}
                <motion.div
                    className="relative z-10 flex flex-col items-center"
                    animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6, repeat: isListening ? Infinity : 0 }}
                >
                    {isProcessing ? (
                        <ProcessingIcon />
                    ) : isSpeakingAI ? (
                        <SpeakingIcon />
                    ) : (
                        <MicIcon isListening={isListening} size={size} />
                    )}
                </motion.div>

                {/* Shimmer effect */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            </motion.button>

            {/* Status label */}
            <motion.p
                className="mt-4 text-sm font-medium tracking-wider"
                style={{
                    color: isListening ? '#2dd4bf' : isProcessing ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                key={orbLabel}
                initial={{ opacity: 0, y: 5 }}
                exit={{ opacity: 0 }}
            >
                {orbLabel}
            </motion.p>
        </div>
    );
}

function MicIcon({ isListening, size }) {
    const iconSize = Math.round(size * 0.28);
    return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className={isListening ? 'text-teal-300' : 'text-sky-200'}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    );
}

function ProcessingIcon() {
    return (
        <motion.div
            className="flex gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-300"
                    animate={{ y: [0, -8, 0], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                />
            ))}
        </motion.div>
    );
}

function SpeakingIcon() {
    return (
        <div className="flex items-end gap-0.5 h-8">
            {[3, 5, 8, 5, 3, 6, 4].map((h, i) => (
                <motion.div
                    key={i}
                    className="w-1 rounded-full bg-sky-300"
                    animate={{ height: [4, h * 5, 4] }}
                    transition={{ duration: 0.5, delay: i * 0.07, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ minHeight: 4 }}
                />
            ))}
        </div>
    );
}
