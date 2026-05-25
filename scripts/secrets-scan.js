/**
 * Baby Button Masher (BBM) - Custom Secrets Scanner Engine
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import fs from 'fs';
import path from 'path';
import { scanDirectory, RESET, BOLD, GREEN, YELLOW, RED, CYAN } from './scan-utils.js';

console.log(`${BOLD}${CYAN}=====================================================${RESET}`);
console.log(`${BOLD}${CYAN}   TODDLER SCREEN DEFENDER - SECRETS SCANNING ENGINE  ${RESET}`);
console.log(`${BOLD}${CYAN}=====================================================${RESET}`);

const SECRET_PATTERNS = [
  {
    name: "Google API Key (AIzaSy)",
    regex: /AIzaSy[a-zA-Z0-9_\-]{35}/g,
    desc: "Exposes Google Cloud or Gemini credentials. Keys must remain in hidden server environments."
  },
  {
    name: "Generic Private Cryptographic Key",
    regex: /-----BEGIN[ A-Z0-9_]*PRIVATE KEY-----/gi,
    desc: "Exposes asymmetric encryption private keys, allowing authentication hijacking."
  },
  {
    name: "AWS Client ID or Access Key",
    regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    desc: "Exposes Amazon Web Services access keys, inviting remote system resource takeovers."
  },
  {
    name: "Slack Webhook / API Url",
    regex: /https:\/\/hooks\.slack\.com\/services\/[T][A-Z0-9_]{8}\/[B][A-Z0-9_]{8}\/[A-Za-z0-9_]{24}/g,
    desc: "Exposes Slack webhook endpoints, enabling spam and channels hijacking."
  },
  {
    name: "Generic High Entropy OAuth Password/Key/Token Pattern",
    regex: /(secret|password|passwd|auth_token|token|api_secret)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.]{12,}['"`]/gi,
    desc: "Exposes suspected high-entropy auth passwords or secrets inside assignments. Use environment variables."
  }
];

// Secrets scan covers a broader set of file types but excludes known false-positive files
const SECRETS_EXT = /\.(ts|tsx|js|jsx|env|json)$/;
function secretsScanDir(dir) {
  return scanDirectory(dir, SECRETS_EXT).filter(
    f => !f.includes('.env.example') && !f.includes('-model.md') && !f.includes('package-lock.json')
  );
}

const fileCollection = secretsScanDir('.');
console.log(`Auditing ${fileCollection.length} workspace files for hardcoded secrets...\n`);

let secretsDetected = 0;

for (const file of fileCollection) {
  const content = fs.readFileSync(file, 'utf-8');
  const relativePath = path.relative(process.cwd(), file);
  
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Strip comments to minimize false positives for explanation examples
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('#')) return;
    
    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0; // Reset state
      if (pattern.regex.test(line)) {
        secretsDetected++;
        console.log(`${BOLD}${RED}[RISK]${RESET} Hardcoded Secret Exposed!`);
        console.log(`  File:     ${relativePath}:${index + 1}`);
        console.log(`  Rule:     ${pattern.name}`);
        console.log(`  Detail:   ${pattern.desc}`);
        console.log(`  Snippet:  "${BOLD}${line.trim().substring(0, 70)}${RESET}"\n`);
      }
    }
  });
}

console.log(`${BOLD}${CYAN}=====================================================${RESET}`);
console.log(`${BOLD}SECRETS SCAN COMPLETED RESULTS:${RESET}`);
console.log(`  Files scanned:           ${fileCollection.length}`);
console.log(`  Secrets keys identified: ${secretsDetected}`);
console.log(`${BOLD}${CYAN}=====================================================${RESET}`);

if (secretsDetected > 0) {
  console.log(`${RED}${BOLD}🔴 SECRETS SCAN FAILURE: Critical plaintext secrets found in file repository!${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}💚 SECRETS SCAN SUCCESS: No hardcoded secrets or exposed api keys found in files!${RESET}\n`);
  process.exit(0);
}
