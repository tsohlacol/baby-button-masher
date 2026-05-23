/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playSyntheticPiano } from "../utils/audio";

interface MouseDrawingProps {
  lastEvent: { key: string; timestamp: number } | null;
  soundEnabled: boolean;
  theme: "cosmic" | "pastel" | "forest" | "rainbow";
}

interface Point {
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  age: number; // to handle decay
}

interface DrawingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  text?: string; // and can display stamped emojis or keys
}

export default function MouseDrawingView({ lastEvent, soundEnabled, theme }: MouseDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [stampEmojis, setStampEmojis] = useState<Array<{ id: string; x: number; y: number; text: string; scale: number }>>([]);
  const pointsRef = useRef<Point[]>([]);
  const particlesRef = useRef<DrawingParticle[]>([]);
  const hueRef = useRef(0);

  // Sync state points list to ref for high frequency requestAnimationFrame access
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Handle drawing sizing and animation loop
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

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw starry ambient background if cosmic or rainbow
      if (theme === "cosmic" || theme === "rainbow") {
        ctx.fillStyle = "rgba(10, 10, 26, 0.08)";
      } else if (theme === "pastel") {
        ctx.fillStyle = "rgba(31, 14, 34, 0.08)";
      } else {
        ctx.fillStyle = "rgba(5, 19, 15, 0.08)";
      }

      const activePoints = pointsRef.current;
      const activeParticles = particlesRef.current;

      // 1. Draw glowing drawing trails
      if (activePoints.length > 1) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        for (let i = 1; i < activePoints.length; i++) {
          const p1 = activePoints[i - 1];
          const p2 = activePoints[i];

          // Skip connecting points if they belong to different segments
          const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          if (distance > 100) continue; 

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          // Neon aesthetic styling
          ctx.strokeStyle = p2.color;
          ctx.lineWidth = p2.size * p2.alpha;
          ctx.shadowColor = p2.color;
          ctx.shadowBlur = 12;
          ctx.globalAlpha = p2.alpha;

          ctx.stroke();
        }
        ctx.shadowBlur = 0; // reset
        ctx.globalAlpha = 1.0;
      }

      // 2. Render particle system (sparkles drifting)
      activeParticles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // slight gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          activeParticles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.text) {
          // Render letters or emojis!
          ctx.font = `${p.size * 2}px sans-serif`;
          ctx.fillText(p.text, p.x, p.y);
        } else {
          // Render sparkles
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 3. Decay Trail Points (make drawing disappear slowly so it stays fresh!)
      const nextPoints = activePoints
        .map((p) => ({
          ...p,
          alpha: p.alpha - 0.0035, // slowly fade away
        }))
        .filter((p) => p.alpha > 0);

      if (nextPoints.length !== activePoints.length) {
        setPoints(nextPoints);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Keyboard press stamps emojis or shapes to let toddler interact
  useEffect(() => {
    if (!lastEvent) return;

    const char = lastEvent.key.toUpperCase();
    const x = Math.random() * (window.innerWidth - 300) + 150;
    const y = Math.random() * (window.innerHeight - 300) + 150;

    // Pick dynamic colors for stamps
    const colors = ["#ff007f", "#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ec4899", "#14b8a6"];
    const col = colors[char.charCodeAt(0) % colors.length];

    // Spawn stamp particles
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: col,
        size: Math.random() * 4 + 4,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015,
      });
    }

    // Add emoji stamp
    const emojis = ["⭐", "🦄", "🌈", "🐱", "🐾", "🎨", "🍉", "🐬", "🍩", "🌸", "🏰", "🦖", "🚀"];
    const selectedEmoji = emojis[char.charCodeAt(0) % emojis.length];

    setStampEmojis((prev) => [
      ...prev,
      {
        id: `${lastEvent.timestamp}-${Math.random()}`,
        x,
        y,
        text: `${char} ${selectedEmoji}`,
        scale: Math.random() * 0.3 + 0.9,
      },
    ].slice(-15));

    if (soundEnabled) {
      playSyntheticPiano(lastEvent.key, "triangle");
    }

  }, [lastEvent, soundEnabled]);

  // Handle pointer interactions (drawing mouse/touch moves)
  const addDrawingPointHelper = (clientX: number, clientY: number) => {
    // Generate lovely cycle hue colors
    hueRef.current = (hueRef.current + 3) % 360;
    const color = `hsla(${hueRef.current}, 90%, 65%, 1)`;

    const newPoint: Point = {
      x: clientX,
      y: clientY,
      color,
      size: Math.random() * 8 + 14,
      alpha: 1.0,
      age: 0,
    };

    setPoints((prev) => [...prev, newPoint]);

    // Emit light starry background particles
    if (Math.random() > 0.6) {
      particlesRef.current.push({
        x: clientX,
        y: clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 1,
        color,
        size: Math.random() * 3 + 2,
        alpha: 0.9,
        decay: 0.02,
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDrawingRef.current = true;
    addDrawingPointHelper(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Drawn automatically on mouse move so kid does not need to drag-hold!
    addDrawingPointHelper(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 w-full h-full bg-[#0a0a1a] overflow-hidden select-none touch-none z-10"
      style={{ cursor: "crosshair" }} // Custom target crosshair
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />

      {/* Mode Header instructions */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none z-20">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-emerald-300 bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🎨 Sensory Brush Sandbox 🎨
        </span>
        <h2 className="text-white/80 text-sm mt-3 font-semibold drop-shadow-xs">Move the mouse or glide your finger to draw rainbows!</h2>
      </div>

      {/* Floating Emojis stamped by key triggers */}
      <AnimatePresence>
        {stampEmojis.map((stamp) => (
          <motion.div
            key={stamp.id}
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: stamp.scale, opacity: 1, y: 0 }}
            exit={{ scale: 0.2, opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            className="absolute pointer-events-none font-bold text-center drop-shadow-[0_10px_10px_rgba(255,255,255,0.15)]"
            style={{
              left: stamp.x,
              top: stamp.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-mono text-xl sm:text-2xl whitespace-nowrap">
              {stamp.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Mode Hint overlay block */}
      <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-center opacity-70 font-mono text-xs select-none text-white font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 z-20">
        <span>Draw on the screen & press keys to hear music chimes & stamp animations!</span>
      </div>
    </div>
  );
}
