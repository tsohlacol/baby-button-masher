/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Parent setup and configuration dashboard: displays playroom mode selection,
 * speech synthesis settings, volume controls, and exit unlock strategy configuration.
 * Provides voice testing and links to the custom words dictionary.
 */

import { Dispatch, SetStateAction } from "react";
import {
  Lock,
  Volume2,
  VolumeX,
  Layers,
  Heart,
  Github,
  Music,
  Settings,
} from "lucide-react";
import { ScreensaverMode, ParentSettings } from "../types";
import { THEME_PRESETS } from "../constants/themes";
import { speakToddlerText } from "../utils/audio";

interface DashboardProps {
  settings: ParentSettings;
  setSettings: Dispatch<SetStateAction<ParentSettings>>;
  voices: SpeechSynthesisVoice[];
  currentTime: Date;
  enterPlaySandbox: () => void;
  triggerVoiceTest: (testLetter: string) => void;
  onOpenDictionary: () => void;
}

export default function Dashboard({
  settings,
  setSettings,
  voices,
  currentTime,
  enterPlaySandbox,
  triggerVoiceTest,
  onOpenDictionary,
}: DashboardProps) {
  const activeTheme = THEME_PRESETS[settings.theme] || THEME_PRESETS.cosmic;

  return (
    <div className="h-screen overflow-hidden flex flex-col px-4 py-4 relative z-10">

      {/* Header row */}
      <header className="flex items-center justify-between gap-3 border-b pb-4 mb-4 border-slate-500/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-500">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Baby Button Masher</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/10">v{__APP_VERSION__}</span>
            </h1>
            <p className="text-xs opacity-60">Keep your desktop safe while your toddler plays &amp; learns!</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* DateTime Display */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className="text-white/40">|</span>
            <span>{currentTime.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
          </div>
          {/* Launch button */}
          <button
            onClick={enterPlaySandbox}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 select-none"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Play Screen</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* COLUMN 1: INTERACTIVE MODES CONFIG */}
        <div className={`p-5 rounded-3xl flex flex-col gap-4 ${activeTheme.cardBg} overflow-y-auto`}>
          <h3 className="text-base font-bold flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-[#a855f7]" />
            <span>Startup Playroom Mode</span>
          </h3>

          <select
            value={settings.activeMode}
            onChange={(e) => setSettings((prev) => ({ ...prev, activeMode: e.target.value as ScreensaverMode }))}
            className="w-full bg-black/20 border border-slate-500/20 p-2.5 rounded-xl text-sm font-medium shrink-0 text-black"
          >
            <option value={ScreensaverMode.SPEAK_THE_KEY}>🗣️ Speak the Key</option>
            <option value={ScreensaverMode.SPACE_ROCKET}>🚀 Space Rocket Blastoff</option>
            <option value={ScreensaverMode.ANIMAL_PARADE}>🦖 Animal &amp; Dino Parade</option>
            <option value={ScreensaverMode.COSMIC_FIREWORKS}>🎆 Cosmic Fireworks</option>
            <option value={ScreensaverMode.KEYBOARD_PIANO}>🎹 Keyboard Piano</option>
            <option value={ScreensaverMode.MOUSE_DRAWING}>🎨 Sensory Mouse Drawing</option>
            <option value={ScreensaverMode.SPACE_EXPLORER}>🌌 Space Explorer</option>
            <option value={ScreensaverMode.BINKY_CATCHER}>🍼 Binky Catcher</option>
          </select>

          {/* Dynamic Switch Rule toggle */}
          <div className="bg-black/15 p-4 rounded-xl border border-slate-500/10 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold block">🧠 Smart Auto-Switch Mode</span>
                <span className="text-[11px] opacity-60 block mt-0.5 leading-relaxed">
                  Changes modes based on their behavior. Faster slamming switches to Fireworks; slower clicks guides them back to word learning.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoModeSwitchEnabled}
                onChange={(e) => setSettings((p) => ({ ...p, autoModeSwitchEnabled: e.target.checked }))}
                className="w-10 h-5 rounded-full accent-indigo-500 cursor-pointer shrink-0"
              />
            </div>
          </div>

          {/* About section */}
          <div className="mt-auto pt-4 border-t border-slate-500/10 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/35 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
                <span className="font-bold text-white/95">About Baby Button Masher</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Secures low-level keyboard handlers and shields workspaces when toddlers play &amp; mash keys.
              </p>
              <div className="pt-2 border-t border-white/5 flex flex-col gap-1 text-[10px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Developer / Author:</span>
                  <strong className="text-white">tsohlacol</strong>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Source Repository:</span>
                  <a
                    href="https://github.com/tsohlacol/toddler-screen-defender"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1 font-mono hover:text-indigo-200"
                  >
                    <Github className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>github.com/tsohlacol</span>
                  </a>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>License:</span>
                  <span className="text-purple-300 font-bold font-mono">BBM-RCL (Reciprocal)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: SPEECH SYNTHESIS & SOUNDS */}
        <div className={`p-5 rounded-3xl flex flex-col ${activeTheme.cardBg} overflow-y-auto`}>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 mb-4 shrink-0">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <span>Speech Voice &amp; Audio</span>
            </h3>

            {/* Voice Selection */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-semibold text-white/80">Voice Model</label>
                {voices.length === 0 ? (
                  <p className="text-slate-500 italic">Loading browser voices…</p>
                ) : (() => {
                  const isHigh = (v: SpeechSynthesisVoice) => {
                    const n = v.name.toLowerCase();
                    return n.includes("online") || n.includes("natural") || n.includes("neural") || n.includes("google") || n.includes("premium");
                  };
                  const highQuality = voices.filter(isHigh);
                  const standard = voices.filter((v) => !isHigh(v));
                  return (
                    <select
                      value={settings.speechVoiceName}
                      onChange={(e) => setSettings((p) => ({ ...p, speechVoiceName: e.target.value }))}
                      className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs text-black"
                    >
                      {highQuality.length > 0 && (
                        <optgroup label="⭐ High Quality (Neural / Online)">
                          {highQuality.map((v) => (
                            <option key={v.name} value={v.name}>{v.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {standard.length > 0 && (
                        <optgroup label="Standard Voices">
                          {standard.map((v) => (
                            <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  );
                })()}
                <button
                  onClick={() => speakToddlerText("Hello! I am your toddler's voice companion.", {
                    name: settings.speechVoiceName,
                    rate: settings.speechRate,
                    pitch: settings.speechPitch,
                  })}
                  className="mt-2 w-full py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/25 text-indigo-300 font-semibold transition-colors cursor-pointer"
                >
                  ▶ Test Voice
                </button>
              </div>

              {/* Speech Rate Slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-semibold text-white/80">Speech Speed</label>
                  <span className="font-mono text-slate-400 text-[10px]">{settings.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings.speechRate}
                  onChange={(e) => setSettings((p) => ({ ...p, speechRate: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Slower speech is easier for toddlers to mirror.</span>
              </div>

              {/* Speech Pitch Slider */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-semibold text-white/80">Friendly Pitch</label>
                  <span className="font-mono text-slate-400 text-[10px]">{settings.speechPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.8"
                  step="0.05"
                  value={settings.speechPitch}
                  onChange={(e) => setSettings((p) => ({ ...p, speechPitch: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-slate-500">Higher pitch rates make the voice sound warmer.</span>
              </div>

              {/* Master Volume Safeguard Limit Slider */}
              <div className="pt-2 border-t border-slate-500/5 mt-2">
                <div className="flex justify-between mb-1.5">
                  <label className="font-semibold text-indigo-400">Master Volume Guard Cap</label>
                  <span className="font-mono text-indigo-400 text-[10px] font-bold">{Math.round(settings.volumeLimit * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.volumeLimit}
                  onChange={(e) => setSettings((p) => ({ ...p, volumeLimit: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-black/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Locks absolute maximum gain.</span>
              </div>

              <div className="flex gap-4 items-center border-t border-slate-500/10 pt-4">
                <button
                  onClick={() => setSettings((p) => ({ ...p, speechEnabled: !p.speechEnabled }))}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border text-[11px] font-medium transition-all ${
                    settings.speechEnabled
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                      : "bg-slate-500/5 text-slate-500 border-slate-500/15"
                  }`}
                >
                  {settings.speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{settings.speechEnabled ? "Voice Speech ON" : "Voice Speech OFF"}</span>
                </button>

                <button
                  onClick={() => setSettings((p) => ({ ...p, soundEffectsEnabled: !p.soundEffectsEnabled }))}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 border text-[11px] font-medium transition-all ${
                    settings.soundEffectsEnabled
                      ? "bg-pink-500/10 border-pink-500 text-pink-400"
                      : "bg-slate-500/5 text-slate-500 border-slate-500/15"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{settings.soundEffectsEnabled ? "SFX Sound ON" : "SFX Sound OFF"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Demo voice preview row */}
          <div className="border-t border-slate-500/10 pt-4 mt-6">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Test Key Voice:</span>
            <div className="grid grid-cols-4 gap-2">
              {["A", "B", "C", "D"].map((l) => (
                <button
                  key={l}
                  onClick={() => triggerVoiceTest(l)}
                  className="py-1.5 rounded bg-black/20 hover:bg-black/40 border border-slate-500/10 font-bold font-mono text-xs text-indigo-400 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>{l}</span>
                  <Volume2 className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: SETTINGS & SECURITY */}
        <div className={`p-5 rounded-3xl flex flex-col gap-4 ${activeTheme.cardBg} overflow-y-auto`}>
          <h3 className="text-base font-bold flex items-center gap-2 shrink-0">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Settings &amp; Security</span>
          </h3>

          <div className="space-y-3 text-xs flex-1">
            {/* Custom Words card */}
            <div className="bg-black/15 p-3 rounded-xl border border-slate-500/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold block">📚 Custom Words</span>
                  <span className="text-[10px] opacity-60 block mt-0.5">
                    {Object.keys(settings.customWords).length} word{Object.keys(settings.customWords).length !== 1 ? "s" : ""} configured
                  </span>
                </div>
                <button
                  onClick={onOpenDictionary}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/25 text-indigo-300 font-semibold text-[11px] transition-all cursor-pointer whitespace-nowrap"
                >
                  Edit Words →
                </button>
              </div>
            </div>

            {/* Toggle to enable/disable PIN passcode unlock feature */}
            <div className="flex items-center justify-between bg-black/10 p-2.5 rounded-xl border border-slate-500/10">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="font-semibold text-white/90">Enable PIN lock option</span>
                <span className="text-[10px] text-slate-400">Add backup numeric PIN unlock method</span>
              </div>
              <input
                type="checkbox"
                checked={!!settings.passcodeUnlockEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setSettings((p) => {
                    let nextRequirement = p.unlockRequirement;
                    if (!enabled && p.unlockRequirement === "passcode") {
                      nextRequirement = "math";
                    }
                    return {
                      ...p,
                      passcodeUnlockEnabled: enabled,
                      unlockRequirement: nextRequirement,
                    };
                  });
                }}
                className="w-4 h-4 rounded text-blue-500 accent-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-white/80">Unlock Strategy</label>
              <select
                value={settings.unlockRequirement}
                onChange={(e) => setSettings((p) => ({ ...p, unlockRequirement: e.target.value as any }))}
                className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-medium text-black"
              >
                <option value="math">Math Sum (A + B formula)</option>
                {settings.passcodeUnlockEnabled && (
                  <option value="passcode">4-Digit PIN Passcode</option>
                )}
                <option value="long_press">3-Second Press (harder for baby)</option>
                <option value="click">Simple Click (easy mock test)</option>
              </select>
            </div>

            {settings.passcodeUnlockEnabled && settings.unlockRequirement === "passcode" && (
              <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">Custom 4-Digit Parent PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={settings.parentPin || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setSettings((p) => ({ ...p, parentPin: val }));
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-black/30 border border-blue-500/30 p-1.5 rounded-lg text-xs font-mono text-center tracking-widest text-blue-300 focus:outline-hidden focus:border-blue-400 font-bold"
                />
                {(settings.parentPin === "1234" || !settings.parentPin) && (
                  <p className="text-[10px] text-yellow-400 mt-1">Change from the default - "1234" is easily guessed.</p>
                )}
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-semibold text-white/80">Multi-Monitor Strategy</label>
              <select
                value={settings.multiMonitorStrategy}
                onChange={(e) => setSettings((p) => ({ ...p, multiMonitorStrategy: e.target.value as any }))}
                className="w-full bg-black/20 border border-slate-500/20 p-2 rounded-lg text-xs font-semibold text-black"
              >
                <option value="blackout">Blackout (Protect Secondary Screens)</option>
                <option value="mirror">Mirror (Clone Active Canvas)</option>
                <option value="independent">Multi-Canvas (Separate Canvases)</option>
              </select>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="pt-3 border-t border-slate-500/10 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Visual Theme:</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "cosmic", label: "🌌 Night" },
                { id: "pastel", label: "🌸 Cute" },
                { id: "forest", label: "🌲 Green" },
                { id: "rainbow", label: "🌈 Colors" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSettings((p) => ({ ...p, theme: t.id as any }))}
                  className={`py-1 text-[10px] rounded transition-all font-semibold ${
                    settings.theme === t.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-black/10 hover:bg-black/20 border border-slate-500/5 text-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
