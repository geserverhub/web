/**
 * Create Energy Quality report tables (eq_customers, eq_sites, eq_energy_data, …)
 * Usage: npm run db:migrate-energy-quality-report
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { printWindowsDbHelp, runInWsl, shouldFallbackToWsl } from './lib/wsl-db-fallback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

function getConfig() {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('mysql://')) {
    const u = new URL(url);
    return {
      host: process.env.DB_HOST || u.hostname || '127.0.0.1',
      port: Number(process.env.DB_PORT || u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: (process.env.DB_NAME || u.pathname.replace(/^\//, '') || 'goeunserverhub').trim(),
    };
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'geserverhub',
    password: process.env.DB_PASSWORD || '',
    database: (process.env.DB_NAME || 'goeunserverhub').trim(),
  };
}

async function backfillFromDevices(conn) {
  const [devices] = await conn.query(
    `SELECT deviceID, deviceName, geID, location, site, ipAddress,
            customerName, customerPhone, customerAddress, client_id
     FROM devices`,
  );
  let linked = 0;
  for (const d of devices) {
    const name = String(d.customerName || d.deviceName || `Device ${d.deviceID}`).trim();
    const [existing] = await conn.query(
      `SELECT ds.device_id FROM eq_device_sites ds WHERE ds.device_id = ? LIMIT 1`,
      [d.deviceID],
    );
    if (existing.length) continue;

    const [custRes] = await conn.query(
      `INSERT INTO eq_customers (customer_name, business_type, address, contact_person, phone, legacy_client_id)
       VALUES (?, 'Industrial / Commercial', ?, ?, ?, ?)`,
      [
        name,
        d.customerAddress || d.location || null,
        name,
        d.customerPhone || d.phone || null,
        d.client_id || null,
      ],
    );
    const customerId = custRes.insertId;

    const [siteRes] = await conn.query(
      `INSERT INTO eq_sites (customer_id, site_name, location, site_region, voltage_system)
       VALUES (?, ?, ?, ?, '3-Phase 400V')`,
      [
        customerId,
        d.deviceName || name,
        d.location || null,
        d.site || 'thailand',
      ],
    );
    const siteId = siteRes.insertId;

    await conn.query(
      `INSERT INTO eq_device_sites (device_id, site_id, measurement_point, gateway_id)
       VALUES (?, ?, ?, ?)`,
      [d.deviceID, siteId, d.deviceName || null, d.geID || d.ipAddress || null],
    );
    linked += 1;
  }
  console.log(`Backfill: linked ${linked} device(s) to eq_customers / eq_sites`);
}

async function applyMigration(cfg) {
  const raw = readFileSync(resolve(ROOT, 'prisma/migrate-energy-quality-report.sql'), 'utf8');
  const sql = raw.replace(/USE\s+[\w`]+\s*;/gi, `USE \`${cfg.database}\`;`);
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
  try {
    console.log(`Applying energy-quality-report schema → ${cfg.database} @ ${cfg.host}:${cfg.port}`);
    await conn.query(sql);
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'eq_%'`,
      [cfg.database],
    );
    console.log('Tables:', tables.map((r) => r.TABLE_NAME).join(', '));
    await backfillFromDevices(conn);
    console.log('Done: migrate-energy-quality-report.sql');
  } finally {
    await conn.end();
  }
}

async function main() {
  const cfg = getConfig();
  const noFallback = process.argv.includes('--no-wsl-fallback');
  try {
    await applyMigration(cfg);
  } catch (err) {
    if (shouldFallbackToWsl(err, noFallback)) {
      runInWsl('npm run db:migrate-energy-quality-report -- --no-wsl-fallback', {
        label: 'db:migrate-energy-quality-report',
      });
      return;
    }
    printWindowsDbHelp();
    console.error(err);
    process.exit(1);
  }
}

main();
