/**
 * Seed rich demo data for Energy Quality reports:
 * - eq_customers / eq_sites / eq_device_sites (backfill)
 * - power_records: 24h history @ 5 min with full CH1/CH2 metrics
 * - eq_energy_data: latest live snapshot
 *
 * Usage:
 *   npm run db:seed-energy-quality-report
 *   npm run db:seed-energy-quality-report -- --force   # replace last 24h history
 *   npm run db:seed-energy-quality-report -- --device=GE-TH01
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { printWindowsDbHelp, runInWsl, shouldFallbackToWsl } from './lib/wsl-db-fallback.mjs';
import { METER1_REFERENCE, estimateMeter1PhaseCurrent } from './lib/meter-parameter-import.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const FORCE = process.argv.includes('--force');
const DEVICE_FILTER = process.argv.find((a) => a.startsWith('--device='))?.split('=')[1]?.trim();

const HOURS = 24;
const INTERVAL_MIN = 5;
const POINTS = Math.floor((HOURS * 60) / INTERVAL_MIN);

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

function round(n, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Daily load curve 0–1 (factory profile). */
function loadFactor(hour, minute) {
  const t = hour + minute / 60;
  if (t >= 8 && t < 12) return 0.85 + Math.sin((t - 8) * 0.8) * 0.1;
  if (t >= 13 && t < 17) return 0.9 + Math.sin((t - 13) * 0.7) * 0.08;
  if (t >= 17 && t < 20) return 0.55 + (t - 17) * 0.05;
  if (t >= 6 && t < 8) return 0.4 + (t - 6) * 0.15;
  return 0.25 + Math.sin(t * 0.5) * 0.05;
}

function genPoint(baseTime, idx, deviceId) {
  const recordTime = new Date(baseTime.getTime() - (POINTS - 1 - idx) * INTERVAL_MIN * 60_000);
  const hour = recordTime.getHours();
  const minute = recordTime.getMinutes();
  const lf = loadFactor(hour, minute);
  const noise = () => (Math.random() - 0.5) * 4;
  const seed = deviceId * 0.17 + idx * 0.003;

  const [refI1, refI2, refI3] = estimateMeter1PhaseCurrent();
  const load = 0.35 + lf * 0.65;
  const i1 = round(refI1 * load + noise() + Math.sin(seed) * 4, 2);
  const i2 = round(refI2 * load + noise() + Math.sin(seed + 1) * 3.5, 2);
  const i3 = round(refI3 * load + noise() + Math.sin(seed + 2) * 3.5, 2);
  const v1 = round(METER1_REFERENCE.voltageLL[0] + noise() * 0.8, 2);
  const v2 = round(METER1_REFERENCE.voltageLL[1] + noise() * 0.8, 2);
  const v3 = round(METER1_REFERENCE.voltageLL[2] + noise() * 0.8, 2);
  const beforePf = round(METER1_REFERENCE.powerFactor + (Math.random() - 0.5) * 0.015, 3);
  const beforeThd = round(
    (METER1_REFERENCE.voltageThd[0] + METER1_REFERENCE.voltageThd[1] + METER1_REFERENCE.voltageThd[2]) / 3 +
      (Math.random() - 0.5) * 0.2,
    3,
  );
  const freq = round(METER1_REFERENCE.frequency + (Math.random() - 0.5) * 0.06, 3);

  const beforeP = round((Math.sqrt(3) * ((v1 + v2 + v3) / 3) * ((i1 + i2 + i3) / 3) * beforePf) / 1000, 3);
  const beforeS = round(beforeP / Math.max(beforePf, 0.01), 3);
  const beforeQ = round(Math.sqrt(Math.max(0, beforeS ** 2 - beforeP ** 2)), 3);

  const kwhStep = round((beforeP * INTERVAL_MIN) / 60 / 1000, 3);
  const beforeKwh = round(12000 + idx * kwhStep + deviceId * 50, 3);

  return {
    recordTime,
    v1,
    v2,
    v3,
    i1,
    i2,
    i3,
    beforePf,
    beforeThd,
    freq,
    beforeP,
    beforeS,
    beforeQ,
    beforeKwh,
  };
}

