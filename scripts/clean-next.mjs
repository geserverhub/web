import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parentRoot = path.resolve(appRoot, '..');

const targets = [
  path.join(appRoot, '.next'),
  path.join(appRoot, 'node_modules', '.cache'),
  path.join(parentRoot, '.next'),
  path.join(parentRoot, 'node_modules', '.cache'),
];

for (const target of targets) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
    console.log('removed:', target);
  } catch (err) {
    console.warn('skip:', target, err.message);
  }
}

console.log('Done. Start dev from ONE environment only (Windows OR WSL), not both.');
