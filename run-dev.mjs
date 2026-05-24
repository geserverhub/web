/**
 * Start Next dev. On Windows, if local MySQL rejects geserverhub, run dev in WSL instead.
 */
import { spawn, execSync } from 'child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
config({ path: resolve(root, '.env.local') });

const port = process.env.PORT || '3005';

function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      host: u.hostname || '127.0.0.1',
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}

async function canConnectLocalDb() {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
  const opts = fromUrl || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'geserverhub',
  };
  if (!opts.user || !opts.password) return false;
  try {
    const conn = await mysql.createConnection({ ...opts, connectTimeout: 3000 });
    await conn.ping();
    await conn.end();
    return true;
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') return false;
    throw err;
  }
}

function run(cmd, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function freePort() {
  const killScript = resolve(__dirname, 'kill-port.mjs');
  await run(process.execPath, [killScript, port], { cwd: root });
}

async function startNextLocal(host = '127.0.0.1') {
  await freePort();
  const nextBin = resolve(root, 'node_modules/next/dist/bin/next');
  let wslIp = '';
  if (process.platform !== 'win32') {
    try {
      wslIp = execSync("hostname -I | awk '{print $1}'", { encoding: 'utf8' }).trim();
    } catch {
      /* ignore */
    }
  }
  console.log(`\n[dev] http://localhost:${port} (hostname ${host})`);
  if (wslIp) console.log(`[dev] From Windows browser: http://${wslIp}:${port}/`);
  console.log('');
  const useTurbo = process.env.DEV_TURBO === '1';
  const args = ['dev', '-p', port, '-H', host];
  if (useTurbo) args.push('--turbopack');
  await run(process.execPath, [nextBin, ...args], { cwd: root });
}

async function startNextWsl() {
  const wslPath = process.env.WSL_PROJECT_DIR || '~/web';
  const cmd = `cd ${wslPath} && npm run dev`;
  console.log('\n[dev] Starting Next.js in WSL (MySQL + APIs)...\n');
  await run('wsl', ['-e', 'bash', '-lc', cmd], { cwd: root });
}

async function main() {
  if (process.platform === 'win32') {
    if (process.env.DEV_USE_WSL === '1') {
      await startNextWsl();
      return;
    }
    const dbOk = await canConnectLocalDb();
    console.log(
      dbOk
        ? '[dev] Windows MySQL OK — homepage + APIs on localhost.'
        : '[dev] Windows MySQL unavailable — homepage uses fallback data; APIs need npm run dev:wsl'
    );
    await startNextLocal('127.0.0.1');
    return;
  }
  await startNextLocal('0.0.0.0');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
