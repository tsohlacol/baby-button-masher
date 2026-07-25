# Security scan scripts

Custom, dependency-free security scanners run by `npm run security-audit` (and individually
via `npm run sast|sca|dast|secrets|malware`). They also run in parallel as part of `make test`.
Each exits non-zero when it finds a blocking issue, failing the build.

These are lightweight, regex-based checks tuned for this repo, not a replacement for
industry SAST/SCA tooling. Treat a clean run as "no obvious anti-patterns," not "audited."

| File | npm script | What it checks | Fails build when |
|------|-----------|----------------|------------------|
| `sast-scan.js` | `sast` | Static anti-patterns in `src/` (`eval`, `Function` ctor, `dangerouslySetInnerHTML`, inline secrets, `localStorage`). Strips comments; honors `// sast-ignore`. | a HIGH-severity match is found |
| `sca-scan.js` | `sca` | Dependency licenses against an allowlist + `npm audit`. | a disallowed license (GPL/AGPL/proprietary) is found |
| `dast-scan.js` | `dast` | Presence of defensive patterns: CSP/viewport in `index.html`, iframe sandbox config, `preventDefault`/`stopPropagation` in the keystroke code. | a required defensive pattern is missing |
| `secrets-scan.js` | `secrets` | Hardcoded credentials (Google/AWS keys, private-key headers, Slack webhooks, generic OAuth) across source/env/json. | any secret pattern matches |
| `malware-scan.js` | `malware` | Suspicious signatures (reverse shells, base64 blobs, remote downloaders, miners, `child_process` exec/spawn). | any signature matches |
| `scan-utils.js` | — | Shared helpers (file walking, comment stripping) used by the scanners above. | n/a (library) |

## Known limitations

- Pattern/allowlist databases are hardcoded and not auto-updated; new CVEs, licenses, or
  obfuscation techniques can slip through.
- `sast-scan.js` fails only on HIGH severity; MEDIUM findings are reported but do not block.
- Comment stripping is simple and can be defeated by deliberate obfuscation.

If stronger guarantees are needed, layer in established tooling (ESLint security plugins,
OWASP Dependency-Check, `npm audit` gating) rather than extending these scripts.
