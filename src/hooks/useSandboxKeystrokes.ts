/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Owns the sandbox keyboard pipeline: the global keydown listener, the rolling
 * mashing-speed estimate, and the tempo-based auto mode switch. Keystroke
 * capture and mashing analysis share `keyEventsRef`, so they live together in
 * one hook rather than poking a shared ref across hook boundaries.
 *
 * Mirror-refs let the keydown handler read the latest overlay/mode/sound state
 * without re-registering on every render.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ScreensaverMode } from "../types";
import { playFireworkSynth } from "../utils/audio";

export interface LastKeyEvent {
  key: string;
  timestamp: number;
}

interface UseSandboxKeystrokesArgs {
  appState: "dashboard" | "sandbox" | "dictionary";
  autoModeSwitchEnabled: boolean;
  soundEffectsEnabled: boolean;
  currentPlayMode: ScreensaverMode;
  setCurrentPlayMode: (mode: ScreensaverMode) => void;
  isExitOverlayOpen: boolean;
  isPasscodeOverlayOpen: boolean;
}

export interface SandboxKeystrokes {
  lastKeystroke: LastKeyEvent | null;
  mashingSpeed: number;
  /** Register a play pulse for `key` (used by the keydown handler and by faux
   *  click-to-play). Records the timestamp and fires the fireworks synth when active. */
  emitKeystroke: (key: string) => void;
  /** Clears rolling keystroke history — call when entering the sandbox. */
  resetKeystrokes: () => void;
}

export function useSandboxKeystrokes({
  appState,
  autoModeSwitchEnabled,
  soundEffectsEnabled,
  currentPlayMode,
  setCurrentPlayMode,
  isExitOverlayOpen,
  isPasscodeOverlayOpen,
}: UseSandboxKeystrokesArgs): SandboxKeystrokes {
  const [mashingSpeed, setMashingSpeed] = useState<number>(0);
  const [lastKeystroke, setLastKeystroke] = useState<LastKeyEvent | null>(null);

  // Timestamps of recent keypresses, shared by the handler and the mashing analyzer.
  const keyEventsRef = useRef<number[]>([]);

  // Refs so the keydown handler reads current values without re-registering on every state change
  const isExitOverlayOpenRef = useRef(false);
  const isPasscodeOverlayOpenRef = useRef(false);
  const currentPlayModeRef = useRef(currentPlayMode);
  const soundEffectsEnabledRef = useRef(soundEffectsEnabled);
  useEffect(() => { isExitOverlayOpenRef.current = isExitOverlayOpen; }, [isExitOverlayOpen]);
  useEffect(() => { isPasscodeOverlayOpenRef.current = isPasscodeOverlayOpen; }, [isPasscodeOverlayOpen]);
  useEffect(() => { currentPlayModeRef.current = currentPlayMode; }, [currentPlayMode]);
  useEffect(() => { soundEffectsEnabledRef.current = soundEffectsEnabled; }, [soundEffectsEnabled]);

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
      if (autoModeSwitchEnabled && countInLast5s > 0) {
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
  }, [appState, autoModeSwitchEnabled, currentPlayMode, setCurrentPlayMode]);

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

  const resetKeystrokes = useCallback(() => {
    keyEventsRef.current = [];
    setMashingSpeed(0);
    setLastKeystroke(null);
  }, []);

  return { lastKeystroke, mashingSpeed, resetKeystrokes };
}
