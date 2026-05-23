/**
 * Export geserverhub database to database/geserverhub.sql
 * Usage: node scripts/export-geserverhub-db.mjs
 */
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
config({ path: resolve(root, '.env.local') });

function fromDatabaseUrl(url) {
  const u = new URL(url);
  return {
    host: process.env.DB_HOST || u.hostname || '127.0.0.1',
    port: process.env.DB_PORT || u.port || '3306',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: (u.pathname || '/geserverhub').replace(/^\//, '') || 'geserverhub',
  };
}

const cfg = process.env.DATABASE_URL?.startsWith('mysql://')
  ? fromDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'geserverhub',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'geserverhub',
    };

const outDir = resolve(root, 'database');
const outFile = resolve(outDir, 'geserverhub.sql');
mkdirSync(outDir, { recursive: true });

const args = [
  `-h${cfg.host}`,
  `-P${cfg.port}`,
  `-u${cfg.user}`,
  ...(cfg.password ? [`-p${cfg.password}`] : []),
  '--single-transaction',
  '--routines',
  '--triggers',
  '--set-gtid-purged=OFF',
  cfg.database,
];

const result = spawnSync('mysqldump', args, {
  encoding: 'buffer',
  maxBuffer: 512 * 1024 * 1024,
});

if (result.error) {
  console.error('mysqldump failed:', result.error.message);
  process.exit(1);
}
if (result.status !== 0) {
  const err = result.stderr?.toString('utf8') || 'unknown error';
  console.error('mysqldump exit', result.status, err);
  process.exit(1);
}

writeFileSync(outFile, result.stdout);
console.log(`Exported ${cfg.database} → database/geserverhub.sql (${result.stdout.length} bytes)`);
