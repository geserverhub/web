/**
 * Create ksystem energy tables and seed demo data when empty.
 * Usage: node scripts/setup-ksystem-energy.mjs
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const host = process.env.MYSQL_HOST || '127.0.0.1';
const port = Number(process.env.MYSQL_PORT || 3306);
const user = process.env.MYSQL_USER || 'ksystem';
const password = process.env.MYSQL_PASSWORD || 'Ksave2025Admin';
const database = process.env.MYSQL_DATABASE || 'ksystem';

async function main() {
  console.log(`Connecting ${user}@${host}:${port} ...`);

  const admin = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
  const sql = readFileSync(resolve(__dirname, '../prisma/migrate-energy-ksystem.sql'), 'utf8');
  await admin.query(sql);
  console.log('Migration applied (CREATE TABLE IF NOT EXISTS).');
  await admin.end();

  const db = await mysql.createConnection({ host, port, user, password, database });

  const [[{ deviceCount }]] = await db.query('SELECT COUNT(*) AS deviceCount FROM devices');
  if (Number(deviceCount) === 0) {
    await db.query(`
      INSERT INTO devices (deviceName, ksaveID, series_no, ipAddress, location, site, status, U_email, P_email, phone, pass_phone, customerName, customerPhone)
      VALUES
      ('KSAVE01', 'KSAVE01', 'KS2024010001', '192.168.1.46', 'Seongnam Research Institute', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'GE Energy Demo', '010-8105-0384'),
      ('KSAVE02', 'KSAVE02', 'KS2024010002', '192.168.1.2', 'Republic of Korea', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'Green Retail Demo', '010-8105-0384'),
      ('KSAVE-TH01', 'KSAVE-TH01', 'KS2024010007', '192.168.1.3', 'Bangkok', 'thailand', 'OFF', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '02-555-1199', '0000', 'Thailand Demo', '02-555-1199')
    `);
    console.log('Seeded devices.');
  }

  const [[{ recordCount }]] = await db.query('SELECT COUNT(*) AS recordCount FROM power_records');
  if (Number(recordCount) < 6) {
    const [devices] = await db.query(`SELECT deviceID, site FROM devices WHERE site IN ('korea', 'thailand')`);
    const krwRate = 140;
    const thbRate = 3.88;

    for (const device of devices) {
      for (let m = 11; m >= 0; m--) {
        const recordTime = new Date();
        recordTime.setMonth(recordTime.getMonth() - m, 15);
        recordTime.setHours(12, 0, 0, 0);
        const beforeKwh = 8000 + m * 120 + device.deviceID * 40;
        const afterKwh = Math.round(beforeKwh * (0.72 + (m % 3) * 0.02));
        await db.query(
          `INSERT INTO power_records (device_id, record_time, before_kWh, metrics_kWh, before_L1, metrics_L1, created_by)
           VALUES (?, ?, ?, ?, 220, 45, 'seed')`,
          [device.deviceID, recordTime, beforeKwh, afterKwh]
        );
      }
    }
    console.log(`Seeded 12 months of power_records (KRW rate ref: ${krwRate}, THB: ${thbRate}).`);
  }

  const [[{ monthlyCount }]] = await db.query(`
    SELECT COUNT(DISTINCT DATE_FORMAT(pr.record_time, '%Y-%m')) AS monthlyCount
    FROM power_records pr
    INNER JOIN devices d ON d.deviceID = pr.device_id
    WHERE d.site = 'korea'
  `);
  console.log(`Korea monthly buckets: ${monthlyCount}`);
  console.log('Done. Restart dev server and open /customer-dashboard');
  await db.end();
}

main().catch((err) => {
  console.error('Setup failed:', err.message || err);
  process.exit(1);
});
