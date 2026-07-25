/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Custom word dictionary editor: allows parents to assign custom speech phrases
 * to keyboard keys. Displays configured words in an editable list with add/remove
 * and voice test functionality.
 */

import { Dispatch, SetStateAction } from "react";
import { Users, Plus, Trash2, Volume2 } from "lucide-react";
import { ParentSettings } from "../types";
import { THEME_PRESETS } from "../constants/themes";

interface DictionaryScreenProps {
  settings: ParentSettings;
  setSettings: Dispatch<SetStateAction<ParentSettings>>;
  newWordChar: string;
  setNewWordChar: Dispatch<SetStateAction<string>>;
  newWordValue: string;
  setNewWordValue: Dispatch<SetStateAction<string>>;
  handleAddCustomWord: () => void;
  handleRemoveCustomWord: (char: string) => void;
  updateCustomWord: (char: string, value: string) => void;
  triggerVoiceTest: (testLetter: string) => void;
  onBack: () => void;
}

export default function DictionaryScreen({
  settings,
  setSettings,
  newWordChar,
  setNewWordChar,
  newWordValue,
  setNewWordValue,
  handleAddCustomWord,
  handleRemoveCustomWord,
  updateCustomWord,
  triggerVoiceTest,
  onBack,
}: DictionaryScreenProps) {
  const activeTheme = THEME_PRESETS[settings.theme] || THEME_PRESETS.cosmic;

  return (
    <div className="h-screen overflow-hidden flex flex-col px-4 py-4 relative z-10">
      <header className="flex items-center gap-4 border-b pb-4 mb-4 border-slate-500/10 shrink-0">
        <button
          onClick={onBack}
          className="p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 text-indigo-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Custom Words</h1>
            <p className="text-xs opacity-60">Assign words so the app speaks family names or personal characters when keys are pressed.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4 pb-4">
          {/* Creator row */}
          <div className={`p-5 rounded-3xl ${activeTheme.cardBg}`}>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Add Custom Key Word</span>
            <div className="flex gap-2 text-xs">
              <div className="w-16">
                <select
                  value={newWordChar}
                  onChange={(e) => setNewWordChar(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 p-2 rounded-lg text-white font-mono font-bold text-center focus:outline-hidden"
                >
                  {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newWordValue}
                  onChange={(e) => setNewWordValue(e.target.value)}
                  placeholder="e.g. Bear 🐻"
                  className="w-full bg-slate-900 border border-slate-700/60 p-2 rounded-lg text-white text-xs focus:outline-hidden"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCustomWord();
                  }}
                />
              </div>
              <button
                onClick={handleAddCustomWord}
                className="p-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium transition-all flex items-center justify-center cursor-pointer"
                title="Add Word Mapping"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Configured words list */}
          <div className={`p-5 rounded-3xl ${activeTheme.cardBg}`}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Configured Keys ({Object.keys(settings.customWords).length})
            </span>
            {Object.keys(settings.customWords).length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-500/10 rounded-xl">
                <p className="text-sm">No custom words yet.</p>
                <p className="text-xs text-slate-600 mt-1">Add some letters above!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.keys(settings.customWords)
                  .sort()
                  .map((char) => (
                    <div
                      key={char}
                      className="flex items-center gap-2 p-2 rounded-xl bg-black/10 border border-slate-500/5 group hover:border-slate-500/15 transition-all text-xs"
                    >
                      <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center text-sm">
                        {char}
                      </div>
                      <input
                        type="text"
                        value={settings.customWords[char] || ""}
                        onChange={(e) => updateCustomWord(char, e.target.value)}
                        placeholder={`Spelling for ${char}`}
                        className="flex-1 bg-black/10 hover:bg-black/20 focus:bg-slate-900/90 border border-slate-500/10 focus:border-slate-500/30 p-1.5 rounded-md text-[11px] font-medium text-slate-100 placeholder-slate-500 transition-all focus:outline-hidden"
                      />
                      <button
                        onClick={() => triggerVoiceTest(char)}
                        className="p-1 px-1.5 rounded bg-slate-850 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                        title="Test Speech"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveCustomWord(char)}
                        className="p-1 px-1.5 rounded bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                        title="Remove Word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
