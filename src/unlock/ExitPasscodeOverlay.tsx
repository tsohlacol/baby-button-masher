/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * 4-digit PIN parent unlock overlay. Presentational — all state and handlers
 * come from useUnlockChallenge via props.
 */

import { motion } from "motion/react";
import { Lock, X } from "lucide-react";

interface ExitPasscodeOverlayProps {
  enteredPasscode: string;
  errorMessage: string;
  shake: boolean;
  onDigitPress: (digit: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ExitPasscodeOverlay({
  enteredPasscode,
  errorMessage,
  shake,
  onDigitPress,
  onClear,
  onClose,
}: ExitPasscodeOverlayProps) {
  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center backdrop-blur-3xl bg-black/50 z-100 pointer-events-auto select-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0], scale: 1, opacity: 1 } : { x: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-full max-w-sm p-8 rounded-3xl bg-slate-900/90 dark:bg-black/80 backdrop-blur-2xl border border-blue-500/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white/70 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 mb-3 animate-pulse">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight">Parent Verification</h2>
          <p className="text-xs text-slate-400 leading-relaxed mt-1 mb-6">
            Enter your 4-digit PIN to exit the child lockdown sandbox.
          </p>

          {/* Passcode indicators */}
          <div className="flex gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => {
              const hasDigit = enteredPasscode.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    hasDigit
                      ? "bg-blue-400 border-blue-400 scale-110 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                      : "border-slate-500 bg-slate-800"
                  }`}
                />
              );
            })}
          </div>

          {/* Error statement feedback */}
          <div className="h-6 mb-4 flex items-center justify-center">
            {errorMessage ? (
              <p className="text-xs text-red-500 font-medium tracking-tight bg-red-950/40 px-3 py-1 rounded-full border border-red-500/20">
                {errorMessage}
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Enter your parent PIN
              </p>
            )}
          </div>

          {/* Grid 3x4 PIN Pad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                onClick={() => onDigitPress(digit)}
                className="aspect-square flex items-center justify-center text-xl font-semibold font-mono rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-500/20 border border-white/5 hover:border-slate-700 dynamic-pin-btn transition-all duration-100 cursor-pointer text-slate-200"
              >
                {digit}
              </button>
            ))}
            {/* Clear */}
            <button
              onClick={onClear}
              className="aspect-square flex items-center justify-center text-xs font-bold uppercase rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-red-500/20 border border-white/5 transition-all cursor-pointer text-slate-450 hover:text-red-300"
            >
              Clear
            </button>
            {/* 0 */}
            <button
              onClick={() => onDigitPress("0")}
              className="aspect-square flex items-center justify-center text-xl font-semibold font-mono rounded-2xl bg-white/5 hover:bg-white/10 active:bg-blue-500/20 border border-white/5 hover:border-slate-700 transition-all duration-100 cursor-pointer text-slate-200"
            >
              0
            </button>
            {/* Cancel */}
            <button
              onClick={onClose}
              className="aspect-square flex items-center justify-center text-xs font-bold uppercase rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:bg-blue-500/10 border border-white/5 transition-all cursor-pointer text-slate-455 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
