/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * The active child-lockdown playroom: renders the selected mode per monitor,
 * the faux click-to-play emitter, the behavior-tempo radar, and the parent
 * safe-exit control. The exit control's long-press meter is local state here;
 * the actual "leave the sandbox" action is delegated to `onExit`.
 */

import { useRef, useState, Dispatch, SetStateAction } from "react";
import { Lock, Unlock } from "lucide-react";
import { ScreensaverMode, ParentSettings } from "../types";
import { LastKeyEvent } from "../hooks/useSandboxKeystrokes";

import FireworksCanvas from "../components/FireworksCanvas";
import AnimalParadeView from "../components/AnimalParadeView";
import SpeakKeyView from "../components/SpeakKeyView";
import KeyboardPianoView from "../components/KeyboardPianoView";
import SpaceRocketView from "../components/SpaceRocketView";
import MouseDrawingView from "../components/MouseDrawingView";
import SpaceExplorerView from "../components/SpaceExplorerView";
import BinkyCatcherView from "../components/BinkyCatcherView";

// Ordered list used for manual mode cycling via the status pill
const PLAY_MODES: ScreensaverMode[] = [
  ScreensaverMode.SPEAK_THE_KEY,
  ScreensaverMode.ANIMAL_PARADE,
  ScreensaverMode.COSMIC_FIREWORKS,
  ScreensaverMode.KEYBOARD_PIANO,
  ScreensaverMode.SPACE_ROCKET,
  ScreensaverMode.MOUSE_DRAWING,
  ScreensaverMode.SPACE_EXPLORER,
  ScreensaverMode.BINKY_CATCHER,
];

interface SandboxProps {
  parsedMonitors: any[];
  settings: ParentSettings;
  setSettings: Dispatch<SetStateAction<ParentSettings>>;
  currentPlayMode: ScreensaverMode;
  setCurrentPlayMode: (mode: ScreensaverMode) => void;
  lastKeystroke: LastKeyEvent | null;
  mashingSpeed: number;
  emitKeystroke: (key: string) => void;
  /** Leave the sandbox and return to the dashboard (stops speech, etc.). */
  onExit: () => void;
  startMathUnlockChallenge: () => void;
  startPasscodeUnlockChallenge: () => void;
}

