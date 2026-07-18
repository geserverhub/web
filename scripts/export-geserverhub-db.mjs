/**
 * Export goeunserverhub database to database/geserverhub.sql
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
    database: (u.pathname || '/goeunserverhub').replace(/^\//, '') || 'goeunserverhub',
  };
}

const cfg = process.env.DATABASE_URL?.startsWith('mysql://')
  ? fromDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'geserverhub',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'goeunserverhub',
    };

const outDir = resolve(root, 'database');
const outFile = resolve(outDir, 'geserverhub.sql');
mkdirSync(outDir, { recursive: true });

const dumpUser = process.env.DB_USER || cfg.user;
const dumpPassword = process.env.DB_PASSWORD ?? cfg.password;

/** MariaDB's mysqldump doesn't recognize MySQL-only flags like --set-gtid-purged. */
const versionCheck = spawnSync('mysqldump', ['--version'], { encoding: 'utf8' });
const isMariaDb = /mariadb/i.test(versionCheck.stdout || '');

const args = [
  `-h${cfg.host}`,
  `-P${cfg.port}`,
  `-u${dumpUser}`,
  ...(dumpPassword ? [`-p${dumpPassword}`] : []),
  '--single-transaction',
  '--no-tablespaces',
  '--routines',
  '--triggers',
  ...(isMariaDb ? [] : ['--set-gtid-purged=OFF']),
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

/** MariaDB / MySQL 5.7 cannot import MySQL 8.0 default collations. */
function normalizeDumpForMariaDb(buf) {
  return Buffer.from(
    buf
      .toString('utf8')
      .replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci')
      .replace(/utf8mb4_0900_as_ci/g, 'utf8mb4_unicode_ci')
      .replace(/utf8mb4_0900_as_cs/g, 'utf8mb4_unicode_ci'),
    'utf8',
  );
}

const normalized = normalizeDumpForMariaDb(result.stdout);
writeFileSync(outFile, normalized);
console.log(
  `Exported ${cfg.database} → database/geserverhub.sql (${normalized.length} bytes, MariaDB-safe collations)`,
);
