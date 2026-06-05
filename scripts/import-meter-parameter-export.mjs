/**
 * Import meter parameter export (Date Time | Meter | Parameter | Phase | Value) into power_records.
 *
 * Usage:
 *   npm run db:import-meter-export -- --file=export.txt --device=3
 *   npm run db:import-meter-export -- --file=export.txt --device=GE-TH01 --force
 *   cat export.txt | npm run db:import-meter-export -- --device=3
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { parseMeterExportToRecords } from './lib/meter-parameter-import.mjs';
import { printWindowsDbHelp, runInWsl, shouldFallbackToWsl } from './lib/wsl-db-fallback.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const FORCE = process.argv.includes('--force');
const NO_ESTIMATE = process.argv.includes('--no-estimate-current');
const fileArg = process.argv.find((a) => a.startsWith('--file='))?.split('=').slice(1).join('=');
const deviceArg = process.argv.find((a) => a.startsWith('--device='))?.split('=')[1]?.trim();

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

async function resolveDeviceId(conn, filter) {
  if (!filter) throw new Error('--device=<id|GEsaveID|deviceName> is required');
  const idNum = Number(filter);
  const [rows] = await conn.query(
    `SELECT deviceID FROM devices WHERE deviceID = ? OR GEsaveID = ? OR deviceName = ? LIMIT 1`,
    [Number.isFinite(idNum) ? idNum : -1, filter, filter],
  );
  if (!rows.length) throw new Error(`Device not found: ${filter}`);
  return rows[0].deviceID;
}

async function runImport(cfg) {
  const text = fileArg
    ? readFileSync(resolve(process.cwd(), fileArg), 'utf8')
    : readFileSync(0, 'utf8');

  const records = parseMeterExportToRecords(text, { estimateCurrent: !NO_ESTIMATE });
  if (!records.length) {
    console.error('No valid rows parsed. Expected: DD/MM/YYYY HH:mm <meter> <parameter> <phase> <value>');
    process.exit(1);
  }

  const conn = await mysql.createConnection({ ...cfg, multipleStatements: false });
  try {
    const deviceId = await resolveDeviceId(conn, deviceArg);
    console.log(`Parsed ${records.length} timestamps → device ${deviceId}`);

    if (FORCE) {
      const times = records.map((r) => r.record_time);
      const minT = times[0];
      const maxT = times[times.length - 1];
      await conn.query(
        `DELETE FROM power_records WHERE device_id = ? AND record_time >= ? AND record_time <= ?`,
        [deviceId, minT, maxT],
      );
      console.log(`  deleted existing rows ${minT} – ${maxT}`);
    }

    let inserted = 0;
    for (const rec of records) {
      const cols = ['device_id', 'record_time'];
      const vals = [deviceId, rec.record_time];
      for (const [k, v] of Object.entries(rec)) {
        if (k === 'record_time' || v == null) continue;
        cols.push(k);
        vals.push(v);
      }
      await conn.query(
        `INSERT INTO power_records (${cols.join(', ')}, created_by) VALUES (${cols.map(() => '?').join(', ')}, 'meter-export-import')`,
        vals,
      );
      inserted += 1;
    }

    const sample = records.find((r) => r.before_current_L1 != null) ?? records[0];
    console.log('Sample record:', JSON.stringify(sample, null, 2));
    console.log(`Done. Inserted ${inserted} power_records.`);
  } finally {
    await conn.end();
  }
}

async function main() {
  const cfg = getConfig();
  const noFallback = process.argv.includes('--no-wsl-fallback');
  try {
    await runImport(cfg);
  } catch (err) {
    if (shouldFallbackToWsl(err, noFallback)) {
      runInWsl(`npm run db:import-meter-export -- --no-wsl-fallback ${process.argv.slice(2).join(' ')}`, {
        label: 'db:import-meter-export',
      });
      return;
    }
    printWindowsDbHelp();
    console.error(err);
    process.exit(1);
  }
}

main();
