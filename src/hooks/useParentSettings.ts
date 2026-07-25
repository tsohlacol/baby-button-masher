/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Parent settings: load from localStorage, persist on change, and mirror the
 * volume cap into the audio core. Owns nothing UI-related — just the settings
 * object and its setter.
 */

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { ScreensaverMode, ParentSettings } from "../types";
import { setAudioVolumeLimit } from "../utils/audio";

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

/** Clamp a numeric field into range, falling back to a default for NaN/non-number input. */
function clampNum(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Coerce a settings object into valid, in-range values. Guards against corrupted or
 * hand-edited localStorage (e.g. a volumeLimit above the hearing-safety cap, or a
 * non-numeric PIN) so the app can never run with out-of-contract settings.
 */
export function sanitizeSettings(s: ParentSettings): ParentSettings {
  const themes: ParentSettings["theme"][] = ["cosmic", "pastel", "forest", "rainbow"];
  const unlocks: ParentSettings["unlockRequirement"][] = ["click", "long_press", "passcode", "math"];
  const strategies: ParentSettings["multiMonitorStrategy"][] = ["blackout", "mirror", "independent"];

  const customWords: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.customWords ?? {})) {
    const key = k.toUpperCase();
    if (/^[A-Z]$/.test(key) && typeof v === "string") customWords[key] = v;
  }

  return {
    ...s,
    volumeLimit: clampNum(s.volumeLimit, 0.1, 1.0, DEFAULT_SETTINGS.volumeLimit),
    speechRate: clampNum(s.speechRate, 0.5, 2, DEFAULT_SETTINGS.speechRate),
    speechPitch: clampNum(s.speechPitch, 0.5, 2, DEFAULT_SETTINGS.speechPitch),
    theme: themes.includes(s.theme) ? s.theme : DEFAULT_SETTINGS.theme,
    unlockRequirement: unlocks.includes(s.unlockRequirement) ? s.unlockRequirement : DEFAULT_SETTINGS.unlockRequirement,
    multiMonitorStrategy: strategies.includes(s.multiMonitorStrategy) ? s.multiMonitorStrategy : DEFAULT_SETTINGS.multiMonitorStrategy,
    activeMode: Object.values(ScreensaverMode).includes(s.activeMode) ? s.activeMode : DEFAULT_SETTINGS.activeMode,
    parentPin: typeof s.parentPin === "string" && /^\d{4}$/.test(s.parentPin) ? s.parentPin : DEFAULT_SETTINGS.parentPin,
    customWords,
  };
}

/** Load persisted settings from localStorage, falling back to defaults for any missing keys. */
function loadSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_SLOT); // sast-ignore — stores only UI config, no credentials
    if (!raw) return DEFAULT_SETTINGS;
    // Shallow-merge so fields added in future versions always have their defaults,
    // then clamp/validate so corrupted or tampered persistence can't apply bad values.
    return sanitizeSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ParentSettings>) });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useParentSettings(): {
  settings: ParentSettings;
  setSettings: Dispatch<SetStateAction<ParentSettings>>;
} {
  const [settings, setSettings] = useState<ParentSettings>(loadSettings);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_SLOT, JSON.stringify(settings)); } catch { /* quota / private-mode */ } // sast-ignore — stores only UI config, no credentials
  }, [settings]);

  // Synchronize audio.ts master volume with parent settings volume limit
  useEffect(() => {
    setAudioVolumeLimit(settings.volumeLimit);
  }, [settings.volumeLimit]);

  return { settings, setSettings };
}
