/**
 * Baby Button Masher (BBM) - Shared security scanner utilities
 */

import fs from 'fs';
import path from 'path';

export const RESET  = "\x1b[0m";
export const BOLD   = "\x1b[1m";
export const GREEN  = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED    = "\x1b[31m";
export const CYAN   = "\x1b[36m";

/**
 * Recursively collect files matching the given extension list, skipping common
 * build/dependency directories.
 *
 * @param {string}   dir        - Root directory to scan
 * @param {RegExp}   extPattern - Regex tested against the filename (e.g. /\.(ts|tsx|js|jsx)$/)
 * @param {string[]} [extra]    - Additional individual file paths to append
 * @returns {string[]}
 */
export function scanDirectory(dir, extPattern, extra = []) {
  const fileList = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current)) {
      const fullPath = path.join(current, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!entry.includes('node_modules') && !entry.includes('dist') && !entry.startsWith('.')) {
          walk(fullPath);
        }
      } else if (extPattern.test(entry)) {
        fileList.push(fullPath);
      }
    }
  }

  walk(dir);
  return [...fileList, ...extra.filter(p => fs.existsSync(p))];
}
