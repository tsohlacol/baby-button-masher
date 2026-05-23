/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ParadeAnimal } from "../types";
import { playAnimalSynth } from "../utils/audio";

interface AnimalParadeProps {
  lastEvent: { key: string; timestamp: number } | null;
  soundEnabled: boolean;
}

const PARADE_EMOJIS = [
  { emoji: "🦖", name: "Dino the Dinosaur", action: "jumping", color: "#10b981" },
  { emoji: "🦕", name: "Bronto the Dinosaur", action: "running", color: "#06b6d4" },
  { emoji: "🐶", name: "Happy Puppy", action: "running", color: "#f59e0b" },
  { emoji: "🐱", name: "Cozy Kitty", action: "spinning", color: "#fb7185" },
  { emoji: "🦄", name: "Magic Unicorn", action: "floating", color: "#f472b6" },
  { emoji: "🦁", name: "Leo the Lion", action: "jumping", color: "#eab308" },
  { emoji: "🐸", name: "Fred the Frog", action: "jumping", color: "#4ade80" },
  { emoji: "🦆", name: "Dilly the Duck", action: "running", color: "#fbbf24" },
  { emoji: "🐼", name: "Cute Panda", action: "running", color: "#9ca3af" },
  { emoji: "🐒", name: "Momo the Monkey", action: "spinning", color: "#b45309" },
  { emoji: "🐰", name: "Bouncy Bunny", action: "jumping", color: "#f472b6" },
];

// Max animals spawnable within a single rapid-mash burst window
const BURST_WINDOW_MS = 400;
const MAX_SPAWNS_PER_BURST = 3;
const MAX_ANIMALS_ON_SCREEN = 20;

export default function AnimalParadeView({ lastEvent, soundEnabled }: AnimalParadeProps) {
  const [animals, setAnimals] = useState<ParadeAnimal[]>([]);
  const spawnTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    // Map character or let it be random
    const keyIndex = (lastEvent.key.charCodeAt(0) || 5) % PARADE_EMOJIS.length;
    const selected = PARADE_EMOJIS[keyIndex];

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Spawn point - left or right edge randomly
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -100 : screenWidth + 100;
    
    // Choose vertical band so they don't spawn off-screen
    const startY = screenHeight * 0.45 + Math.random() * (screenHeight * 0.35);

    const speedX = (fromLeft ? 1 : -1) * (Math.random() * 3 + 3); // speed across
    const actionTypes: Array<"running" | "jumping" | "spinning" | "floating"> = ["running", "jumping", "spinning", "floating"];
    const chosenAction = selected.action as any || actionTypes[Math.floor(Math.random() * actionTypes.length)];

    const newAnimal: ParadeAnimal = {
      id: `${lastEvent.timestamp}-${Math.random()}`,
      emoji: selected.emoji,
      name: selected.name,
      color: selected.color,
      x: startX,
      y: startY,
      scale: Math.random() * 0.4 + 0.8, // dynamic sizes
      rotation: 0,
      speedX,
      speedY: chosenAction === "floating" ? -(Math.random() * 1.5 + 1) : 0,
      bounceHeight: Math.random() * 30 + 20,
      phase: Math.random() * Math.PI * 2,
      action: chosenAction,
    };

    if (soundEnabled) {
      playAnimalSynth(selected.name.toLowerCase());
    }

    setAnimals((prev) => [...prev, newAnimal].slice(-3)); // Cap at 3 simultaneous animals
  }, [lastEvent, soundEnabled]);

  // Periodic frame movement simulation for items
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimals((prev) =>
        prev
          .map((animal) => {
            const width = window.innerWidth;
            const newPhase = animal.phase + 0.08;
            
            let rotation = animal.rotation;
            if (animal.action === "spinning") {
              rotation += 6;
            } else if (animal.action === "jumping") {
              rotation = Math.sin(newPhase * 1.5) * 12;
            }

            let nextY = animal.y;
            if (animal.action === "floating") {
              nextY += animal.speedY; // floats upwards
            } else if (animal.action === "jumping") {
              // Bounces nicely
              nextY = animal.y + Math.abs(Math.sin(newPhase * 2)) * -animal.bounceHeight * 0.2;
            }

            return {
              ...animal,
              x: animal.x + animal.speedX,
              y: nextY,
              rotation,
              phase: newPhase,
            };
          })
          // Remove animals that have animated completely off-screen
          .filter((animal) => {
            if (animal.speedX > 0 && animal.x > window.innerWidth + 150) return false;
            if (animal.speedX < 0 && animal.x < -150) return false;
            if (animal.action === "floating" && animal.y < -150) return false;
            return true;
          })
      );
    }, 30);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-transparent overflow-hidden select-none pointer-events-none z-10 transition-all duration-700">
      {/* Cartoon Skies & Decor */}
      <div className="absolute top-[8%] left-[10%] opacity-20 w-32 h-16 bg-white/70 rounded-full blur-[2px]" />
      <div className="absolute top-[18%] right-[15%] opacity-30 w-48 h-20 bg-white/70 rounded-full blur-[2px]" />
      <div className="absolute top-[5%] right-[40%] opacity-15 w-24 h-12 bg-white/70 rounded-full blur-[3px]" />

      {/* Background mountains / Hills */}
      <div className="absolute bottom-[14%] left-[-10%] w-[120%] h-[30%] bg-gradient-to-t from-[#aaef81]/40 to-[#86db54]/25 rounded-[50%] blur-[2px]" />
      <div className="absolute bottom-[5%] left-[-5%] w-[110%] h-[24%] bg-gradient-to-t from-[#59bd27]/50 to-[#7bd844]/60 rounded-[50%] backdrop-blur-xs border-t border-white/10" />

      {/* Floating Mode banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🦖 Animal Parade Mode 🦖
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold drop-shadow-xs">Click or press keys to summon animal buddies!</h2>
      </div>

      {/* Animals Loop */}
      <AnimatePresence>
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="absolute select-none pointer-events-none transition-all duration-75"
            style={{
              left: `${animal.x}px`,
              top: `${animal.y}px`,
              transform: `scale(${animal.scale}) rotate(${animal.rotation}deg)`,
            }}
          >
            <div className="flex flex-col items-center">
              {/* Floating speech glass bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.7 }}
                animate={{ opacity: 0.95, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="bg-white/15 backdrop-blur-md text-xs text-white font-extrabold px-3 py-1.5 rounded-xl border border-white/20 whitespace-nowrap mb-1.5 shadow-md pointer-events-none"
              >
                {animal.name}
              </motion.div>

              {/* Huge cartoon emoji icon */}
              <div 
                className="text-7xl active:scale-125 select-none duration-150 filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.15)]"
                style={{
                  transform: animal.speedX < 0 ? "scaleX(-1)" : "scaleX(1)" // flip horizontally depending on direction
                }}
              >
                {animal.emoji}
              </div>
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
