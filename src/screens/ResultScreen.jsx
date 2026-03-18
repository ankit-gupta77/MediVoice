import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../context/SessionContext';

const RISK_CONFIG = {
    LOW: {
        emoji: '🟢',
        label: 'Low Risk',
        color: 'text-green-400',
        borderColor: 'border-green-400/30',
        bg: 'from-green-500/10 to-emerald-500/5',
        glow: '0 0 40px rgba(74,222,128,0.15)',
        desc: 'Your symptoms appear mild. Monitor closely and follow home care guidelines.',
    },
    MEDIUM: {
        emoji: '🟡',
        label: 'Moderate Risk',
        color: 'text-yellow-400',
        borderColor: 'border-yellow-400/30',
        bg: 'from-yellow-500/10 to-amber-500/5',
        glow: '0 0 40px rgba(250,204,21,0.15)',
        desc: 'Your symptoms warrant attention. Consider consulting a doctor soon.',
    },
    HIGH: {
        emoji: '🔴',
        label: 'High Risk',
        color: 'text-red-400',
        borderColor: 'border-red-400/30',
        bg: 'from-red-500/15 to-orange-500/5',
        glow: '0 0 40px rgba(239,68,68,0.2)',
        desc: 'Your symptoms are concerning. Please seek medical help promptly.',
    },
};

const NEARBY_DOCTORS = [
    { name: 'Dr. Priya Sharma', specialty: 'General Physician', distance: '0.8 km', rating: '4.8', avail: 'Available now' },
    { name: 'Dr. Arjun Mehta', specialty: 'Internal Medicine', distance: '1.2 km', rating: '4.9', avail: 'Next: 3:00 PM' },
    { name: 'City Health Clinic', specialty: 'Multi-specialty', distance: '2.1 km', rating: '4.6', avail: 'Walk-in open' },
];

export default function ResultScreen() {
    const { assessment, symptoms, messages, resetSession, setScreen } = useSession();

    // Fallback assessment from messages if not in context
    const riskKey = assessment?.risk || 'LOW';
    const riskConf = RISK_CONFIG[riskKey] || RISK_CONFIG.LOW;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="min-h-screen flex flex-col max-w-lg mx-auto">
            {/* Header */}
            <motion.header
                className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
                style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,7,18,0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <button onClick={() => setScreen('chat')} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">Chat</span>
                </button>
                <span className="font-display font-bold text-lg text-gradient">Assessment</span>
                <button onClick={resetSession} className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-white/40 hover:text-white/60 transition-colors">
                    New
                </button>
            </motion.header>

            <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Risk level card */}
                    <motion.div
                        variants={itemVariants}
                        className={`rounded-3xl p-6 bg-gradient-to-br ${riskConf.bg} border ${riskConf.borderColor}`}
                        style={{ boxShadow: riskConf.glow }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Risk Level</p>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full glass border ${riskConf.borderColor} ${riskConf.color}`}>
                                {riskConf.emoji} {riskConf.label}
                            </span>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">{riskConf.desc}</p>
                    </motion.div>

                    {/* Symptom summary */}
                    <motion.div variants={itemVariants} className="rounded-3xl p-5 glass border border-white/08">
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Symptom Summary</p>
                        <p className="text-white/75 text-sm leading-relaxed">
                            {assessment?.summary || 'Based on the conversation, we have recorded your reported symptoms and concerns.'}
                        </p>
                        {symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {symptoms.map((s, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full glass border border-sky-400/20 text-sky-300/70">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Possible conditions */}
                    {assessment?.conditions?.length > 0 && (
                        <motion.div variants={itemVariants} className="rounded-3xl p-5 glass border border-white/08">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Possible Conditions</p>
                            <div className="space-y-2">
                                {assessment.conditions.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 flex-shrink-0" />
                                        <span className="text-sm text-white/70">{c}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-white/25 mt-3 italic">
                                ⚕️ These are informational only, not a diagnosis.
                            </p>
                        </motion.div>
                    )}

                    {/* Next steps */}
                    {assessment?.steps?.length > 0 && (
                        <motion.div variants={itemVariants} className="rounded-3xl p-5 glass border border-white/08">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Recommended Steps</p>
                            <div className="space-y-3">
                                {assessment.steps.map((step, i) => (
                                    <div key={i} className="flex gap-3">
                                        <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                            style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-white/70 leading-relaxed flex-1">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Action buttons */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                        <ActionButton
                            emoji="🏠"
                            label="Home Care"
                            sublabel="Self treatment tips"
                            color="from-sky-500/15 to-teal-500/10"
                            border="border-sky-400/20"
                        />
                        <ActionButton
                            emoji="👨‍⚕️"
                            label="Consult Doctor"
                            sublabel="Book appointment"
                            color="from-purple-500/15 to-violet-500/10"
                            border="border-purple-400/20"
                        />
                        <ActionButton
                            emoji="🚨"
                            label="Emergency"
                            sublabel="Call 108 / 112"
                            color="from-red-500/15 to-orange-500/10"
                            border="border-red-400/20"
                            href="tel:112"
                        />
                    </motion.div>

                    {/* Nearby doctors (mock) */}
                    <motion.div variants={itemVariants} className="rounded-3xl p-5 glass border border-white/08">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Nearby Doctors</p>
                            <span className="text-xs text-sky-400/60">📍 Mock data</span>
                        </div>
                        <div className="space-y-3">
                            {NEARBY_DOCTORS.map((doc, i) => (
                                <motion.div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-2xl glass border border-white/05 hover:border-white/10 transition-all cursor-pointer"
                                    whileHover={{ scale: 1.01, x: 4 }}
                                >
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg,rgba(56,189,248,0.2),rgba(45,212,191,0.2))' }}>
                                        {['👩‍⚕️', '👨‍⚕️', '🏥'][i]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white/80 truncate">{doc.name}</p>
                                        <p className="text-xs text-white/40">{doc.specialty} · {doc.distance}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-yellow-400">⭐ {doc.rating}</p>
                                        <p className="text-xs text-green-400/70">{doc.avail}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Disclaimer */}
                    <motion.div
                        variants={itemVariants}
                        className="p-4 rounded-2xl border border-white/05 text-center"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                        <p className="text-xs text-white/25 leading-relaxed">
                            ⚕️ This is <strong>not a medical diagnosis</strong>. MediVoice provides general information only.
                            Always consult a qualified healthcare professional for proper medical advice and treatment.
                        </p>
                    </motion.div>

                    {/* CTA */}
                    <motion.button
                        variants={itemVariants}
                        onClick={resetSession}
                        className="w-full py-4 rounded-3xl font-semibold text-sm btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        🎙 Start New Consultation
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

function ActionButton({ emoji, label, sublabel, color, border, href }) {
    const Tag = href ? 'a' : 'button';
    return (
        <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Tag
                href={href}
                className={`block w-full p-3.5 rounded-3xl bg-gradient-to-br ${color} border ${border} text-center cursor-pointer transition-all`}
                style={{ textDecoration: 'none' }}
            >
                <span className="text-2xl block mb-1">{emoji}</span>
                <p className="text-xs font-semibold text-white/80">{label}</p>
                <p className="text-xs text-white/35 mt-0.5">{sublabel}</p>
            </Tag>
        </motion.div>
    );
}
