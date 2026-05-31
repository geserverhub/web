/**
 * Reset .next before dev when incomplete or after production build (stale CSS chunk hashes).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = path.join(root, '.next', 'prerender-manifest.json');
const buildId = path.join(root, '.next', 'BUILD_ID');
const serverApp = path.join(root, '.next', 'server', 'app');

function runClean() {
  const clean = path.join(root, 'scripts', 'clean-next.mjs');
  console.log('[dev] Resetting .next for dev (fixes missing CSS / prerender-manifest)…');
  const r = spawnSync(process.execPath, [clean], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (process.env.DEV_KEEP_NEXT === '1') {
  process.exit(0);
}

const missingManifest = !fs.existsSync(manifest);
const afterProductionBuild =
  fs.existsSync(buildId) && fs.existsSync(serverApp) && fs.existsSync(manifest);

if (missingManifest || afterProductionBuild) {
  runClean();
}
