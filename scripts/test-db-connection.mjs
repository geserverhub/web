import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const opts = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

try {
  const conn = await mysql.createConnection(opts);
  await conn.ping();
  const [rows] = await conn.query('SELECT COUNT(*) AS n FROM PartnerProduct');
  console.log('OK', opts.user, '@', opts.host, 'PartnerProduct rows:', rows[0]?.n);
  await conn.end();
} catch (err) {
  console.error('FAIL', err.code || err.message);
  process.exit(1);
}
