/**
 * Set customerName on partner investment rows (was null → grouped as "ไม่ระบุ").
 * Usage: node scripts/fix-partner-investment-names.mjs
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const FIXES = [
  { id: 'cmpqhmgqt0000qh7564w9knmx', customerName: '복녀파위니' },
  { id: 'cmpqhew650000qhot2xedltbu', customerName: '김동규 부사님' },
];

const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'geserverhub',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'goeunserverhub',
});

for (const { id, customerName } of FIXES) {
  await db.query(
    `UPDATE PartnerTransaction SET customerName = ?, updatedAt = NOW(3) WHERE id = ?`,
    [customerName, id],
  );
  await db.query(
    `UPDATE PartnerPersonFinancial SET personName = ?, updatedAt = NOW(3) WHERE transactionId = ?`,
    [customerName, id],
  );
  console.log(`Updated ${id} → ${customerName}`);
}

const [rows] = await db.query(`
  SELECT customerName, amount FROM PartnerTransaction
  WHERE type = 'PARTNER_INVESTMENT' AND status != 'CANCELLED'
`);
console.log('After fix:', rows);

await db.end();
