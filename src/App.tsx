/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 *
 * @license TSD-RCL
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Tv,
  Users,
  Moon,
  Sun,
  Settings,
  X,
  Layers,
  HelpCircle,
  Rocket,
  Paintbrush,
  Heart,
  Github,
  Plus,
  Trash2,
} from "lucide-react";

import { ScreensaverMode, ParentSettings } from "./types";
import { speakToddlerText, playFireworkSynth, getAvailableVoices, setAudioVolumeLimit, cancelSpeech } from "./utils/audio";
import { getLearnItem } from "./utils/words";

// Importer local components
import FireworksCanvas from "./components/FireworksCanvas";
import AnimalParadeView from "./components/AnimalParadeView";
import SpeakKeyView from "./components/SpeakKeyView";
import KeyboardPianoView from "./components/KeyboardPianoView";
import SpaceRocketView from "./components/SpaceRocketView";
import MouseDrawingView from "./components/MouseDrawingView";

const THEME_PRESETS = {
  cosmic: {
    bg: "bg-[#0a0a1a] text-white",
    cardBg: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/40",
    accent: "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]",
    textMuted: "text-white/60",
    glass: "backdrop-blur-xl bg-white/10 border border-white/20",
  },
  pastel: {
    bg: "bg-[#1f0e22] text-pink-100",
    cardBg: "bg-pink-500/10 backdrop-blur-xl border border-pink-400/20 shadow-2xl shadow-pink-950/20",
    accent: "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.4)]",
    textMuted: "text-pink-300/65",
    glass: "backdrop-blur-xl bg-pink-500/10 border border-pink-400/20",
  },
  forest: {
    bg: "bg-[#05130f] text-emerald-100",
    cardBg: "bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/20 shadow-2xl shadow-emerald-950/20",
    accent: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]",
    textMuted: "text-emerald-300/65",
    glass: "backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/20",
  },
  rainbow: {
    bg: "bg-[#100725] text-purple-100",
    cardBg: "bg-purple-500/10 backdrop-blur-xl border border-purple-400/25 shadow-2xl shadow-purple-950/25",
    accent: "bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]",
    textMuted: "text-purple-300/65",
    glass: "backdrop-blur-xl bg-purple-500/10 border border-purple-400/25",
  },
};

