# Threat Model for Baby Button Masher (BBM)

*   **Developed/Authored by Logo/Maintainer:** tsohlacol
*   **Source Repository:** [github.com/tsohlacol/toddler-screen-defender](https://github.com/tsohlacol/toddler-screen-defender)
*   **License Model:** BBM-RCL (Reciprocal Licence)

---

## 1. Executive Summary

Baby Button Masher (BBM) is a security-focused sandbox software package designed to lock down active keyboard inputs, block system shortcut mashings, and protect host workspaces from unauthorized alterations or destructive clicks when an infant or young child is actively interacting with the screen. 

As a web-and-native lightweight solution, BBM's primary security guarantee is **robust input isolation**. Since this application runs both in an sandboxed iframe (development/previews) and inside a compiled desktop wrapper, this threat model maps the critical boundaries, attack surfaces, and defensive measures implemented within the BBM codebase.

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
                  | |             BBM React Client             | |
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

BBM works on two logical tiers:
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

Through the implementation of the five-tier automated verification pipeline (**SAST, SCA, DAST, Secrets Scanner, and Malware Scanner**), the following are continuously validated:
*   **Static Safety (SAST):** Zero instances of dynamic compilation, script injection sinks, or raw HTML insertions.
*   **Supply Chain Safety (SCA):** Zero unlicensed package dependencies and direct compliance with the reciprocal **BBM-RCL License**.
*   **Active Defense (DAST):** Complete trapping of keyboard event bubbling routes inside the dynamic render frames.
*   **Secrets Exposure (Secrets Scanner):** Absence of hardcoded Google/Gemini API keys, AWS credentials, Slack webhooks, and private cert payloads inside repository sources.
*   **Infection Controls (Malware Scanner):** Total prevention of integrated miner engines, cryptojacking lines, backdoor dynamic execution links, and malicious reverse shell codebases.

---

## 6. Rationale for Custom Lightweight Security Scanners (SAST, SCA, DAST, Secrets, Malware)

Rather than relying purely on heavy, general-purpose enterprise vulnerability scanners, BBM maintains **custom-tailored, lightweight security scanning engines** executed as Node.js scripts (`/scripts/*`).

### Why Custom Scanners Were Created

General-purpose scanners (like SonarQube, Snyk, or OWASP ZAP) are standard for standard cloud enterprises, but they have major blind spots. We tailored these utility scanner scripts to BBM's specific, unique structural requirements:

1.  **Tailored Sandbox Safety Rule Sets (SAST)**
    *   Standard static engines look for generic server variables or database injection routes, which do not apply to BBM's client-only UI.
    *   Our custom SAST engine actively filters and targets front-end critical risk factors: verifying that **raw HTML injectors** like `dangerouslySetInnerHTML`, sandbox bypasses like raw `eval()`, and dynamic string constructors like `new Function()` are completely barred from entering the codebase.
2.  **Reciprocal Copyleft License Compliance (SCA)**
    *   Standard dependency scanners only report vulnerability CVE databases. They do not know or care about legal licensing alignment!
    *   Since BBM operates under the reciprocal **BBM-RCL License** model, any copyleft GPL, AGPL, or unauthorized proprietary package could contaminate the upstream core code or disrupt owner distribution rights. Our custom SCA automatically checks dependency declarations directly against strict copyleft licensing blacklists.
3.  **Active Input Lock Verification (DAST)**
    *   Standard dynamic scanners (e.g. web application scanners fuzzing port endpoints) are designed for client-server protocol audits. They are entirely blind to front-end browser keyboard-lock mechanics!
    *   BBM's primary failure mode is a toddler escaping the lock interface via unhandled key bubbles. Our custom DAST dynamically audits browser-locking routines: enforcing that all custom keyboard-blocking listeners call `preventDefault()` and `stopPropagation()` concurrently, and checks runtime permissions constraints (`metadata.json`) to keep the iframe environment securely sealed.
4.  **Local Dev Leak Protection (Secrets Scanner)**
    *   Scans configuration settings, `.env` blocks, and scripts specifically targeting credentials layout, blocking inadvertent git commits of live keys.
5.  **Child Play Safe-Guards (Malware & Miner Engine Scanner)**
    *   React platforms have faced attacks involving hijacked open-source libraries that inject CPU-intensive crypto-miners (which would make the child interface lag or freeze) or backdoor payload scripts. We enforce an active local malware signature scan as a build gating criteria.
6.  **Zero-Dependency Portability & Speed**
    *   Enterprise tools require large Docker images, cloud account tokens, and lengthy startup sequences.
    *   Our scripts execute in milliseconds with zero dependencies, allowing developers to run `make security-audit` instantly and continuously in local development workspaces and minimal containerized builders.

---

### 6.1 Complementary Hybrid Strategy: Custom vs. Commodity Scanners

We acknowledge that **custom lightweight scripts are not replacements for robust, industry-standard commodity scanners** (like Semgrep, Snyk, SonarQube, or Trivy for dependencies and Microsoft Windows Defender / ClamAV for binary packages). While custom scripts excel at validating specific business logic and contextual front-end constraints (like key propagation or copyleft license violations), they lack the massive heuristic databases, semantic control-flow graph (CFG) parsers, and continuous global CVE tracking possessed by specialized, enterprise scanners.

Consequently, BBM adopts a **Hybrid Security Strategy** that integrates commodity capabilities alongside local custom checks:

1.  **Commodity Vulnerability Core (`npm audit`)**: 
    Our custom SCA script does not operate in a vacuum. It internally spawns the commodity **`npm audit`** security engine to automatically query the official global registry of vulnerabilities, giving us direct access to thousands of live, community-vouched security alerts.
2.  **Binary & OS Antivirus Integrity (Microsoft Defender)**:
    Since the final Windows wrapper is compiled into an executable installer, we recommend passing all production bundles through **Microsoft Defender Antivirus (WSL/Windows Host)** or scanning with **ClamAV** to check compiled installers for malicious code embeddings before final signing.
3.  **Pipeline Division of Labor**:
    *   **Custom Local Scanners** run instantly during local development (via `make security-audit`) to prevent basic logical errors (e.g., forgetting a key intercept propagation hook) from ever being committed.
    *   **CI/CD Commodity Scanners** operate on the repository origin (e.g., GitHub Actions, GitLab CI) using heavy, specialized engines:
        *   **Semgrep & GitGuardian**: To scan React structures for deep, multi-file code injection vectors, dependency-reachability bugs, secrets leak exposures, and cloud keys.
        *   **Snyk / Socket.dev**: To continuously monitor our deep dependency trees for newly discovered exploits, malicious supply-chain pull-requests, and security anomalies.
        *   **OWASP ZAP / Burp Suite DevSecOps**: In staging or production wrappers to check for dynamic runtime frame breakouts and sandbox escapes.

By using this hybrid tiering, BBM preserves extreme local speed and zero-dependency portability without compromising on the deep security coverage provided by professional commodity scanners.


