# Toddler Screen Defender - User Manual & Operating Guide

Welcome to **Toddler Screen Defender (TSD)**. This manual provides clear instructions on how to install, configure, operate, and exit the sensory toddler lockdown portal safely.

---

## 1. System Requirements & Installation

### Fresh Installation
1. Download the latest installer package `TSD_Setup_v1.0.exe` from the Github Releases drawer.
2. Run the executable on your computer.
3. Read and accept the **End-User License Agreement (EULA)**, which outlines how lowest-level window and pointer intercepts function.
4. Select your installation path (defaults to `%PROGRAMFILES%\ToddlerScreenDefender`) and specify whether you want a Desktop Shortcut icon generated.
5. Click **Install**.
6. (Optional) Run of boot: Check the box "Launch Toddler Screen Defender automatically on computer boot" to make it lock the laptop standard displays as soon as your Windows user profile initializes.

---

## 2. Dynamic Configurations & Game Room Selection

Once launched, Toddler Screen Defender locks the computer screen into an interactive gaming shield. While in sandbox play, the default windows keyboard bindings (Windows Keys, Alt+Tab, etc.) are swallowed safely.

Hovering over or sliding out the **Parent Control Panel** (by answering a random math calculation challenge) exposes configuration groups. Refer to the table below to customize the sensory experience:

| Feature Setting | Configurable Range / Modes | Operational Purpose |
| :--- | :--- | :--- |
| **Playroom Mode** | `Speak-The-Key`, `Animal Zoo`, `Cosmic Fireworks`, `Keyboard Piano`, `Sensory Drawing` | Selects which responsive sensory visual & auditory sandbox of keys your child interacts with. |
| **Theme selection** | `Cosmic Starry`, `Soft Pastel`, `Forest Green`, `Rainbow Magic` | Alters background canvas pigments, particles, or text gradients. |
| **Master Volume Cap** | `10%` to `100%` (*Default: 30%*) | restrains dynamic synthesizer gains & speech output volumes. Keeps toddler ear levels comfortable. |
| **Multi-Monitor Guard**| `Deep Blackout`, `Canvas Mirroring`, `Active Independent Canvases` | Safe-mode for connected external screens (*Default: Blackout to limit mouse leaks*). |
| **Sound / Voice Options** | Voice Type Dropdown Selector | Chooses premium/natural text-to-speech engine vocals, and configures key speech alerts. |
| **Custom Words Editor** | Standard Letters A-Z dropdown + list | Lets parents build a custom key-value vocabulary map for spelling learning. |

### Dynamic Daughter Word Vocabulary Editor

The **Special Daughter Words** panel has been redesigned into a fully dynamic and scrollable vocabulary manager:
1. **Adding Custom Letters**: Choose any upper-case standard alphabet letter (`A` to `Z`) from the dynamic letter dropdown, type in the custom phrase/word you want spoken (e.g. `Alice 💖` or `Mommy Bear 🐻`), and click **Add** to associate it immediately.
2. **Inline Adjustments**: Parents can directly click inside any input field in the list of active configured words to modify spelling expressions on-the-fly.
3. **Phonetic Testing**: Clicking the **Speaker** icon next to any configured word will trigger an immediate dry-run text-to-speech preview, letting you check voice synthesis and pronunciation before locking the screen.
4. **Deleting Associations**: Clicking the **Trash Can** icon next to any active configuration instantly deletes the overridden word association, seamlessly reverting TSD to its default high-quality learning dictionary items.

---

## 3. How to Exit (The Parent Override Hatch)

Because children will repeatedly press standard letters (`E`, `X`, `I`, `T`) or escape keys, the parent exit mechanism requires cognitive or code-based verification. TSD supports multiple exit options:

### A. Parent Math Challenge (Default)
By default, the exit hatch uses cognitive validation:
1. Locate the **Lock Icon / Exit Hatch** positioned in the bottom-right corner of the active primary display.
2. Click or tap this button.
3. A security equation modal will appear containing a random addition, subtraction, or multiplication of two single-digit numbers (e.g., `7 * 4 = ?`, `9 - 3 = ?`).
4. Type the valid solution using the input pad and confirm.
5. If verified, the locks release immediately, taking you safely back to your desktop.

### B. Numeric PIN Passcode (Configurable & Off by Default)
For parents who prefer a fixed numeric passcode instead of solving math equations:
1. Open the **Parent Control Panel**.
2. Under the **Safety Configuration** section, locate the **Enable passcode PIN lock option** toggle. This option is **off by default** to keep the core setup simple.
3. Toggle the switch to **on**.
4. Once enabled, select **4-Digit PIN Passcode Verification** in the **Unlock Safeguard Strategy** dropdown list.
5. Define your custom 4-digit PIN in the input field below (defaults to `1234`).
6. When your child is in play mode, clicking the **Exit Hatch** will prompt you with a touch-friendly 3x4 layout PIN Pad. Enter your custom PIN (or type it on your physical keyboard) to unlock. Invalid entries trigger a spring-shake animation of the modal and reset.

