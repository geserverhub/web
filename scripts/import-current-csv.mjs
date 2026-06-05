/**
 * Import CH1 phase current CSV files into power_records_preinstall.
 *
 * Usage:
 *   npm run db:import-current-csv -- --meter=GE-KR-0001 --l1=current1.csv --l2=current2.csv --l3=current3.csv
 *   npm run db:import-current-csv -- --meter=GE-KR-0001 --l1="G:\path\current1.csv" --force
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import {
  mergePhaseCurrentMaps,
  parseCurrentCsv,
} from './lib/current-csv-import.mjs';
import { printWindowsDbHelp, runInWsl, shouldFallbackToWsl } from './lib/wsl-db-fallback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const FORCE = process.argv.includes('--force');
const NO_FALLBACK = process.argv.includes('--no-wsl-fallback');

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : null;
}

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

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0].c) > 0;
}

async function resolveMeterIdColumn(conn) {
  for (const name of ['GEsaveID', 'geID', 'ksaveID']) {
    if (await columnExists(conn, 'devices', name)) return name;
  }
  return null;
}

async function ensurePreinstallColumns(conn) {
  const adds = [
    ['before_L1', 'DECIMAL(10,2) DEFAULT NULL', 'record_time'],
    ['before_L2', 'DECIMAL(10,2) DEFAULT NULL', 'before_L1'],
    ['before_L3', 'DECIMAL(10,2) DEFAULT NULL', 'before_L2'],
    ['before_current_L1', 'DECIMAL(10,2) DEFAULT NULL', 'before_L3'],
    ['before_current_L2', 'DECIMAL(10,2) DEFAULT NULL', 'before_current_L1'],
    ['before_current_L3', 'DECIMAL(10,2) DEFAULT NULL', 'before_current_L2'],
  ];
  for (const [name, type, after] of adds) {
    if (await columnExists(conn, 'power_records_preinstall', name)) continue;
    const hasAfter = await columnExists(conn, 'power_records_preinstall', after);
    const afterClause = hasAfter ? ` AFTER ${after}` : '';
    await conn.query(`ALTER TABLE power_records_preinstall ADD COLUMN ${name} ${type}${afterClause}`);
    console.log(`  added power_records_preinstall.${name}`);
  }
}

async function resolveOrCreateDevice(conn, meterId, opts = {}) {
  const idCol = await resolveMeterIdColumn(conn);
  if (!idCol) throw new Error('devices table has no GEsaveID / geID / ksaveID column');

  const [rows] = await conn.query(
    `SELECT deviceID, deviceName, ${idCol} AS meter_id FROM devices
     WHERE ${idCol} = ? OR deviceName = ? OR deviceID = ?
     LIMIT 1`,
    [meterId, meterId, Number.isFinite(Number(meterId)) ? Number(meterId) : -1],
  );
  if (rows.length) {
    return { deviceID: rows[0].deviceID, deviceName: rows[0].deviceName, GEsaveID: rows[0].meter_id };
  }

  const hasScope = await columnExists(conn, 'devices', 'record_scope');
  const cols = ['deviceName', idCol, 'location', 'site', 'status', 'U_email', 'P_email', 'phone', 'pass_phone', 'customerName'];
  const vals = [
    opts.deviceName || meterId,
    meterId,
    opts.location || 'Bangkok',
    opts.site || 'thailand',
    'OK',
    'no-reply@ge.local',
    'no-reply@ge.local',
    '-',
    '-',
    opts.customerName || 'Homemart',
  ];
  if (hasScope) {
    cols.push('record_scope');
    vals.push('pre_install');
  }
  const [res] = await conn.query(
    `INSERT INTO devices (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    vals,
  );
  console.log(`  created device ${meterId} (deviceID=${res.insertId}, column ${idCol})`);
  return { deviceID: res.insertId, deviceName: vals[0], GEsaveID: meterId };
}

async function runImport(cfg) {
  const meterId = arg('meter') || arg('device');
  const l1Path = arg('l1');
  const l2Path = arg('l2');
  const l3Path = arg('l3');
  if (!meterId) throw new Error('--meter=GE-KR-0001 is required');
  if (!l1Path && !l2Path && !l3Path) {
    throw new Error('At least one of --l1= --l2= --l3= CSV paths is required');
  }

  const l1Map = l1Path ? parseCurrentCsv(readFileSync(resolve(l1Path), 'utf8'), 'l1') : new Map();
  const l2Map = l2Path ? parseCurrentCsv(readFileSync(resolve(l2Path), 'utf8'), 'l2') : new Map();
  const l3Map = l3Path ? parseCurrentCsv(readFileSync(resolve(l3Path), 'utf8'), 'l3') : new Map();

  console.log(`L1 rows: ${l1Map.size}, L2 rows: ${l2Map.size}, L3 rows: ${l3Map.size}`);

  const records = mergePhaseCurrentMaps(l1Map, l2Map, l3Map);
  if (!records.length) {
    console.error('No records merged from CSV files.');
    process.exit(1);
  }

  const conn = await mysql.createConnection({ ...cfg, multipleStatements: false });
  try {
    await ensurePreinstallColumns(conn);
    const device = await resolveOrCreateDevice(conn, meterId, {
      customerName: arg('customer') || 'Homemart',
      location: arg('location') || 'Bangkok',
      site: arg('site') || 'thailand',
    });
    const deviceId = device.deviceID;
    console.log(`Target device: ${device.deviceName} (ID ${deviceId}, GEsaveID ${device.GEsaveID})`);

    if (FORCE) {
      const minT = records[0].record_time;
      const maxT = records[records.length - 1].record_time;
      const [del] = await conn.query(
        `DELETE FROM power_records_preinstall WHERE device_id = ? AND record_time >= ? AND record_time <= ?`,
        [deviceId, minT, maxT],
      );
      console.log(`  deleted ${del.affectedRows} existing rows (${minT} – ${maxT})`);
    }

    let inserted = 0;
    let skipped = 0;
    const BATCH = 200;
    for (let i = 0; i < records.length; i += BATCH) {
      const chunk = records.slice(i, i + BATCH);
      for (const rec of chunk) {
        try {
          await conn.query(
            `INSERT INTO power_records_preinstall (
              device_id, record_time,
              before_L1, before_L2, before_L3,
              before_current_L1, before_current_L2, before_current_L3
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              deviceId,
              rec.record_time,
              rec.before_L1,
              rec.before_L2,
              rec.before_L3,
              rec.before_current_L1,
              rec.before_current_L2,
              rec.before_current_L3,
            ],
          );
          inserted += 1;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            skipped += 1;
            continue;
          }
          throw err;
        }
      }
    }

    console.log('Sample:', JSON.stringify(records[0], null, 2));
    console.log(`Done. Inserted ${inserted} rows into power_records_preinstall (${skipped} duplicates skipped).`);
    console.log(`Period: ${records[0].record_time} → ${records[records.length - 1].record_time}`);
  } finally {
    await conn.end();
  }
}

async function main() {
  const cfg = getConfig();
  try {
    await runImport(cfg);
  } catch (err) {
    if (shouldFallbackToWsl(err, NO_FALLBACK)) {
      runInWsl(`npm run db:import-current-csv -- --no-wsl-fallback ${process.argv.slice(2).join(' ')}`, {
        label: 'db:import-current-csv',
      });
      return;
    }
    printWindowsDbHelp();
    console.error(err);
    process.exit(1);
  }
}

main();
