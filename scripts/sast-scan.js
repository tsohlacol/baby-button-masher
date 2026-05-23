/**
 * Toddler Screen Defender (TSD) - Custom SAST Scan Engine
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the TSD-RCL Reciprocal License.
 */

import fs from 'fs';
import { scanDirectory, RESET, BOLD, GREEN, YELLOW, RED, CYAN } from './scan-utils.js';

console.log(`${BOLD}${CYAN}=====================================================${RESET}`);
console.log(`${BOLD}${CYAN}   TODDLER SCREEN DEFENDER - SAST SCANNING ENGINE     ${RESET}`);
console.log(`${BOLD}${CYAN}=====================================================${RESET}`);

const SENSITIVE_PATTERNS = [
  {
    name: "Unsafe Dynamic Code Execution (eval)",
    regex: /\beval\s*\(/g,
    severity: "HIGH",
    desc: "Direct execution of string scripts can bypass sandboxes and lead to severe context escalation."
  },
  {
    name: "Dynamic Function Constructor",
    regex: /\bnew\s+Function\s*\(/g,
    severity: "MEDIUM",
    desc: "Alternative eval function creation which runs code globally with escalated context."
  },
  {
    name: "React DOM Raw Injection (dangerouslySetInnerHTML)",
    regex: /dangerouslySetInnerHTML/g,
    severity: "HIGH",
    desc: "Injecting unescaped contents into the client interface allows client-side cross-site scripting (XSS)."
  },
  {
    name: "Hardcoded API Token/Private Secrets Assignment",
    regex: /(const|let|var)\s+([a-zA-Z0-9_]*(key|secret|password|token|api_key|apikey))[a-zA-Z0-9_]*\s*=\s*['"`][a-zA-Z0-9_\-\.\/+=@$%^&*]{8,}['"`]/gi,
    severity: "HIGH",
    desc: "Exposes credentials or keys to the git origin directly; use process.env references instead."
  },
  {
    name: "Insecure Local Storage Usage",
    regex: /localStorage\s*\.\s*(setItem|getItem|clear)/g,
    severity: "LOW",
    desc: "Local storage has no cryptographic protection on shared machines; store only configuration data."
  }
];

const fileCollection = scanDirectory('./src', /\.(ts|tsx|js|jsx)$/);
console.log(`Analyzing ${fileCollection.length} source code files concurrently...\n`);

let totalIssues = 0;
let highestSeverity = "NONE";

for (const file of fileCollection) {
  const content = fs.readFileSync(file, 'utf-8');
  const relativePath = path.relative(process.cwd(), file);
  
  // Clean comments to avoid false-positives
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Basic comment stripping for regex match
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    
    for (const pattern of SENSITIVE_PATTERNS) {
      pattern.regex.lastIndex = 0; // Reset
      if (pattern.regex.test(line)) {
        totalIssues++;
        const sevColor = pattern.severity === "HIGH" ? RED : (pattern.severity === "MEDIUM" ? YELLOW : CYAN);
        
        console.log(`${BOLD}${sevColor}[${pattern.severity}]${RESET} Feature vulnerability check triggered!`);
        console.log(`  File:     ${relativePath}:${index + 1}`);
        console.log(`  Rule:     ${pattern.name}`);
        console.log(`  Detail:   ${pattern.desc}`);
        console.log(`  Snippet:  "${BOLD}${line.trim().substring(0, 70)}${RESET}"\n`);
        
        if (pattern.severity === "HIGH") highestSeverity = "HIGH";
        else if (pattern.severity === "MEDIUM" && highestSeverity !== "HIGH") highestSeverity = "MEDIUM";
        else if (highestSeverity === "NONE") highestSeverity = "LOW";
      }
    }
  });
}

console.log(`${BOLD}${CYAN}=====================================================${RESET}`);
console.log(`${BOLD}SAST SCAN COMPLETE STATUS:${RESET}`);
console.log(`  Total files audited:  ${fileCollection.length}`);
console.log(`  Total vulnerabilities: ${totalIssues}`);
console.log(`  Highest severity tier: ${highestSeverity === "NONE" ? GREEN + "SAFE / PASS" : (highestSeverity === "HIGH" ? RED + "HIGH RISK" : YELLOW + "POTENTIAL RISK")}${RESET}`);
console.log(`${BOLD}${CYAN}=====================================================${RESET}`);

if (highestSeverity === "HIGH") {
  console.log(`${RED}${BOLD}🔴 SAST SCAN FAILURE: Critical security risk elements detected in upstream source tree!${RESET}\n`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}💚 SAST SCAN SUCCESS: Clean code metrics. No high-severity security violations found!${RESET}\n`);
  process.exit(0);
}
