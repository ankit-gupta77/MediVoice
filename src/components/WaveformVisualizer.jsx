import React, { useEffect, useRef } from 'react';
import { useSession } from '../context/SessionContext';

export default function WaveformVisualizer({ height = 60, bars = 32 }) {
    const { status } = useSession();
    const animFrameRef = useRef(null);
    const canvasRef = useRef(null);
    const barsRef = useRef(Array(bars).fill(0.1));
    const isListening = status === 'listening';
    const isSpeaking = status === 'speaking';
    const isActive = isListening || isSpeaking;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let time = 0;

        function draw() {
            canvas.width = canvas.offsetWidth;
            canvas.height = height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bars;
            const gap = 2;

            for (let i = 0; i < bars; i++) {
                let targetH;
                if (isListening) {
                    // Simulate microphone input with oscillating heights
                    targetH = 0.1 + 0.7 * Math.abs(
                        Math.sin(time * 3 + i * 0.7) * Math.sin(time * 1.5 + i * 0.3)
                    );
                } else if (isSpeaking) {
                    targetH = 0.08 + 0.4 * Math.abs(
                        Math.sin(time * 2 + i * 0.5) * Math.cos(time + i * 0.4)
                    );
                } else {
                    targetH = 0.05 + 0.04 * Math.abs(Math.sin(time * 0.5 + i * 0.3));
                }

                // Smooth animation
                barsRef.current[i] += (targetH - barsRef.current[i]) * 0.15;
                const barH = barsRef.current[i] * height;

                const x = i * barWidth + gap / 2;
                const y = (height - barH) / 2;

                // Color gradient based on position and activity
                const progress = i / bars;
                const r = isListening ? 45 : isSpeaking ? 56 : 100;
                const g = isListening ? 212 : isSpeaking ? 189 : 150;
                const b = isListening ? 191 : isSpeaking ? 248 : 200;
                const alpha = isActive ? 0.6 + 0.4 * barsRef.current[i] : 0.2;

                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth - gap, barH, 2);
                ctx.fill();
            }

            time += 0.04;
            animFrameRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isListening, isSpeaking, bars, height]);

    return (
        <div className={`w-full transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
            <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height }}
            />
        </div>
    );
}
