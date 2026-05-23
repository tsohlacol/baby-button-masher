/**
 * Toddler Screen Defender (TSD)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import { describe, it, expect } from "vitest";

// Dynamic solver formula test
function solveSecurityEquation(num1: number, num2: number, op: string): number {
  switch (op) {
    case "+":
      return num1 + num2;
    case "-":
      return num1 - num2;
    case "*":
      return num1 * num2;
    default:
      return num1 + num2;
  }
}

describe.concurrent("Parent Verification Solver and Logic Locks", () => {
  it("should calculate correct math security formulas for addition", () => {
    expect(solveSecurityEquation(7, 4, "+")).toBe(11);
    expect(solveSecurityEquation(9, 3, "+")).toBe(12);
  });

  it("should calculate correct math security formulas for subtraction", () => {
    expect(solveSecurityEquation(8, 2, "-")).toBe(6);
    expect(solveSecurityEquation(5, 5, "-")).toBe(0);
  });

  it("should calculate correct math security formulas for multiplication", () => {
    expect(solveSecurityEquation(4, 6, "*")).toBe(24);
    expect(solveSecurityEquation(9, 7, "*")).toBe(63);
  });

  it("should default to addition for unsupported operator specifications", () => {
    expect(solveSecurityEquation(12, 3, "unsupported_operator_bypass")).toBe(15);
  });

  it("should enforce standard constraints on coordinate checks and pointer lock bounds", () => {
    const isWithinBounds = (x: number, y: number, width: number, height: number): boolean => {
      return x >= 0 && x <= width && y >= 0 && y <= height;
    };

    expect(isWithinBounds(150, 150, 1920, 1080)).toBe(true);
    expect(isWithinBounds(-5, 400, 1920, 1080)).toBe(false);
    expect(isWithinBounds(2000, 400, 1920, 1080)).toBe(false);
  });
});
