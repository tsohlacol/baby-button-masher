/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Math-equation parent unlock overlay. Presentational — all state and the
 * verify handler come from useUnlockChallenge via props.
 */

import { motion } from "motion/react";
import { Lock, X } from "lucide-react";

interface ExitMathOverlayProps {
  mathSum: { a: number; b: number; operation: string; answer: number };
  answerInput: string;
  setAnswerInput: (value: string) => void;
  errorMessage: string;
  onSubmit: () => void;
  onClose: () => void;
}

export default function ExitMathOverlay({
  mathSum,
  answerInput,
  setAnswerInput,
  errorMessage,
  onSubmit,
  onClose,
}: ExitMathOverlayProps) {
  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center backdrop-blur-3xl bg-black/40 z-100 pointer-events-auto select-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/10 dark:bg-black/45 backdrop-blur-2xl border border-white/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.4)] relative"
      >
        <button
           onClick={onClose}
           className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white/70 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 text-pink-300 mb-4 animate-bounce">
          <Lock className="w-6 h-6" />
          <h2 className="text-xl font-bold font-sans">Verification Required</h2>
        </div>
        <p className="text-xs text-white/70 leading-relaxed mb-6">
          Prove that you are not the infant mashing keys! Please enter the math solution below to exit the screensaver play area.
        </p>

        <div className="text-center bg-white/5 border border-white/10 py-4 px-6 rounded-2xl mb-6">
          <span className="text-[10px] uppercase text-white/50 tracking-wider font-mono">Solve This Equation</span>
          <div className="text-3xl font-black font-mono tracking-wider text-pink-300 mt-1">
            {mathSum.a} {mathSum.operation} {mathSum.b} = ?
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="number"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            placeholder="Enter parent equation solution..."
            autoFocus
            className="w-full bg-black/40 border border-white/20 p-3 rounded-xl text-center text-lg font-bold font-mono text-pink-300 focus:outline-hidden focus:border-pink-400 backdrop-blur-md"
          />

          {errorMessage && (
            <p className="text-[11px] text-red-300 leading-relaxed text-center font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">{errorMessage}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 font-bold rounded-xl text-xs transition-all uppercase cursor-pointer"
            >
              Back to Sandbox
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 py-3 bg-pink-500 hover:bg-pink-400 font-bold rounded-xl text-xs text-white transition-all uppercase cursor-pointer shadow-lg active:scale-95"
            >
              Submit & Unlock
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
