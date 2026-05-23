# Threat Model for Toddler Screen Defender (TSD)

*   **Developed/Authored by Logo/Maintainer:** tsohlacol
*   **Source Repository:** [github.com/tsohlacol/toddler-screen-defender](https://github.com/tsohlacol/toddler-screen-defender)
*   **License Model:** TSD-RCL (Reciprocal Licence)

---

## 1. Executive Summary

Toddler Screen Defender (TSD) is a security-focused sandbox software package designed to lock down active keyboard inputs, block system shortcut mashings, and protect host workspaces from unauthorized alterations or destructive clicks when an infant or young child is actively interacting with the screen. 

As a web-and-native lightweight solution, TSD's primary security guarantee is **robust input isolation**. Since this application runs both in an sandboxed iframe (development/previews) and inside a compiled desktop wrapper, this threat model maps the critical boundaries, attack surfaces, and defensive measures implemented within the TSD codebase.

---

## 2. System Boundaries & Architecture

```
                  +----------------------------------------------+
                  |               Physical User                  |
                  |          [ Toddler Key Masher ]              |
                  +----------------------+-----------------------+
                                         | Inputs (Keydown, Mouse)
                                         v
                  +----------------------------------------------+
                  |         Operating System (Host Key Hook)     |
                  +----------------------+-----------------------+
                                         | Safe Intercept / Trap
                                         v
                  +----------------------------------------------+
                  |       Chromium Embedded / Webview Sandbox    |
                  | +------------------------------------------+ |
                  | |             TSD React Client             | |
                  | |   * Event PreventDefaults (Keyboard)     | |
                  | |   * Event StopPropagations (Keyboard)    | |
                  | |   * Canvas Overlay (Lock Mode)           | |
                  | +------------------+-----------------------+ |
                  +--------------------|-------------------------+
                                       | Valid Parent Solves Check
                                       v
                  +----------------------------------------------+
                  |               Authorized Parent              |
                  +----------------------------------------------+
```

TSD works on two logical tiers:
1.  **Client-Side Sandboxed React Layer:** Employs standard hook constraints (`preventDefault`, `stopPropagation`) to lock mouse, scrolling, context menus, and keys in multi-screen grids.
2.  **Native C# Host Wrapper hook (Production Installer):** Binds low-level windows message intercepts (`WH_KEYBOARD_LL`) to filter critical OS shortcuts (such as `Win`, `Alt+Tab`, `Alt+F4`, `Ctrl+Alt+Del`) which regular web views cannot capture alone.

---

## 3. Threat Analysis using STRIDE

### S - Spoofing (Identity/Access)
*   **Threat:** A smart toddler or older sibling bypasses the unlock verification block by replicating a parent's unlock steps or input combinations.
*   **Risk Level:** Moderate.
*   **Mitigation:** 
    *   Dynamic random equation values are refreshed on every single click or input.
    *   Lockout timer constraints demand persistent execution patterns (3-second continuous holding of the unlock bar).
    *   Operators are selected randomly during equation generation, preventing muscle-memory or physical repetition.

### T - Tampering (Code/Settings Modification)
*   **Threat:** Unsigned configuration scripts, external sound edits, or user overrides are injected locally to disable the safeguard routines or mute the safety speaker alarms.
*   **Risk Level:** Low.
*   **Mitigation:**
    *   Local settings use highly constrained React state boundaries.
    *   Volume parameters are forcibly clamped at both runtime initialization and during manual configuration state changes to prevent auditory damage (max gain limits).

### R - Repudiation (Attribution/Log Evasion)
*   **Threat:** Actions taken on secondary monitors cannot be traced, or a toddler escapes secondary screens due to lack of diagnostic trails.
*   **Risk Level:** Very Low.
*   **Mitigation:**
    *   Integrated multi-monitor strategies strictly force automated and complete auxiliary blackouts by cloning a non-interactive backdrop across secondary adapters.

### I - Information Disclosure (Workspace Leakage)
*   **Threat:** An underlying operating system window, private spreadsheet, or web document briefly flickering or bleeding visual contents behind the sandboxed canvas.
*   **Risk Level:** High (due to physical mashing triggers).
*   **Mitigation:**
    *   Complete CSS fullscreen coverage using viewport variables (`w-screen h-screen select-none`).
    *   Disabling default system context menus (`onContextMenu` overrides).
    *   Total blockage of text selection states, drag-and-drop frames, and cursor bleedthroughs.

### D - Denial of Service (System Crash / Keyboard Freeze)
*   **Threat:** Malformed continuous inputs (mashing dozens of keys simultaneously) causing Web Audio allocation overflow or synthetic utterance memory exhaustion.
*   **Risk Level:** Moderate.
*   **Mitigation:**
    *   Strict rate limiting on Web Speech synthesizers.
    *   Synthesizer nodes are dynamically and safely cleared after playing (`audioContext.close` on termination).
    *   Coordinated garbage collection of firework canvas particles and speech callbacks.

### E - Elevation of Privilege (Desktop Escape)
*   **Threat:** Leveraged keyboard combinations (such as dynamic focus traps or multi-button browser shortcuts like `F11` or Esc long presses) allow the toddler to close or window-maximize the sandbox layout, gaining complete desktop write permissions.
*   **Risk Level:** Critical.
*   **Mitigation:**
    *   React active environment calls `e.preventDefault()` and `e.stopPropagation()` in unison on all custom keyboard event pipelines.
    *   Full-page canvas captures all mouse wheel, finger pinch-zooms, double clicks, and standard arrow keys.
    *   Native MSI and Inno Setup configuration files compile with administrative desktop execution tags to block normal background thread overrides.

---

## 4. Operational Assets and Controls

| Asset | Critical Threat | Defensive Security Control | Verification Test Case |
| :--- | :--- | :--- | :--- |
| **User Keyboard Handler** | Edge combinations exit trap | `e.stopPropagation()` & `e.preventDefault()` overrides inside key hook | `App.tsx` event checking validated by DAST script |
| **Toddler Audio Safeguards** | High decibel sound synthesis | Master volume absolute clamping function `setAudioVolumeLimit` | `audio.test.ts` unit tests |
| **Verification Logic** | Predictable equation codes | Procedural equation builder utilizing independent variables | `security.test.ts` unit tests |
| **Sandbox Integrity** | Malicious modules injection | Strict licensing tracking and CVE package vulnerability checks | Custom SCA analysis |

---

## 5. Summary of Compliance

Through the implementation of the three-tier automated verification pipeline (**SAST, SCA, and DAST**), the following are continuously validated:
*   **Static Safety (SAST):** Zero instances of dynamic compilation, script injection sinks, or hardcoded tokens within variables.
*   **Supply Chain Safety (SCA):** Strict compliance with the **TSD-RCL License** prevents dependency contamination.
*   **Active Defense (DAST):** Complete operational trapping of all relevant keystroke propagation bubbles, preventing leakage to background applications.
