# Baby Button Masher - Settled Design Configurations

This document outlines the final design configurations implemented in Baby Button Masher (BBM) driven by parental security, sensory playfulness, and robust desktop safety.

---

## 1. Verified Parent Exit Hatch (Math & Configurable PIN Options)
* **Implemented Solution**: Dynamic Single-Digit Math Equations (Default) & Configurable 4-Digit Numeric PIN (Off by default).
* **Details**: To prevent accidental exit from toddler key mashing, the lock screen uses robust verification.
  - *Math Sum Challenge (Default)*: Renders a randomly generated equation containing addition (`+`), subtraction (`-`), or multiplication (`*`) of two single-digit numbers (`1` to `9`). Subtractions are sorted dynamically to prevent negative outputs (safely keeping `A >= B`).
  - *PIN Passcode (Optional)*: Parents can toggle a "PIN Passcode" option switch ON from the settings dashboard. This unlocks a customizable 4-digit PIN verification system (defaults to `1234`). When active, clicking the Exit Hatch triggers a touch-friendly numeric pad modal with clean shake animations for invalid attempts. This is off by default to keep the default interaction simple and cognitive.

---

## 2. Multi-Monitor (Extended Display) Engineering
* **Default Configuration**: **Deep Blackout (Protect Secondary Screens)**.
* **Details**: By default, connected secondary displays are completely locked into black screen overlays. This prevents accidental mouse drift leading to baby click leaks. This is fully configurable in Column 3 of the dashboard with three options:
  1. *Deep Blackout*: Side monitors are blacked out.
  2. *Canvas Mirroring*: Clones active sandbox visuals across all screens.
  3. *Multi-Canvas*: Spawns separate, active independent drawing/piano sandboxes.

---

## 3. Mouse Cursor & Game Drawing Interaction
* **Implemented Solution**: Default cursor for general play, with an exclusive **Sensory Mouse Drawing** playroom mode.
* **Details**: The mouse cursor is suppressed from opening context menus globally by intercepting and disabling right-clicks (`contextmenu` events). Under the new drawing mode, moving the cursor or dragging on a touch screen paints glowing neon lines that decay gracefully over time (trail fading). Keyboard strikes stamp colourful emojis & play sweet pentatonic chimes at the pointer positions.

---

## 4. Master Volume Protection Cap
* **Implemented Solution**: Hard Volume Cap Slider.
* **Details**: To safeguard toddler hearing and prevent speaker damage, a Master Volume Guard Cap has been engineered. Defaulting to `30%`,parents can slide this limit from `10%` to `100%`. This setting instantly scales all synthesizer oscillators and speech synthesis utterances, restricting sudden media-button mashing.

---

## 5. Deployment, Portability & WSL Builds
* **Implemented Solution**: Docker-centric Installer Compilation with WSL support.
* **Details**: Booting on startup (Launch Option A) is supported natively. The complete compilation cycle operates within a Docker environment, outputting a fully packageable Windows installer setup supporting seamless install, update, repair, and uninstall routines with zero local host dependencies.

---

## 6. Clear Premium Voice Synthesis
* **Implemented Solution**: Natural Neural Speech Sorting.
* **Details**: The app queries standard speech synthesis voices and automatically bubbles high-clarity Google/Microsoft natural-sounding neural voices to the very top, offering a warm and pleasant learning environment for children.