---

## 4. Emergency Task Termination (The Ctrl+Alt+Del Escape Hatch)

If for any reason the application crashes, hangs, or fails to register input validation:
1. Press the standard hardware combination **`Ctrl + Alt + Delete`**.
2. Because the Secure Attention Sequence (SAS) is managed directly by the Windows Kernel (`winlogon.exe`), **it will bypass Toddler Screen Defender completely**.
3. Select **Task Manager** from the overlay screen.
4. Locate `ToddlerScreenDefender.exe` (or `node` during local developer modes) in the active Processes list.
5. Click **End Task** to force terminate the program. Your standard Desktop environment will instantly regain control.

---

## 5. Uninstallation, Upgrades & Repair Cycles

* **To Update / Upgrade**: Download the newer installer version and run it. The installer automatically stops the outdated active program assembly, overwrites older assemblies inside `%PROGRAMFILES%`, and refreshes setting profiles.
* **To Repair**: If dynamic files become corrupt or deleted, run the installer setup again and choose **Repair Installation** to restore vital system dependencies.
* **To Uninstall**: 
  1. Open the Windows **Start Menu** -> Search **Add or Remove Programs**.
  2. Locate **Toddler Screen Defender** inside the programs library.
  3. Click **Uninstall** and follow the simple automated wizard. 
  4. The uninstaller terminates active instances, unregisters native keys hook bindings, deletes shortcut references, and cleans storage keys gracefully.

---

## 6. Code Quality, Parallel Unit Testing, and Security Audits

To guarantee the child lockdown portal is resilient against input crashes, memory leaks, and typical security escalation paths, TSD maintains a comprehensive unit testing framework and automated five-tier security pipeline.

### Parallelized Unit Testing (Vitest)
Unit and integration tests are powered by **Vitest** for blistering speed. Vitest runs all test files concurrently in distinct worker processes in parallel by default:
* **Dictionary Mapping Tests (`words.test.ts`)**: Confirms standard keys normalize correctly and map to correct child sensory assets without throwing exceptions.
* **Audio Boundaries & Clamping Tests (`audio.test.ts`)**: Validates that absolute master volume caps remain strictly locked. Ensures any out-of-range programmatic gain triggers a clamping routine to preserve comfortable toddler ear levels.
* **Security lock verification (`security.test.ts`)**: Validates the mathematical equations solver engine, safety bypass blocks, and layout coordinate checks.

To trigger parallel unit tests manually, execute:
```bash
make test
```
*(Or call `npm run test` directly)*.

---

### Five-Tier Automated Security Assessment

We execute five complementary classes of security audits and scans to ensure code integrity:

#### 1. SAST (Static Application Security Testing)
* **What it is**: Scans the source code files statically to spot anti-patterns, potential injection points, or dynamic evaluators.
* **How to run**: `make sast`

#### 2. SCA (Software Composition Analysis)
* **What it is**: Audits third-party node packages for public security vulnerabilities (matching against CVE registries via `npm audit` integration) and tracks open-source license compliance against copyleft restrictions (preventing infectious GPL/AGPL inclusions).
* **How to run**: `make sca`

#### 3. DAST (Dynamic Application Security Testing)
* **What it is**: Evaluates active dynamic parameters, event wrappers, index view security limits, and package permission controls.
* **How to run**: `make dast`

#### 4. Hardcoded Secrets Scanning
* **What it is**: Continuously inspects workspace configuration settings, `.env` scripts, packages, and code lines matching against high-entropy variables or regular expression databases (e.g. Google/Gemini API key formats, AWS client credential patterns, private authentication keys, as well as Slack webhook URLs) to eliminate git leak risks.
* **How to run**: `make secrets`

#### 5. Malware & Cryptomining Signature Scanning
* **What it is**: Actively scans workspace scripts, servers, and modules for indications of compromise (IOCs), trojan shells, reverse bash/netcat socket spawning, cryptocurrency miner injections (Coinhive, etc.), high-risk external executable downloads, and dynamic payloads execution.
* **How to run**: `make malware`

#### Complete Security Pipeline Audit
To audit all five security scanners concurrently, run:
```bash
make security-audit
```
Integrate `make test` or `make security-audit` directly into your GitHub Actions CI/CD workflows (`.github/workflows/ci.yml`) to guarantee no insecure code enters the main branch. For advanced dynamic audits of active sandbox mirrors, we recommend hooking **OWASP ZAP** or **SonarQube DevSecOps** containers directly to target ports in release branch deployment flows.
