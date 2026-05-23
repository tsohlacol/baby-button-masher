/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import { useEffect, useRef, useState } from "react";
import { Particle } from "../types";

interface FireworksProps {
  lastEvent: { key: string; timestamp: number } | null;
  theme: "cosmic" | "pastel" | "forest" | "rainbow";
}

// Maps each typeable key to a normalized (x, y) screen position that mirrors its
// physical location on a standard QWERTY keyboard.
// x=0 is the far-left edge, x=1 is the far-right edge; y=0 is top, y=1 is bottom.
const KEY_POSITIONS: Record<string, [number, number]> = {
  // Number row (y ≈ 0.08)
  "`": [0.03, 0.08],
  "1": [0.07, 0.08], "2": [0.15, 0.08], "3": [0.23, 0.08], "4": [0.31, 0.08],
  "5": [0.39, 0.08], "6": [0.47, 0.08], "7": [0.55, 0.08], "8": [0.63, 0.08],
  "9": [0.71, 0.08], "0": [0.79, 0.08], "-": [0.87, 0.08], "=": [0.92, 0.08],
  // QWERTY row (y ≈ 0.28, slight right offset for Tab)
  "q": [0.10, 0.28], "w": [0.18, 0.28], "e": [0.26, 0.28], "r": [0.34, 0.28],
  "t": [0.42, 0.28], "y": [0.50, 0.28], "u": [0.58, 0.28], "i": [0.66, 0.28],
  "o": [0.74, 0.28], "p": [0.82, 0.28], "[": [0.88, 0.28], "]": [0.93, 0.28],
  // ASDF row (y ≈ 0.52, CapsLock offset)
  "a": [0.12, 0.52], "s": [0.20, 0.52], "d": [0.28, 0.52], "f": [0.36, 0.52],
  "g": [0.44, 0.52], "h": [0.52, 0.52], "j": [0.60, 0.52], "k": [0.68, 0.52],
  "l": [0.76, 0.52], ";": [0.84, 0.52], "'": [0.90, 0.52],
  // ZXCV row (y ≈ 0.74, large Shift offset)
  "z": [0.16, 0.74], "x": [0.24, 0.74], "c": [0.32, 0.74], "v": [0.40, 0.74],
  "b": [0.48, 0.74], "n": [0.56, 0.74], "m": [0.64, 0.74],
  ",": [0.72, 0.74], ".": [0.80, 0.74], "/": [0.87, 0.74],
  // Space bar
  " ": [0.50, 0.92],
};

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