export default function App() {
  // Page states: "dashboard" | "locked_screensaver" | "sandbox"
  const [appState, setAppState] = useState<"dashboard" | "sandbox">("dashboard");

  // Voice list loaded state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Settings state
  const [settings, setSettings] = useState<ParentSettings>({
    speechEnabled: true,
    speechVoiceName: "",
    speechRate: 0.85,
    speechPitch: 1.3,
    soundEffectsEnabled: true,
    autoModeSwitchEnabled: true,
    activeMode: ScreensaverMode.SPEAK_THE_KEY,
    unlockRequirement: "math",
    theme: "cosmic",
    customWords: {
      A: "Alice 💖",
      M: "Mommy Bear 🐻",
      D: "Daddy Shark 🦈",
    },
    volumeLimit: 0.3,
    multiMonitorStrategy: "blackout",
    parentPin: "1234",
    passcodeUnlockEnabled: false,
  });

  // Synchronize audio.ts master volume with parent settings volume limit
  useEffect(() => {
    setAudioVolumeLimit(settings.volumeLimit);
  }, [settings.volumeLimit]);

  // Current active toddler playroom mode
  const [currentPlayMode, setCurrentPlayMode] = useState<ScreensaverMode>(ScreensaverMode.SPEAK_THE_KEY);

  // Keystroke frequency tracking
  const [mashingSpeed, setMashingSpeed] = useState<number>(0);
  const [lastKeystroke, setLastKeystroke] = useState<{ key: string; timestamp: number } | null>(null);

  // Security Lock Overlay State
  const [isExitOverlayOpen, setIsExitOverlayOpen] = useState(false);
  const [mathSum, setMathSum] = useState<{ a: number; b: number; operation: string; answer: number }>({ a: 0, b: 0, operation: "+", answer: 0 });
  const [parentAnswerInput, setParentAnswerInput] = useState("");
  const [mathErrorMessage, setMathErrorMessage] = useState("");
  const [longPressProgress, setLongPressProgress] = useState(0);

  // Parent Passcode Lock Overlay State
  const [isPasscodeOverlayOpen, setIsPasscodeOverlayOpen] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState("");
  const [passcodeShake, setPasscodeShake] = useState(false);

  // Dynamic custom word creator states
  const [newWordChar, setNewWordChar] = useState("B");
  const [newWordValue, setNewWordValue] = useState("");

  // Time logging
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refs for tracking pressed timestamps
  const keyEventsRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<any>(null);

  // Refs so the keydown handler reads current values without needing to re-register on every state change
  const isExitOverlayOpenRef = useRef(false);
  const isPasscodeOverlayOpenRef = useRef(false);
  const currentPlayModeRef = useRef(currentPlayMode);
  const soundEffectsEnabledRef = useRef(settings.soundEffectsEnabled);
  useEffect(() => { isExitOverlayOpenRef.current = isExitOverlayOpen; }, [isExitOverlayOpen]);
  useEffect(() => { isPasscodeOverlayOpenRef.current = isPasscodeOverlayOpen; }, [isPasscodeOverlayOpen]);
  useEffect(() => { currentPlayModeRef.current = currentPlayMode; }, [currentPlayMode]);
  useEffect(() => { soundEffectsEnabledRef.current = settings.soundEffectsEnabled; }, [settings.soundEffectsEnabled]);

  // Load browser voices once on mount; re-run whenever the browser voice list updates
  useEffect(() => {
    const loadVoices = () => setVoices(getAvailableVoices());
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Auto-select a default voice once the voice list is populated
  useEffect(() => {
    if (voices.length > 0 && !settings.speechVoiceName) {
      const fallback = voices.find(
        (v) =>
          v.name.includes("Zira") ||
          v.name.includes("Natural") ||
          v.name.includes("Google US English") ||
          v.lang.startsWith("en")
      ) || voices[0];
      setSettings((prev) => ({ ...prev, speechVoiceName: fallback.name }));
    }
  }, [voices]);

  // Update Clock — paused in sandbox to avoid re-rendering the hidden dashboard every second
  useEffect(() => {
    if (appState === "sandbox") return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [appState]);

  // Physical keyboard bypass listener when passcode popup is open
  useEffect(() => {
    if (!isPasscodeOverlayOpen) return;

    const handlePasscodeKeyboardInput = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePasscodeDigitPress(e.key);
      } else if (e.key === "Backspace") {
        setEnteredPasscode((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        setIsPasscodeOverlayOpen(false);
      }
    };

    window.addEventListener("keydown", handlePasscodeKeyboardInput);
    return () => {
      window.removeEventListener("keydown", handlePasscodeKeyboardInput);
    };
  }, [isPasscodeOverlayOpen, settings.parentPin]);

  // Calculate keyboard mashing speed rolling average (Keystrokes per minute) in sandbox mode
  useEffect(() => {
    if (appState !== "sandbox") return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Keep keystrokes from only the last 5 seconds to analyze current rhythm
      keyEventsRef.current = keyEventsRef.current.filter((t) => now - t < 5000);
      
      const countInLast5s = keyEventsRef.current.length;
      const kpm = countInLast5s * 12; // extrapolation to 1 minute
      setMashingSpeed(kpm);

      // Perform auto mode switching based on her tempo behavior
      if (settings.autoModeSwitchEnabled && countInLast5s > 0) {
        // Evaluate typical average interval
        const averageInterval = countInLast5s > 1 ? 5000 / countInLast5s : 5000;

        if (averageInterval < 400) {
          // Fast mashing! Toddler is slamming keys!
          // Auto switch to exciting sensory modes: Cosmic Fireworks or Animal Parade
          if (currentPlayMode !== ScreensaverMode.COSMIC_FIREWORKS) {
            setCurrentPlayMode(ScreensaverMode.COSMIC_FIREWORKS);
          }
        } else if (averageInterval >= 400 && averageInterval <= 700) {
          // Semi-rhythmic hitting. Good for music!
          if (currentPlayMode !== ScreensaverMode.KEYBOARD_PIANO) {
            setCurrentPlayMode(ScreensaverMode.KEYBOARD_PIANO);
          }
        } else if (averageInterval > 700 && averageInterval <= 1000) {
          // Space Rocket blast off!
          if (currentPlayMode !== ScreensaverMode.SPACE_ROCKET) {
            setCurrentPlayMode(ScreensaverMode.SPACE_ROCKET);
          }
        } else if (averageInterval > 1000 && averageInterval <= 1400) {
          // Playful animal parade
          if (currentPlayMode !== ScreensaverMode.ANIMAL_PARADE) {
            setCurrentPlayMode(ScreensaverMode.ANIMAL_PARADE);
          }
        } else if (averageInterval > 1400) {
          // Slower deliberate clicking. Perfect for Speak educational mode!
          if (currentPlayMode !== ScreensaverMode.SPEAK_THE_KEY) {
            setCurrentPlayMode(ScreensaverMode.SPEAK_THE_KEY);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appState, settings.autoModeSwitchEnabled, currentPlayMode]);

  // Handler for all toddler play room keystrokes. Uses refs to read current state so the listener
  // does not need to be re-registered on every settings or mode change.
  const handleSandboxKeystroke = useCallback((e: KeyboardEvent) => {
    if (isExitOverlayOpenRef.current || isPasscodeOverlayOpenRef.current) {
      return;
    }
    if (e.ctrlKey || e.altKey || (e.key === "f" && (e.metaKey || e.ctrlKey))) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const timestamp = Date.now();
    keyEventsRef.current.push(timestamp);
    setLastKeystroke({ key: e.key, timestamp });
    if (currentPlayModeRef.current === ScreensaverMode.COSMIC_FIREWORKS && soundEffectsEnabledRef.current) {
      playFireworkSynth();
    }
  }, []);

  // Welcome speech on sandbox entry
  useEffect(() => {
    if (appState !== "sandbox") return;
    if (settings.speechEnabled) {
      speakToddlerText("Toddler Play Sandbox Activated! Mash keys to play!", {
        name: settings.speechVoiceName,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
      });
    }
  }, [appState]);

  // Register keyboard and context-menu intercepts for the active sandbox
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };
    if (appState === "sandbox") {
      window.addEventListener("keydown", handleSandboxKeystroke, { passive: false });
      window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    }
    return () => {
      window.removeEventListener("keydown", handleSandboxKeystroke);
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, [appState, handleSandboxKeystroke]);

  // Formulates math sum for exit control challenge (add, subtract, or multiply two single digit numbers)
  const startMathUnlockChallenge = () => {
    const ops = ["+", "-", "*"] as const;
    const operation = ops[Math.floor(Math.random() * ops.length)];
    
    let a = Math.floor(Math.random() * 9) + 1; // 1 to 9 (single digit)
    let b = Math.floor(Math.random() * 9) + 1; // 1 to 9 (single digit)
    let answer = 0;
    
    if (operation === "+") {
      answer = a + b;
    } else if (operation === "-") {
      // Ensure result is positive and easy by keeping a >= b
      if (a < b) {
        const temp = a;
        a = b;
        b = temp;
      }
      answer = a - b;
    } else if (operation === "*") {
      answer = a * b;
    }
    
    setMathSum({ a, b, operation, answer });
    setParentAnswerInput("");
    setMathErrorMessage("");
    setIsExitOverlayOpen(true);
  };

  const verifyMathUnlock = () => {
    const numericAns = Number(parentAnswerInput.trim());
    if (!isNaN(numericAns) && numericAns === mathSum.answer) {
      setIsExitOverlayOpen(false);
      setAppState("dashboard");
      cancelSpeech();
    } else {
      setMathErrorMessage("Oops! That's not correct. Try another formula so we know you are mommy/daddy.");
      setParentAnswerInput("");
    }
  };

  const startPasscodeUnlockChallenge = () => {
    setEnteredPasscode("");
    setPasscodeErrorMessage("");
    setPasscodeShake(false);
    setIsPasscodeOverlayOpen(true);
  };

  const handlePasscodeDigitPress = (digit: string) => {
    setPasscodeErrorMessage("");
    setEnteredPasscode((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      // Auto-unlock or verify once we reach 4 digits
      if (next.length === 4) {
        const correctPin = settings.parentPin || "1234";
        if (next === correctPin) {
          setTimeout(() => {
            setIsPasscodeOverlayOpen(false);
            setAppState("dashboard");
            cancelSpeech();
          }, 200);
          return next;
        } else {
          setPasscodeShake(true);
          setPasscodeErrorMessage("Access Denied! Incorrect Parent PIN.");
          setTimeout(() => {
            setPasscodeShake(false);
            setEnteredPasscode("");
          }, 600);
          return next;
        }
      }
      return next;
    });
  };

  // Action to start play sandbox in full height
  const enterPlaySandbox = () => {
    // Lock preset initial playroom mode
    setCurrentPlayMode(settings.activeMode);
    setAppState("sandbox");
    keyEventsRef.current = [];
    setMashingSpeed(0);
    setLastKeystroke(null);
  };

  // Test custom voice button handler
  const triggerVoiceTest = (testLetter: string) => {
    const item = getLearnItem(testLetter);
    // customize if specific key has customized text
    const targetWord = settings.customWords[testLetter] || item.word;
    const phrase = `${testLetter} is for ${targetWord}!`;
    speakToddlerText(phrase, {
      name: settings.speechVoiceName,
      rate: settings.speechRate,
      pitch: settings.speechPitch,
    });
  };

  // Preset custom word helper updater
  const updateCustomWord = (char: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      customWords: {
        ...prev.customWords,
        [char.toUpperCase()]: value,
      },
    }));
  };

  const handleAddCustomWord = () => {
    if (!newWordValue.trim()) return;
    updateCustomWord(newWordChar, newWordValue.trim());
    setNewWordValue("");
    // Exclude the just-added char because setSettings is async and the snapshot is stale
    const used = new Set(Object.keys(settings.customWords));
    used.add(newWordChar.toUpperCase());
    const nextChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find(c => !used.has(c));
    if (nextChar) {
      setNewWordChar(nextChar);
    }
  };

  const handleRemoveCustomWord = (char: string) => {
    setSettings((prev) => {
      const nextCustomWords = { ...prev.customWords };
      delete nextCustomWords[char.toUpperCase()];
      return {
        ...prev,
        customWords: nextCustomWords,
      };
    });
  };

  const activeTheme = THEME_PRESETS[settings.theme] || THEME_PRESETS.cosmic;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 overflow-x-hidden ${activeTheme.bg} font-sans relative`}>
      
      {/* Mesh Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-600/15 blur-[100px]" />
        <div className="absolute top-[25%] right-[10%] w-[45%] h-[40%] rounded-full bg-pink-600/10 blur-[110px]" />
      </div>

      {/* Thin Outer Rim border from the premium design specification */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-white/5 z-50 rounded-none mix-blend-overlay" />

      {/* 1. PARENT SETUP DASHBOARD VIEW */}
      {appState === "dashboard" && (
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          
          {/* Header row */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6 mb-8 border-slate-500/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                  <span>Toddler Screen Defender</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/10">v1.1</span>
                </h1>
                <p className="text-sm opacity-60">Protect your desktop windows from mashers. Let your baby girl play & learn securely!</p>
              </div>
            </div>

            {/* DateTime Display */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-white/40">|</span>
              <span>{currentTime.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
            </div>
          </header>

          {/* Core Launch Banner */}
          <div className="mb-8 p-8 rounded-3xl bg-linear-to-r from-indigo-900 to-purple-900 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-[-50%] right-[-10%] w-96 h-96 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="absolute bottom-[-20%] left-[20%] w-64 h-64 rounded-full bg-pink-500/15 blur-2xl" />

            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-white/15 text-violet-200 border border-white/10 uppercase">
                Ready to protect
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight mt-3 mb-2">
                Launch Toddler Screensaver Sandbox
              </h2>
              <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                Starts an ambient locked screensaver interface. When your daughter presses letters A-Z or mashing keys, 
                she'll trigger educational speech spelling, rainbow music chords, dinosaurs, or firework bursts. 
                Exiting requires a secure parents verification formula.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <button
                  onClick={enterPlaySandbox}
                  className="px-8 py-4 rounded-2xl bg-white text-indigo-900 font-bold hover:bg-neutral-150 transition-all select-none flex items-center justify-center gap-3 shadow-lg active:scale-98 text-lg"
                >
                  <Lock className="w-5 h-5 text-indigo-600" />
                  <span>Launch Play Screen Now</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-indigo-200 bg-white/10 border border-white/10 rounded-2xl px-4 py-2">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Press <kbd className="bg-slate-800 px-1 rounded mx-0.5">Parent Exit Button</kbd> at the bottom right to unlock.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMN 1: INTERACTIVE MODES CONFIG */}
            <div className={`p-6 rounded-3xl flex flex-col justify-between ${activeTheme.cardBg}`}>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-[#a855f7]" />
                  <span>Choose Startup Play Playroom Mode</span>
                </h3>
                <p className={`text-xs ${activeTheme.textMuted} mb-6`}>
                  Choose the primary mode that boots or configure active auto-adaptation switching rules.
                </p>

                <div className="space-y-3">
                  {[
                    {
                      id: ScreensaverMode.SPEAK_THE_KEY,
                      icon: <Volume2 className="w-4 h-4 text-emerald-500" />,
                      title: "🗣️ Speak the Key",
                      desc: "Speaks letter/number names clearly, spells out corresponding cute animals/objects."
                    },
                    {
                      id: ScreensaverMode.SPACE_ROCKET,
                      icon: <Rocket className="w-4 h-4 text-blue-400" />,
                      title: "🚀 Space Rocket Blastoff",
                      desc: "Keys launch custom pilot-coded rockets, orbit satellites, and spinning UFO space probe entities."
                    },
                    {
                      id: ScreensaverMode.ANIMAL_PARADE,
                      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
                      title: "🦖 Animal & Dino Parade",
                      desc: "Keys summon dinosaurs, puppies, cats running, spinning or floating across screen."
                    },
                    {
                      id: ScreensaverMode.COSMIC_FIREWORKS,
                      icon: <Tv className="w-4 h-4 text-purple-500" />,
                      title: "🎆 Cosmic Fireworks",
                      desc: "High-speed typing shoots bright exploding sparks & gravity-fading firework glows."
                    },
                    {
                      id: ScreensaverMode.KEYBOARD_PIANO,
                      icon: <Music className="w-4 h-4 text-pink-500" />,
                      title: "🎹 Keyboard Piano",
                      desc: "Turn standard keys into physical musical piano. Taps generate harmonic pentatonic sweeps."
                    },
                    {
                      id: ScreensaverMode.MOUSE_DRAWING,
                      icon: <Paintbrush className="w-4 h-4 text-indigo-400" />,
                      title: "🎨 Sensory Mouse Drawing",
                      desc: "Use the mouse/touchscreen to draw glowing rainbow streams; tap keys to stamp cute emojis & hear chimes!"
                    }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSettings((prev) => ({ ...prev, activeMode: mode.id }))}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                        settings.activeMode === mode.id
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 font-medium"
                          : "bg-black/10 hover:bg-black/20 border-slate-500/10"
                      }`}
                    >
                      <span className="p-1 rounded-lg bg-white/5 border border-white/5 mt-0.5">{mode.icon}</span>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">{mode.title}</div>
                        <p className="opacity-70 mt-0.5 font-normal leading-relaxed">{mode.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Switch Rule toggle */}
              <div className="mt-6 pt-6 border-t border-slate-500/10 bg-black/15 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block">🧠 Smart Auto-Switch Mode</span>
                    <span className="text-[11px] opacity-60 block mt-0.5 leading-relaxed">
                      Changes modes dynamically based on her behavior! Faster slamming switches to Fireworks; slower individual clicks guides her back to word learning.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoModeSwitchEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, autoModeSwitchEnabled: e.target.checked }))}
                    className="w-10 h-5 rounded-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* COLUMN 2: SPEECH SYNTHESIS & SOUNDS */}
            <div className={`p-6 rounded-3xl flex flex-col justify-between ${activeTheme.cardBg}`}>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Volume2 className="w-5 h-5 text-indigo-500" />
                  <span>Speech Voice & Audio Settings</span>
                </h3>
                <p className={`text-xs ${activeTheme.textMuted} mb-6`}>
                  Adjust synthetic rate, pitch, and voice models. Double-click any key below to hear a test preview.
                </p>

                {/* Voice Selection */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-white/80">Voice Model</label>
                    <select
                      value={settings.speechVoiceName}
                      onChange={(e) => setSettings((p) => ({ ...p, speechVoiceName: e.target.value }))}
                      className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs"
                    >
                      {voices.length === 0 ? (
                        <option>Loading browser voices...</option>
                      ) : (
                        voices.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Speech Rate Slider */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="font-semibold text-white/80">Speech Speed</label>
                      <span className="font-mono text-slate-400 text-[10px]">{settings.speechRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={settings.speechRate}
                      onChange={(e) => setSettings((p) => ({ ...p, speechRate: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500">Slower speech is easier for toddlers to mirror.</span>
                  </div>

                  {/* Speech Pitch Slider */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="font-semibold text-white/80">Friendly Pitch</label>
                      <span className="font-mono text-slate-400 text-[10px]">{settings.speechPitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.8"
                      step="0.05"
                      value={settings.speechPitch}
                      onChange={(e) => setSettings((p) => ({ ...p, speechPitch: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500">Higher pitch rates make the voice sound warmer.</span>
                  </div>

                  {/* Master Volume Safeguard Limit Slider */}
                  <div className="pt-2 border-t border-slate-500/5 mt-2">
                    <div className="flex justify-between mb-1.5">
                      <label className="font-semibold text-indigo-400">Master Volume Guard Cap</label>
                      <span className="font-mono text-indigo-400 text-[10px] font-bold">{Math.round(settings.volumeLimit * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.volumeLimit}
                      onChange={(e) => setSettings((p) => ({ ...p, volumeLimit: parseFloat(e.target.value) }))}
                      className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Locks absolute maximum gain. Restricts toddler sound slamming.</span>
                  </div>

                  <div className="flex gap-4 items-center border-t border-slate-500/10 pt-4">
                    <button
                      onClick={() => setSettings((p) => ({ ...p, speechEnabled: !p.speechEnabled }))}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border text-[11px] font-medium transition-all ${
                        settings.speechEnabled
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-slate-500/5 text-slate-500 border-slate-500/15"
                      }`}
                    >
                      {settings.speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{settings.speechEnabled ? "Voice Speech ON" : "Voice Speech OFF"}</span>
                    </button>

                    <button
                      onClick={() => setSettings((p) => ({ ...p, soundEffectsEnabled: !p.soundEffectsEnabled }))}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border text-[11px] font-medium transition-all ${
                        settings.soundEffectsEnabled
                          ? "bg-pink-500/10 border-pink-500 text-pink-400"
                          : "bg-slate-500/5 text-slate-500 border-slate-500/15"
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>{settings.soundEffectsEnabled ? "SFX Sound ON" : "SFX Sound OFF"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Demo voice preview row */}
              <div className="border-t border-slate-500/10 pt-4 mt-6">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Test Key Voice:</span>
                <div className="grid grid-cols-4 gap-2">
                  {["A", "B", "C", "D"].map((l) => (
                    <button
                      key={l}
                      onClick={() => triggerVoiceTest(l)}
                      className="py-1.5 rounded bg-black/20 hover:bg-black/40 border border-slate-500/10 font-bold font-mono text-xs text-indigo-400 transition-all active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>{l}</span>
                      <Volume2 className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3: DAUGHTER PERSONAL CUSTOMIZATION (Alices Mode!) */}
            <div className={`p-6 rounded-3xl flex flex-col justify-between ${activeTheme.cardBg}`}>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Special Daughter Words</span>
                </h3>
                <p className={`text-xs ${activeTheme.textMuted} mb-6`}>
                  Make learning personal! Assign custom spelling expressions so the screen speaks family names or private characters.
                </p>

                <div className="space-y-4 text-xs">
                  {/* 1. Creator row to ADD or MODIFY custom word mapping */}
                <div className="bg-black/25 border border-slate-500/10 p-3 rounded-2xl space-y-2 mb-4">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Add Custom Key Word</span>
                  <div className="flex gap-2 text-xs">
                    <div className="w-16">
                      <select
                        value={newWordChar}
                        onChange={(e) => setNewWordChar(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/60 p-2 rounded-lg text-white font-mono font-bold text-center focus:outline-hidden"
                      >
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newWordValue}
                        onChange={(e) => setNewWordValue(e.target.value)}
                        placeholder="e.g. Bear 🐻"
                        className="w-full bg-slate-900 border border-slate-700/60 p-2 rounded-lg text-white text-xs focus:outline-hidden"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddCustomWord();
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleAddCustomWord}
                      className="p-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium transition-all flex items-center justify-center cursor-pointer"
                      title="Add Word Mapping"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </button>
                  </div>
                </div>

                {/* 2. Scrollable keys list */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Configured Keys ({Object.keys(settings.customWords).length})</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {Object.keys(settings.customWords).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 border border-dashed border-slate-500/10 rounded-xl">
                      <p className="text-[11px]">No custom spelling associations yet.</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">Add some letters above!</p>
                    </div>
                  ) : (
                    Object.keys(settings.customWords)
                      .sort()
                      .map((char) => (
                        <div
                          key={char}
                          className="flex items-center gap-2 p-2 rounded-xl bg-black/10 border border-slate-500/5 group hover:border-slate-500/15 transition-all text-xs"
                        >
                          {/* Badge Key */}
                          <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center text-sm">
                            {char}
                          </div>

                          {/* Editable word field */}
                          <input
                            type="text"
                            value={settings.customWords[char] || ""}
                            onChange={(e) => updateCustomWord(char, e.target.value)}
                            placeholder={`Spelling for ${char}`}
                            className="flex-1 bg-black/10 hover:bg-black/20 focus:bg-slate-900/90 border border-slate-500/10 focus:border-slate-500/30 p-1.5 rounded-md text-[11px] font-medium text-slate-100 placeholder-slate-500 transition-all focus:outline-hidden"
                          />

                          {/* Sound test button */}
                          <button
                            onClick={() => triggerVoiceTest(char)}
                            className="p-1 px-1.5 rounded bg-slate-850 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Test Speech"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete association button */}
                          <button
                            onClick={() => handleRemoveCustomWord(char)}
                            className="p-1 px-1.5 rounded bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Remove Word"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                  )}
                </div>

                  {/* Safety Configuration options */}
                  <div className="pt-4 border-t border-slate-500/10 space-y-3">
                    {/* Toggle to enable/disable PIN passcode unlock feature */}
                    <div className="flex items-center justify-between text-xs bg-black/10 p-2.5 rounded-xl border border-slate-500/10">
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="font-semibold text-white/90">Enable passcode PIN lock option</span>
                        <span className="text-[10px] text-slate-400">Add backup numeric PIN keypad unlock method to protection modes</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!settings.passcodeUnlockEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setSettings((p) => {
                            let nextRequirement = p.unlockRequirement;
                            // Reset requirement if disabling active passcode mode
                            if (!enabled && p.unlockRequirement === "passcode") {
                              nextRequirement = "math";
                            }
                            return {
                              ...p,
                              passcodeUnlockEnabled: enabled,
                              unlockRequirement: nextRequirement,
                            };
                          });
                        }}
                        className="w-4 h-4 rounded text-blue-500 accent-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 font-semibold text-white/80">Unlock Safeguard Strategy</label>
                      <select
                        value={settings.unlockRequirement}
                        onChange={(e) => setSettings((p) => ({ ...p, unlockRequirement: e.target.value as any }))}
                        className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-medium"
                      >
                        <option value="math">Parent Math Sum verification (A + B formula)</option>
                        {settings.passcodeUnlockEnabled && (
                          <option value="passcode">4-Digit PIN Passcode Verification</option>
                        )}
                        <option value="long_press">3-Second Lock Button Press (harder for baby)</option>
                        <option value="click">Simple Click (easy mock test)</option>
                      </select>
                    </div>

                    {settings.passcodeUnlockEnabled && settings.unlockRequirement === "passcode" && (
                      <div className="mt-2.5 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">Custom 4-Digit Parent PIN</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={settings.parentPin || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setSettings((p) => ({ ...p, parentPin: val }));
                          }}
                          placeholder="e.g. 1234"
                          className="w-full bg-black/30 border border-blue-500/30 p-1.5 rounded-lg text-xs font-mono text-center tracking-widest text-blue-300 focus:outline-hidden focus:border-blue-400 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Multi-Monitor Safeguard configuration */}
                  <div className="pt-4 border-t border-slate-500/10">
                    <label className="block mb-1.5 font-semibold text-white/80">Multi-Monitor Strategy (Default: Blackout)</label>
                    <select
                      value={settings.multiMonitorStrategy}
                      onChange={(e) => setSettings((p) => ({ ...p, multiMonitorStrategy: e.target.value as any }))}
                      className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-semibold text-indigo-400"
                    >
                      <option value="blackout">Deep Blackout (Protect Secondary Screens)</option>
                      <option value="mirror">Mirror Playroom (Clone Active Canvas)</option>
                      <option value="independent">Multi-Canvas (Separate Canvases)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block mt-1 leading-relaxed">
                      Connected secondary displays are locked into blackout to block accidental mouse movements.
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="mt-6 pt-4 border-t border-slate-500/10">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Visual Palette Theme:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "cosmic", label: "🌌 Night" },
                    { id: "pastel", label: "🌸 Cute" },
                    { id: "forest", label: "🌲 Green" },
                    { id: "rainbow", label: "🌈 Colors" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSettings((p) => ({ ...p, theme: t.id as any }))}
                      className={`py-1 text-[10px] rounded transition-all font-semibold ${
                        settings.theme === t.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-black/10 hover:bg-black/20 border border-slate-500/5 text-slate-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* About & Developer Credits */}
              <div className="mt-6 pt-5 border-t border-slate-500/10 text-xs text-left">
                <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
                    <span className="font-bold text-white/95">About TSD Defender</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Designed to secure low-level keyboard handlers and shield workspaces when toddlers play & mash keys.
                  </p>
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-1 text-[10px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Developer / Author:</span>
                      <strong className="text-white">tsohlacol</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Source Repository:</span>
                      <a 
                        href="https://github.com/tsohlacol/toddler-screen-defender" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 font-mono hover:text-indigo-200"
                      >
                        <Github className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>github.com/tsohlacol</span>
                      </a>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>License Model:</span>
                      <span className="text-purple-300 font-bold font-mono">TSD-RCL (Reciprocal)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Guidance banner footer */}
          <footer className="mt-12 p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="opacity-70">
                <strong>Why is this toddler proof?</strong> Standard screensaver applications in web browsers cannot capture reserved OS hotkeys like Alt+Tab or Win+D. For absolute safety, we advise running the application in a <strong>Chromium Fullscreen App</strong> mode (Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white border border-slate-700">F11</kbd> after launching) so children cannot escape or click taskbars.
              </p>
            </div>
          </footer>

        </div>
      )}

      {/* 2. ACTIVE SECURE PLAYROOM SANDBOX PLAY */}
      {appState === "sandbox" && (() => {
        // Compute layout divisions based on detected system hardware monitors
        const list = (window as any).TSD_MONITORS && (window as any).TSD_MONITORS.length > 0 
          ? (window as any).TSD_MONITORS 
          : [{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, isPrimary: true }];
        
        const minLeft = Math.min(...list.map((m: any) => m.left));
        const minTop = Math.min(...list.map((m: any) => m.top));
        const maxRight = Math.max(...list.map((m: any) => m.left + m.width));
        const maxBottom = Math.max(...list.map((m: any) => m.top + m.height));
        const totalW = maxRight - minLeft || 1;
        const totalH = maxBottom - minTop || 1;

        const parsedMonitors = list.map((m: any) => ({
          ...m,
          normLeft: ((m.left - minLeft) / totalW) * 100,
          normTop: ((m.top - minTop) / totalH) * 100,
          normWidth: (m.width / totalW) * 100,
          normHeight: (m.height / totalH) * 100,
        }));

        return (
          <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 select-none z-50">
            {parsedMonitors.map((m: any, idx: number) => {
              const isBlackout = settings.multiMonitorStrategy === "blackout" && !m.isPrimary;
              const shouldRenderSandbox = m.isPrimary || settings.multiMonitorStrategy === "mirror" || settings.multiMonitorStrategy === "independent";

              return (
                <div
                  key={idx}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${m.normLeft}%`,
                    top: `${m.normTop}%`,
                    width: `${m.normWidth}%`,
                    height: `${m.normHeight}%`,
                  }}
                >
                  {isBlackout ? (
                    // Deep Blackout Display for Secondary Screens
                    <div className="w-full h-full bg-black flex flex-col items-center justify-center border-l border-white/5 selection:bg-transparent">
                      <span className="text-[10px] uppercase tracking-widest font-mono text-slate-800 pointer-events-none">
                        TSD Screen Shield Guard Active • Auxiliary Display Cloaked
                      </span>
                    </div>
                  ) : shouldRenderSandbox ? (
                    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
                      {/* Active playrooms based on selected mode */}
                      {currentPlayMode === ScreensaverMode.SPEAK_THE_KEY && (
                        <SpeakKeyView
                          lastEvent={lastKeystroke}
                          voiceName={settings.speechVoiceName}
                          speechRate={settings.speechRate}
                          speechPitch={settings.speechPitch}
                          speechEnabled={settings.speechEnabled}
                        />
                      )}

                      {currentPlayMode === ScreensaverMode.ANIMAL_PARADE && (
                        <AnimalParadeView
                          lastEvent={lastKeystroke}
                          soundEnabled={settings.soundEffectsEnabled}
                        />
                      )}

                      {currentPlayMode === ScreensaverMode.COSMIC_FIREWORKS && (
                        <FireworksCanvas
                          lastEvent={lastKeystroke}
                          theme={settings.theme}
                        />
                      )}

                      {currentPlayMode === ScreensaverMode.KEYBOARD_PIANO && (
                        <KeyboardPianoView
                          lastEvent={lastKeystroke}
                          soundEnabled={settings.soundEffectsEnabled}
                          theme={settings.theme}
                        />
                      )}

                      {currentPlayMode === ScreensaverMode.SPACE_ROCKET && (
                        <SpaceRocketView
                          lastEvent={lastKeystroke}
                          soundEnabled={settings.soundEffectsEnabled}
                        />
                      )}

                      {currentPlayMode === ScreensaverMode.MOUSE_DRAWING && (
                        <MouseDrawingView
                          lastEvent={lastKeystroke}
                          soundEnabled={settings.soundEffectsEnabled}
                          theme={settings.theme}
                        />
                      )}

                      {/* BACKGROUND CONTINUOUS MOUSE-CLICK EMITTER LISTENER FOR SANDBOX */}
                      {currentPlayMode !== ScreensaverMode.MOUSE_DRAWING && (
                        <div 
                          onClick={() => {
                            // Spawns a faux keystroke space trigger if keys are blocked so standard clicks also animate beautifully
                            const timestamp = Date.now();
                            setLastKeystroke({
                              key: " ",
                              timestamp,
                            });
                            keyEventsRef.current.push(timestamp);
                            if (currentPlayMode === ScreensaverMode.COSMIC_FIREWORKS && settings.soundEffectsEnabled) {
                              playFireworkSynth();
                            }
                          }}
                          className="absolute inset-0 block w-full h-full pointer-events-auto z-5 cursor-crosshair opacity-0"
                        />
                      )}

                      {/* Primary Monitor overlays (Pill status, Unlock Hatch, behavior tempo) */}
                      {m.isPrimary && (
                        <>
                          {/* MULTI_MONITOR STATUS PILL FOR PREPARATION ASSURANCE */}
                          <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 select-none pointer-events-none z-30 shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span>Screen Guard: {settings.multiMonitorStrategy === "blackout" ? "🚫 Secondary Blackout Active" : settings.multiMonitorStrategy === "mirror" ? "👥 Canvas Mirror Active" : "🎯 Multi-Canvas Active"}</span>
                          </div>

                          {/* DYNAMIC PARENT SAFE EXIT CONTROL: BOTTOM-RIGHT CORNER */}
                          <div className="absolute bottom-6 right-6 z-40 pointer-events-auto select-none">
                            {settings.unlockRequirement === "long_press" ? (
                              // Case A: 3-Second steady Hold trigger
                              <button
                                onMouseDown={() => {
                                  longPressTimerRef.current = setInterval(() => {
                                    setLongPressProgress((old) => {
                                      if (old >= 100) {
                                        clearInterval(longPressTimerRef.current);
                                        setLongPressProgress(0);
                                        // Exit play room completely
                                        setAppState("dashboard");
                                        cancelSpeech();
                                        return 0;
                                      }
                                      return old + 4; // increment fast
                                    });
                                  }, 80);
                                }}
                                onMouseUp={() => {
                                  if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                                  setLongPressProgress(0);
                                }}
                                onTouchStart={() => {
                                  longPressTimerRef.current = setInterval(() => {
                                    setLongPressProgress((old) => {
                                      if (old >= 100) {
                                        clearInterval(longPressTimerRef.current);
                                        setLongPressProgress(0);
                                        setAppState("dashboard");
                                        cancelSpeech();
                                        return 0;
                                      }
                                      return old + 4;
                                    });
                                  }, 80);
                                }}
                                onTouchEnd={() => {
                                  if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                                  setLongPressProgress(0);
                                }}
                                className="group relative flex items-center justify-center p-4 bg-slate-900/90 border border-slate-700/60 rounded-full text-white cursor-pointer hover:bg-slate-950 hover:border-indigo-500 shadow-xl transition-all duration-300"
                              >
                                {/* Circular timer progress meter */}
                                <div 
                                  className="absolute inset-0 rounded-full border-4 border-indigo-500 scale-102 transition-colors duration-100 pointer-events-none" 
                                  style={{
                                    clipPath: `inset(${100 - longPressProgress}% 0px 0px 0px)`
                                  }}
                                />
                                <Lock className="w-5 h-5 text-indigo-400 group-hover:scale-110" />
                                <span className="max-w-0 overflow-hidden group-hover:max-w-28 group-hover:ml-2 text-[10px] font-mono whitespace-nowrap transition-all duration-300">
                                  Hold 3s to Unlock
                                </span>
                              </button>
                            ) : settings.unlockRequirement === "math" ? (
                              // Case B: Math Challenge Popup button trigger
                              <button
                                onClick={startMathUnlockChallenge}
                                className="group flex items-center p-4 bg-slate-900/95 border border-[#fcbbfd]/20 hover:border-[#a855f7]/60 rounded-full text-white cursor-pointer hover:bg-slate-950 shadow-2xl transition-all duration-300 active:scale-95"
                              >
                                <Lock className="w-5 h-5 text-[#a855f7]" />
                                <span className="max-w-0 overflow-hidden group-hover:max-w-32 group-hover:ml-2 text-[11px] font-sans font-medium text-slate-300 whitespace-nowrap transition-all duration-500">
                                  🔐 Parent Unlock
                                </span>
                              </button>
                            ) : (settings.unlockRequirement === "passcode" && settings.passcodeUnlockEnabled) ? (
                              // Case B.2: Passcode PIN Verification trigger button
                              <button
                                onClick={startPasscodeUnlockChallenge}
                                className="group flex items-center p-4 bg-slate-900/95 border border-[#60a5fa]/20 hover:border-[#3b82f6]/60 rounded-full text-white cursor-pointer hover:bg-slate-950 shadow-2xl transition-all duration-300 active:scale-95"
                              >
                                <Lock className="w-5 h-5 text-[#3b82f6]" />
                                <span className="max-w-0 overflow-hidden group-hover:max-w-32 group-hover:ml-2 text-[11px] font-sans font-medium text-slate-300 whitespace-nowrap transition-all duration-500">
                                  🔢 Enter PIN Passcode
                                </span>
                              </button>
                            ) : (
                              // Case C: Simple button unlock
                              <button
                                onClick={() => {
                                  setAppState("dashboard");
                                  cancelSpeech();
                                }}
                                className="group flex items-center p-4 bg-slate-900/95 border border-slate-700/60 rounded-full text-white hover:bg-red-950/20 hover:border-red-500 max-w-sm transition-all shadow-xl font-mono cursor-pointer"
                              >
                                <Unlock className="w-5 h-5 text-emerald-400 group-hover:rotate-12" />
                                <span className="max-w-0 overflow-hidden group-hover:max-w-24 group-hover:ml-2 text-xs transition-all duration-300">
                                  Exit play
                                </span>
                              </button>
                            )}
                          </div>

                          {/* REAL-TIME ROLL MONITOR RADAR FOR STATS (SUBCONSCIOUS FEEDBACK) */}
                          <div className="absolute bottom-6 left-6 z-40 bg-black/75 border border-white/5 backdrop-blur-md text-white px-4 py-2 rounded-2xl font-mono text-[9px] text-left pointer-events-none flex items-center gap-4 shadow-xl">
                            <div>
                              <span className="text-white/40 block">BEHAVIOR TEMPO</span>
                              <span className="font-bold text-indigo-400">
                                {mashingSpeed} Keystrokes/Min
                              </span>
                            </div>
                            <div className="border-l border-white/10 h-6" />
                            <div>
                              <span className="text-white/40 block">PLAY MODE STATE</span>
                              <span className="font-bold text-pink-400 uppercase">
                                {currentPlayMode.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* 3. SECURITY POPUP COMPONENT (MATH FORMULA) */}
      {isExitOverlayOpen && (
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center backdrop-blur-3xl bg-black/40 z-100 pointer-events-auto select-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-8 rounded-3xl bg-white/10 dark:bg-black/45 backdrop-blur-2xl border border-white/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.4)] relative"
          >
            <button
               onClick={() => setIsExitOverlayOpen(false)}
               className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white/70 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-pink-300 mb-4 animate-bounce">
              <Lock className="w-6 h-6" />
              <h2 className="text-xl font-bold font-sans">Verification Required</h2>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-6">
              Prove that you are not the infant mashing keys! Please enter the math solution below to exit the screensaver play area.
            </p>

            <div className="text-center bg-white/5 border border-white/10 py-4 px-6 rounded-2xl mb-6">
              <span className="text-[10px] uppercase text-white/50 tracking-wider font-mono">Solve This Equation</span>
              <div className="text-3xl font-black font-mono tracking-wider text-pink-300 mt-1">
                {mathSum.a} {mathSum.operation} {mathSum.b} = ?
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                value={parentAnswerInput}
                onChange={(e) => setParentAnswerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") verifyMathUnlock();
                }}
                placeholder="Enter parent equation solution..."
                autoFocus
                className="w-full bg-black/40 border border-white/20 p-3 rounded-xl text-center text-lg font-bold font-mono text-pink-300 focus:outline-hidden focus:border-pink-400 backdrop-blur-md"
              />

              {mathErrorMessage && (
                <p className="text-[11px] text-red-300 leading-relaxed text-center font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{mathErrorMessage}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsExitOverlayOpen(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 font-bold rounded-xl text-xs transition-all uppercase cursor-pointer"
                >
                  Back to Sandbox
                </button>
                <button
                  onClick={verifyMathUnlock}
                  className="flex-1 py-3 bg-pink-500 hover:bg-pink-400 font-bold rounded-xl text-xs text-white transition-all uppercase cursor-pointer shadow-lg active:scale-95"
                >
                  Submit & Unlock
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Parent PIN Overlay Modal */}
      {isPasscodeOverlayOpen && (
        <div className="fixed inset-0 w-screen h-screen flex justify-center items-center backdrop-blur-3xl bg-black/50 z-100 pointer-events-auto select-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={passcodeShake ? { x: [-10, 10, -8, 8, -5, 5, 0], scale: 1, opacity: 1 } : { x: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-full max-w-sm p-8 rounded-3xl bg-slate-900/90 dark:bg-black/80 backdrop-blur-2xl border border-blue-500/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative"
          >
            <button
              onClick={() => setIsPasscodeOverlayOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white/70 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 mb-3 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-sans tracking-tight">Parent Verification</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 mb-6">
                Enter your 4-digit PIN to exit the child lockdown sandbox.
              </p>

              {/* Passcode indicators */}
              <div className="flex gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, index) => {
                  const hasDigit = enteredPasscode.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        hasDigit
                          ? "bg-blue-400 border-blue-400 scale-110 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                          : "border-slate-500 bg-slate-800"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error statement feedback */}
              <div className="h-6 mb-4 flex items-center justify-center">
                {passcodeErrorMessage ? (
                  <p className="text-xs text-red-500 font-medium tracking-tight bg-red-950/40 px-3 py-1 rounded-full border border-red-500/20">
                    {passcodeErrorMessage}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    Default PIN is {settings.parentPin || "1234"}
                  </p>
                )}
              </div>

              {/* Grid 3x4 PIN Pad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePasscodeDigitPress(digit)}
                    className="aspect-square flex items-center justify-center text-xl font-semibold font-mono rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-500/20 border border-white/5 hover:border-slate-700 dynamic-pin-btn transition-all duration-100 cursor-pointer text-slate-200"
                  >
                    {digit}
                  </button>
                ))}
                {/* Clear */}
                <button
                  onClick={() => setEnteredPasscode("")}
                  className="aspect-square flex items-center justify-center text-xs font-bold uppercase rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-red-500/20 border border-white/5 transition-all cursor-pointer text-slate-450 hover:text-red-300"
                >
                  Clear
                </button>
                {/* 0 */}
                <button
                  onClick={() => handlePasscodeDigitPress("0")}
                  className="aspect-square flex items-center justify-center text-xl font-semibold font-mono rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-500/20 border border-white/5 hover:border-slate-700 transition-all duration-100 cursor-pointer text-slate-200"
                >
                  0
                </button>
                {/* Cancel */}
                <button
                  onClick={() => setIsPasscodeOverlayOpen(false)}
                  className="aspect-square flex items-center justify-center text-xs font-bold uppercase rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-blue-500/10 border border-white/5 transition-all cursor-pointer text-slate-455 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
