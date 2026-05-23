import { useEffect, useRef, useState } from "react";
import { Particle } from "../types";

interface FireworksProps {
  lastEvent: { key: string; timestamp: number } | null;
  theme: "cosmic" | "pastel" | "forest" | "rainbow";
}

const THEME_COLORS: Record<string, string[]> = {
  cosmic: ["#a855f7", "#3b82f6", "#06b6d4", "#ec4899", "#f43f5e", "#e11d48"],
  pastel: ["#fbcfe8", "#c084fc", "#93c5fd", "#a7f3d0", "#fef08a", "#fda4af"],
  forest: ["#4ade80", "#22c55e", "#10b981", "#14b8a6", "#84cc16", "#a3e635"],
  rainbow: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"],
};

export default function FireworksCanvas({ lastEvent, theme }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  // Spawns particles on keystrokes
  useEffect(() => {
    if (!lastEvent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pick a semi-random position on screen
    const x = Math.random() * (canvas.width - 200) + 100;
    const y = Math.random() * (canvas.height - 200) + 100;

    const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
    const baseColor = colors[Math.floor(Math.random() * colors.length)];

    // Spawn burst
    const numParticles = 35 + Math.floor(Math.random() * 25);
    const newParticles: Particle[] = [];

    // Different explosion styles
    const styles: Array<"circle" | "star" | "ring"> = ["circle", "star", "ring"];
    const explosionStyle = styles[Math.floor(Math.random() * styles.length)];

    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      newParticles.push({
        id: `${lastEvent.timestamp}-${i}-${Math.random()}`,
        x,
        y,
        vx,
        vy,
        color: baseColor,
        size: Math.random() * 5 + 3,
        alpha: 1.0,
        decay: Math.random() * 0.015 + 0.012,
        shape: explosionStyle,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-300); // Caps particle amount for performance
  }, [lastEvent, theme]);

  // Main Canvas updates loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    const render = () => {
      // Semi-clear for glowing tail effect
      ctx.fillStyle = "rgba(10, 10, 18, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const activeParticles = particlesRef.current.filter((p) => p.alpha > 0);

      activeParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle gravity drift
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;

        if (p.shape === "star") {
          // Draw four-point sparkle
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size * 0.3, p.y - p.size * 0.3);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x + p.size * 0.3, p.y + p.size * 0.3);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size * 0.3, p.y + p.size * 0.3);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.lineTo(p.x - p.size * 0.3, p.y - p.size * 0.3);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "ring") {
          // Ring outlines
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Pure soft circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Maintain remaining particles
      particlesRef.current = activeParticles;
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-transparent select-none pointer-events-none overflow-hidden z-10">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          💫 Cosmic Fireworks Mode 💫
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold drop-shadow-xs">Mash keys to shoot stars & light sky!</h2>
      </div>
    </div>
  );
}
