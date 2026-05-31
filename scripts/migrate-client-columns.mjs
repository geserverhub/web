import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const migrations = [
  { file: '../prisma/migrate-add-client-contact-fax.sql', label: 'Client.contactFax' },
  { file: '../prisma/migrate-add-client-line-user-id.sql', label: 'Client.lineUserId' },
];

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'geserverhub',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'goeunserverhub',
  multipleStatements: true,
});

try {
  for (const { file, label } of migrations) {
    const sql = readFileSync(resolve(__dirname, file), 'utf8');
    try {
      await conn.query(sql);
      console.log(`Migration applied: ${label}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`Column already exists (${label}) — OK`);
      } else {
        throw err;
      }
    }
  }
} finally {
  await conn.end();
}
