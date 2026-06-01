/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * @license BBM-RCL
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
import SpaceExplorerView from "./components/SpaceExplorerView";
import { getLearnItem } from "./utils/words";

// Importer local components
import FireworksCanvas from "./components/FireworksCanvas";
import AnimalParadeView from "./components/AnimalParadeView";
import SpeakKeyView from "./components/SpeakKeyView";
import KeyboardPianoView from "./components/KeyboardPianoView";
import SpaceRocketView from "./components/SpaceRocketView";
import MouseDrawingView from "./components/MouseDrawingView";

// Ordered list used for manual mode cycling via the status pill
const PLAY_MODES: ScreensaverMode[] = [
  ScreensaverMode.SPEAK_THE_KEY,
  ScreensaverMode.ANIMAL_PARADE,
  ScreensaverMode.COSMIC_FIREWORKS,
  ScreensaverMode.KEYBOARD_PIANO,
  ScreensaverMode.SPACE_ROCKET,
  ScreensaverMode.MOUSE_DRAWING,
  ScreensaverMode.SPACE_EXPLORER,
];

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

const SETTINGS_SLOT = "tsd-parent-settings";

const DEFAULT_SETTINGS: ParentSettings = {
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
  multiMonitorStrategy: "mirror",
  parentPin: "1234",
  passcodeUnlockEnabled: false,
};

