/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 *
 * Audio Synthesis & Voice Core
 * Uses Web Audio API & Speech Synthesis API for reliable performance without external files.
 */

let audioCtx: AudioContext | null = null;
let audioVolumeLimit: number = 0.3;

export function getAudioVolumeLimit(): number {
  return audioVolumeLimit;
}

export function setAudioVolumeLimit(vol: number) {
  audioVolumeLimit = Math.max(0, Math.min(1, vol));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Map characters to pentatonic / pleasing frequencies so random tapping sounds beautiful!
const PIANO_NOTES: Record<string, { note: string; freq: number }> = {
  a: { note: "C4", freq: 261.63 },
  s: { note: "D4", freq: 293.66 },
  d: { note: "E4", freq: 329.63 },
  f: { note: "G4", freq: 392.00 },
  g: { note: "A4", freq: 440.00 },
  h: { note: "C5", freq: 523.25 },
  j: { note: "D5", freq: 587.33 },
  k: { note: "E5", freq: 659.25 },
  l: { note: "G5", freq: 783.99 },
  q: { note: "F4", freq: 349.23 },
  w: { note: "A4", freq: 440.00 },
  e: { note: "B4", freq: 493.88 },
  r: { note: "C5", freq: 523.25 },
  t: { note: "E5", freq: 659.25 },
  y: { note: "G5", freq: 783.99 },
  u: { note: "A5", freq: 880.00 },
  i: { note: "B5", freq: 987.77 },
  o: { note: "C6", freq: 1046.50 },
  p: { note: "D6", freq: 1174.66 },
  z: { note: "C3", freq: 130.81 },
  x: { note: "D3", freq: 146.83 },
  c: { note: "E3", freq: 164.81 },
  v: { note: "G3", freq: 196.00 },
  b: { note: "A3", freq: 220.00 },
  n: { note: "C4", freq: 261.63 },
  m: { note: "D4", freq: 293.66 },
};

// Return a pleasing fallback frequency if key is not mapped
function getFrequencyForKey(key: string): { note: string; freq: number } {
  const normKey = key.toLowerCase();
  if (PIANO_NOTES[normKey]) {
    return PIANO_NOTES[normKey];
  }
  // Generate a frequency based on char code
  const code = normKey.charCodeAt(0) || 65;
  const index = code % 8;
  const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  return {
    note: "FX" + index,
    freq: pentatonicScale[index] || 440,
  };
}

/**
 * Plays a beautiful musical note with sub-millisecond envelope.
 */
export function playSyntheticPiano(key: string, type: OscillatorType = "sine") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const { freq } = getFrequencyForKey(key);

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const userVolume = audioVolumeLimit;
    // Warm envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.35 * userVolume, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (error) {
    console.warn("Audio synthesis was blocked or failed:", error);
  }
}

/**
 * Plays an explosion firework bloop.
 */
export function playFireworkSynth() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sawtooth";
    // Pitch sweep downwards rapidly
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);

    const userVolume = audioVolumeLimit;
    gainNode.gain.setValueAtTime(0.3 * userVolume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    // Dynamic bandpass filter for an explosive fizzle
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (error) {
    console.warn("Audio synthesis failed:", error);
  }
}

/**
 * Plays a cute space rocket blastoff sweeping sound.
 */
export function playRocketSynth() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sawtooth";
    // Sweep pitch upwards rapidly
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.5);

    const userVolume = audioVolumeLimit;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25 * userVolume, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

    // Filter to make it less abrasive
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.warn("Rocket synth failed:", error);
  }
}

/**
 * Plays simple playful animal synth cues.
 */
export function playAnimalSynth(animalName: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const userVolume = audioVolumeLimit;
    if (animalName.includes("dog") || animalName.includes("puppy")) {
      // Woof sound: rapid pitch jump
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.22);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4 * userVolume, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * userVolume, ctx.currentTime + 0.25);
    } else if (animalName.includes("cat") || animalName.includes("kitten")) {
      // Meow: slow pitch swell
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.4);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25 * userVolume, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * userVolume, ctx.currentTime + 0.4);
    } else if (animalName.includes("dino") || animalName.includes("dragon") || animalName.includes("t-rex")) {
      // Low rumble growl
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5 * userVolume, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * userVolume, ctx.currentTime + 0.5);
    } else {
      // Default cute ping
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3 * userVolume, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn("Animal sound synth failed", err);
  }
}

/**
 * Browser Speech Synthesis wrapper that speaks out letters/words cleanly.
 * Automatically halts previous phrases to keep up with Toddler keyboard mashing speed.
 */
export function speakToddlerText(text: string, settings: { name?: string; rate?: number; pitch?: number } = {}) {
  if (typeof window === 'undefined' || !("speechSynthesis" in window)) return;

  try {
    // Cancel prior speech immediately for rapid response
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to match custom voice name if requested
    if (settings.name) {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.name === settings.name);
      if (matched) utterance.voice = matched;
    }

    utterance.volume = audioVolumeLimit;
    utterance.rate = settings.rate || 0.9;   // slightly slower is sweeter for children
    utterance.pitch = settings.pitch || 1.25; // slightly higher pitch is friendlier

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Speech Synthesis error:", error);
  }
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Retrieves lists of child-friendly voices.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  return [...voices].sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    
    // Sort premium or natural sounding voices first
    const aIsPremium = aLower.includes("natural") || aLower.includes("google") || aLower.includes("neural") || aLower.includes("premium");
    const bIsPremium = bLower.includes("natural") || bLower.includes("google") || bLower.includes("neural") || bLower.includes("premium");
    
    if (aIsPremium && !bIsPremium) return -1;
    if (!aIsPremium && bIsPremium) return 1;
    
    // Fallback to alphabetical sorting
    return a.name.localeCompare(b.name);
  });
}
