# Security Policy

## Supported Versions

Only the latest release of Baby Button Masher receives security fixes.

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Scope

Baby Button Masher is a local Windows desktop application with no network services, no user accounts, and no data transmission. The relevant attack surface is limited to:

- **Sandbox escape**: ways a toddler (or an attacker with physical access) could bypass the keyboard hook or exit the full-screen lock without solving the parent challenge
- **Installer integrity**: tampering with the distributed `BBM_Setup_v*.exe`
- **Dependency vulnerabilities**: known CVEs in bundled libraries (WebView2, .NET runtime, npm packages)

Out of scope: denial-of-service, network attacks, and issues that require the attacker to already have admin privileges on the machine (since admin access already bypasses the sandbox by design via Ctrl+Alt+Del).

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report privately by emailing the maintainer or using [GitHub's private vulnerability reporting](https://github.com/tsohlacol/baby-button-masher/security/advisories/new).

Include:
- A description of the vulnerability and its impact
- Steps to reproduce
- Any suggested fix if you have one

You can expect an acknowledgment within a few days. Given that this is a personal open-source project maintained on a best-effort basis, patch timelines will vary, but sandbox escapes will be prioritized.

## Disclosure Policy

Once a fix is available, a public advisory will be posted. Coordinated disclosure is appreciated - please allow reasonable time for a fix before going public.
