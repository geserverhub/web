/**
 * Apply GE Energy Tech meter order tables on goeunserverhub.
 * Usage: node scripts/apply-ge-energy-tech-orders-schema.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config();

function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: 'goeunserverhub',
      multipleStatements: true,
    };
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'goeunserverhub',
    multipleStatements: true,
  };
}

async function main() {
  const sql = readFileSync(join(__dirname, '..', 'prisma', 'migrate-ge-energy-tech-orders.sql'), 'utf8');
  const conn = await mysql.createConnection(getConfig());
  console.log('Applying geet_meter_order schema on goeunserverhub…');
  await conn.query(sql);
  await conn.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
