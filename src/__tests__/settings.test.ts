/**
 * Baby Button Masher (BBM)
 * Tests for parent-settings sanitization — guards against corrupted/tampered
 * localStorage applying out-of-contract values.
 */

import { describe, it, expect } from "vitest";
import { sanitizeSettings } from "../hooks/useParentSettings";
import { ScreensaverMode, ParentSettings } from "../types";

const base: ParentSettings = {
  speechEnabled: true,
  speechVoiceName: "",
  speechRate: 1,
  speechPitch: 1,
  soundEffectsEnabled: true,
  autoModeSwitchEnabled: true,
  activeMode: ScreensaverMode.SPEAK_THE_KEY,
  unlockRequirement: "math",
  theme: "cosmic",
  customWords: {},
  volumeLimit: 0.3,
  multiMonitorStrategy: "mirror",
  parentPin: "1234",
  passcodeUnlockEnabled: false,
};

describe("sanitizeSettings", () => {
  it("clamps volumeLimit into [0.1, 1.0] with a NaN fallback", () => {
    expect(sanitizeSettings({ ...base, volumeLimit: 5 }).volumeLimit).toBe(1.0);
    expect(sanitizeSettings({ ...base, volumeLimit: -2 }).volumeLimit).toBe(0.1);
    expect(sanitizeSettings({ ...base, volumeLimit: NaN }).volumeLimit).toBe(0.3);
  });

  it("clamps speechRate and speechPitch into [0.5, 2]", () => {
    expect(sanitizeSettings({ ...base, speechRate: 9 }).speechRate).toBe(2);
    expect(sanitizeSettings({ ...base, speechPitch: 0.1 }).speechPitch).toBe(0.5);
  });

  it("keeps only single A-Z custom-word keys, uppercased", () => {
    const out = sanitizeSettings({ ...base, customWords: { a: "Ant", "1": "One", ZZ: "Bad", B: "Bear" } });
    expect(out.customWords).toEqual({ A: "Ant", B: "Bear" });
  });

  it("falls back on an invalid PIN and invalid enum-like fields", () => {
    expect(sanitizeSettings({ ...base, parentPin: "12" }).parentPin).toBe("1234");
    expect(sanitizeSettings({ ...base, theme: "neon" as unknown as ParentSettings["theme"] }).theme).toBe("cosmic");
    expect(
      sanitizeSettings({ ...base, multiMonitorStrategy: "x" as unknown as ParentSettings["multiMonitorStrategy"] }).multiMonitorStrategy,
    ).toBe("mirror");
  });

  it("leaves already-valid settings unchanged", () => {
    expect(sanitizeSettings(base)).toEqual(base);
  });
});
