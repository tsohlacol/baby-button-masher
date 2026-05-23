# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Toddler Screen Defender (TSD)** is a full-screen interactive gaming sandbox that locks toddlers out of system-sensitive operations while providing sensory feedback for key presses. It combines a **React/Vite frontend** running inside a **Windows WPF host application** with a **low-level Win32 keyboard hook** that blocks system shortcuts like Alt+Tab, Win+Key, Alt+F4, and Ctrl+Esc.

The application is distributed as a Windows installer (`TSD_Setup_v*.exe`) compiled using Docker, with no local environment dependencies required.

**License:** TSD-RCL (Reciprocal Contribution License) - modifications must be contributed back upstream.

---

## Architecture Overview

### Two-Tier Design

1. **Frontend Layer (React/Vite/WebView2)**
   - Offline single-page application (SPA) served from `file://` protocol
   - Six interactive playroom modes: Speak-The-Key, Animal Parade, Cosmic Fireworks, Keyboard Piano, Space Rocket, Mouse Drawing
   - Parent settings panel with math/PIN unlock challenges
   - Master volume cap, multi-monitor strategies, custom word vocabularies

2. **Native Host Layer (C# WPF / .NET 8)**
   - Windows-only desktop application wrapping the React frontend in `Microsoft.Web.WebView2`
   - Global low-level keyboard hook (`WH_KEYBOARD_LL`) via Win32 API that runs at kernel priority
   - Full-screen borderless window positioned across all monitors
   - Focus enforcement to prevent background windows from gaining control

### Data Flow

```
User Keyboard Input
  |
Windows Kernel (WH_KEYBOARD_LL hook in MainWindow.xaml.cs)
  ├─ Blocks: Win key, Alt+Tab, Alt+Esc, Alt+F4, Ctrl+Esc, Ctrl+Shift+Esc, F11
  └─ Passes through: All other keys
  |
WebView2 Control (embedded browser)
  |
React App (App.tsx)
  ├─ Handles keystroke events
  ├─ Plays audio/visuals based on active mode
  └─ Renders parent settings overlay
  |
Audio & Canvas (Web Audio API, Canvas 2D)
```

### Monitor Integration

The C# host detects all connected displays (`Screen.AllScreens` / Win32 `EnumDisplayMonitors`) and passes their geometry to React via `window.TSD_MONITORS`. React can then:
- Blackout secondary monitors
- Mirror the active canvas to all screens
- Spawn independent canvases per monitor (future feature)

---

## Technology Stack

### Frontend
- **React 19**: UI framework
- **TypeScript 5.8**: Type safety
- **Vite 6.2**: Build tool & dev server
- **Tailwind CSS 4.1**: Styling (via @tailwindcss/vite plugin)
- **Motion 12.23**: Framer-inspired animations (`motion/react`)
- **Lucide React**: Icon library
- **Web Audio API**: Synthesis (sine wave oscillators, envelope ADSR)
- **Web Speech API**: Text-to-speech synthesis
- **Canvas 2D**: Particle rendering for fireworks/drawing

### Backend / Host
- **.NET 8 SDK**: C# framework
- **WPF**: Windows Presentation Foundation (UI framework)
- **WebView2 1.0.2207**: Chromium-based browser control for hosting React app
- **Win32 API**: Low-level keyboard hooking

### Build & Deployment
- **Docker**: Multi-stage containerized compilation (no local .NET/Node required)
- **Node 18** (in Docker): Frontend build
- **.NET 8 SDK** (in Docker): C# compilation
- **Inno Setup 6.2** (via Wine in Docker): Windows installer generation
- **Makefile**: Task orchestration

---

## Development Workflow

### Setup
```bash
# Install Node dependencies (runs npm install + npm run build)
make setup
```

### Development
```bash
# Dev server with hot reload on http://localhost:3000
npm run dev

# In another terminal, sync dist to host and run WPF app locally (requires .NET 8 SDK)
make run
```

### Building & Testing
```bash
# Type-check TypeScript without emitting
npm run lint

# Run all unit tests (parallelized)
npm run test

# Security audit (SAST + SCA + DAST + Secrets + Malware scans)
npm run security-audit

# Full integration: lint + security audit + tests
make test
```

### Creating the Windows Installer
```bash
# Builds everything in Docker and outputs TSD_Setup_v*.exe to ./build-output/
make build-installer

# Or run the full pipeline (setup, test, build-installer, zip)
make all
```

### Cleaning
```bash
make clean  # Removes dist/, build-output/, host/assets/react-app/
```

---

## Key Concepts & Code Patterns

### 1. Keystroke Event Handling (App.tsx)

React captures `keydown` and `keyup` events. Unlike the native host hook, the React layer handles:
- Audio playback (speech, piano notes, firework chords)
- Visual effects (particle spawning, emoji bouncing)
- Keystroke rate limiting (tracks mashing speed to auto-switch modes)
- Parent unlock button activation

The Win32 hook in `MainWindow.xaml.cs` intercepts *before* React sees them, so system shortcuts never reach the React app.

### 2. Audio System (utils/audio.ts)

- **Pentatonic Piano Mapping:** Keyboard keys (`A-L`, `Q-U`, `I-O`) map to musical notes (C4–C6).
- **Synthesizer:** Uses Web Audio API `OscillatorNode` + `GainNode` with envelope (attack, sustain, release).
- **Volume Limiting:** Master gain is clamped to `parentSettings.volumeLimit` (0.1–1.0) across all oscillators and speech utterances.
- **Text-to-Speech:** Queries available `SpeechSynthesisVoice` objects, bubbles neural voices to the top.

### 3. Parent Settings Persistence (App.tsx)

Settings are stored in React state (not localStorage) and passed as props down to components. Each setting is validated/clamped:
- `volumeLimit`: Clamped to [0.1, 1.0]
- `unlockRequirement`: Either "math" (default) or "passcode"
- `theme`: One of `cosmic`, `pastel`, `forest`, `rainbow`
- `multiMonitorStrategy`: One of `blackout`, `mirror`, `independent`

On exit unlock, users must solve a random single-digit math equation or enter a 4-digit PIN.

### 4. Multi-Monitor Handling

C# host passes `window.TSD_MONITORS` (array of `{ left, top, width, height, isPrimary }`).

React's multi-monitor strategy:
- **Blackout (default):** Secondary monitors are rendered with a black full-screen overlay.
- **Mirror:** All monitors display the same active playroom mode.
- **Independent (future):** Each monitor runs its own independent sandbox.

### 5. Security Layering

1. **Native Hook Layer** (MainWindow.xaml.cs): Blocks Win key, Alt+Tab, Alt+F4, Ctrl+Esc, F11.
2. **React Layer** (App.tsx):
   - Disables context menus (`onContextMenu: preventDefault`)
   - Prevents text selection (`select-none` class)
   - Blocks drag-and-drop
3. **CSS Layer** (Tailwind): Full-screen viewport coverage, no borders or gaps.
4. **Ctrl+Alt+Del Escape:** Kernel-level SAS sequence always reaches Task Manager, allowing force-termination if TSD hangs.

---

## Common Development Tasks

### Adding a New Playroom Mode

1. Create a new component in `src/components/NewModeView.tsx` accepting `{ onKeystroke, settings, ...}` props.
2. Add the mode to `ScreensaverMode` enum in `src/types.ts`.
3. Import and render the component in `App.tsx` based on `currentPlayMode`.
4. Add a radio button in the settings panel to select the mode.

### Adjusting Audio (Pitch, Timing, Volume)

- **Piano notes:** Edit frequency map in `src/utils/audio.ts` under `PIANO_NOTES`.
- **Oscillator envelope:** Modify `attack`, `sustain`, `release` timing in audio synthesis functions.
- **Volume limits:** Adjust the `volumeLimit` slider range and default (currently 0.3).

### Customizing Themes

Edit `THEME_PRESETS` object in `App.tsx`. Each theme has:
- `bg`: Background + text color
- `cardBg`: Card/panel styling
- `accent`: Button/highlight color
- `textMuted`: Muted text styling
- `glass`: Glassmorphism overlay effect

### Modifying the Win32 Hook

In `host/MainWindow.xaml.cs`, the `HookCallback` method filters keycodes:
- Add new blocked keys by checking their `vkCode` against constants.
- Blocked keys return `(IntPtr)1` to swallow the keystroke.
- Passed keys call `CallNextHookEx` to allow normal processing.

---

## Testing & Validation

### Running Tests

```bash
npm run test    # All tests
npm run test -- --run audio.test.ts  # Single test file
```

Tests use **Vitest** (Jest-compatible runner). Test files live in `src/__tests__/`.

### Security Scans

```bash
npm run sast      # Static code analysis (checks for common vulnerabilities)
npm run sca       # Software composition analysis (license & dependency risks)
npm run dast      # Dynamic analysis (iframe sandbox, clickjacking, overrides)
npm run secrets   # Hardcoded API key scanning
npm run malware   # Binary signature checks for known backdoors
```

### Manual Testing

1. **Dev Mode:** Run `npm run dev` to test React without the native host.
   - Keyboard shortcuts (Win, Alt+Tab, etc.) are *not* blocked in dev mode.
   - Audio and visuals work normally.

2. **Local Build:** Run `make run` to build and launch the WPF app.
   - Requires .NET 8 SDK on your local machine.
   - React frontend is bundled from `dist/` into `host/assets/react-app/`.
   - Native hook *is* active.

3. **Installer Testing:** Build with `make build-installer` and run `./build-output/TSD_Setup_v*.exe` on a Windows machine.
   - Tests full installation flow, registry entries, desktop shortcuts.
   - Tests uninstallation and cleanup.

---

## Docker Build Pipeline

The **Dockerfile.build** orchestrates a 3-stage build:

1. **Stage 1 (frontend-builder):** Node 18 Alpine → builds React via Vite → outputs `dist/`
2. **Stage 2 (native-builder):** .NET 8 SDK → copies `dist/` as host assets → publishes self-contained Windows exe
3. **Stage 3 (installer-builder):** Ubuntu + Wine → runs Inno Setup compiler on the exe → outputs `TSD_Setup_v*.exe`
4. **Stage 4 (final):** Alpine → extracts the exe and makes it available for docker run copy

**Key build flags:**
- `dotnet publish -r win-x64 --self-contained true /p:PublishSingleFile=true`: Creates a single exe with all dependencies baked in.
- Wine + Inno Setup: Compiles the setup executable with EULA, registry entries, uninstaller.

---

## Important Design Decisions

1. **Offline-First Architecture:** React app is bundled and served via `file://` protocol to eliminate network dependencies during sandbox mode.

2. **No iFrame Isolation in Production:** The React SPA runs directly in WebView2, not inside an iframe. This allows full window control and monitor detection.

3. **Math Over PIN (Default):** Exit challenge defaults to solving a random math equation rather than a fixed PIN, to prevent muscle-memory bypass.

4. **Volume Clamping at Runtime:** The `volumeLimit` setting is enforced in both oscillator gain and speech synthesis utterance settings, ensuring children cannot unmute via browser dev tools.

5. **Ctrl+Alt+Del Always Works:** This sequence is handled by the Windows kernel (`winlogon.exe`) at a privilege level where user-mode hooks cannot intercept. It acts as a fail-safe.

6. **Focus Enforcement:** If any background window gains focus, the app re-activates itself and forces topmost z-order, keeping the child locked in the sandbox.

---

## Licensing & Contributing

**TSD is licensed under the TSD-RCL (Reciprocal Contribution License).**

**Key obligations:**
- You are free to modify TSD for personal use.
- **If you distribute modifications**, you *must* submit them as a Pull Request to the upstream repository: `https://github.com/tsohlacol/toddler-screen-defender`
- Editing config files (e.g., changing volume settings) does *not* trigger this obligation.

See `LICENSE` and `EULA.txt` for full legal text.

---

## Useful References

- **Architecture deep-dive:** `docs/architecture.md` (keyboard hook mechanics, window positioning, screen locking)
- **Design rationale:** `docs/design-considerations.md` (exit strategies, audio limits, multi-monitor modes)
- **Build pipeline:** `docs/build-and-installer.md` (Docker 3-stage workflow, Inno Setup config)
- **Security analysis:** `docs/threat-model.md` (STRIDE threat analysis, mitigation strategies)
- **User manual:** `docs/user-manual.md` (end-user operating guide, playroom modes, configuration)