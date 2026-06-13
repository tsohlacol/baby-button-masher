/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import { useEffect, useRef, useState } from "react";

interface BinkyCatcherProps {
  soundEnabled: boolean;
}

interface Binky {
  id: string;
  x: number; // pixels from left
  y: number; // pixels from top
  speed: number;
  emoji: string;
  caught: boolean;
}

interface CatchBurst {
  id: string;
  x: number;
  y: number;
}

const BINKY_EMOJIS = ["🍼", "🍼", "🍼", "🧸", "⭐", "🌈", "🍭", "🎀"];
const PLAYER_WIDTH = 80;
const PLAYER_Y_OFFSET = 120; // px from bottom
const CATCH_RADIUS = 60;

export default function BinkyCatcherView({ soundEnabled }: BinkyCatcherProps) {
  const [playerX, setPlayerX] = useState(window.innerWidth / 2);
  const [binkies, setBinkies] = useState<Binky[]>([]);
  const [score, setScore] = useState(0);
  const [bursts, setBursts] = useState<CatchBurst[]>([]);
  const [roadOffset, setRoadOffset] = useState(0);

  const playerXRef = useRef(playerX);
  const keysHeld = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);

  const playCatchSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Key listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        keysHeld.current.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => keysHeld.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Binky spawner
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const margin = 60;
      const x = margin + Math.random() * (window.innerWidth - margin * 2);
      const emoji = BINKY_EMOJIS[Math.floor(Math.random() * BINKY_EMOJIS.length)];
      setBinkies((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          x,
          y: -60,
          speed: 3 + Math.random() * 2.5,
          emoji,
          caught: false,
        },
      ].slice(-20));
    }, 1200);
    return () => clearInterval(spawnInterval);
  }, []);

  // Game loop
  useEffect(() => {
    const loop = setInterval(() => {
      const speed = 8;
      const w = window.innerWidth;

      // Move player from held keys
      if (keysHeld.current.has("ArrowLeft")) {
        setPlayerX((x) => {
          const next = Math.max(PLAYER_WIDTH / 2, x - speed);
          playerXRef.current = next;
          return next;
        });
      }
      if (keysHeld.current.has("ArrowRight")) {
        setPlayerX((x) => {
          const next = Math.min(w - PLAYER_WIDTH / 2, x + speed);
          playerXRef.current = next;
          return next;
        });
      }

      // Scroll road
      setRoadOffset((o) => (o + 6) % 120);

      const playerY = window.innerHeight - PLAYER_Y_OFFSET;
      const px = playerXRef.current;

      // Move binkies and check catches
      setBinkies((prev) => {
        const caught: Binky[] = [];
        const next = prev
          .map((b) => ({ ...b, y: b.y + b.speed }))
          .filter((b) => {
            if (b.caught) return false;
            if (b.y > window.innerHeight + 80) return false;
            // Catch check
            const dx = Math.abs(b.x - px);
            const dy = Math.abs(b.y - playerY);
            if (dx < CATCH_RADIUS && dy < CATCH_RADIUS) {
              caught.push(b);
              return false;
            }
            return true;
          });

        if (caught.length > 0) {
          caught.forEach((b) => {
            playCatchSound();
            setBursts((bs) => [...bs, { id: `burst-${Date.now()}-${Math.random()}`, x: b.x, y: b.y }].slice(-10));
          });
          setScore((s) => s + caught.length);
        }

        return next;
      });
    }, 30);

    return () => clearInterval(loop);
  }, [soundEnabled]);

  // Clean up bursts
  useEffect(() => {
    if (bursts.length === 0) return;
    const t = setTimeout(() => setBursts((bs) => bs.slice(1)), 600);
    return () => clearTimeout(t);
  }, [bursts]);

  const playerY = window.innerHeight - PLAYER_Y_OFFSET;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none" style={{ background: "linear-gradient(180deg, #1a0533 0%, #0d1f6e 60%, #1a3a1a 100%)" }}>

      {/* Scrolling road lanes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ overflow: "visible" }}>
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={window.innerWidth * frac}
            y1={-roadOffset}
            x2={window.innerWidth * frac}
            y2={window.innerHeight + 120 - roadOffset}
            stroke="white"
            strokeWidth="3"
            strokeDasharray="60 60"
          />
        ))}
        {/* Road edges */}
        <line x1="30" y1="0" x2="30" y2={window.innerHeight} stroke="#facc15" strokeWidth="4" />
        <line x1={window.innerWidth - 30} y1="0" x2={window.innerWidth - 30} y2={window.innerHeight} stroke="#facc15" strokeWidth="4" />
      </svg>

      {/* Twinkling stars in sky */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            left: `${(i * 37 + 11) % 95}%`,
            top: `${(i * 19 + 5) % 45}%`,
            animationDelay: `${(i * 0.37).toFixed(2)}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Score */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-yellow-300 bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🍼 Binky Catcher
        </span>
        <span className="text-white/80 text-2xl font-black drop-shadow-lg mt-1">
          Score: {score}
        </span>
      </div>

      {/* Falling binkies */}
      {binkies.map((b) => (
        <div
          key={b.id}
          className="absolute pointer-events-none"
          style={{
            left: b.x,
            top: b.y,
            transform: "translate(-50%, -50%)",
            fontSize: "2.5rem",
            filter: "drop-shadow(0 4px 12px rgba(255,200,100,0.5))",
          }}
        >
          {b.emoji}
        </div>
      ))}

      {/* Catch burst effects */}
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: burst.x,
            top: burst.y,
            transform: "translate(-50%, -50%)",
            fontSize: "3rem",
            opacity: 0.8,
          }}
        >
          ✨
        </div>
      ))}

      {/* Player character */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: playerX,
          top: playerY,
          transform: "translate(-50%, -50%)",
          fontSize: "3.5rem",
          filter: "drop-shadow(0 0 16px rgba(250,204,21,0.7))",
          transition: "left 30ms linear",
        }}
      >
        👶
      </div>

      {/* Instruction footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center opacity-60 font-mono text-xs text-white font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10 pointer-events-none">
        Use arrow keys to catch the binkies!
      </div>

    </div>
  );
}
