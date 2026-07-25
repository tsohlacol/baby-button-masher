/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Single source of truth for the four visual themes.
 * - THEME_PRESETS: Tailwind class bundles used by React UI (dashboard, cards, buttons).
 * - themePalette: raw hex swatches used by canvas renderers (e.g. fireworks) that
 *   cannot consume Tailwind classes.
 * Adding or renaming a theme should only require editing this file.
 */

export type ThemeName = "cosmic" | "pastel" | "forest" | "rainbow";

export const THEME_PRESETS: Record<
  ThemeName,
  { bg: string; cardBg: string; accent: string; textMuted: string; glass: string }
> = {
  cosmic: {
    bg: "bg-[#0a0a1a] text-white",
    cardBg: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/40",
    accent: "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]",
    textMuted: "text-white/60",
    glass: "backdrop-blur-xl bg-white/10 border border-white/20",
  },
  pastel: {
    bg: "bg-[#1f0e22] text-pink-100",
    cardBg: "bg-pink-500/10 backdrop-blur-xl border border-pink-400/20 shadow-2xl shadow-pink-950/20",
    accent: "bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.4)]",
    textMuted: "text-pink-300/65",
    glass: "backdrop-blur-xl bg-pink-500/10 border border-pink-400/20",
  },
  forest: {
    bg: "bg-[#05130f] text-emerald-100",
    cardBg: "bg-emerald-500/10 backdrop-blur-xl border border-emerald-400/20 shadow-2xl shadow-emerald-950/20",
    accent: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]",
    textMuted: "text-emerald-300/65",
    glass: "backdrop-blur-xl bg-emerald-500/10 border border-emerald-400/20",
  },
  rainbow: {
    bg: "bg-[#100725] text-purple-100",
    cardBg: "bg-purple-500/10 backdrop-blur-xl border border-purple-400/25 shadow-2xl shadow-purple-950/25",
    accent: "bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]",
    textMuted: "text-purple-300/65",
    glass: "backdrop-blur-xl bg-purple-500/10 border border-purple-400/25",
  },
};

export const themePalette: Record<ThemeName, string[]> = {
  cosmic: ["#a855f7", "#3b82f6", "#06b6d4", "#ec4899", "#f43f5e", "#e11d48"],
  pastel: ["#fbcfe8", "#c084fc", "#93c5fd", "#a7f3d0", "#fef08a", "#fda4af"],
  forest: ["#4ade80", "#22c55e", "#10b981", "#14b8a6", "#84cc16", "#a3e635"],
  rainbow: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"],
};