/** Load persisted settings from localStorage, falling back to defaults for any missing keys. */
function loadSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_SLOT); // sast-ignore — stores only UI config, no credentials
    if (!raw) return DEFAULT_SETTINGS;
    // Shallow-merge so fields added in future versions always have their defaults.
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ParentSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  // Page states: "dashboard" | "locked_screensaver" | "sandbox"
  const [appState, setAppState] = useState<"dashboard" | "sandbox" | "dictionary">("dashboard");

  // Voice list loaded state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Settings state — initialised from localStorage, persisted on every change
  const [settings, setSettings] = useState<ParentSettings>(loadSettings);

  // Startup splash overlay — mirrors the WPF SplashOverlay so the transition is seamless.
  // The WPF airspace problem means WebView2's Win32 HWND always renders in front of WPF
  // elements, so the WPF splash becomes invisible behind the WebView2 black HWND after
  // ~1-2 s. This React overlay takes over from that point and provides the full-duration
  // splash experience. C# calls window.__bbmReveal() after the minimum hold time, which
  // triggers the CSS fade-out. In dev mode (no webview), the overlay auto-dismisses after
  // 500 ms so it doesn't block development.
  const [splashRevealing, setSplashRevealing] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const w = window as any;
    const inWebView = !!w.chrome?.webview;

    if (!inWebView) {
      // Dev mode: dismiss quickly so it doesn't block development.
      const t = setTimeout(() => setSplashRevealing(true), 500);
      return () => clearTimeout(t);
    }

    // Signal the WPF host that React has rendered its first paint.
    w.chrome.webview.postMessage('tsd:ready');

    // C# will call this after the minimum hold time to trigger the fade-out.
    w.__bbmReveal = () => setSplashRevealing(true);
    return () => { delete w.__bbmReveal; };
  }, []);

  useEffect(() => {
    if (!splashRevealing) return;
    // Remove the overlay element from the DOM after the CSS transition finishes (1.5 s).
    const t = setTimeout(() => setSplashDone(true), 1600);
    return () => clearTimeout(t);
  }, [splashRevealing]);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_SLOT, JSON.stringify(settings)); } catch { /* quota / private-mode */ } // sast-ignore — stores only UI config, no credentials
  }, [settings]);

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

  // Once the browser voice list loads, ensure a valid voice is selected.
  // getAvailableVoices() sorts neural/online voices first, so voices[0] is the
  // best available. If the persisted name is gone (OS reinstall, etc.), re-pick.
  useEffect(() => {
    if (voices.length === 0) return;
    const savedStillAvailable = voices.some((v) => v.name === settings.speechVoiceName);
    if (!settings.speechVoiceName || !savedStillAvailable) {
      const best = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
      setSettings((prev) => ({ ...prev, speechVoiceName: best.name }));
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

      // Perform auto mode switching based on their tempo behavior
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
      playFireworkSynth(e.key);
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

  // Monitor layout is static after launch — compute once and memoize
  const parsedMonitors = useMemo(() => {
    const list = (window as any).BBM_MONITORS?.length > 0
      ? (window as any).BBM_MONITORS
      : [{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, isPrimary: true }];
    const minLeft = Math.min(...list.map((m: any) => m.left));
    const minTop = Math.min(...list.map((m: any) => m.top));
    const maxRight = Math.max(...list.map((m: any) => m.left + m.width));
    const maxBottom = Math.max(...list.map((m: any) => m.top + m.height));
    const totalW = maxRight - minLeft || 1;
    const totalH = maxBottom - minTop || 1;
    return list.map((m: any) => ({
      ...m,
      normLeft: ((m.left - minLeft) / totalW) * 100,
      normTop: ((m.top - minTop) / totalH) * 100,
      normWidth: (m.width / totalW) * 100,
      normHeight: (m.height / totalH) * 100,
    }));
  }, []);

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
        <div className="h-screen overflow-hidden flex flex-col px-4 py-4 relative z-10">

          {/* Header row */}
          <header className="flex items-center justify-between gap-3 border-b pb-4 mb-4 border-slate-500/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>Baby Button Masher</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/10">v1.1</span>
                </h1>
                <p className="text-xs opacity-60">Keep your desktop safe while your toddler plays &amp; learns!</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* DateTime Display */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="text-white/40">|</span>
                <span>{currentTime.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
              </div>
              {/* Launch button */}
              <button
                onClick={enterPlaySandbox}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 select-none"
              >
                <Lock className="w-4 h-4" />
                <span>Launch Play Screen</span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            
            {/* COLUMN 1: INTERACTIVE MODES CONFIG */}
            <div className={`p-5 rounded-3xl flex flex-col gap-4 ${activeTheme.cardBg} overflow-y-auto`}>
              <h3 className="text-base font-bold flex items-center gap-2 shrink-0">
                <Layers className="w-4 h-4 text-[#a855f7]" />
                <span>Startup Playroom Mode</span>
              </h3>

              <select
                value={settings.activeMode}
                onChange={(e) => setSettings((prev) => ({ ...prev, activeMode: e.target.value as ScreensaverMode }))}
                className="w-full bg-black/20 border border-slate-500/20 p-2.5 rounded-xl text-sm font-medium shrink-0 text-black"
              >
                <option value={ScreensaverMode.SPEAK_THE_KEY}>🗣️ Speak the Key</option>
                <option value={ScreensaverMode.SPACE_ROCKET}>🚀 Space Rocket Blastoff</option>
                <option value={ScreensaverMode.ANIMAL_PARADE}>🦖 Animal &amp; Dino Parade</option>
                <option value={ScreensaverMode.COSMIC_FIREWORKS}>🎆 Cosmic Fireworks</option>
                <option value={ScreensaverMode.KEYBOARD_PIANO}>🎹 Keyboard Piano</option>
                <option value={ScreensaverMode.MOUSE_DRAWING}>🎨 Sensory Mouse Drawing</option>
                <option value={ScreensaverMode.SPACE_EXPLORER}>🌌 Space Explorer</option>
              </select>

              {/* Dynamic Switch Rule toggle */}
              <div className="bg-black/15 p-4 rounded-xl border border-slate-500/10 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold block">🧠 Smart Auto-Switch Mode</span>
                    <span className="text-[11px] opacity-60 block mt-0.5 leading-relaxed">
                      Changes modes based on their behavior. Faster slamming switches to Fireworks; slower clicks guides them back to word learning.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoModeSwitchEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, autoModeSwitchEnabled: e.target.checked }))}
                    className="w-10 h-5 rounded-full accent-indigo-500 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* About section */}
              <div className="mt-auto pt-4 border-t border-slate-500/10 text-xs">
                <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
                    <span className="font-bold text-white/95">About Baby Button Masher</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Secures low-level keyboard handlers and shields workspaces when toddlers play &amp; mash keys.
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
                      <span>License:</span>
                      <span className="text-purple-300 font-bold font-mono">BBM-RCL (Reciprocal)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: SPEECH SYNTHESIS & SOUNDS */}
            <div className={`p-5 rounded-3xl flex flex-col ${activeTheme.cardBg} overflow-y-auto`}>
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 mb-4 shrink-0">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Speech Voice &amp; Audio</span>
                </h3>

                {/* Voice Selection */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-white/80">Voice Model</label>
                    {voices.length === 0 ? (
                      <p className="text-slate-500 italic">Loading browser voices…</p>
                    ) : (() => {
                      const isHigh = (v: SpeechSynthesisVoice) => {
                        const n = v.name.toLowerCase();
                        return n.includes("online") || n.includes("natural") || n.includes("neural") || n.includes("google") || n.includes("premium");
                      };
                      const highQuality = voices.filter(isHigh);
                      const standard = voices.filter((v) => !isHigh(v));
                      return (
                        <select
                          value={settings.speechVoiceName}
                          onChange={(e) => setSettings((p) => ({ ...p, speechVoiceName: e.target.value }))}
                          className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs text-black"
                        >
                          {highQuality.length > 0 && (
                            <optgroup label="⭐ High Quality (Neural / Online)">
                              {highQuality.map((v) => (
                                <option key={v.name} value={v.name}>{v.name}</option>
                              ))}
                            </optgroup>
                          )}
                          {standard.length > 0 && (
                            <optgroup label="Standard Voices">
                              {standard.map((v) => (
                                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      );
                    })()}
                    <button
                      onClick={() => speakToddlerText("Hello! I am your toddler's voice companion.", {
                        name: settings.speechVoiceName,
                        rate: settings.speechRate,
                        pitch: settings.speechPitch,
                      })}
                      className="mt-2 w-full py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/25 text-indigo-300 font-semibold transition-colors cursor-pointer"
                    >
                      ▶ Test Voice
                    </button>
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
                    <span className="text-[10px] text-slate-400 block mt-0.5">Locks absolute maximum gain.</span>
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

            {/* COLUMN 3: SETTINGS & SECURITY */}
            <div className={`p-5 rounded-3xl flex flex-col gap-4 ${activeTheme.cardBg} overflow-y-auto`}>
              <h3 className="text-base font-bold flex items-center gap-2 shrink-0">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Settings &amp; Security</span>
              </h3>

              <div className="space-y-3 text-xs flex-1">
                {/* Custom Words card */}
                <div className="bg-black/15 p-3 rounded-xl border border-slate-500/10">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold block">📚 Custom Words</span>
                      <span className="text-[10px] opacity-60 block mt-0.5">
                        {Object.keys(settings.customWords).length} word{Object.keys(settings.customWords).length !== 1 ? "s" : ""} configured
                      </span>
                    </div>
                    <button
                      onClick={() => setAppState("dictionary")}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/25 text-indigo-300 font-semibold text-[11px] transition-all cursor-pointer whitespace-nowrap"
                    >
                      Edit Words →
                    </button>
                  </div>
                </div>

                {/* Toggle to enable/disable PIN passcode unlock feature */}
                <div className="flex items-center justify-between bg-black/10 p-2.5 rounded-xl border border-slate-500/10">
                  <div className="flex flex-col gap-0.5 max-w-[80%]">
                    <span className="font-semibold text-white/90">Enable PIN lock option</span>
                    <span className="text-[10px] text-slate-400">Add backup numeric PIN unlock method</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.passcodeUnlockEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setSettings((p) => {
                        let nextRequirement = p.unlockRequirement;
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
                  <label className="block mb-1.5 font-semibold text-white/80">Unlock Strategy</label>
                  <select
                    value={settings.unlockRequirement}
                    onChange={(e) => setSettings((p) => ({ ...p, unlockRequirement: e.target.value as any }))}
                    className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-medium"
                  >
                    <option value="math">Math Sum (A + B formula)</option>
                    {settings.passcodeUnlockEnabled && (
                      <option value="passcode">4-Digit PIN Passcode</option>
                    )}
                    <option value="long_press">3-Second Press (harder for baby)</option>
                    <option value="click">Simple Click (easy mock test)</option>
                  </select>
                </div>

                {settings.passcodeUnlockEnabled && settings.unlockRequirement === "passcode" && (
                  <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">Custom 4-Digit Parent PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={settings.parentPin || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setSettings((p) => ({ ...p, parentPin: val }));
                      }}
                      placeholder="Enter 4-digit PIN"
                      className="w-full bg-black/30 border border-blue-500/30 p-1.5 rounded-lg text-xs font-mono text-center tracking-widest text-blue-300 focus:outline-hidden focus:border-blue-400 font-bold"
                    />
                    {(settings.parentPin === "1234" || !settings.parentPin) && (
                      <p className="text-[10px] text-yellow-400 mt-1">Change from the default — "1234" is easily guessed.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block mb-1.5 font-semibold text-white/80">Multi-Monitor Strategy</label>
                  <select
                    value={settings.multiMonitorStrategy}
                    onChange={(e) => setSettings((p) => ({ ...p, multiMonitorStrategy: e.target.value as any }))}
                    className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-semibold text-indigo-400"
                  >
                    <option value="blackout">Blackout (Protect Secondary Screens)</option>
                    <option value="mirror">Mirror (Clone Active Canvas)</option>
                    <option value="independent">Multi-Canvas (Separate Canvases)</option>
                  </select>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="pt-3 border-t border-slate-500/10 shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Visual Theme:</span>
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
            </div>

          </div>

        </div>
      )}

      {/* DICTIONARY SCREEN */}
      {appState === "dictionary" && (
        <div className="h-screen overflow-hidden flex flex-col px-4 py-4 relative z-10">
          <header className="flex items-center gap-4 border-b pb-4 mb-4 border-slate-500/10 shrink-0">
            <button
              onClick={() => setAppState("dashboard")}
              className="p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">Custom Words</h1>
                <p className="text-xs opacity-60">Assign words so the app speaks family names or personal characters when keys are pressed.</p>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-lg mx-auto space-y-4 pb-4">
              {/* Creator row */}
              <div className={`p-5 rounded-3xl ${activeTheme.cardBg}`}>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Add Custom Key Word</span>
                <div className="flex gap-2 text-xs">
                  <div className="w-16">
                    <select
                      value={newWordChar}
                      onChange={(e) => setNewWordChar(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/60 p-2 rounded-lg text-white font-mono font-bold text-center focus:outline-hidden"
                    >
                      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => (
                        <option key={c} value={c}>{c}</option>
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
                        if (e.key === "Enter") handleAddCustomWord();
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

              {/* Configured words list */}
              <div className={`p-5 rounded-3xl ${activeTheme.cardBg}`}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Configured Keys ({Object.keys(settings.customWords).length})
                </span>
                {Object.keys(settings.customWords).length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-500/10 rounded-xl">
                    <p className="text-sm">No custom words yet.</p>
                    <p className="text-xs text-slate-600 mt-1">Add some letters above!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.keys(settings.customWords)
                      .sort()
                      .map((char) => (
                        <div
                          key={char}
                          className="flex items-center gap-2 p-2 rounded-xl bg-black/10 border border-slate-500/5 group hover:border-slate-500/15 transition-all text-xs"
                        >
                          <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center text-sm">
                            {char}
                          </div>
                          <input
                            type="text"
                            value={settings.customWords[char] || ""}
                            onChange={(e) => updateCustomWord(char, e.target.value)}
                            placeholder={`Spelling for ${char}`}
                            className="flex-1 bg-black/10 hover:bg-black/20 focus:bg-slate-900/90 border border-slate-500/10 focus:border-slate-500/30 p-1.5 rounded-md text-[11px] font-medium text-slate-100 placeholder-slate-500 transition-all focus:outline-hidden"
                          />
                          <button
                            onClick={() => triggerVoiceTest(char)}
                            className="p-1 px-1.5 rounded bg-slate-850 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Test Speech"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveCustomWord(char)}
                            className="p-1 px-1.5 rounded bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                            title="Remove Word"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE SECURE PLAYROOM SANDBOX PLAY */}
      {appState === "sandbox" && (
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
                        BBM Screen Shield Guard Active • Auxiliary Display Cloaked
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

                      {currentPlayMode === ScreensaverMode.SPACE_EXPLORER && (
                        <SpaceExplorerView
                          lastEvent={lastKeystroke}
                          voiceName={settings.speechVoiceName}
                          speechRate={settings.speechRate}
                          speechPitch={settings.speechPitch}
                          speechEnabled={settings.speechEnabled}
                          soundEnabled={settings.soundEffectsEnabled}
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
                              playFireworkSynth(" ");
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
                                onMouseLeave={() => {
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
                                onTouchCancel={() => {
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
                          <div className="absolute bottom-6 left-6 z-40 bg-black/75 border border-white/5 backdrop-blur-md text-white px-4 py-2 rounded-2xl font-mono text-[9px] text-left flex items-center gap-4 shadow-xl">
                            <div>
                              <span className="text-white/40 block">BEHAVIOR TEMPO</span>
                              <span className="font-bold text-indigo-400">
                                {mashingSpeed} Keystrokes/Min
                              </span>
                            </div>
                            <div className="border-l border-white/10 h-6" />
                            {/* Click to cycle through play modes manually */}
                            <button
                              className="text-left cursor-pointer hover:bg-white/10 rounded-lg px-2 -mx-2 py-1 -my-1 transition-colors"
                              onClick={() => {
                                const idx = PLAY_MODES.indexOf(currentPlayMode);
                                setCurrentPlayMode(PLAY_MODES[(idx + 1) % PLAY_MODES.length]);
                              }}
                            >
                              <span className="text-white/40 block">PLAY MODE ▶</span>
                              <span className="font-bold text-pink-400 uppercase">
                                {currentPlayMode.replaceAll("_", " ")}
                              </span>
                            </button>
                            <div className="border-l border-white/10 h-6" />
                            {/* Click to toggle auto-switch on/off */}
                            <button
                              className="text-left cursor-pointer hover:bg-white/10 rounded-lg px-2 -mx-2 py-1 -my-1 transition-colors"
                              onClick={() => setSettings((p) => ({ ...p, autoModeSwitchEnabled: !p.autoModeSwitchEnabled }))}
                            >
                              <span className="text-white/40 block">AUTO-SWITCH</span>
                              <span className={`font-bold uppercase ${settings.autoModeSwitchEnabled ? "text-emerald-400" : "text-white/30"}`}>
                                {settings.autoModeSwitchEnabled ? "ON" : "OFF"}
                              </span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      )}

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
                    Enter your parent PIN
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

      {/* Startup splash overlay — covers the WebView2 HWND black background until
          C# calls window.__bbmReveal() after the minimum hold time. zIndex is set
          to the maximum possible value so it renders above all other content. */}
      {!splashDone && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            opacity: splashRevealing ? 0 : 1,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: 2147483647,
            pointerEvents: splashRevealing ? 'none' : 'all',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          <p style={{ color: '#fff', fontSize: '52px', fontWeight: 300, fontFamily: 'Segoe UI, system-ui, sans-serif', margin: 0 }}>
            Baby Button Masher
          </p>
          <p style={{ color: '#888', fontSize: '22px', fontFamily: 'Segoe UI, system-ui, sans-serif', marginTop: '16px' }}>
            by tsohlacol
          </p>
        </div>
      )}

    </div>
  );
}
