# Security Policy

## Supported Versions

Only the latest release of Baby Button Masher receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Scope

Baby Button Masher is a local Windows desktop application with no network services, no user accounts, and no data transmission. The relevant attack surface is limited to:

- **Sandbox escape**: ways a toddler is likely to bypass the keyboard hook or exit the full-screen lock without solving the parent challenge.  ALT+CTRL+DEL and ALT_F4 are specifically allowed as a safety feature so you don't get locked out.
- **Unintended remote interfaces**: If the software somehow introduces a remote interface with a vulnerability in it, this would allow an attacker to try and break into the system. This would be undesireable.

Out of scope: denial-of-service, network attacks, and issues that require the attacker to already have admin privileges on the machine (since admin access already bypasses the sandbox by design via Ctrl+Alt+Del), and protection against anyone who knows anything about computers, issues that would allow the local user to bypass the application (ALT+F4 is allowed by design).

NOTE: This is NOT a screen lock.  It's just a toy for toddlers to mash the keyboard and get feedback, without damaging the computer.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report privately by emailing the maintainer or using [GitHub's private vulnerability reporting](https://github.com/tsohlacol/baby-button-masher/security/advisories/new).

Include:
- A description of the vulnerability and its impact
- Steps to reproduce
- Any suggested fix if you have one

Given that this is a personal open-source project maintained on a best-effort basis, patch timelines will vary.

## Security Controls

### Runtime Sandbox Controls

- **Win32 low-level keyboard hook** (`WH_KEYBOARD_LL` in `host/MainWindow.xaml.cs`): intercepts keystrokes at kernel priority before they reach the OS. Blocks Win key, Alt+Tab, Alt+Esc, Ctrl+Esc, Ctrl+Shift+Esc, and F11.
- **Focus enforcement**: if any background window gains focus, the host re-activates itself and forces topmost z-order.
- **React-layer input hardening** (`src/App.tsx`): disables context menus (`preventDefault`), blocks drag-and-drop, suppresses text selection via CSS (`select-none`).
- **Randomized parent exit challenge**: the unlock math problem uses `Math.random()` to prevent muscle-memory bypass. Alternatively a 4-digit PIN can be configured.
- **Volume clamping**: master gain and speech synthesis volume are both capped at the `volumeLimit` setting, enforced in code so browser dev tools cannot unmute.
- **Intentional escape hatch**: Ctrl+Alt+Del is handled by `winlogon.exe` at kernel privilege and is deliberately left open as a fail-safe for parents.

### Build-Time Security Scanning (`npm run security-audit`)

All five scans run in CI and block the build on failure:

| Scan | Script | What it checks |
|------|--------|----------------|
| **SAST** | `scripts/sast-scan.js` | Scans all `src/` TypeScript/JavaScript files for `eval`, `new Function`, `dangerouslySetInnerHTML`, hardcoded credentials, and insecure `localStorage` usage. Fails on any HIGH-severity finding. |
| **SCA** | `scripts/sca-scan.js` | Checks every dependency license against a blacklist (GPL, AGPL, Proprietary) for BBM-RCL compatibility. Also runs `npm audit` to surface CVEs from the npm advisory registry. |
| **DAST** | `scripts/dast-scan.js` | Verifies `index.html` viewport constraints are present, confirms `App.tsx` uses `preventDefault`/`stopPropagation` for keyboard interception, and checks that exit-challenge math uses `Math.random()`. |
| **Secrets** | `scripts/secrets-scan.js` | Scans all `.ts`, `.tsx`, `.js`, `.jsx`, `.env`, and `.json` files for Google API keys, private key PEM blocks, AWS access keys, Slack webhooks, and generic high-entropy auth tokens. |
| **Malware** | `scripts/malware-scan.js` | Scans `src/` and `scripts/` for reverse shell signatures, large base64 payloads, remote binary downloaders, cryptocurrency mining scripts, and unsafe `child_process` shell-spawning calls. |

### Deployment Controls

- **Offline-first architecture**: the React SPA is bundled and served from `file://` with no network calls at runtime, eliminating the remote attack surface entirely.
- **Single self-contained executable**: built with `dotnet publish --self-contained true /p:PublishSingleFile=true`, reducing supply chain exposure at install time.
- **No user accounts or data transmission**: no credentials, telemetry, or persistent storage leaves the machine.

## Disclosure Policy

Once a fix is available, I'll aim to post a public advisory. Coordinated disclosure is appreciated - please allow reasonable time for a fix before going public.  Since this is open source, proposed fixes are appreciated.
