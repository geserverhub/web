#!/usr/bin/env node
/**
 * Full restore: database/geserverhub.sql → MySQL (WSL/local).
 * Usage: node scripts/restore-db.mjs
 * First-time WSL: MYSQL_ROOT_PASSWORD=your_root_pass node scripts/restore-db.mjs
 */
import { config } from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'geserverhub';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'goeunserverhub';
const BACKUP = resolve(ROOT, 'database/geserverhub.sql');
const MIGRATIONS = [
  'prisma/migrate-energy-geserverhub.sql',
  'prisma/migrate-mfactory-inquiry.sql',
  'prisma/migrate-mfactory-booking-v2.sql',
];

async function ping(user, password) {
  const conn = await createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user,
    password,
    multipleStatements: true,
  });
  await conn.ping();
  await conn.end();
}

async function ensureDatabase() {
  try {
    await ping(DB_USER, DB_PASSWORD);
    const conn = await createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true,
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.end();
    console.log(`OK: ${DB_USER} can access MySQL`);
    return;
  } catch {
    /* need root setup */
  }

  const rootPass = process.env.MYSQL_ROOT_PASSWORD;
  if (!rootPass) {
    console.error(`
Cannot connect as ${DB_USER} and MYSQL_ROOT_PASSWORD is not set.

WSL first-time setup — run in Ubuntu terminal:
  cd ~/web   # or: cd /mnt/c/web/web
  export MYSQL_ROOT_PASSWORD='your-mysql-root-password'
  node scripts/restore-db.mjs
`);
    process.exit(1);
  }

  const root = await createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: 'root',
    password: rootPass,
    multipleStatements: true,
  });
  await root.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await root.query(
    `CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`,
    [DB_USER, DB_PASSWORD]
  );
  await root.query(`ALTER USER ?@'localhost' IDENTIFIED BY ?`, [DB_USER, DB_PASSWORD]);
  await root.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO ?@'localhost'`, [DB_USER]);
  await root.query('FLUSH PRIVILEGES');
  await root.end();
  console.log(`OK: created database and user ${DB_USER}`);
}

function mysqlImport(file) {
  return new Promise((resolvePromise, reject) => {
    const args = ['-h', DB_HOST, '-P', String(DB_PORT), '-u', DB_USER, DB_NAME];
    const child = spawn('mysql', args, {
      env: { ...process.env, MYSQL_PWD: DB_PASSWORD },
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    const stream = createReadStream(file);
    stream.pipe(child.stdin);
    stream.on('error', reject);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`mysql import exited ${code} (${file})`));
    });
  });
}

async function main() {
  if (!DB_PASSWORD) {
    console.error('ERROR: DB_PASSWORD missing in .env.local');
    process.exit(1);
  }

  console.log('==> Ensure database & user...');
  await ensureDatabase();

  console.log(`==> Import ${BACKUP} ...`);
  await mysqlImport(BACKUP);

  for (const rel of MIGRATIONS) {
    const p = resolve(ROOT, rel);
    console.log(`==> Migration ${rel} ...`);
    await mysqlImport(p);
  }

  const conn = await createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM MFactoryInquiry');
  await conn.end();
  console.log(`OK: MFactoryInquiry rows = ${n}`);
  console.log(`Done. Database "${DB_NAME}" restored.`);
}

main().catch((err) => {
  console.error('FAIL —', err.message || err);
  process.exit(1);
});
