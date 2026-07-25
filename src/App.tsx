/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * @license BBM-RCL
 */

import { useState, useEffect, useMemo } from "react";

import { ScreensaverMode, ParentSettings } from "./types";
import { speakToddlerText, cancelSpeech } from "./utils/audio";
import { useParentSettings } from "./hooks/useParentSettings";
import { useVoices } from "./hooks/useVoices";
import { useSandboxKeystrokes } from "./hooks/useSandboxKeystrokes";
import { useUnlockChallenge } from "./unlock/useUnlockChallenge";
import ExitMathOverlay from "./unlock/ExitMathOverlay";
import ExitPasscodeOverlay from "./unlock/ExitPasscodeOverlay";
import Sandbox from "./screens/Sandbox";
import Dashboard from "./screens/Dashboard";
import DictionaryScreen from "./screens/DictionaryScreen";
import { getLearnItem } from "./utils/words";

export default function App() {
  // Page states: "dashboard" | "locked_screensaver" | "sandbox"
  const [appState, setAppState] = useState<"dashboard" | "sandbox" | "dictionary">("dashboard");

  // Settings state — load/persist/volume-sync handled by the hook
  const { settings, setSettings } = useParentSettings();

  // Voice list (browser speech synthesis), sorted best-first
  const voices = useVoices();

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

  // Current active toddler playroom mode
  const [currentPlayMode, setCurrentPlayMode] = useState<ScreensaverMode>(ScreensaverMode.SPEAK_THE_KEY);

  // Exit / passcode unlock challenges (state, verification, keyboard handling)
  const unlock = useUnlockChallenge({
    parentPin: settings.parentPin,
    onUnlock: () => {
      setAppState("dashboard");
      cancelSpeech();
    },
  });
  const { isExitOverlayOpen, isPasscodeOverlayOpen, startMathUnlockChallenge, startPasscodeUnlockChallenge } = unlock;

  // Sandbox keyboard pipeline: keystroke capture, mashing speed, tempo-based auto mode switch
  const { lastKeystroke, mashingSpeed, emitKeystroke, resetKeystrokes } = useSandboxKeystrokes({
    appState,
    autoModeSwitchEnabled: settings.autoModeSwitchEnabled,
    soundEffectsEnabled: settings.soundEffectsEnabled,
    currentPlayMode,
    setCurrentPlayMode,
    isExitOverlayOpen,
    isPasscodeOverlayOpen,
  });

  // Dynamic custom word creator states
  const [newWordChar, setNewWordChar] = useState("B");
  const [newWordValue, setNewWordValue] = useState("");

  // Time logging
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Action to start play sandbox in full height
  const enterPlaySandbox = () => {
    // Lock preset initial playroom mode
    setCurrentPlayMode(settings.activeMode);
    setAppState("sandbox");
    resetKeystrokes();
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
        <Dashboard
          settings={settings}
          setSettings={setSettings}
          voices={voices}
          currentTime={currentTime}
          enterPlaySandbox={enterPlaySandbox}
          triggerVoiceTest={triggerVoiceTest}
          onOpenDictionary={() => setAppState("dictionary")}
        />
      )}

      {/* DICTIONARY SCREEN */}
      {appState === "dictionary" && (
        <DictionaryScreen
          settings={settings}
          setSettings={setSettings}
          newWordChar={newWordChar}
          setNewWordChar={setNewWordChar}
          newWordValue={newWordValue}
          setNewWordValue={setNewWordValue}
          handleAddCustomWord={handleAddCustomWord}
          handleRemoveCustomWord={handleRemoveCustomWord}
          updateCustomWord={updateCustomWord}
          triggerVoiceTest={triggerVoiceTest}
          onBack={() => setAppState("dashboard")}
        />
      )}

      {/* 2. ACTIVE SECURE PLAYROOM SANDBOX PLAY */}
      {appState === "sandbox" && (
        <Sandbox
          parsedMonitors={parsedMonitors}
          settings={settings}
          setSettings={setSettings}
          currentPlayMode={currentPlayMode}
          setCurrentPlayMode={setCurrentPlayMode}
          lastKeystroke={lastKeystroke}
          mashingSpeed={mashingSpeed}
          emitKeystroke={emitKeystroke}
          onExit={() => { setAppState("dashboard"); cancelSpeech(); }}
          startMathUnlockChallenge={startMathUnlockChallenge}
          startPasscodeUnlockChallenge={startPasscodeUnlockChallenge}
        />
      )}

      {/* 3. SECURITY POPUP COMPONENT (MATH FORMULA) */}
      {isExitOverlayOpen && (
        <ExitMathOverlay
          mathSum={unlock.mathSum}
          answerInput={unlock.parentAnswerInput}
          setAnswerInput={unlock.setParentAnswerInput}
          errorMessage={unlock.mathErrorMessage}
          onSubmit={unlock.verifyMathUnlock}
          onClose={() => unlock.setIsExitOverlayOpen(false)}
        />
      )}

      {/* 4. Parent PIN Overlay Modal */}
      {isPasscodeOverlayOpen && (
        <ExitPasscodeOverlay
          enteredPasscode={unlock.enteredPasscode}
          errorMessage={unlock.passcodeErrorMessage}
          shake={unlock.passcodeShake}
          onDigitPress={unlock.handlePasscodeDigitPress}
          onClear={() => unlock.setEnteredPasscode("")}
          onClose={() => unlock.setIsPasscodeOverlayOpen(false)}
        />
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
            by tsohlacol · v{__APP_VERSION__}
          </p>
        </div>
      )}

    </div>
  );
}
