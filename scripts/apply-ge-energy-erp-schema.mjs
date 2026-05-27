/**
 * Apply GE Energy ERP MySQL schema + seed metadata.
 * Usage: node scripts/apply-ge-energy-erp-schema.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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
  const sqlPath = join(__dirname, '..', 'prisma', 'migrate-ge-energy-erp.sql');
  const raw = readFileSync(sqlPath, 'utf8');
  const conn = await mysql.createConnection(getConfig());
  console.log('Applying GE Energy ERP schema…');
  try {
    await conn.query(raw);
    console.log('SQL migration applied.');
  } finally {
    await conn.end();
  }
  console.log('Start the app and open any ERP page to auto-seed departments/pages, or run the dev server.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