async function tableExists(conn, name) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [name],
  );
  return Number(rows[0].c) > 0;
}

async function ensureEqSchema(conn) {
  if (await tableExists(conn, 'eq_customers')) return true;
  console.warn('eq_* tables missing — run: npm run db:migrate-energy-quality-report');
  return false;
}

async function backfillEqLinks(conn) {
  const [devices] = await conn.query(
    `SELECT deviceID, deviceName, geID, location, site, ipAddress,
            customerName, customerPhone, customerAddress, client_id
     FROM devices`,
  );
  let linked = 0;
  let updated = 0;

  const businessBySite = {
    thailand: 'Manufacturing / Industrial',
    korea: 'Electronics / Factory',
    vietnam: 'Food Processing',
    malaysia: 'Commercial Building',
  };

  for (const d of devices) {
    const name = String(d.customerName || d.deviceName || `Device ${d.deviceID}`).trim();
    const siteRegion = String(d.site || 'thailand').toLowerCase();
    const biz = businessBySite[siteRegion] || 'Industrial / Commercial';

    const [existing] = await conn.query(
      `SELECT ds.device_id, c.id AS customer_id, s.id AS site_id
       FROM eq_device_sites ds
       JOIN eq_sites s ON s.id = ds.site_id
       JOIN eq_customers c ON c.id = s.customer_id
       WHERE ds.device_id = ? LIMIT 1`,
      [d.deviceID],
    );

    if (existing.length) {
      const row = existing[0];
      await conn.query(
        `UPDATE eq_customers SET
          customer_name = ?, business_type = ?, address = ?,
          contact_person = ?, phone = ?, email = ?
         WHERE id = ?`,
        [
          name,
          biz,
          d.customerAddress || d.location || `${d.location || 'Site'}, ${siteRegion}`,
          name,
          d.customerPhone || d.phone || '02-000-0000',
          `contact@${String(d.geID || d.deviceName).toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
          row.customer_id,
        ],
      );
      await conn.query(
        `UPDATE eq_sites SET
          site_name = ?, location = ?, site_region = ?,
          transformer_size = '500 kVA', contract_demand = 350.000, voltage_system = '3-Phase 400V'
         WHERE id = ?`,
        [d.deviceName || name, d.location || null, siteRegion, row.site_id],
      );
      updated += 1;
      continue;
    }

    const [custRes] = await conn.query(
      `INSERT INTO eq_customers (customer_name, business_type, address, contact_person, phone, email, legacy_client_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        biz,
        d.customerAddress || d.location || null,
        name,
        d.customerPhone || null,
        `contact@${String(d.geID || d.deviceName).toLowerCase().replace(/[^a-z0-9]/g, '')}.local`,
        d.client_id || null,
      ],
    );
    const customerId = custRes.insertId;

    const [siteRes] = await conn.query(
      `INSERT INTO eq_sites (customer_id, site_name, location, site_region, transformer_size, contract_demand, voltage_system)
       VALUES (?, ?, ?, ?, '500 kVA', 350.000, '3-Phase 400V')`,
      [customerId, d.deviceName || name, d.location || null, siteRegion],
    );
    const siteId = siteRes.insertId;

    await conn.query(
      `INSERT INTO eq_device_sites (device_id, site_id, measurement_point, gateway_id)
       VALUES (?, ?, ?, ?)`,
      [d.deviceID, siteId, d.deviceName || null, d.geID || d.ipAddress || null],
    );
    linked += 1;
  }
  console.log(`eq_customers/sites: linked ${linked}, updated ${updated}`);
}

async function ensureCurrentColumns(conn) {
  const preinstallExtras = [
    ['power_records_preinstall', 'before_L1', 'DECIMAL(10,2) DEFAULT NULL', 'record_time'],
    ['power_records_preinstall', 'before_L2', 'DECIMAL(10,2) DEFAULT NULL', 'before_L1'],
    ['power_records_preinstall', 'before_L3', 'DECIMAL(10,2) DEFAULT NULL', 'before_L2'],
    ['power_records_preinstall', 'before_P', 'DECIMAL(12,3) DEFAULT NULL', 'before_current_L3'],
    ['power_records_preinstall', 'before_Q', 'DECIMAL(12,3) DEFAULT NULL', 'before_P'],
    ['power_records_preinstall', 'before_S', 'DECIMAL(12,3) DEFAULT NULL', 'before_Q'],
    ['power_records_preinstall', 'before_PF', 'DECIMAL(6,3) DEFAULT NULL', 'before_S'],
    ['power_records_preinstall', 'before_THD', 'DECIMAL(8,3) DEFAULT NULL', 'before_PF'],
    ['power_records_preinstall', 'before_F', 'DECIMAL(8,3) DEFAULT NULL', 'before_THD'],
  ];
  const currentCols = [
    ['power_records', 'before_current_L1', 'before_L3'],
    ['power_records', 'before_current_L2', 'before_current_L1'],
    ['power_records', 'before_current_L3', 'before_current_L2'],
    ['power_records_preinstall', 'before_current_L1', 'before_L3'],
    ['power_records_preinstall', 'before_current_L2', 'before_current_L1'],
    ['power_records_preinstall', 'before_current_L3', 'before_current_L2'],
  ];

  async function addColIfMissing(table, name, type, after) {
    if (!(await tableExists(conn, table))) return;
    const [exists] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, name],
    );
    if (Number(exists[0].c)) return;
    const [afterExists] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, after],
    );
    const afterClause = Number(afterExists[0].c) ? ` AFTER ${after}` : '';
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}${afterClause}`);
    console.log(`  added ${table}.${name}`);
  }

  for (const [table, name, type, after] of preinstallExtras) {
    await addColIfMissing(table, name, type, after);
  }
  for (const [table, name, after] of currentCols) {
    await addColIfMissing(table, name, 'DECIMAL(10,2) DEFAULT NULL', after);
  }
}

async function configureDevicesForCh1Report(conn) {
  try {
    const [cols] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'record_scope'`,
    );
    if (!Number(cols[0].c)) return;
    await conn.query(
      `UPDATE devices SET record_scope = 'pre_install'
       WHERE record_scope IS NULL OR record_scope = '' OR record_scope = 'both'`,
    );
    console.log('  devices.record_scope → pre_install (CH1 only)');
  } catch {
    /* optional column */
  }
}

