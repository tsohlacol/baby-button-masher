/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getLearnItem } from "../utils/words";
import { speakToddlerText } from "../utils/audio";

interface SpeakKeyProps {
  lastEvent: { key: string; timestamp: number } | null;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
}

// Sparkle drift particle interface for specific letter
interface LetterBubble {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
}

export default function SpeakKeyView({ lastEvent, voiceName, speechRate, speechPitch }: SpeakKeyProps) {
  const [currentKey, setCurrentKey] = useState<string>("A");
  const [bubbles, setBubbles] = useState<LetterBubble[]>([]);

  useEffect(() => {
    if (!lastEvent) {
      // Speak greeting initially
      speakToddlerText("Press any key to start playing!", { name: voiceName, rate: speechRate, pitch: speechPitch });
      return;
    }

    const keyUpper = lastEvent.key.toUpperCase();
    const cleanKey = lastEvent.key === " " ? "Space" : keyUpper;
    
    // Safety check - we only want individual letters, digits or selected control keys
    if (cleanKey.length > 20) return;

    setCurrentKey(cleanKey);

    const matchInfo = getLearnItem(lastEvent.key);
    
    // Construct adorable audible feedback
    let sayPhrase = "";
    if (lastEvent.key === " ") {
      sayPhrase = "Space Rocket!";
    } else if (/^[A-Z0-9]$/i.test(lastEvent.key)) {
      sayPhrase = `${cleanKey}. is for ${matchInfo.word}.`;
    } else {
      sayPhrase = `${matchInfo.word}!`;
    }

    // Trigger Speech synthesis!
    speakToddlerText(sayPhrase, { name: voiceName, rate: speechRate, pitch: speechPitch });

    // Spawn 8-12 beautiful little floating bubble matches
    const newBubbles: LetterBubble[] = Array.from({ length: 10 }).map((_, idx) => ({
      id: `${lastEvent.timestamp}-${idx}-${Math.random()}`,
      emoji: matchInfo.emoji.slice(0, 2) || "⭐", // handle multiple emojis cleanly
      x: Math.random() * 80 + 10, // percentages
      y: Math.random() * 40 + 50,
      size: Math.random() * 24 + 28, // width in px
      rotation: Math.random() * 360,
      duration: Math.random() * 3 + 2,
    }));

    setBubbles(newBubbles);
  }, [lastEvent, voiceName, speechRate, speechPitch]);

  const matchInfo = getLearnItem(currentKey === "Space" ? " " : currentKey);

  return (
    <div className="absolute inset-0 w-full h-full bg-transparent select-none pointer-events-none z-10 transition-colors duration-1000 flex flex-col justify-center items-center overflow-hidden">
      
      {/* Dynamic drifting bubbles representing letter's emojis */}
      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 150, x: `${b.x}%`, scale: 0.3, rotate: b.rotation }}
            animate={{ 
              opacity: [0, 0.9, 0.9, 0], 
              y: -100, 
              rotate: b.rotation + 180,
              scale: [0.3, 1.2, 1.0, 0.4]
            }}
            transition={{ duration: b.duration, ease: "easeOut" }}
            className="absolute text-5xl select-none filter drop-shadow-[0_8px_8px_rgba(255,255,255,0.1)]"
            style={{ fontSize: `${b.size}px` }}
          >
            {b.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
 
      {/* Interactive learning label banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-[#fcbbfd] bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg uppercase">
          🗣️ Speak the Key Mode 🗣️
        </span>
        <h2 className="text-white/70 text-sm mt-3 font-semibold tracking-wide drop-shadow-xs">Deliberate learning: press single keys to hear and spell them!</h2>
      </div>
 
      {/* Giant Central Educational Interactive Block */}
      <motion.div
        key={currentKey + "-" + lastEvent?.timestamp}
        initial={{ scale: 0.6, y: 50, rotate: -4, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 15 }}
        className="w-[90%] max-w-lg p-10 rounded-3xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/15 dark:bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center text-center text-white"
      >
        {/* Giant Glowing Primary Character */}
        <h1 className="text-9xl md:text-[11rem] font-sans font-black tracking-tight filter drop-shadow-[0_10px_20px_rgba(255,255,255,0.15)] select-none animate-pulse">
          {currentKey}
        </h1>
 
        {/* Word Label matching character */}
        <div className="mt-8 font-sans text-4xl md:text-5xl font-extrabold flex items-center justify-center gap-4 text-white">
          <span className="text-6xl md:text-7xl drop-shadow-md select-none">{matchInfo.emoji}</span>
          <span className="capitalize tracking-tight bg-linear-to-r from-white to-pink-100 bg-clip-text text-transparent">{matchInfo.word}</span>
        </div>
 
        {/* Playful Trivia / Subtitle */}
        {matchInfo.fact && (
          <p className="mt-5 text-xs md:text-sm text-white/70 font-sans font-semibold tracking-wide max-w-sm leading-relaxed bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
            {matchInfo.fact}
          </p>
        )}
      </motion.div>
 
      {/* Prompt footer */}
      <div className="absolute bottom-[14%] text-center opacity-60 font-mono text-xs select-none text-white font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
        <span>Press letters <strong className="text-pink-300">A to Z</strong> or numbers <strong className="text-pink-300">0 to 9</strong></span>
      </div>
    </div>
  );
}
