# Toddler Screen Defender - Audit Checklist & Pending Tasks (`docs/TODO.md`)

This document lists the completed items and remaining development tasks for **Toddler Screen Defender (TSD)**. It represents a strict technical gap analysis comparing the original system design specs with the current codebase implementation.

---

## I. Core Gameplay & Sensory Sandbox Engine

- [x] **"Speak-The-Key" Playroom Mode (`SPEAK_THE_KEY`)**
  - Fully implemented offline voice synthesizer lookup dynamically spoken on key inputs.
  - Integrates fallback dictionary objects for special keys (Space, Enter, Backspace, etc.).
- [x] **"Animal Parade" Playroom Mode (`ANIMAL_PARADE`)**
  - Stabs jumping, floaty, or running interactive animal emojis with custom velocities and gravity boundaries.
- [x] **"Cosmic Fireworks" Playroom Mode (`COSMIC_FIREWORKS`)**
  - Triggers beautiful interactive particle explosions using HTML5 Canvas rendering.
- [x] **"Keyboard Piano" Playroom Mode (`KEYBOARD_PIANO`)**
  - Binds keyboard row frequencies to pleasant pentatonic sound synthesizer nodes.
- [x] **"Space Rocket" Playroom Mode (`SPACE_ROCKET`)**
  - Responsive visual rocket booster and throttle gauge simulation triggered by rapid key taps.
- [x] **"Sensory Drawing" Playroom Mode (`MOUSE_DRAWING`)**
  - Renders fading visual drag trails for smooth touch-tablet drawing.
- [x] **Dynamic Roll Mashing Tracker**
  - Fully tracks keystrokes-per-minute (KPM) average, dynamically updating active playroom games according to toddler speed rhythm behavior.
- [x] **Hearing Safety Master Volume Guard**
  - Volume slider clamps synthesizer gain variables programmatically to preserve comfortable audio level limits (capped safely between 10% and 100%).
- [x] **Parent Settings Vocabulary Editor (`customWords`)**
  - Redesigned vocabulary editor interface into a dynamic, scrollable key-value dictionary list allowing custom mapping across all standard alphabet letters, with testing and deletion.
- [x] **Passcode Unlock Requirement Method (`unlockRequirement === "passcode"`)**
  - Fully implemented a secure parent passcode validation overlay containing a touch-friendly 4-digit PIN pad with clean spring-shake animations.
  - Off by default but fully configurable via a toggle switch in the parent settings dashboard.
  - When enabled, parents can configure a custom 4-digit numeric PIN passcode.
  - Handled automated evaluation triggers, physical key bypasses, and state sanitizations.

---

## II. Native Host Wrapper Layer (C# / WPF Framework)

- [x] **Borderless Window Customization Styles**
  - Initialized with borderless Chrome, removed titlebars, deactivated taskbars, and applied `HWND_TOPMOST` z-index styles.
- [x] **Active Topmost Focus Shielding**
  - Listens to window deactivated events (`Window_Deactivated` trigger) to instantly force safety focus back if background notifications arise.
- [x] **Standard Windows Hotkey Interception Hook (`LowLevelKeyboardProc`)**
  - Low-level `WH_KEYBOARD_LL` Win32 Windows hook swallowed major shortcut combinations (`WinKey`, `Alt+Tab`, `Alt+F4`, `Ctrl+Esc`, `Ctrl+Shift+Esc`, and `F11`).
- [x] **Low-Level Modifier States Reliability**
  - Refactored physical modifier state checks within the low-level WPF key hook procedure. Successfully replaced desynchronized WPF thread indicators with direct, zero-delay Win32 `GetKeyState` hardware queries to maintain security.
- [x] **Multi-Monitor Display Shielding**
  - Detects distinct display monitor device layouts on host launch via native Windows `EnumDisplayMonitors` APIs, injecting logical screen boundaries into Webview2 prior to load. Successfully refactored React to segment layout viewports using percentage-scaled absolute containers across "Deep Blackout", "Canvas Mirroring", and "Active Independent Canvases" strategies.

---

## III. Installer Compiling & Automated Pipelines

- [x] **Single-Command ESLint Audit Engine**
  - Static type declarations and framework code formatting validated using Vite TypeScript linters.
- [x] **Isolated WSL-Compatible Multi-Stage Docker Build Environment**
  - Builds optimized React code, compiles WPF release targets, and invokes Wine compilers to deliver self-contained setup programs with zero host dependencies.
- [x] **Standard Windows Application Installation Lifecycle Package (`installer.iss`)**
  - Implements smooth file deployment directives, creates system shortcuts, and mounts automated uninstall cleanup processes.
- [x] **"Launch automatically on system boot" Configuration Option**
  - Fully added customizable `[Tasks]` and standard Windows startup `[Registry]` entries so parents can enable immediate startup protection.
- [x] **Uninstall WebView2 User Data Cache Directory Purging**
  - Configured custom LocalAppData User Data Folders in C# host and updated `[UninstallDelete]` keys to cleanly wipe any residual Edge WebView2 sandbox data upon uninstallation.

---

## IV. Quality Control & Five-Tier Security Assurance

- [x] **Fast Concurrent Unit Testing Framework (Vitest)**
  - Confirms volume limit clamping bounds under `audio.test.ts`.
  - Audits randomized addition/subtraction parent solver rules under `security.test.ts`.
  - Validates key normalizing dictionaries under `words.test.ts`.
- [x] **SAST static engine checks**
- [x] **SCA software license compliance metrics**
- [x] **DAST dynamic sandbox environment assurance**
- [x] **Entropy database API secrets leaks scanning**
- [x] **Trojan, backdoor, shell, and miner malware scans**
