/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 *
 * Loads the browser's speech-synthesis voice list and keeps it fresh as the
 * browser populates voices asynchronously. Returns the list sorted best-first
 * (getAvailableVoices bubbles neural/online voices to the top).
 */

import { useEffect, useState } from "react";
import { getAvailableVoices } from "../utils/audio";

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(getAvailableVoices());
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return voices;
}
