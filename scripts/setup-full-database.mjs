/**
 * Create goeunserverhub + all GE Energy tables/columns + optional Prisma hub tables.
 *
 * Usage:
 *   node scripts/setup-full-database.mjs
 *   node scripts/setup-full-database.mjs --skip-prisma    # energy SQL only
 *   node scripts/setup-full-database.mjs --skip-seed      # schema only
 *   node scripts/setup-full-database.mjs --restore        # import database/geserverhub.sql first
 */
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const DB_NAME = (process.env.DB_NAME || 'goeunserverhub').trim();
const args = new Set(process.argv.slice(2));
const SKIP_PRISMA = args.has('--skip-prisma');
const SKIP_SEED = args.has('--skip-seed');
const USE_RESTORE = args.has('--restore');

const SQL_FILES = [
  'prisma/migrate-energy-geserverhub.sql',
  'prisma/migrate-ge-energy-app-extensions.sql',
  'prisma/migrate-ge-energy-tech-orders.sql',
];

const EXPECTED_TABLES = [
  'User',
  'Client',
  'devices',
  'power_records',
  'power_records_preinstall',
  'user_feedback',
  'support_tickets',
  'device_notifications',
  'mqtt_settings',
  'device_connectivity',
  'ai_settings',
  'carbon_locations',
  'carbon_meters',
  'carboncre_cacu',
  'momoge_cus',
  'ge_electricity_rates',
  'ge_energy_meter_device_binding',
  'ge_customer_energy_saver_orders',
  'broadcast_messages',
  'product_list',
  'notifications',
  'api_keys',
  'feedback_replies',
  'user_permissions',
  'ge_after_sales_chat_thread',
  'ge_after_sales_chat_message',
  'ge_platform_device_registration',
  'geet_meter_order',
  'geet_meter_order_event',
];

function getAdminConfig() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const u = new URL(url);
    return {
      host: process.env.DB_HOST || u.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
    };
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
  };
}

function patchSqlForDb(sql) {
  return sql
    .replace(/USE\s+goeunserverhub\s*;/gi, `USE \`${DB_NAME}\`;`)
    .replace(/USE\s+geserverhub\s*;/gi, `USE \`${DB_NAME}\`;`);
}

async function runSqlFile(conn, relativePath) {
  const full = join(ROOT, relativePath);
  if (!existsSync(full)) {
    throw new Error(`Missing SQL file: ${relativePath}`);
  }
  const sql = patchSqlForDb(readFileSync(full, 'utf8'));
  console.log(`  → ${relativePath}`);
  await conn.query(sql);
}

async function runPrismaPush() {
  console.log('Applying Prisma schema (User, Client, …) via prisma db push…');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'],
    { cwd: ROOT, stdio: 'inherit', env: process.env },
  );
  if (result.status !== 0) {
    throw new Error(
      'prisma db push failed — restore hub tables with: npm run db:restore  OR  node scripts/setup-full-database.mjs --restore',
    );
  }
}

async function restoreFromDump(conn) {
  const dump = join(ROOT, 'database', 'geserverhub.sql');
  if (!existsSync(dump)) {
    throw new Error(`Backup not found: database/geserverhub.sql — run git pull or use prisma db push`);
  }
  console.log('Restoring Prisma + legacy tables from database/geserverhub.sql (may take a minute)…');
  let sql = readFileSync(dump, 'utf8');
  sql = sql.replace(/CREATE DATABASE[^;]+;/gi, '');
  sql = sql.replace(/USE\s+`?geserverhub`?\s*;/gi, `USE \`${DB_NAME}\`;`);
  sql = sql.replace(/USE\s+`?goeunserverhub`?\s*;/gi, `USE \`${DB_NAME}\`;`);
  await conn.query(sql);
}

async function seedDemoData(db) {
  const [[{ deviceCount }]] = await db.query('SELECT COUNT(*) AS deviceCount FROM devices');
  if (Number(deviceCount) === 0) {
    await db.query(`
      INSERT INTO devices (deviceName, geID, series_no, ipAddress, location, site, status, U_email, P_email, phone, pass_phone, customerName, customerPhone)
      VALUES
      ('GE01', 'GE01', 'GE2024010001', '192.168.1.46', 'Seongnam Research Institute', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'GE Energy Demo', '010-8105-0384'),
      ('GE02', 'GE02', 'GE2024010002', '192.168.1.2', 'Republic of Korea', 'korea', 'ON', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '010-8105-0384', '0000', 'Green Retail Demo', '010-8105-0384'),
      ('GE-TH01', 'GE-TH01', 'GE2024010007', '192.168.1.3', 'Bangkok', 'thailand', 'OFF', 'demo@ge-serverhub.com', 'demo@ge-serverhub.com', '02-555-1199', '0000', 'Thailand Demo', '02-555-1199')
    `);
    console.log('Seeded demo devices (GE01, GE02, GE-TH01).');
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
          [nextId++, device.deviceID, recordTime, beforeKwh, afterKwh],
        );
      }
    }
    console.log('Seeded 12 months of power_records per device.');
  }

  const [[{ rateCount }]] = await db.query(
    'SELECT COUNT(*) AS rateCount FROM ge_electricity_rates',
  );
  if (Number(rateCount) === 0) {
    const koreaRate = Number(process.env.KOREA_ELECTRICITY_RATE || 140);
    const thailandRate = Number(process.env.THAILAND_ELECTRICITY_RATE || 3.88);
    await db.query(
      `INSERT INTO ge_electricity_rates (site, rate_per_kwh, effective_from, label, is_active)
       VALUES
       ('korea', ?, '2020-01-01 00:00:00', 'Default Korea rate', 1),
       ('thailand', ?, '2020-01-01 00:00:00', 'Default Thailand rate', 1)`,
      [koreaRate, thailandRate],
    );
    console.log(`Seeded ge_electricity_rates (korea=${koreaRate}, thailand=${thailandRate}).`);
  }
}

async function verifyTables(db) {
  const [rows] = await db.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
    [DB_NAME],
  );
  const existing = new Set(rows.map((r) => String(r.TABLE_NAME)));
  const missing = EXPECTED_TABLES.filter((t) => !existing.has(t));
  console.log(`\nTables in ${DB_NAME}: ${existing.size}`);
  if (missing.length) {
    console.warn('Missing expected tables:', missing.join(', '));
  } else {
    console.log('All expected GE Energy tables are present.');
  }
}

async function main() {
  const adminCfg = getAdminConfig();
  console.log(`Database setup → ${DB_NAME} @ ${adminCfg.host}:${adminCfg.port}\n`);

  const admin = await mysql.createConnection({
    ...adminCfg,
    multipleStatements: true,
  });

  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );

  if (USE_RESTORE) {
    await restoreFromDump(admin);
  } else if (!SKIP_PRISMA) {
    await runPrismaPush();
  }

  console.log('\nApplying GE Energy SQL migrations:');
  for (const file of SQL_FILES) {
    await runSqlFile(admin, file);
  }
  await admin.end();

  const db = await mysql.createConnection({ ...adminCfg, database: DB_NAME });

  if (!SKIP_SEED) {
    console.log('\nSeeding demo data (if empty)…');
    await seedDemoData(db);
  }

  await verifyTables(db);
  await db.end();

  console.log('\nDone. Verify: npm run db:check');
  console.log('Energy-only refresh: npm run db:setup-energy');
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message || err);
  process.exit(1);
});
