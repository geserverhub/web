import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(ROOT, '.env.local') });
config({ path: resolve(ROOT, '.env') });

const meter = process.argv.find((a) => a.startsWith('--meter='))?.split('=')[1]?.trim();
const customer = process.argv.find((a) => a.startsWith('--customer='))?.split('=')[1]?.trim();
if (!meter || !customer) {
  console.error('Usage: node scripts/update-device-customer.mjs --meter=GE-KR-0001 --customer=Homemart');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
const u = new URL(url);
const conn = await mysql.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ''),
});

const [cols] = await conn.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices'
     AND COLUMN_NAME IN ('GEsaveID', 'geID', 'ksaveID')`,
);
const idCol = cols[0]?.COLUMN_NAME || 'geID';

const [res] = await conn.query(
  `UPDATE devices SET customerName = ? WHERE ${idCol} = ? OR deviceName = ?`,
  [customer, meter, meter],
);
const [rows] = await conn.query(
  `SELECT deviceID, deviceName, customerName, ${idCol} AS meter_id FROM devices WHERE ${idCol} = ? LIMIT 1`,
  [meter],
);
const device = rows[0] ?? null;
let eqCustomersUpdated = 0;
if (device?.deviceID) {
  try {
    const [eqRes] = await conn.query(
      `UPDATE eq_customers c
       INNER JOIN eq_sites s ON s.customer_id = c.id
       INNER JOIN eq_device_sites ds ON ds.site_id = s.id
       SET c.customer_name = ?
       WHERE ds.device_id = ?`,
      [customer, device.deviceID],
    );
    eqCustomersUpdated = eqRes.affectedRows;
  } catch {
    /* eq_* tables optional */
  }
}
console.log(
  JSON.stringify({ updated: res.affectedRows, eqCustomersUpdated, device }, null, 2),
);
await conn.end();
