import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const REQUIRED_DB = 'goeunserverhub';
const LEGACY_DB = 'geserverhub';
const dbName = (process.env.DB_NAME || REQUIRED_DB).trim();
const legacyOk =
  process.env.DB_LEGACY_GESERVERHUB === '1' && dbName.toLowerCase() === LEGACY_DB;

if (dbName.toLowerCase() !== REQUIRED_DB && !legacyOk) {
  console.error(
    `FAIL — DB_NAME must be ${REQUIRED_DB}` +
      (process.env.DB_LEGACY_GESERVERHUB === '1' ? ` or legacy ${LEGACY_DB}` : '') +
      `, got "${dbName}".`
  );
  process.exit(1);
}

const opts = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
};

console.log('Platform:', process.platform);
console.log('Connecting:', opts.user, '@', opts.host + ':' + opts.port, '/', opts.database);

try {
  const conn = await mysql.createConnection(opts);
  await conn.ping();
  console.log('OK — database connection works.');
  await conn.end();
} catch (err) {
  console.error('FAIL —', err.code || err.message);
  if (process.platform === 'win32' && err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error(`
Windows ใช้ MySQL80 คนละตัวกับ WSL.
เลือกอย่างใดอย่างหนึ่ง:
  1) รัน dev ใน WSL:  cd /mnt/c/web/web && npm run dev:restart
  2) สร้าง user บน Windows MySQL:
       $env:MYSQL_ROOT_PASSWORD="รหัส-root-Windows"
       node scripts/setup-windows-db-user.mjs
`);
  }
  process.exit(1);
}
