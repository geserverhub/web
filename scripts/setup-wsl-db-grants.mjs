/**
 * Grant geserverhub user access to goeunserverhub on WSL MySQL.
 * Run inside WSL:
 *   cd /mnt/c/web/web
 *   export MYSQL_ROOT_PASSWORD='your-mysql-root-password'
 *   node scripts/setup-wsl-db-grants.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const rootPassword = process.env.MYSQL_ROOT_PASSWORD || process.env.ROOT_PASSWORD || '';
const appPassword = process.env.DB_PASSWORD || '2350400018644';
const dbName = process.env.DB_NAME || 'goeunserverhub';
const appUser = process.env.DB_USER || 'geserverhub';

if (!rootPassword) {
  console.error('Set MYSQL_ROOT_PASSWORD (WSL MySQL root password) first.');
  process.exit(1);
}

const root = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: 'root',
  password: rootPassword,
  multipleStatements: true,
});

await root.query(`
  CREATE DATABASE IF NOT EXISTS \`${dbName}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS '${appUser}'@'localhost' IDENTIFIED BY '${appPassword.replace(/'/g, "''")}';
  CREATE USER IF NOT EXISTS '${appUser}'@'%' IDENTIFIED BY '${appPassword.replace(/'/g, "''")}';
  GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'localhost';
  GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${appUser}'@'%';
  FLUSH PRIVILEGES;
`);

await root.end();

const app = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: appUser,
  password: appPassword,
  database: dbName,
});
await app.ping();
await app.end();

console.log(`OK — ${appUser} can access ${dbName}. Restart: npm run dev`);
