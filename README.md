# Baby Button Masher (BBM)

<p align="center">
  <img src="images/bbm.png" alt="Baby Button Masher" width="180" />
</p>

[![License: BBM-RCL](https://img.shields.io/badge/License-BBM--RCL-purple.svg)](./LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Docker%20%26%20WSL-blue.svg)](#building-your-own-copy-from-source)

**Baby Button Masher (BBM)** is an open-source, full-screen, interactive, Windows game for toddlers.  Toddlers like to mash buttons, and this game gives them feedback.  It also protects your computer from damage while your toddler is mashing at your keyboard.

---

## Obtaining a Copy (Pre-built Installers)

To download and run standard installations of Baby Button Masher without compiling the code yourself, follow these steps:

1. Navigate to the projects upstream website at **[github.com/tsohlacol/toddler-screen-defender](https://github.com/tsohlacol/toddler-screen-defender)**.
2. Under the **Releases** tab on the right sidebar, select the latest version tag (e.g., `v1.1.0`).
3. Download the standalone `BBM_Setup.exe` installer file.
4. Run the installer, accept the **End User License Agreement (EULA)**, and follow the simple setup screens.

---

## Starting the software
Just double-click the icon the installer leaves on your desktop.  Or you can find Baby Button Masher in your start menu.

## Exiting the software
- Press ALT+F4 to completely exit
- You can press the lock button at the bottom right to go back to the main screen
- If those both fail (if tehre's a bug) you'll need to 
  1. ALT+CTRL+DEL
  2. switch to an admin user
  3. ALT+CTRL+DEL
  4. open task manager
  5. Find "Baby Button Masher" in the list.  Kill it.


---
## Building Your Own Copy From Source

You can build Baby Button Masher on **Windows Subsystem for Linux (WSL)** with **Docker installed** to compile both the React web canvas, the C# WPF wrapper binaries, and the Windows installer. No dependency configuration on your local host is needed!

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
`./build-output/BBM_Setup_v1.0.exe`

---

## How to Uninstall, Update or Configure

* **Setting Controls**: Slide or hover over the parent panel (bottom-right of your main screen), solve the math challenge, and configure volume restrictions or monitor preferences inside the pop-up pane.
* **Updating**: Simply install the newer version. The script will automatically halt your current running instance, update programmatic files, and restart without data loss.
* **Uninstall**: Search **Add or Remove Programs** inside Windows settings. Choose Baby Button Masher, click Uninstall, and our setup tool cleans system folders and shortcuts gracefully.

---

## Contribution & Licensing

Baby Button Masher is open source, licensed under our **Baby Button Masher Reciprocal Contribution License (BBM-RCL)** and subject to our **EULA**. 

**Important Licensing Terms:**
* You are free to modify and adapt this product for personal and config use.
* **If you make functional or code-level Modifications to the wrapper or playrooms and distribute/publish them, you MUST submit those modifications back as a Pull Request to our GitHub upstream home: `https://github.com/tsohlacol/toddler-screen-defender`.** 
* Standard editing of config settings files does not trigger this obligation. See [LICENSE](./LICENSE) as well as the detailed [EULA](./EULA.txt) for more details.
