import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playRocketSynth } from "../utils/audio";

interface SpaceRocketProps {
  lastEvent: { key: string; timestamp: number } | null;
  soundEnabled: boolean;
}

interface SpaceObject {
  id: string;
  emoji: string;
  name: string;
  keyLabel: string;
  x: number; // percentage from left, e.g. 5 to 95
  y: number; // height from top, e.g. window.innerHeight (starts bottom)
  speedY: number; // upward progress speed
  speedX: number; // drift
  scale: number;
  rotation: number;
  pulse: boolean;
}

const SPACE_EMOJIS = [
  { emoji: "🚀", name: "Starship Rocket", sound: "blastoff" },
  { emoji: "🛸", name: "Gliding UFO", sound: "glide" },
  { emoji: "🪐", name: "Golden Saturn", sound: "orbit" },
  { emoji: "🧑‍🚀", name: "Tiny Astronaut", sound: "float" },
  { emoji: "👾", name: "Cute Martian", sound: "alien" },
  { emoji: "🛰️", name: "Orbit Satellite", sound: "beep" },
  { emoji: "☄️", name: "Fiery Comet", sound: "fizzle" },
  { emoji: "🌙", name: "Sleepy Moon", sound: "glow" },
  { emoji: "⭐", name: "Golden Star", sound: "twinkle" },
];

