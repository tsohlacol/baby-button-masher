/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import { describe, it, expect } from "vitest";
import { getLearnItem, TODDLER_WORDS, FALLBACK_WORDS } from "../utils/words";

describe.concurrent("Toddler Word Dictionary Tests", () => {
  it("should retrieve correct letter representations for uppercase characters", () => {
    // A -> Apple
    const appleItem = getLearnItem("A");
    expect(appleItem.word).toBe("Apple");
    expect(appleItem.emoji).toBe("🍎");
    expect(appleItem.textColor).toContain("text-rose-600");

    // Z -> Zebra
    const zebraItem = getLearnItem("Z");
    expect(zebraItem.word).toBe("Zebra");
    expect(zebraItem.emoji).toBe("🦓");
  });

  it("should handle lowercase characters dynamically by normalizing them to uppercase", () => {
    const appleItem = getLearnItem("a");
    const zebraItem = getLearnItem("z");

    expect(appleItem.word).toBe("Apple");
    expect(zebraItem.word).toBe("Zebra");
  });

  it("should correctly load number digit emojis and words", () => {
    const zeroItem = getLearnItem("0");
    const nineItem = getLearnItem("9");

    expect(zeroItem.word).toBe("Zero");
    expect(zeroItem.emoji).toBe("🍩");
    
    expect(nineItem.word).toBe("Nine Cookies");
    expect(nineItem.emoji).toBe("🍪🍪🍪🍪🍪🍪🍪🍪🍪");
  });

  it("should map fallback keys such as Space, Enter, Backspace, and Shift securely", () => {
    const spaceItem = getLearnItem(" ");
    const enterItem = getLearnItem("Enter");
    const bsItem = getLearnItem("Backspace");

    expect(spaceItem.emoji).toBe("🚀");
    expect(enterItem.word).toBe("Magic Stars");
    expect(bsItem.word).toBe("Clear Broom");
  });

  it("should return a dynamic, safe placeholder item for unknown characters/symbols", () => {
    const dollarItem = getLearnItem("$");
    const hashItem = getLearnItem("#");

    expect(dollarItem.word).toBe("Key: $");
    expect(dollarItem.emoji).toBe("🎉");
    expect(hashItem.word).toBe("Key: #");
  });

  it("should match dictionary keys to internal toddler structures", () => {
    expect(Object.keys(TODDLER_WORDS).length).toBeGreaterThanOrEqual(36); // 26 letters + 10 digits
    expect(Object.keys(FALLBACK_WORDS).length).toBeGreaterThanOrEqual(5);
  });
});
