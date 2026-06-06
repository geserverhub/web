import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const sql = readFileSync(resolve(__dirname, '../prisma/migrate-energy-pk-fks.sql'), 'utf8');
const dbName = process.env.DB_NAME || 'goeunserverhub';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
  multipleStatements: true,
});

await conn.query(sql);
console.log(`PK/FK migration applied on ${dbName}`);
await conn.end();