export default function SpaceRocketView({ lastEvent, soundEnabled }: SpaceRocketProps) {
  const [objects, setObjects] = useState<SpaceObject[]>([]);
  const [trailParticles, setTrailParticles] = useState<Array<{ id: string; x: number; y: number; color: string; scale: number }>>([]);

  useEffect(() => {
    if (!lastEvent) return;

    // Use charCode to pick emoji or random
    const charCode = lastEvent.key.charCodeAt(0) || 32;
    const item = SPACE_EMOJIS[charCode % SPACE_EMOJIS.length];

    const startX = 10 + Math.random() * 80; // 10% to 90% wide
    const initialY = window.innerHeight + 80;

    const newObj: SpaceObject = {
      id: `${lastEvent.timestamp}-${Math.random()}`,
      emoji: item.emoji,
      name: item.name,
      keyLabel: lastEvent.key.toUpperCase(),
      x: startX,
      y: initialY,
      speedY: -(Math.random() * 5 + 7), // travels upwards
      speedX: (Math.random() - 0.5) * 2, // slight drift
      scale: Math.random() * 0.3 + 0.9,
      rotation: (Math.random() - 0.5) * 45, // slight orientation angle
      pulse: Math.random() > 0.5,
    };

    if (soundEnabled) {
      playRocketSynth();
    }

    setObjects((prev) => [...prev, newObj].slice(-15));
  }, [lastEvent, soundEnabled]);

  // Handle loop animation frame running 30 times a second
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Update objects
      setObjects((prev) =>
        prev
          .map((obj) => ({
            ...obj,
            y: obj.y + obj.speedY,
            x: Math.max(5, Math.min(95, obj.x + (obj.speedX / window.innerWidth) * 100)),
            rotation: obj.rotation + (obj.emoji === "🛸" ? 5 : 0.2), // UFO spins faster!
          }))
          .filter((obj) => obj.y > -200) // remove after flying off-screen
      );

      // 2. Spawn exhaust trail particles behind active objects
      setObjects((activeObjects) => {
        if (activeObjects.length > 0) {
          const newParticles: any[] = [];
          activeObjects.forEach((obj) => {
            // Only rocket, UFO, and comet spawn exhaust particles
            if (obj.emoji === "🚀" || obj.emoji === "🛸" || obj.emoji === "☄️") {
              const xPos = (obj.x / 100) * window.innerWidth;
              // Spawn right at the base of the emoji
              newParticles.push({
                id: `trail-${Date.now()}-${Math.random()}`,
                x: xPos + (Math.random() - 0.5) * 20,
                y: obj.y + 70 + Math.random() * 10,
                color: obj.emoji === "🚀" ? "rgba(239, 68, 68, 0.6)" : obj.emoji === "🛸" ? "rgba(168, 85, 247, 0.5)" : "rgba(249, 115, 22, 0.6)",
                scale: Math.random() * 1.2 + 0.6,
                opacity: 0.9,
              });
            }
          });
          if (newParticles.length > 0) {
            setTrailParticles((tp) => [...tp, ...newParticles].slice(-40));
          }
        }
        return activeObjects;
      });

      // 3. Update trail particles (slow fade and downward drop)
      setTrailParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + 2, // drop slightly
            opacity: (p as any).opacity - 0.05,
          }))
          .filter((p) => (p as any).opacity > 0)
      );
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-transparent overflow-hidden select-none pointer-events-none z-10 transition-all duration-700">
      
      {/* Dynamic Star Ambient Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[25%] w-2 h-2 bg-white rounded-full animate-ping" />
        <div className="absolute top-[30%] right-[30%] w-1 h-1 bg-white rounded-full animate-ping [animation-delay:1s]" />
        <div className="absolute bottom-[25%] left-[45%] w-2 h-2 bg-white rounded-full animate-ping [animation-delay:2.5s]" />
        <div className="absolute top-[60%] left-[15%] w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" />
        <div className="absolute top-[45%] right-[10%] w-2.5 h-2.5 bg-blue-300 rounded-full animate-pulse [animation-delay:1.5s]" />
        <div className="absolute bottom-[10%] right-[40%] w-1 h-1 bg-red-200 rounded-full animate-ping [animation-delay:0.5s]" />
      </div>

      {/* Floating Mode banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🚀 Space Rocket Mode 🚀
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold drop-shadow-xs">Mash keys to blast off spaceships into orbit!</h2>
      </div>

      {/* Exhaust Fire Trail Layer */}
      {trailParticles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none blur-[2px]"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${12 * p.scale}px`,
            height: `${12 * p.scale}px`,
            backgroundColor: p.color,
            opacity: (p as any).opacity,
          }}
        />
      ))}

      {/* Active Flying Space Objects */}
      <AnimatePresence>
        {objects.map((obj) => (
          <div
            key={obj.id}
            className="absolute select-none pointer-events-none transition-all duration-75"
            style={{
              left: `${obj.x}%`,
              top: `${obj.y}px`,
              transform: `translate(-50%, -50%) scale(${obj.scale}) rotate(${obj.rotation}deg)`,
            }}
          >
            <div className="flex flex-col items-center">
              {/* Glassmorphic speech bubble naming the active vehicle */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 0.95, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="bg-white/10 backdrop-blur-md text-[10px] text-white font-extrabold px-2.5 py-1 rounded-xl border border-white/10 whitespace-nowrap mb-1.5 shadow-md pointer-events-none flex items-center gap-1.5"
              >
                <div className="w-5 h-5 rounded-full bg-pink-500 text-white font-mono font-black text-xs flex items-center justify-center border border-white/10">
                  {obj.keyLabel}
                </div>
                <span>{obj.name}</span>
              </motion.div>

              {/* Massive Cartoon Emoji spaceship */}
              <div
                className="text-7xl md:text-8xl select-none filter drop-shadow-[0_15px_15px_rgba(255,255,255,0.12)]"
              >
                {obj.emoji}
              </div>

              {/* Space travel thruster fire effect at bottom of emojis */}
              {obj.emoji === "🚀" && (
                <div className="w-6 h-10 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent rounded-full animate-bounce blur-[2px] opacity-90 mt-[-10px] scale-x-75" />
              )}
            </div>
          </div>
        ))}
      </AnimatePresence>

      {/* Control Instruction Footer */}
      <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-center opacity-60 font-mono text-xs select-none text-white font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
        <span>Click or type any character to trigger massive rocket thrusts!</span>
      </div>

    </div>
  );
}
