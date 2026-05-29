/**
 * Set Korea device locations to "KOREA" in devices table.
 * Run on WSL: node scripts/fix-device-location-korea.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'geserverhub',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'goeunserverhub',
});

try {
  const [result] = await conn.query(
    `UPDATE devices
     SET location = 'KOREA'
     WHERE LOWER(COALESCE(site, '')) LIKE '%korea%'
        OR LOWER(COALESCE(location, '')) LIKE '%korea%'
        OR LOWER(COALESCE(location, '')) LIKE '%seongnam%'
        OR LOWER(COALESCE(location, '')) LIKE '%research institute%'`,
  );
  console.log('Updated devices.location → KOREA:', result.affectedRows, 'row(s)');
} finally {
  await conn.end();
}
