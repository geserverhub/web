import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const root = join(import.meta.dirname, '..');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.svg', '.bat', '.ps1']);
const skip = new Set(['node_modules', '.next', 'package-lock.json']);

const replacements = [
  ['GOEUN SERVER HUB', 'GE SERVER HUB'],
  ['GOEUN HUB', 'GE HUB'],
  ['GOEUN CARGO', 'GE CARGO'],
  ['GOEUN DIGITAL INFRASTRUCTURE', 'GE DIGITAL INFRASTRUCTURE'],
  ['Goeun Server Hub', 'GE Server Hub'],
  ['GOEUN', 'GE'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (exts.has(extname(name))) out.push(p);
  }
  return out;
}

let updated = 0;
for (const file of walk(root)) {
  if (file.includes('rename-goeun-to-ge')) continue;
  let text = readFileSync(file, 'utf8');
  const orig = text;
  for (const [from, to] of replacements) text = text.split(from).join(to);
  if (text !== orig) {
    writeFileSync(file, text, 'utf8');
    updated++;
  }
}
console.log(`Updated ${updated} files`);
