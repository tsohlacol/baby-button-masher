/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAudioVolumeLimit, setAudioVolumeLimit, playSyntheticPiano, playAnimalSynth, playFireworkSynth } from "../utils/audio";

describe.concurrent("BBM Audio Synthesizer and Limit Controls", () => {
  beforeEach(() => {
    // Reset volume state before each parallel group run if needed
    setAudioVolumeLimit(0.3);
  });

  it("should get and set audio limits safely within normal human toddler hearing bounds", () => {
    expect(getAudioVolumeLimit()).toBe(0.3);

    // Increase up to half volume
    setAudioVolumeLimit(0.5);
    expect(getAudioVolumeLimit()).toBe(0.5);

    // Set maximum ceiling
    setAudioVolumeLimit(1.0);
    expect(getAudioVolumeLimit()).toBe(1.0);
  });

  it("should clamp volume input parameters out-of-range strictly to secure safety thresholds", () => {
    // Negative values should clamp securely to 0 (mute)
    setAudioVolumeLimit(-0.55);
    expect(getAudioVolumeLimit()).toBe(0);

    // Outrageous gain factors should clamp securely to 1.0 (protect baby ears)
    setAudioVolumeLimit(45.0);
    expect(getAudioVolumeLimit()).toBe(1.0);
  });

  it("should fail-safe and gracefully bypass when Speech or Web Audio APIs are missing in the runtime host console", () => {
    // Ensuring function call executions don't throw critical unhandled exceptions when windows are virtualized
    expect(() => playSyntheticPiano("a")).not.toThrow();
    expect(() => playFireworkSynth()).not.toThrow();
    expect(() => playAnimalSynth("puppy")).not.toThrow();
    expect(() => playAnimalSynth("kitten")).not.toThrow();
    expect(() => playAnimalSynth("tyrannosaurus-rex")).not.toThrow();
    expect(() => playAnimalSynth("unknown-alien-monster")).not.toThrow();
  });
});
