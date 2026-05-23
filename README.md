# Toddler Screen Defender (TSD)

[![License: TSD-RCL](https://img.shields.io/badge/License-TSD--RCL-purple.svg)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Docker%20%26%20WSL-blue.svg)](#building-your-own-copy-from-source)

**Toddler Screen Defender (TSD)** is an open-source, full-screen interactive gaming container that allows toddlers to play on your keyboard and interact with your computer while preventing any damage (eg. opening system-sensitive folders, deleting document profiles, or writing messy emails). 

TSD is designed for Windows 11 computers.  It comes with no warranty express or implied. Use at your own risk.

---

## Key Features

* **Advanced low-level Win32 Keyboard Intercept hooks (`WH_KEYBOARD_LL`)**: Blocks critical Windows combinations such as `Alt+Tab`, `Alt+F4`, `Ctrl+Esc`, and standard Windows system buttons.
* **Intelligent Parent Validation (Math Exit Challenge)**: Exiting requires solving a single-digit random math challenge (addition, subtraction, or multiplication) safely out of reach of your child.
* **Five Sensory Sandbox Modes**:
  1. `🗣️ Speak-The-Key`: Multi-language talking keyboard utilizing premium natural voice synthesizers.
  2. `🦁 Animal Zoo`: Letters trigger rich sound effects and animal emoji callouts.
  3. `🎆 Cosmic Fireworks`: Every key press spawns glowing spatial particle cascades & audio chords.
  4. `🎹 Pentatonic Piano`: A beautiful chromatic piano converting alpha keys to harmonic pitch sweeps.
  5. `🎨 Sensory Drawing (New)`: Glide the mouse to paint glowing neon rainbows and strike keys to stamp cute scaling emojis!
* **Master Volume Defense Guard**: Configurable decibel limits (10% to 100%) to safeguard toddler hearing from accidental speaker amplification.
* **Dual-Monitor Blackout Shields**: Prevents mouse pointer drift by blacking out connected external monitors.
* **Emergency Fail-Safe**: Keeps `Ctrl + Alt + Delete` and system **Task Manager** accessible as an emergency safety valve at all times.

---

## Obtaining a Copy (Pre-built Installers)

To download and run standard installations of Toddler Screen Defender without compiling the code yourself, follow these steps:

1. Navigate to the projects upstream website at **[github.com/tsohlacol/toddler-screen-defender](https://github.com/tsohlacol/toddler-screen-defender)**.
2. Under the **Releases** tab on the right sidebar, select the latest version tag (e.g., `v1.0.4`).
3. Download the standalone `TSD_Setup.exe` installer file.
4. Run the installer, accept the **End User License Agreement (EULA)**, and follow the simple setup screens.

---

## Building Your Own Copy From Source

You can build Toddler Screen Defender on **Windows Subsystem for Linux (WSL)** with **Docker installed** to compile both the React web canvas, the C# WPF wrapper binaries, and the Windows installer. No dependency configuration on your local host is needed!

### Prerequisites:
* WSL (WSL2 recommended) with any standard distribution (Ubuntu, Debian, etc.).
* Docker Desktop installed with WSL integration enabled.

### Verification of Local Workspace:
We supply a project-wide **Makefile** to compile and test code:

```bash
# 1. Clone the repository
git clone https://github.com/tsohlacol/toddler-screen-defender.git
cd toddler-screen-defender

# 2. View makefile building instructions
make help

# 3. Code validation (Lint, Type checking & fast build test)
make test
```

### Full Compiler & Installer Assembler Build:
Deploy the dockerized multi-stage installer pipeline, bringing raw code down into a package:

```bash
# Run the pipeline within Docker via the Makefile wrapper helper
make build-installer
```

This single command triggers the full compile queue inside Docker, using:
- **Node.js** to compile static optimized typescript packages.
- **.NET 8 SDK CLI** to cross-compile the self-contained WPF binary.
- **Wine with Inno Setup** to assemble the finished installer, dumping the completed setup files into:
`./build-output/TSD_Setup_v1.0.exe`

---

## How to Uninstall, Update or Configure

* **Setting Controls**: Slide or hover over the parent panel (bottom-right of your main screen), solve the math challenge, and configure volume restrictions or monitor preferences inside the pop-up pane.
* **Updating**: Simply install the newer version. The script will automatically halt your current running instance, update programmatic files, and restart without data loss.
* **Uninstall**: Search **Add or Remove Programs** inside Windows settings. Choose Toddler Screen Defender, click Uninstall, and our setup tool cleans system folders and shortcuts gracefully.

---

## Contribution & Licensing

Toddler Screen Defender is open source, licensed under our **Toddler Screen Defender Reciprocal Contribution License (TSD-RCL)** and subject to our **EULA**. 

**Important Licensing Terms:**
* You are free to modify and adapt this product for personal and config use.
* **If you make functional or code-level Modifications to the wrapper or playrooms and distribute/publish them, you MUST submit those modifications back as a Pull Request to our GitHub upstream home: `https://github.com/tsohlacol/toddler-screen-defender`.** 
* Standard editing of config settings files does not trigger this obligation. See [LICENSE](./LICENSE) as well as the detailed [EULA](./EULA.txt) for more details.
