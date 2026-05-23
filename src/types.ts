/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 *
 * Types & Interfaces for Toddler Screen Defender & Play Screensaver
 */

export enum ScreensaverMode {
  SPEAK_THE_KEY = "SPEAK_THE_KEY",
  ANIMAL_PARADE = "ANIMAL_PARADE",
  COSMIC_FIREWORKS = "COSMIC_FIREWORKS",
  KEYBOARD_PIANO = "KEYBOARD_PIANO",
  SPACE_ROCKET = "SPACE_ROCKET",
  MOUSE_DRAWING = "MOUSE_DRAWING",
}

export interface KeystrokeEvent {
  id: string;
  key: string;
  code: string;
  timestamp: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape: "circle" | "star" | "ring";
}

export interface ParadeAnimal {
  id: string;
  emoji: string;
  name: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  speedX: number;
  speedY: number;
  bounceHeight: number;
  phase: number;
  action: "running" | "jumping" | "spinning" | "floating";
}

export interface KeySound {
  frequency: number;
  noteName: string;
  color: string;
}

export interface ParentSettings {
  speechEnabled: boolean;
  speechVoiceName: string;
  speechRate: number; // 0.5 to 2
  speechPitch: number; // 0.5 to 2
  soundEffectsEnabled: boolean;
  autoModeSwitchEnabled: boolean;
  activeMode: ScreensaverMode;
  unlockRequirement: "click" | "long_press" | "passcode" | "math";
  theme: "cosmic" | "pastel" | "forest" | "rainbow";
  customWords: Record<string, string>; // custom word assignments e.g., 'A' -> 'Alice'
  volumeLimit: number; // 0.1 to 1.0
  multiMonitorStrategy: "blackout" | "mirror" | "independent";
  parentPin?: string; // 4-digit PIN for passcode unlock
  passcodeUnlockEnabled?: boolean; // configuration toggle for PIN passcode unlock
}

export interface SystemMonitor {
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
}

declare global {
  interface Window {
    TSD_MONITORS?: SystemMonitor[];
  }
}

