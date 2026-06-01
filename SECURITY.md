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

## Disclosure Policy

Once a fix is available, I'll aim to post a public advisory. Coordinated disclosure is appreciated - please allow reasonable time for a fix before going public.  Since this is open source, proposed fixes are appreciated.
