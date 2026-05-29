/**
 * Backfill PartnerPersonFinancial + PartnerMonthlyFinancial from PartnerTransaction.
 * Usage: node scripts/sync-partner-person-financial.mjs [year]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const yearArg = process.argv[2] ? Number(process.argv[2]) : null;

function getConfig() {
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
  const db = await mysql.createConnection(getConfig());

  const [txRows] = await db.query(`
    SELECT id, type, customerName, amount, currency, date, notes, status
    FROM PartnerTransaction
    WHERE status != 'CANCELLED'
      AND type IN ('PROFIT_SHARE', 'PARTNER_INVESTMENT')
      ${yearArg ? 'AND YEAR(date) = ?' : ''}
  `, yearArg ? [yearArg] : []);

  let personUpserts = 0;
  for (const tx of txRows) {
    const ledgerType = tx.type === 'PARTNER_INVESTMENT' ? 'INVESTMENT' : 'PROFIT_SHARE';
    await db.query(`
      INSERT INTO PartnerPersonFinancial (id, personName, ledgerType, amount, currency, transactionId, recordedAt, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        personName = VALUES(personName),
        ledgerType = VALUES(ledgerType),
        amount = VALUES(amount),
        currency = VALUES(currency),
        recordedAt = VALUES(recordedAt),
        notes = VALUES(notes),
        updatedAt = CURRENT_TIMESTAMP(3)
    `, [
      randomUUID(),
      tx.customerName || 'ไม่ระบุ',
      ledgerType,
      Number(tx.amount),
      tx.currency || 'KRW',
      tx.id,
      tx.date,
      tx.notes || null,
    ]);
    personUpserts += 1;
  }

  const years = yearArg ? [yearArg] : [...new Set(txRows.map((t) => new Date(t.date).getFullYear()))];
  if (!yearArg) {
    const [yearRows] = await db.query(`
      SELECT DISTINCT YEAR(date) AS y FROM PartnerTransaction WHERE status != 'CANCELLED'
    `);
    for (const row of yearRows) years.push(Number(row.y));
  }
  const uniqueYears = [...new Set(years.filter(Boolean))];

  let monthUpserts = 0;
  for (const y of uniqueYears) {
    for (let m = 1; m <= 12; m += 1) {
      const monthStart = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00`);
      const monthEnd = new Date(y, m, 1);

      const [agg] = await db.query(`
        SELECT
          COALESCE(SUM(CASE WHEN type IN ('SALE','PROFIT_SHARE') AND currency = 'KRW' THEN amount ELSE 0 END), 0) AS revenueKrw,
          COALESCE(SUM(CASE WHEN type = 'PARTNER_INVESTMENT' AND currency = 'KRW' THEN amount ELSE 0 END), 0) AS investmentKrw,
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND currency = 'KRW' THEN amount ELSE 0 END), 0) AS expenseKrw
        FROM PartnerTransaction
        WHERE status != 'CANCELLED'
          AND date >= ? AND date < ?
      `, [monthStart, monthEnd]);

      const row = agg[0];
      const revenueKrw = Number(row.revenueKrw);
      const investmentKrw = Number(row.investmentKrw);
      const expenseKrw = Number(row.expenseKrw);
      if (revenueKrw === 0 && investmentKrw === 0 && expenseKrw === 0) continue;

      await db.query(`
        INSERT INTO PartnerMonthlyFinancial (id, year, month, revenueKrw, investmentKrw, expenseKrw)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          revenueKrw = VALUES(revenueKrw),
          investmentKrw = VALUES(investmentKrw),
          expenseKrw = VALUES(expenseKrw),
          updatedAt = CURRENT_TIMESTAMP(3)
      `, [randomUUID(), y, m, revenueKrw, investmentKrw, expenseKrw]);
      monthUpserts += 1;
    }
  }

  console.log(`Synced ${personUpserts} person ledger rows, ${monthUpserts} monthly snapshots.`);
  await db.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