async function backfillMissingCurrent(conn, table) {
  if (!(await tableExists(conn, table))) return;
  const [res] = await conn.query(
    `UPDATE ${table}
     SET
       before_current_L1 = IF(
         before_current_L1 IS NULL AND before_L1 IS NOT NULL AND before_L1 > 0 AND before_L1 < 50,
         before_L1, before_current_L1),
       before_current_L2 = IF(
         before_current_L2 IS NULL AND before_L2 IS NOT NULL AND before_L2 > 0 AND before_L2 < 50,
         before_L2, before_current_L2),
       before_current_L3 = IF(
         before_current_L3 IS NULL AND before_L3 IS NOT NULL AND before_L3 > 0 AND before_L3 < 50,
         before_L3, before_current_L3),
       before_L1 = IF(before_L1 IS NOT NULL AND before_L1 > 0 AND before_L1 < 50, 400.00, before_L1),
       before_L2 = IF(before_L2 IS NOT NULL AND before_L2 > 0 AND before_L2 < 50, 401.00, before_L2),
       before_L3 = IF(before_L3 IS NOT NULL AND before_L3 > 0 AND before_L3 < 50, 399.00, before_L3)
     WHERE (before_current_L1 IS NULL OR before_current_L2 IS NULL OR before_current_L3 IS NULL)
       AND (before_L1 IS NOT NULL OR before_L2 IS NOT NULL OR before_L3 IS NOT NULL)`,
  );
  if (res.affectedRows > 0) {
    console.log(`  backfilled ${res.affectedRows} rows in ${table} (before_current_*)`);
  }
}

