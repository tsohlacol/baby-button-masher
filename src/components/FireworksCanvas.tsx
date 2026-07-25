/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import React, { useEffect, useRef } from "react";
import { Particle } from "../types";
import { themePalette } from "../constants/themes";

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

interface Seed {
  id: string;
  x: number;
  y: number;
  color: string;
  plantedAt: number;
}

// Radius (px) within which a left-click detonation blooms planted seeds.
const BLOOM_RADIUS = 260;
// Radius (px) within which a nearby cursor makes a seed shimmer.
const SHIMMER_RADIUS = 180;
// Wave (px/frame) magnitude that maps to 100% shockwave charge.
const MAX_WAVE_SPEED = 42;
// Per-frame decay of the shockwave vector so charge fades out after motion stops.
const WAVE_DECAY = 0.93;
// How fast a new motion sample overrides the smoothed wave vector; high value
// means a quick flick registers charge almost instantly.
const WAVE_ATTACK = 0.65;

export default function FireworksCanvas({ lastEvent, theme }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const seedsRef = useRef<Seed[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const waveRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const currentColorIndexRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Spawns a firework burst of particles at (x, y) in the given color. When a
  // `wave` (direction + charge) is supplied, particles are biased toward that
  // direction and sped up, stretching the round burst into a comet shape.
  const spawnBurst = (
    x: number,
    y: number,
    color: string,
    count?: number,
    wave?: { angle: number; charge: number }
  ) => {
    const numParticles = count ?? 35 + Math.floor(Math.random() * 25);
    const newParticles: Particle[] = [];

    // Different explosion styles
    const styles: Array<"circle" | "star" | "ring"> = ["circle", "star", "ring"];
    const explosionStyle = styles[Math.floor(Math.random() * styles.length)];

    for (let i = 0; i < numParticles; i++) {
      let angle: number;
      if (wave && wave.charge > 0.04) {
        // Narrow the spread cone around the wave direction as charge grows.
        const spread = Math.PI * 2 * (1 - wave.charge * 0.85);
        angle = wave.angle + (Math.random() - 0.5) * spread;
      } else {
        angle = Math.random() * Math.PI * 2;
      }

      const speed = Math.random() * 7 + 2 + (wave ? wave.charge * 9 : 0);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const decay = (Math.random() * 0.015 + 0.012) * (wave ? 1 - wave.charge * 0.3 : 1);

      newParticles.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        vx,
        vy,
        color,
        size: Math.random() * 5 + 3,
        alpha: 1.0,
        decay,
        shape: explosionStyle,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-300); // Caps particle amount for performance
  };

  // Spawns particles on keystrokes
  useEffect(() => {
    if (!lastEvent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Position the burst at the keyboard-layout location of the pressed key.
    // Unknown keys (Shift, arrows, etc.) fall back to a random position.
    const keyPos = KEY_POSITIONS[lastEvent.key.toLowerCase()] ?? KEY_POSITIONS[lastEvent.key];
    const x = keyPos
      ? keyPos[0] * canvas.width
      : Math.random() * (canvas.width - 200) + 100;
    const y = keyPos
      ? keyPos[1] * canvas.height
      : Math.random() * (canvas.height - 200) + 100;

    const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
    const baseColor = colors[Math.floor(Math.random() * colors.length)];

    spawnBurst(x, y, baseColor);
  }, [lastEvent, theme]);

  // Plants a glowing seed at the cursor position (right click), using the
  // color currently selected by the mouse wheel.
  const plantSeed = (x: number, y: number) => {
    const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
    const color = colors[currentColorIndexRef.current % colors.length];

    seedsRef.current = [
      ...seedsRef.current,
      { id: `${Date.now()}-${Math.random()}`, x, y, color, plantedAt: Date.now() },
    ].slice(-40); // Caps planted seed count
  };

  // Left click: detonates a shockwave-shaped firework at (x, y), distorted by
  // whatever motion wave was built up right before the click. Any planted
  // seeds within BLOOM_RADIUS bloom too, staggered into a cascade, each
  // stretched along the same wave direction.
  const detonate = (x: number, y: number) => {
    const wave = waveRef.current;
    const mag = Math.hypot(wave.vx, wave.vy);
    const charge = Math.min(1, mag / MAX_WAVE_SPEED);
    const waveInfo = charge > 0.04 ? { angle: Math.atan2(wave.vy, wave.vx), charge } : undefined;
    // Spend the charge immediately so a second click doesn't reuse it.
    waveRef.current = { vx: 0, vy: 0 };

    const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
    const currentColor = colors[currentColorIndexRef.current % colors.length];

    const nearby = seedsRef.current
      .map((seed) => ({ seed, distance: Math.hypot(seed.x - x, seed.y - y) }))
      .filter((entry) => entry.distance <= BLOOM_RADIUS)
      .sort((a, b) => a.distance - b.distance);

    if (nearby.length === 0) {
      // No planted charges nearby: the shockwave still fires on its own.
      spawnBurst(x, y, currentColor, undefined, waveInfo);
      return;
    }

    const bloomingIds = new Set(nearby.map((entry) => entry.seed.id));
    seedsRef.current = seedsRef.current.filter((seed) => !bloomingIds.has(seed.id));

    nearby.forEach((entry, i) => {
      setTimeout(() => spawnBurst(entry.seed.x, entry.seed.y, entry.seed.color, undefined, waveInfo), i * 90);
    });
  };

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

      // Draw planted seeds, shimmering brighter the closer the cursor gets.
      const now = Date.now();
      seedsRef.current.forEach((seed, i) => {
        const distToMouse = mouseRef.current ? Math.hypot(seed.x - mouseRef.current.x, seed.y - mouseRef.current.y) : Infinity;
        const proximity = Math.max(0, 1 - distToMouse / SHIMMER_RADIUS); // 0 (far) to 1 (right on top)
        const pulse = Math.sin(now / 400 + i) * 0.15 + 0.85; // gentle ambient twinkle
        const shimmer = 1 + proximity * 0.9;

        ctx.save();
        ctx.globalAlpha = pulse * (0.6 + proximity * 0.4);
        ctx.fillStyle = seed.color;
        ctx.shadowColor = seed.color;
        ctx.shadowBlur = 8 + proximity * 18;
        ctx.beginPath();
        ctx.arc(seed.x, seed.y, (4 + proximity * 3) * shimmer, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Decay the shockwave vector every frame so charge fades once motion stops.
      waveRef.current = { vx: waveRef.current.vx * WAVE_DECAY, vy: waveRef.current.vy * WAVE_DECAY };

      // Cursor HUD: current wheel-selected color + shockwave charge meter.
      if (mouseRef.current) {
        const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
        const currentColor = colors[currentColorIndexRef.current % colors.length];
        const { x: cx, y: cy } = mouseRef.current;
        const mag = Math.hypot(waveRef.current.vx, waveRef.current.vy);
        const charge = Math.min(1, mag / MAX_WAVE_SPEED);

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = currentColor;
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (charge > 0.02) {
          const waveAngle = Math.atan2(waveRef.current.vy, waveRef.current.vx);

          // Charge ring
          ctx.save();
          ctx.globalAlpha = 0.25 + charge * 0.55;
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = 2 + charge * 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 14 + charge * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Direction arrow showing where the comet burst will point
          ctx.save();
          ctx.globalAlpha = 0.5 + charge * 0.5;
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(waveAngle) * (20 + charge * 40), cy + Math.sin(waveAngle) * (20 + charge * 40));
          ctx.stroke();
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const now = performance.now();
    const prev = lastMoveRef.current;
    mouseRef.current = { x: e.clientX, y: e.clientY };

    if (prev) {
      const dt = Math.max(now - prev.t, 1);
      const rawVx = ((e.clientX - prev.x) / dt) * 16; // normalize to px/frame-ish units
      const rawVy = ((e.clientY - prev.y) / dt) * 16;
      waveRef.current = {
        vx: waveRef.current.vx * (1 - WAVE_ATTACK) + rawVx * WAVE_ATTACK,
        vy: waveRef.current.vy * (1 - WAVE_ATTACK) + rawVy * WAVE_ATTACK,
      };
    }

    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) {
      plantSeed(e.clientX, e.clientY);
    } else if (e.button === 0) {
      detonate(e.clientX, e.clientY);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Mouse wheel cycles the color used for newly planted seeds & shockwave bursts.
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const colors = THEME_COLORS[theme] || THEME_COLORS.cosmic;
    const dir = e.deltaY > 0 ? 1 : -1;
    currentColorIndexRef.current = (currentColorIndexRef.current + dir + colors.length) % colors.length;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      className="absolute inset-0 w-full h-full bg-transparent select-none touch-none overflow-hidden z-10"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          💫 Cosmic Fireworks Mode 💫
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold drop-shadow-xs">Mash keys to shoot stars! Right-click plants a seed, scroll to change its color, left-click for a shockwave burst!</h2>
      </div>
    </div>
  );
}
