/**
 * Apply hub tables + PK/FK relations (idempotent SQL).
 * Usage: node scripts/apply-full-hub-relations.mjs
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

const sql = readFileSync(resolve(ROOT, 'prisma/migrate-full-hub-relations.sql'), 'utf8');
const cfg = getConfig();

const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
try {
  console.log(`Applying hub relations → ${cfg.database} @ ${cfg.host}:${cfg.port}`);
  await conn.query(sql);
  console.log('Done: migrate-full-hub-relations.sql');
} finally {
  await conn.end();
}
