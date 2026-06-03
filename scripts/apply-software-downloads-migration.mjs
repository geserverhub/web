/**
 * Create SoftwareDownloadProduct + SoftwareDownloadOrder tables.
 * On Windows, falls back to WSL MySQL when local access is denied.
 * Usage: npm run db:migrate-software-downloads
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { printWindowsDbHelp, runInWsl, shouldFallbackToWsl } from './lib/wsl-db-fallback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const u = new URL(url);
    return {
      host: process.env.DB_HOST || u.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: (process.env.DB_NAME || u.pathname.replace(/^\//, '') || 'goeunserverhub').trim(),
    };
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'goeunserverhub').trim(),
  };
}

async function applyMigration(cfg) {
  const sql = readFileSync(resolve(ROOT, 'scripts/db-migrate-software-downloads.sql'), 'utf8');
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
  try {
    console.log(`Applying software-downloads schema → ${cfg.database} @ ${cfg.host}:${cfg.port}`);
    await conn.query(sql);
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('SoftwareDownloadProduct', 'SoftwareDownloadOrder')`,
      [cfg.database],
    );
    const names = tables.map((r) => r.TABLE_NAME);
    console.log('Tables present:', names.join(', ') || '(none)');
    if (names.length < 2) {
      throw new Error('Migration incomplete — expected SoftwareDownloadProduct and SoftwareDownloadOrder');
    }
    console.log('Done: db-migrate-software-downloads.sql');
  } finally {
    await conn.end();
  }
}

function runViaWsl() {
  runInWsl('node scripts/apply-software-downloads-migration.mjs --no-wsl-fallback', {
    cwd: ROOT,
    label: 'db:migrate-software-downloads',
  });
}

const cfg = getConfig();
const noWslFallback = process.argv.includes('--no-wsl-fallback');

try {
  await applyMigration(cfg);
} catch (err) {
  if (
    !noWslFallback &&
    shouldFallbackToWsl(err, false)
  ) {
    runViaWsl();
    process.exit(0);
  }
  console.error('\nMigration failed:', err.message || err);
  if (process.platform === 'win32' && err.code === 'ER_ACCESS_DENIED_ERROR') {
    printWindowsDbHelp();
  }
  process.exit(1);
}
