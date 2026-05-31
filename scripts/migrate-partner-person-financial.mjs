import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = readFileSync(resolve(__dirname, '../prisma/migrate-partner-person-financial.sql'), 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'geserverhub',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'goeunserverhub',
  multipleStatements: true,
});

try {
  await conn.query(sql);
  console.log('Migration applied: PartnerPersonFinancial + PartnerMonthlyFinancial');
} catch (err) {
  if (err.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('Tables already exist — OK');
  } else {
    throw err;
  }
} finally {
  await conn.end();
}
