import React, { useRef, useEffect } from 'react';

export default function BackgroundCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animId;
        let time = 0;

        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.4 + 0.1,
            hue: [200, 175, 270][Math.floor(Math.random() * 3)],
        }));

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function draw() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Moving orb blobs
            const blobs = [
                { x: 0.2, y: 0.3, r: 300, h: 200, s: 80, l: 20, a: 0.12, spd: 0.0005 },
                { x: 0.8, y: 0.7, r: 350, h: 180, s: 80, l: 15, a: 0.10, spd: 0.0007 },
                { x: 0.5, y: 0.5, r: 250, h: 270, s: 60, l: 20, a: 0.08, spd: 0.0004 },
            ];

            blobs.forEach((b, i) => {
                const cx = (b.x + 0.05 * Math.sin(time * b.spd * 100)) * canvas.width;
                const cy = (b.y + 0.05 * Math.cos(time * b.spd * 80)) * canvas.height;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
                grad.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,${b.a})`);
                grad.addColorStop(1, `hsla(${b.h},${b.s}%,${b.l}%,0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, b.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                const glimmer = 0.5 + 0.5 * Math.sin(time * 0.02 + p.x * 0.01);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue},80%,75%,${p.alpha * glimmer})`;
                ctx.fill();
            });

            time++;
            animId = requestAnimationFrame(draw);
        }

        draw();
        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />
    );
}
