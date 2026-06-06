import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const dbName = process.env.DB_NAME || 'goeunserverhub';
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
});

const [fks] = await conn.query(
  `SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
   WHERE CONSTRAINT_SCHEMA = ?
     AND REFERENCED_TABLE_NAME IS NOT NULL
     AND TABLE_NAME IN ('power_records','power_records_preinstall','devices','device_notifications')
   ORDER BY TABLE_NAME, CONSTRAINT_NAME`,
  [dbName],
);
console.log(`FK constraints on ${dbName}:`);
for (const row of fks) console.log(`  ${row.TABLE_NAME}.${row.CONSTRAINT_NAME} -> ${row.REFERENCED_TABLE_NAME}`);
await conn.end();
