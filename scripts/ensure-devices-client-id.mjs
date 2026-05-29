import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'geserverhub',
});

const [cols] = await conn.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'client_id'`,
);
if (!cols.length) {
  await conn.query(
    `ALTER TABLE devices ADD COLUMN client_id varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL`,
  );
  console.log('Added devices.client_id');
}
await conn.query(
  `UPDATE devices d
   LEFT JOIN Client c ON c.slug = 'goeun-server-hub'
   SET d.client_id = c.id
   WHERE d.client_id IS NULL AND c.id IS NOT NULL`,
);
console.log('devices.client_id migration OK');
await conn.end();
