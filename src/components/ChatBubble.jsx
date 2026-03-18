import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { parseAssessment } from '../services/aiService';

function TypingText({ text, speed = 18 }) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                i++;
            } else {
                setDone(true);
                clearInterval(interval);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <span>
            {displayed}
            {!done && <span className="cursor-blink inline-block w-0.5 h-4 bg-current ml-0.5 align-middle" />}
        </span>
    );
}

export default function ChatBubble({ message, isLatest }) {
    const isUser = message.role === 'user';
    const isEmergency = message.meta?.isEmergency;

    // Clean display text
    let displayText = message.meta?.displayText || message.content;
    displayText = displayText
        .replace(/ASSESSMENT_START[\s\S]*?ASSESSMENT_END/g, '')
        .trim();

    const hasAssessment = message.meta?.hasAssessment;
    const assessment = hasAssessment ? parseAssessment(message.content) : null;

    if (isUser) {
        return (
            <motion.div
                className="flex justify-end mb-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div
                    className="max-w-xs sm:max-w-md px-5 py-3.5 rounded-3xl rounded-tr-sm bubble-user"
                    style={{ maxWidth: '75%' }}
                >
                    <p className="text-sm font-medium text-sky-50 leading-relaxed">{displayText}</p>
                    <p className="text-xs text-sky-300/40 mt-1.5 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {/* User avatar */}
                <div className="w-8 h-8 rounded-full ml-2 flex-shrink-0 flex items-center justify-center text-xs font-bold self-end bg-gradient-to-br from-sky-500 to-teal-500">
                    U
                </div>
            </motion.div>
        );
    }

    // AI message
    return (
        <motion.div
            className="flex justify-start mb-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            {/* AI Avatar */}
            <div className={`w-8 h-8 rounded-full mr-2 flex-shrink-0 flex items-center justify-center self-end text-lg ${isEmergency ? 'bg-red-600' : 'bg-gradient-to-br from-violet-600 to-sky-600'}`}>
                {isEmergency ? '🚨' : '🤖'}
            </div>

            <div style={{ maxWidth: '75%' }}>
                {/* Emergency styling */}
                {isEmergency ? (
                    <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-red-900/40 border border-red-500/50">
                        <p className="text-sm font-semibold text-red-200 leading-relaxed">{displayText}</p>
                    </div>
                ) : (
                    <div className="px-5 py-3.5 rounded-3xl rounded-tl-sm bubble-ai">
                        <p className="text-sm text-white/85 leading-relaxed">
                            {isLatest && displayText ? (
                                <TypingText text={displayText} />
                            ) : (
                                displayText
                            )}
                        </p>
                    </div>
                )}

                {/* Assessment card if present */}
                {assessment && (
                    <motion.div
                        className="mt-2 px-5 py-4 rounded-2xl glass border border-purple-500/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider mb-2">
                            📋 Assessment Summary
                        </p>
                        {assessment.conditions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {assessment.conditions.map((c, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full glass border border-white/10 text-white/70">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        )}
                        <RiskBadge risk={assessment.risk} />
                    </motion.div>
                )}

                <p className="text-xs text-white/25 mt-1.5 ml-1">
                    MediVoice · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </motion.div>
    );
}

function RiskBadge({ risk }) {
    const config = {
        LOW: { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', emoji: '🟢', label: 'Low Risk' },
        MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', emoji: '🟡', label: 'Medium Risk' },
        HIGH: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', emoji: '🔴', label: 'High Risk' },
    };
    const c = config[risk] || config.LOW;
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${c.bg} ${c.color} font-semibold`}>
            {c.emoji} {c.label}
        </span>
    );
}
