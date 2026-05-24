/**
 * Create geserverhub DB user on Windows MySQL80 (localhost:3306).
 * Run in PowerShell (as admin if needed):
 *   $env:MYSQL_ROOT_PASSWORD="your-root-password"
 *   node scripts/setup-windows-db-user.mjs
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootPassword = process.env.MYSQL_ROOT_PASSWORD || process.env.ROOT_PASSWORD || '';
const appPassword = process.env.DB_PASSWORD || '2350400018644';
const dbName = process.env.DB_NAME || 'goeunserverhub';

if (!rootPassword) {
  console.error('Set MYSQL_ROOT_PASSWORD (Windows MySQL root password) first.');
  process.exit(1);
}

const root = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: rootPassword,
  multipleStatements: true,
});

await root.query(`
  CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'geserverhub'@'localhost' IDENTIFIED BY '${appPassword.replace(/'/g, "''")}';
  GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO 'geserverhub'@'localhost';
  FLUSH PRIVILEGES;
`);
console.log('User geserverhub@localhost ready on Windows MySQL.');

const backup = resolve(__dirname, '../backups/20260508_173742/goeunserverhub_db.sql');
try {
  const sql = readFileSync(backup, 'utf8');
  const app = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'geserverhub',
    password: appPassword,
    database: dbName,
    multipleStatements: true,
  });
  await app.query(sql);
  await app.end();
  console.log('Imported backup into', dbName);
} catch (e) {
  console.warn('Backup import skipped:', e.message);
}

await root.end();
console.log('Done. Restart: npm run dev:restart');
