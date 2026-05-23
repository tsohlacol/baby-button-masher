/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playSyntheticPiano } from "../utils/audio";

interface KeyboardPianoProps {
  lastEvent: { key: string; timestamp: number } | null;
  soundEnabled: boolean;
  theme: "cosmic" | "pastel" | "forest" | "rainbow";
}

interface FloatingNote {
  id: string;
  char: string;
  x: number; // percentage width
  color: string;
  symbol: string;
  speedY: number;
}

const NOTE_SYMBOLS = ["🎵", "🎶", "🎼", "⭐", "🔔", "✨"];

const PIANO_KEYS = [
  { note: "C4", keyTrigger: "A", color: "bg-red-400 border-red-500 text-red-950 shadow-red-200" },
  { note: "D4", keyTrigger: "S", color: "bg-orange-400 border-orange-500 text-orange-950 shadow-orange-200" },
  { note: "E4", keyTrigger: "D", color: "bg-yellow-400 border-yellow-500 text-yellow-950 shadow-yellow-200" },
  { note: "F4", keyTrigger: "F", color: "bg-green-400 border-green-500 text-green-950 shadow-green-200" },
  { note: "G4", keyTrigger: "G", color: "bg-teal-400 border-teal-500 text-teal-950 shadow-teal-200" },
  { note: "A4", keyTrigger: "H", color: "bg-blue-400 border-blue-500 text-blue-950 shadow-blue-200" },
  { note: "B4", keyTrigger: "J", color: "bg-indigo-400 border-indigo-500 text-indigo-950 shadow-indigo-200" },
  { note: "C5", keyTrigger: "K", color: "bg-purple-400 border-purple-500 text-purple-950 shadow-purple-200" },
  { note: "D5", keyTrigger: "L", color: "bg-pink-400 border-pink-500 text-pink-950 shadow-pink-200" },
];

export default function KeyboardPianoView({ lastEvent, soundEnabled, theme }: KeyboardPianoProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [floatingNotes, setFloatingNotes] = useState<FloatingNote[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    const keyUpper = lastEvent.key.toUpperCase();
    setActiveKey(keyUpper);

    if (soundEnabled) {
      // Toddler synth plays pleasant notes
      playSyntheticPiano(lastEvent.key, "sine");
    }

    // Spawn cute music note bubbles
    const matchIndex = PIANO_KEYS.findIndex(pk => pk.keyTrigger === keyUpper);
    const floatBgX = matchIndex !== -1 ? (matchIndex / PIANO_KEYS.length) * 80 + 10 : Math.random() * 80 + 10;

    const colors = ["text-red-400", "text-amber-400", "text-emerald-400", "text-cyan-400", "text-purple-400", "text-pink-400"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomSymbol = NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)];

    const newNote: FloatingNote = {
      id: `${lastEvent.timestamp}-${Math.random()}`,
      char: keyUpper.slice(0, 1),
      x: floatBgX,
      color: randomColor,
      symbol: randomSymbol,
      speedY: Math.random() * 2 + 1.5,
    };

    setFloatingNotes((prev) => [...prev, newNote].slice(-25));

    // Reset indicator block
    const timeout = setTimeout(() => {
      setActiveKey(null);
    }, 250);

    return () => clearTimeout(timeout);
  }, [lastEvent, soundEnabled]);

  // Periodic frame updater to float notes upwards
  useEffect(() => {
    const timer = setInterval(() => {
      setFloatingNotes((prev) =>
        prev
          .map((n) => ({
            ...n,
            y: n.speedY, // decrease position upward
          }))
          .filter((_, idx) => idx < 30) // cap rendering limit
      );
    }, 45);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-transparent overflow-hidden select-none pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* Floating Mode banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🎹 Keyboard Piano Mode 🎹
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold drop-shadow-xs">Hit letters S, D, F, G, H, J, K to compose a melody!</h2>
      </div>

      {/* Floating visual music particles workspace */}
      <div className="relative flex-1 w-full overflow-hidden flex items-end">
        <AnimatePresence>
          {floatingNotes.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 350, x: `${n.x}%`, scale: 0.5, rotate: 0 }}
              animate={{
                opacity: [0, 1, 0.8, 0],
                y: -150,
                x: `${n.x + Math.sin(Math.random() * 2) * 8}%`, // winding swerve
                rotate: [0, 45, -45, 15],
                scale: [0.5, 1.4, 1.0, 0.3],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              className={`absolute flex flex-col items-center pointer-events-none ${n.color}`}
            >
              <span className="text-5xl drop-shadow-[0_0_8px_currentColor]">{n.symbol}</span>
              <span className="text-xs font-mono font-bold mt-1 bg-white/20 px-1.5 py-0.5 rounded text-white border border-white/20 backdrop-blur-md">
                {n.char}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Rainbow piano visual rows - Beautiful Glassmorphic Base */}
      <div className="w-full max-w-4xl mx-auto h-64 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/25 rounded-3xl flex p-30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
        {PIANO_KEYS.map((pk) => {
          const isPressed = activeKey === pk.keyTrigger;
          return (
            <motion.div
              key={pk.note}
              animate={{
                y: isPressed ? 16 : 0,
                scaleY: isPressed ? 0.95 : 1,
                boxShadow: isPressed
                  ? "0px 0px 4px rgba(0,0,0,0.5)"
                  : "0px 8px 0px rgba(0,0,0,0.25)",
              }}
              transition={{ type: "spring", stiffness: 350, damping: 15 }}
              className={`flex-1 mx-1.5 border-r border-l rounded-b-2xl flex flex-col justify-end items-center pb-4 select-none relative transition-all cursor-pointer ${pk.color}`}
            >
              {/* Hotkey identifier bubble */}
              <div className="w-8 h-8 rounded-full bg-white/30 border border-white/40 flex items-center justify-center font-mono font-black text-sm mb-4 text-white">
                {pk.keyTrigger}
              </div>
              <span className="font-mono text-xs font-black opacity-80 text-white">
                {pk.note}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