async function seedPowerHistory(conn, device, table = 'power_records') {
  const deviceId = device.deviceID;
  const since = new Date();
  since.setHours(since.getHours() - HOURS);

  if (!FORCE) {
    const [recent] = await conn.query(
      `SELECT COUNT(*) AS c FROM ${table}
       WHERE device_id = ? AND record_time >= ? - INTERVAL ? HOUR
         AND before_current_L1 IS NOT NULL AND before_PF IS NOT NULL`,
      [deviceId, since, HOURS],
    );
    if (Number(recent[0].c) >= POINTS * 0.5) {
      console.log(`  device ${device.deviceName} (${deviceId}): skip — ${recent[0].c} rich records in last ${HOURS}h`);
      return { inserted: 0, skipped: true };
    }
  } else {
    await conn.query(
      `DELETE FROM ${table} WHERE device_id = ? AND record_time >= ? - INTERVAL ? HOUR`,
      [deviceId, since, HOURS + 1],
    );
  }

  const baseTime = new Date();
  const rows = [];
  for (let i = 0; i < POINTS; i++) {
    rows.push(genPoint(baseTime, i, deviceId));
  }

  const hasCreatedBy =
    table === 'power_records' &&
    (await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'created_by'`,
      [table],
    ).then(([r]) => Number(r[0].c) > 0));

  let inserted = 0;
  for (const p of rows) {
    const baseCols = `device_id, record_time, before_L1, before_L2, before_L3,
        before_current_L1, before_current_L2, before_current_L3, before_kWh,
        before_P, before_Q, before_S, before_PF, before_THD, before_F`;
    const baseVals = [
      deviceId,
      p.recordTime,
      p.v1,
      p.v2,
      p.v3,
      p.i1,
      p.i2,
      p.i3,
      p.beforeKwh,
      p.beforeP,
      p.beforeQ,
      p.beforeS,
      p.beforePf,
      p.beforeThd,
      p.freq,
    ];
    if (hasCreatedBy) {
      await conn.query(
        `INSERT INTO ${table} (${baseCols}, created_by) VALUES (${baseVals.map(() => '?').join(', ')}, 'eq-report-seed')`,
        baseVals,
      );
    } else {
      await conn.query(
        `INSERT INTO ${table} (${baseCols}) VALUES (${baseVals.map(() => '?').join(', ')})`,
        baseVals,
      );
    }
    inserted += 1;
  }
  console.log(`  device ${device.deviceName} (${deviceId}): inserted ${inserted} ${table} (${HOURS}h @ ${INTERVAL_MIN}min)`);
  return { inserted, skipped: false, latest: rows[rows.length - 1] };
}

async function seedEnergySnapshot(conn, deviceId, point) {
  if (!(await tableExists(conn, 'eq_energy_data'))) return;
  const p = point;
  const voltage = [p.v1, p.v2, p.v3];
  await conn.query(
    `INSERT INTO eq_energy_data (
      device_id, recorded_at,
      voltage_l1, voltage_l2, voltage_l3,
      current_l1, current_l2, current_l3,
      power_kw, energy_kwh, power_factor, frequency,
      thdi_l1, thdi_l2, thdi_l3,
      thdv_l1, thdv_l2, thdv_l3,
      reactive_kvar, apparent_kva, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'seed')`,
    [
      deviceId,
      p.recordTime,
      voltage[0],
      voltage[1],
      voltage[2],
      p.i1,
      p.i2,
      p.i3,
      p.beforeP,
      p.beforeKwh,
      p.beforePf,
      p.freq,
      p.beforeThd,
      p.beforeThd * 0.95,
      p.beforeThd * 1.05,
      p.beforeThd * 0.6,
      p.beforeThd * 0.62,
      p.beforeThd * 0.58,
      p.beforeQ,
      p.beforeS,
    ],
  );
}

async function runSeed(cfg) {
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: false });
  try {
    console.log(`Seeding Energy Quality report data → ${cfg.database} @ ${cfg.host}:${cfg.port}`);

    const hasPower = await tableExists(conn, 'power_records');
    if (!hasPower) {
      console.error('power_records table missing — run: npm run db:setup-energy');
      process.exit(1);
    }

    await ensureEqSchema(conn);
    await ensureCurrentColumns(conn);
    await configureDevicesForCh1Report(conn);
    await backfillMissingCurrent(conn, 'power_records');
    await backfillMissingCurrent(conn, 'power_records_preinstall');
    await backfillEqLinks(conn);

    let deviceSql = `SELECT deviceID, deviceName, geID, site FROM devices`;
    const params = [];
    if (DEVICE_FILTER) {
      deviceSql += ` WHERE deviceName = ? OR geID = ? OR deviceID = ?`;
      const idNum = Number(DEVICE_FILTER);
      params.push(DEVICE_FILTER, DEVICE_FILTER, Number.isFinite(idNum) ? idNum : -1);
    }
    const [devices] = await conn.query(deviceSql, params);
    if (!devices.length) {
      console.warn('No devices found' + (DEVICE_FILTER ? ` for filter ${DEVICE_FILTER}` : ''));
      return;
    }

    let totalRecords = 0;
    for (const device of devices) {
      let scopeRow = null;
      try {
        const [scopeRows] = await conn.query(
          `SELECT record_scope FROM devices WHERE deviceID = ? LIMIT 1`,
          [device.deviceID],
        );
        scopeRow = scopeRows[0] ?? null;
      } catch {
        scopeRow = null;
      }
      const table =
        scopeRow?.record_scope === 'pre_install' && (await tableExists(conn, 'power_records_preinstall'))
          ? 'power_records_preinstall'
          : 'power_records';
      const result = await seedPowerHistory(conn, device, table);
      if (!result.skipped && result.latest) {
        await seedEnergySnapshot(conn, device.deviceID, result.latest);
        totalRecords += result.inserted;
      }
    }

    const [summary] = await conn.query(
      `SELECT d.deviceName, COUNT(pr.id) AS cnt,
              MAX(pr.record_time) AS last_rec,
              MAX(pr.before_PF) AS max_pf
       FROM devices d
       LEFT JOIN power_records pr ON pr.device_id = d.deviceID
         AND pr.record_time >= NOW() - INTERVAL 24 HOUR
       GROUP BY d.deviceID, d.deviceName`,
    );
    console.log('\nSummary (last 24h):');
    for (const row of summary) {
      console.log(`  ${row.deviceName}: ${row.cnt} records, last=${row.last_rec}, max PF=${row.max_pf}`);
    }
    console.log(`\nDone. Inserted ${totalRecords} new power_records.`);
    console.log('Open Energy Quality Report, select a meter, and refresh.');
  } finally {
    await conn.end();
  }
}

async function main() {
  const cfg = getConfig();
  const noFallback = process.argv.includes('--no-wsl-fallback');
  try {
    await runSeed(cfg);
  } catch (err) {
    if (shouldFallbackToWsl(err, noFallback)) {
      runInWsl('npm run db:seed-energy-quality-report -- --no-wsl-fallback', {
        label: 'db:seed-energy-quality-report',
      });
      return;
    }
    printWindowsDbHelp();
    console.error(err);
    process.exit(1);
  }
}

main();
