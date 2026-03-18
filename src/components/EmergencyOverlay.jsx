import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';

export default function EmergencyOverlay() {
    const { resetSession } = useSession();

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ background: 'rgba(0,0,0,0.85)' }}
            >
                {/* Pulsing red ring */}
                <motion.div
                    className="absolute rounded-full border-4 border-red-500"
                    style={{ width: 300, height: 300 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute rounded-full border-2 border-red-400"
                    style={{ width: 200, height: 200 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.5, delay: 0.3, repeat: Infinity }}
                />

                {/* Emergency card */}
                <motion.div
                    className="relative mx-6 max-w-sm w-full rounded-3xl p-8 text-center"
                    style={{
                        background: 'rgba(127,0,0,0.4)',
                        backdropFilter: 'blur(30px)',
                        border: '2px solid rgba(239,68,68,0.6)',
                        boxShadow: '0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.2)',
                    }}
                    initial={{ scale: 0.7, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <motion.div
                        className="text-6xl mb-4"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        🚨
                    </motion.div>

                    <h2 className="text-2xl font-bold text-red-300 mb-2 font-display">
                        Emergency Alert
                    </h2>
                    <p className="text-red-100/80 text-sm mb-6 leading-relaxed">
                        Your symptoms suggest a medical emergency. Please seek immediate help.
                    </p>

                    {/* Emergency numbers */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <EmergencyButton number="112" label="Emergency" icon="🆘" />
                        <EmergencyButton number="108" label="Ambulance" icon="🚑" />
                        <EmergencyButton number="102" label="Maternity" icon="👶" />
                        <EmergencyButton number="1800-180-1104" label="Health Helpline" icon="📞" />
                    </div>

                    <button
                        onClick={resetSession}
                        className="w-full py-3 rounded-2xl text-sm font-semibold text-white/60 border border-white/10 hover:bg-white/5 transition-all duration-200"
                    >
                        I'm safe — Return to app
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function EmergencyButton({ number, label, icon }) {
    return (
        <a
            href={`tel:${number}`}
            className="flex flex-col items-center py-3 px-2 rounded-2xl bg-red-900/40 border border-red-500/30 hover:bg-red-800/50 transition-all duration-200 group"
        >
            <span className="text-xl mb-1">{icon}</span>
            <span className="text-white font-bold text-sm group-hover:text-red-200">{number}</span>
            <span className="text-white/50 text-xs">{label}</span>
        </a>
    );
}
