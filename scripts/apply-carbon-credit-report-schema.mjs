/**
 * Create cc_reports table for ISO 14064-2 carbon credit print registry.
 * Usage: npm run db:migrate-carbon-credit-report
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
  const raw = readFileSync(resolve(ROOT, 'prisma/migrate-carbon-credit-report.sql'), 'utf8');
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
  try {
    console.log(`Applying carbon-credit-report schema → ${cfg.database} @ ${cfg.host}:${cfg.port}`);
    await conn.query(raw);
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cc_reports'`,
      [cfg.database],
    );
    console.log('Tables:', tables.map((r) => r.TABLE_NAME).join(', ') || '(none)');
    console.log('Done: migrate-carbon-credit-report.sql');
  } finally {
    await conn.end();
  }
}

async function main() {
  const cfg = getConfig();
  const noFallback = process.argv.includes('--no-wsl-fallback');
  try {
    await applyMigration(cfg);
  } catch (err) {
    if (shouldFallbackToWsl(err, noFallback)) {
      runInWsl('npm run db:migrate-carbon-credit-report -- --no-wsl-fallback', {
        label: 'db:migrate-carbon-credit-report',
      });
      return;
    }
    printWindowsDbHelp();
    console.error(err);
    process.exit(1);
  }
}

main();
