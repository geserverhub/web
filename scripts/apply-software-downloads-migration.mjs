/**
 * Create SoftwareDownloadProduct + SoftwareDownloadOrder tables.
 * Usage: npm run db:migrate-software-downloads
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

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

const sql = readFileSync(resolve(ROOT, 'scripts/db-migrate-software-downloads.sql'), 'utf8');
const cfg = getConfig();

const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
try {
  console.log(`Applying software-downloads schema → ${cfg.database} @ ${cfg.host}:${cfg.port}`);
  await conn.query(sql);
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('SoftwareDownloadProduct', 'SoftwareDownloadOrder')`,
    [cfg.database],
  );
  console.log('Tables present:', tables.map((r) => r.TABLE_NAME).join(', ') || '(none)');
  console.log('Done: db-migrate-software-downloads.sql');
} finally {
  await conn.end();
}
