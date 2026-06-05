/**
 * Create GE energy tables in goeunserverhub and seed demo data when empty.
 * Usage: node scripts/setup-ge-energy.mjs
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const DB_NAME = 'goeunserverhub';

function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const u = new URL(url);
    return {
      host: process.env.DB_HOST || u.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: DB_NAME,
    };
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
  };
}

async function main() {
  const cfg = getConfig();
  console.log(`Connecting ${cfg.user}@${cfg.host}:${cfg.port} / ${DB_NAME} ...`);

  const admin = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
  });

  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  for (const file of [
    '../prisma/migrate-energy-geserverhub.sql',
    '../prisma/migrate-ge-energy-app-extensions.sql',
    '../prisma/migrate-ge-energy-tech-orders.sql',
  ]) {
    const sql = readFileSync(resolve(__dirname, file), 'utf8');
    console.log(`Applying ${file.replace('../prisma/', '')}…`);
    await admin.query(sql);
  }
  console.log('All GE Energy migrations applied on goeunserverhub.');
  await admin.end();

  const db = await mysql.createConnection({ ...cfg, database: DB_NAME });

  const [[{ deviceCount }]] = await db.query('SELECT COUNT(*) AS deviceCount FROM devices');
  if (Number(deviceCount) === 0) {
    await db.query(`
      INSERT INTO devices (deviceName, GEsaveID, series_no, ipAddress, location, site, status, U_email, P_email, phone, pass_phone, customerName, customerPhone)
      VALUES
      ('GE01', 'GE01', 'GE2024010001', '192.168.1.46', 'Seongnam Research Institute', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'GE Energy', '010-8105-0384'),
      ('GE02', 'GE02', 'GE2024010002', '192.168.1.2', 'Republic of Korea', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'Green Retail', '010-8105-0384'),
      ('GE-TH01', 'GE-TH01', 'GE2024010007', '192.168.1.3', 'Bangkok', 'thailand', 'OFF', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '02-555-1199', '0000', 'Thailand', '02-555-1199')
    `);
    console.log('Seeded devices.');
  }

  const [[{ recordCount }]] = await db.query('SELECT COUNT(*) AS recordCount FROM power_records');
  if (Number(recordCount) < 6) {
    const [devices] = await db.query(`SELECT deviceID, site FROM devices WHERE site IN ('korea', 'thailand')`);
    const [[{ maxId }]] = await db.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM power_records');
    let nextId = Number(maxId) + 1;

    for (const device of devices) {
      for (let m = 11; m >= 0; m--) {
        const recordTime = new Date();
        recordTime.setMonth(recordTime.getMonth() - m, 15);
        recordTime.setHours(12, 0, 0, 0);
        const beforeKwh = 8000 + m * 120 + device.deviceID * 40;
        const afterKwh = Math.round(beforeKwh * (0.72 + (m % 3) * 0.02));
        await db.query(
          `INSERT INTO power_records (id, device_id, record_time, before_kWh, metrics_kWh, before_L1, metrics_L1, created_by)
           VALUES (?, ?, ?, ?, ?, 220, 45, 'seed')`,
          [nextId++, device.deviceID, recordTime, beforeKwh, afterKwh]
        );
      }
    }
    console.log('Seeded 12 months of power_records per device.');
  }

  const [[{ monthlyCount }]] = await db.query(`
    SELECT COUNT(DISTINCT DATE_FORMAT(pr.record_time, '%Y-%m')) AS monthlyCount
    FROM power_records pr
    INNER JOIN devices d ON d.deviceID = pr.device_id
    WHERE d.site = 'korea'
  `);
  console.log(`Korea monthly buckets: ${monthlyCount}`);
  console.log('Done — all energy data uses goeunserverhub only.');
  await db.end();
}

main().catch((err) => {
  console.error('Setup failed:', err.message || err);
  process.exit(1);
});
