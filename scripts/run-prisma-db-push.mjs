/**
 * prisma db push with WSL fallback on Windows when local MySQL auth fails.
 */
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { printWindowsDbHelp, runInWsl } from './lib/wsl-db-fallback.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const noWslFallback = process.argv.includes('--no-wsl-fallback');
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runPush() {
  return spawnSync(npx, ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('Applying Prisma schema via db push…');
const result = runPush();

if (result.status === 0) {
  console.log('Done: prisma db push');
  process.exit(0);
}

if (!noWslFallback && process.platform === 'win32') {
  runInWsl('npx prisma db push --skip-generate --accept-data-loss', { cwd: ROOT, label: 'prisma db push' });
  process.exit(0);
}

console.error('\nprisma db push failed.');
if (process.platform === 'win32') printWindowsDbHelp();
process.exit(result.status || 1);
