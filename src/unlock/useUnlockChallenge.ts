/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Parent exit challenges: the math-equation and 4-digit-PIN unlock flows plus
 * their overlay state. Both call `onUnlock` on success; the caller decides what
 * unlocking means (return to dashboard, stop speech, etc.).
 */

import { useEffect, useState } from "react";

interface MathSum {
  a: number;
  b: number;
  operation: string;
  answer: number;
}

interface UseUnlockChallengeArgs {
  parentPin: string | undefined;
  onUnlock: () => void;
}

export function useUnlockChallenge({ parentPin, onUnlock }: UseUnlockChallengeArgs) {
  // Math challenge overlay state
  const [isExitOverlayOpen, setIsExitOverlayOpen] = useState(false);
  const [mathSum, setMathSum] = useState<MathSum>({ a: 0, b: 0, operation: "+", answer: 0 });
  const [parentAnswerInput, setParentAnswerInput] = useState("");
  const [mathErrorMessage, setMathErrorMessage] = useState("");

  // Passcode overlay state
  const [isPasscodeOverlayOpen, setIsPasscodeOverlayOpen] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeErrorMessage, setPasscodeErrorMessage] = useState("");
  const [passcodeShake, setPasscodeShake] = useState(false);

  // Formulates math sum for exit control challenge (add, subtract, or multiply two single digit numbers)
  const startMathUnlockChallenge = () => {
    const ops = ["+", "-", "*"] as const;
    const operation = ops[Math.floor(Math.random() * ops.length)];

    let a = Math.floor(Math.random() * 9) + 1; // 1 to 9 (single digit)
    let b = Math.floor(Math.random() * 9) + 1; // 1 to 9 (single digit)
    let answer = 0;

    if (operation === "+") {
      answer = a + b;
    } else if (operation === "-") {
      // Ensure result is positive and easy by keeping a >= b
      if (a < b) {
        const temp = a;
        a = b;
        b = temp;
      }
      answer = a - b;
    } else if (operation === "*") {
      answer = a * b;
    }

    setMathSum({ a, b, operation, answer });
    setParentAnswerInput("");
    setMathErrorMessage("");
    setIsExitOverlayOpen(true);
  };

  const verifyMathUnlock = () => {
    const numericAns = Number(parentAnswerInput.trim());
    if (!isNaN(numericAns) && numericAns === mathSum.answer) {
      setIsExitOverlayOpen(false);
      onUnlock();
    } else {
      setMathErrorMessage("Oops! That's not correct. Try another formula so we know you are mommy/daddy.");
      setParentAnswerInput("");
    }
  };

  const startPasscodeUnlockChallenge = () => {
    setEnteredPasscode("");
    setPasscodeErrorMessage("");
    setPasscodeShake(false);
    setIsPasscodeOverlayOpen(true);
  };

  const handlePasscodeDigitPress = (digit: string) => {
    setPasscodeErrorMessage("");
    setEnteredPasscode((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + digit;
      // Auto-unlock or verify once we reach 4 digits
      if (next.length === 4) {
        const correctPin = parentPin || "1234";
        if (next === correctPin) {
          setTimeout(() => {
            setIsPasscodeOverlayOpen(false);
            onUnlock();
          }, 200);
          return next;
        } else {
          setPasscodeShake(true);
          setPasscodeErrorMessage("Access Denied! Incorrect Parent PIN.");
          setTimeout(() => {
            setPasscodeShake(false);
            setEnteredPasscode("");
          }, 600);
          return next;
        }
      }
      return next;
    });
  };

  // Physical keyboard bypass listener when passcode popup is open
  useEffect(() => {
    if (!isPasscodeOverlayOpen) return;

    const handlePasscodeKeyboardInput = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePasscodeDigitPress(e.key);
      } else if (e.key === "Backspace") {
        setEnteredPasscode((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        setIsPasscodeOverlayOpen(false);
      }
    };

    window.addEventListener("keydown", handlePasscodeKeyboardInput);
    return () => {
      window.removeEventListener("keydown", handlePasscodeKeyboardInput);
    };
  }, [isPasscodeOverlayOpen, parentPin]);

  return {
    // Overlay visibility (also consumed by the keystroke pipeline to gate input)
    isExitOverlayOpen,
    setIsExitOverlayOpen,
    isPasscodeOverlayOpen,
    setIsPasscodeOverlayOpen,
    // Triggers wired to the sandbox exit control
    startMathUnlockChallenge,
    startPasscodeUnlockChallenge,
    // Math overlay bindings
    mathSum,
    parentAnswerInput,
    setParentAnswerInput,
    mathErrorMessage,
    verifyMathUnlock,
    // Passcode overlay bindings
    enteredPasscode,
    setEnteredPasscode,
    passcodeErrorMessage,
    passcodeShake,
    handlePasscodeDigitPress,
  };
}
