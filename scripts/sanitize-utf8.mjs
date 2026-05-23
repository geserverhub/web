/**
 * Strip invalid UTF-8 bytes so Next.js can parse source files on /mnt/c.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = process.argv[2] || 'src/app/energy-dashboard/dashboard/page.tsx';
const path = resolve(root, rel);

const buf = readFileSync(path);
const text = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  .replace(/\u0085/g, '\n')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n');

writeFileSync(path, text, 'utf8');
console.log('sanitized:', rel);
