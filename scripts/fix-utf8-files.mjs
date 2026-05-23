/**
 * Normalize route/page files that break Next.js UTF-8 parsing (CRLF, NEL, bad bytes).
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const files = [
  'src/app/energy-dashboard/dashboard/page.tsx',
  'src/app/energy-dashboard/devices-setting/page.tsx',
  'src/app/api/kenergy/user-feedback/route.ts',
  'src/app/api/kenergy/devices-setting/route.ts',
  'src/app/api/kenergy/device-notifications/route.ts',
];

for (const rel of files) {
  const path = resolve(root, rel);
  let text = readFileSync(path, 'latin1');
  text = text.replace(/\u0085/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  writeFileSync(path, text, 'utf8');
  console.log('fixed:', rel);
}
