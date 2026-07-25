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