export default function Sandbox({
  parsedMonitors,
  settings,
  setSettings,
  currentPlayMode,
  setCurrentPlayMode,
  lastKeystroke,
  mashingSpeed,
  emitKeystroke,
  onExit,
  startMathUnlockChallenge,
  startPasscodeUnlockChallenge,
}: SandboxProps) {
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<any>(null);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-slate-950 select-none z-50">
      {parsedMonitors.map((m: any, idx: number) => {
          const isBlackout = settings.multiMonitorStrategy === "blackout" && !m.isPrimary;
          const shouldRenderSandbox = m.isPrimary || settings.multiMonitorStrategy === "mirror" || settings.multiMonitorStrategy === "independent";

          return (
            <div
              key={idx}
              className="absolute overflow-hidden"
              style={{
                left: `${m.normLeft}%`,
                top: `${m.normTop}%`,
                width: `${m.normWidth}%`,
                height: `${m.normHeight}%`,
              }}
            >
              {isBlackout ? (
                // Deep Blackout Display for Secondary Screens
                <div className="w-full h-full bg-black flex flex-col items-center justify-center border-l border-white/5 selection:bg-transparent">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-slate-800 pointer-events-none">
                    BBM Screen Shield Guard Active • Auxiliary Display Cloaked
                  </span>
                </div>
              ) : shouldRenderSandbox ? (
                <div className="relative w-full h-full bg-slate-950 overflow-hidden">
                  {/* Active playrooms based on selected mode */}
                  {currentPlayMode === ScreensaverMode.SPEAK_THE_KEY && (
                    <SpeakKeyView
                      lastEvent={lastKeystroke}
                      voiceName={settings.speechVoiceName}
                      speechRate={settings.speechRate}
                      speechPitch={settings.speechPitch}
                      speechEnabled={settings.speechEnabled}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.ANIMAL_PARADE && (
                    <AnimalParadeView
                      lastEvent={lastKeystroke}
                      soundEnabled={settings.soundEffectsEnabled}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.COSMIC_FIREWORKS && (
                    <FireworksCanvas
                      lastEvent={lastKeystroke}
                      theme={settings.theme}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.KEYBOARD_PIANO && (
                    <KeyboardPianoView
                      lastEvent={lastKeystroke}
                      soundEnabled={settings.soundEffectsEnabled}
                      theme={settings.theme}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.SPACE_ROCKET && (
                    <SpaceRocketView
                      lastEvent={lastKeystroke}
                      soundEnabled={settings.soundEffectsEnabled}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.MOUSE_DRAWING && (
                    <MouseDrawingView
                      lastEvent={lastKeystroke}
                      soundEnabled={settings.soundEffectsEnabled}
                      theme={settings.theme}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.SPACE_EXPLORER && (
                    <SpaceExplorerView
                      lastEvent={lastKeystroke}
                      voiceName={settings.speechVoiceName}
                      speechRate={settings.speechRate}
                      speechPitch={settings.speechPitch}
                      speechEnabled={settings.speechEnabled}
                      soundEnabled={settings.soundEffectsEnabled}
                    />
                  )}

                  {currentPlayMode === ScreensaverMode.BINKY_CATCHER && (
                    <BinkyCatcherView
                      soundEnabled={settings.soundEffectsEnabled}
                    />
                  )}

                  {/* BACKGROUND CONTINUOUS MOUSE-CLICK EMITTER LISTENER FOR SANDBOX */}
                  {currentPlayMode !== ScreensaverMode.MOUSE_DRAWING && (
                    <div
                      onClick={() => {
                        // Spawns a faux keystroke space trigger if keys are blocked so standard clicks also animate beautifully
                        emitKeystroke(" ");
                      }}
                      className="absolute inset-0 block w-full h-full pointer-events-auto z-5 cursor-crosshair opacity-0"
                    />
                  )}

                  {/* Primary Monitor overlays (Pill status, Unlock Hatch, behavior tempo) */}
                  {m.isPrimary && (
                    <>
                      {/* MULTI_MONITOR STATUS PILL FOR PREPARATION ASSURANCE */}
                      <div className="absolute top-8 left-8 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/55 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 select-none pointer-events-none z-30 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span>Screen Guard: {settings.multiMonitorStrategy === "blackout" ? "🚫 Secondary Blackout Active" : settings.multiMonitorStrategy === "mirror" ? "👥 Canvas Mirror Active" : "🎯 Multi-Canvas Active"}</span>
                      </div>

                      {/* DYNAMIC PARENT SAFE EXIT CONTROL: BOTTOM-RIGHT CORNER */}
                      <div className="absolute bottom-6 right-6 z-40 pointer-events-auto select-none">
                        {settings.unlockRequirement === "long_press" ? (
                          // Case A: 3-Second steady Hold trigger
                          <button
                            onMouseDown={() => {
                              longPressTimerRef.current = setInterval(() => {
                                setLongPressProgress((old) => {
                                  if (old >= 100) {
                                    clearInterval(longPressTimerRef.current);
                                    setLongPressProgress(0);
                                    // Exit play room completely
                                    onExit();
                                    return 0;
                                  }
                                  return old + 4; // increment fast
                                });
                              }, 80);
                            }}
                            onMouseUp={() => {
                              if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                              setLongPressProgress(0);
                            }}
                            onMouseLeave={() => {
                              if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                              setLongPressProgress(0);
                            }}
                            onTouchStart={() => {
                              longPressTimerRef.current = setInterval(() => {
                                setLongPressProgress((old) => {
                                  if (old >= 100) {
                                    clearInterval(longPressTimerRef.current);
                                    setLongPressProgress(0);
                                    onExit();
                                    return 0;
                                  }
                                  return old + 4;
                                });
                              }, 80);
                            }}
                            onTouchEnd={() => {
                              if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                              setLongPressProgress(0);
                            }}
                            onTouchCancel={() => {
                              if (longPressTimerRef.current) clearInterval(longPressTimerRef.current);
                              setLongPressProgress(0);
                            }}
                            className="group relative flex items-center justify-center p-4 bg-slate-900/90 border border-slate-700/60 rounded-full text-white cursor-pointer hover:bg-slate-950 hover:border-indigo-500 shadow-xl transition-all duration-300"
                          >
                            {/* Circular timer progress meter */}
                            <div
                              className="absolute inset-0 rounded-full border-4 border-indigo-500 scale-102 transition-colors duration-100 pointer-events-none"
                              style={{
                                clipPath: `inset(${100 - longPressProgress}% 0px 0px 0px)`
                              }}
                            />
                            <Lock className="w-5 h-5 text-indigo-400 group-hover:scale-110" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-28 group-hover:ml-2 text-[10px] font-mono whitespace-nowrap transition-all duration-300">
                              Hold 3s to Unlock
                            </span>
                          </button>
                        ) : settings.unlockRequirement === "math" ? (
                          // Case B: Math Challenge Popup button trigger
                          <button
                            onClick={startMathUnlockChallenge}
                            className="group flex items-center p-4 bg-slate-900/95 border border-[#fcbbfd]/20 hover:border-[#a855f7]/60 rounded-full text-white cursor-pointer hover:bg-slate-950 shadow-2xl transition-all duration-300 active:scale-95"
                          >
                            <Lock className="w-5 h-5 text-[#a855f7]" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-32 group-hover:ml-2 text-[11px] font-sans font-medium text-slate-300 whitespace-nowrap transition-all duration-500">
                              🔐 Parent Unlock
                            </span>
                          </button>
                        ) : (settings.unlockRequirement === "passcode" && settings.passcodeUnlockEnabled) ? (
                          // Case B.2: Passcode PIN Verification trigger button
                          <button
                            onClick={startPasscodeUnlockChallenge}
                            className="group flex items-center p-4 bg-slate-900/95 border border-[#60a5fa]/20 hover:border-[#3b82f6]/60 rounded-full text-white cursor-pointer hover:bg-slate-950 shadow-2xl transition-all duration-300 active:scale-95"
                          >
                            <Lock className="w-5 h-5 text-[#3b82f6]" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-32 group-hover:ml-2 text-[11px] font-sans font-medium text-slate-300 whitespace-nowrap transition-all duration-500">
                              🔢 Enter PIN Passcode
                            </span>
                          </button>
                        ) : (
                          // Case C: Simple button unlock
                          <button
                            onClick={onExit}
                            className="group flex items-center p-4 bg-slate-900/95 border border-slate-700/60 rounded-full text-white hover:bg-red-950/20 hover:border-red-500 max-w-sm transition-all shadow-xl font-mono cursor-pointer"
                          >
                            <Unlock className="w-5 h-5 text-emerald-400 group-hover:rotate-12" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-24 group-hover:ml-2 text-xs transition-all duration-300">
                              Exit play
                            </span>
                          </button>
                        )}
                      </div>

                      {/* REAL-TIME ROLL MONITOR RADAR FOR STATS (SUBCONSCIOUS FEEDBACK) */}
                      <div className="absolute bottom-6 left-6 z-40 bg-black/75 border border-white/5 backdrop-blur-md text-white px-4 py-2 rounded-2xl font-mono text-[9px] text-left flex items-center gap-4 shadow-xl">
                        <div>
                          <span className="text-white/40 block">BEHAVIOR TEMPO</span>
                          <span className="font-bold text-indigo-400">
                            {mashingSpeed} Keystrokes/Min
                          </span>
                        </div>
                        <div className="border-l border-white/10 h-6" />
                        {/* Click to cycle through play modes manually */}
                        <button
                          className="text-left cursor-pointer hover:bg-white/10 rounded-lg px-2 -mx-2 py-1 -my-1 transition-colors"
                          onClick={() => {
                            const idx = PLAY_MODES.indexOf(currentPlayMode);
                            setCurrentPlayMode(PLAY_MODES[(idx + 1) % PLAY_MODES.length]);
                          }}
                        >
                          <span className="text-white/40 block">PLAY MODE ▶</span>
                          <span className="font-bold text-pink-400 uppercase">
                            {currentPlayMode.replaceAll("_", " ")}
                          </span>
                        </button>
                        <div className="border-l border-white/10 h-6" />
                        {/* Click to toggle auto-switch on/off */}
                        <button
                          className="text-left cursor-pointer hover:bg-white/10 rounded-lg px-2 -mx-2 py-1 -my-1 transition-colors"
                          onClick={() => setSettings((p) => ({ ...p, autoModeSwitchEnabled: !p.autoModeSwitchEnabled }))}
                        >
                          <span className="text-white/40 block">AUTO-SWITCH</span>
                          <span className={`font-bold uppercase ${settings.autoModeSwitchEnabled ? "text-emerald-400" : "text-white/30"}`}>
                            {settings.autoModeSwitchEnabled ? "ON" : "OFF"}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}
