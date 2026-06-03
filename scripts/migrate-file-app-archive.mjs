/**
 * Create FileAppArchiveRecord table (+ packageName column if upgrading).
 * Usage: node scripts/migrate-file-app-archive.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });
config({ path: resolve(ROOT, '.env.save') });

function getDbConfig() {
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

const migrations = [
  { file: 'prisma/migrate-file-app-archive-records.sql', label: 'FileAppArchiveRecord table' },
  { file: 'prisma/migrate-file-app-archive-v2-package.sql', label: 'FileAppArchiveRecord.packageName' },
];

const cfg = getDbConfig();
const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });

try {
  console.log(`Applying file app archive migrations on ${cfg.database} @ ${cfg.host}:${cfg.port}…`);
  for (const { file, label } of migrations) {
    const sql = readFileSync(resolve(ROOT, file), 'utf8');
    try {
      await conn.query(sql);
      console.log(`  ✓ ${label}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ✓ ${label} (column already exists)`);
      } else {
        throw err;
      }
    }
  }
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'FileAppArchiveRecord'`,
    [cfg.database]
  );
  if (Number(row.c) > 0) {
    console.log('\nFileAppArchiveRecord table is ready.');
  } else {
    throw new Error('FileAppArchiveRecord table still missing after migration');
  }
} finally {
  await conn.end();
}
