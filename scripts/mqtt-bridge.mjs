/**
 * GE Energy MQTT bridge — subscribe MQTT telemetry and write to goeunserverhub.power_records.
 *
 * Usage:
 *   npm run mqtt:bridge
 *
 * Env (.env.local):
 *   MQTT_BRIDGE_HOST, MQTT_BRIDGE_PORT, MQTT_BRIDGE_USER, MQTT_BRIDGE_PASS
 *   MQTT_BRIDGE_TOPIC=ge/#          (override subscribe pattern)
 *   MQTT_BRIDGE_SITES=thailand,korea  (load broker creds from mqtt_settings per site)
 *
 * When MQTT_BRIDGE_SITES is set, DB mqtt_settings rows are merged (host/port/user/pass/topic_prefix).
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import mqtt from 'mqtt';
import mysql from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const DB_NAME = 'goeunserverhub';

function getDbConfig() {
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

function decodePassword(stored) {
  if (!stored) return '';
  try {
    return Buffer.from(stored, 'base64').toString('utf8');
  } catch {
    return stored;
  }
}

function log(level, msg, extra) {
  const ts = new Date().toISOString();
  const tail = extra ? ` ${JSON.stringify(extra)}` : '';
  console.log(`[${ts}] [mqtt-bridge] [${level}] ${msg}${tail}`);
}

const SCOPE_TO_TABLE = {
  installed: 'power_records',
  pre_install: 'power_records_preinstall',
};

const OPTIONAL_FIELDS = [
  'before_meter_no',
  'metrics_meter_no',
  'before_L1',
  'before_L2',
  'before_L3',
  'before_current_L1',
  'before_current_L2',
  'before_current_L3',
  'before_kWh',
  'before_P',
  'before_Q',
  'before_S',
  'before_PF',
  'before_THD',
  'before_F',
  'metrics_L1',
  'metrics_L2',
  'metrics_L3',
  'metrics_kWh',
  'metrics_P',
  'metrics_Q',
  'metrics_S',
  'metrics_PF',
  'metrics_THD',
  'metrics_F',
];

function normalizeScope(scope) {
  if (!scope) return null;
  const n = String(scope).trim().toLowerCase();
  if (n === 'installed') return 'installed';
  if (n === 'pre_install' || n === 'pre-install' || n === 'preinstall') return 'pre_install';
  return null;
}

/** First matching key; supports after_* aliases for metrics_* DB columns. */
function num(raw, ...keys) {
  for (const key of keys) {
    const v = raw[key];
    if (v === undefined || v === null || v === '') continue;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mqtt_settings (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      site varchar(20) NOT NULL DEFAULT 'thailand',
      host varchar(255) NOT NULL,
      port int NOT NULL DEFAULT 1883,
      username varchar(255) DEFAULT NULL,
      password varchar(512) DEFAULT NULL,
      topic varchar(255) DEFAULT NULL,
      topic_prefix varchar(255) DEFAULT 'ge',
      \`interval\` int NOT NULL DEFAULT 30,
      gateway_model varchar(50) DEFAULT 'T310',
      serial_port varchar(100) DEFAULT '/dev/ttyS1',
      baud_rate int NOT NULL DEFAULT 9600,
      parity varchar(10) NOT NULL DEFAULT 'none',
      data_bits tinyint NOT NULL DEFAULT 8,
      stop_bits tinyint NOT NULL DEFAULT 1,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_mqtt_user_site (user_id, site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_connectivity (
      id int NOT NULL AUTO_INCREMENT,
      device_id int NOT NULL,
      gateway_model varchar(50) DEFAULT 'T310',
      serial_port varchar(100) DEFAULT '/dev/ttyS1',
      baud_rate int NOT NULL DEFAULT 9600,
      parity varchar(10) NOT NULL DEFAULT 'none',
      data_bits tinyint NOT NULL DEFAULT 8,
      stop_bits tinyint NOT NULL DEFAULT 1,
      slave_before int NOT NULL DEFAULT 1,
      slave_metrics int NOT NULL DEFAULT 2,
      reg_v_l1 int NOT NULL DEFAULT 0,
      reg_v_l2 int NOT NULL DEFAULT 2,
      reg_v_l3 int NOT NULL DEFAULT 4,
      scale_voltage decimal(10,4) NOT NULL DEFAULT 10.0000,
      mqtt_topic varchar(255) DEFAULT NULL,
      publish_interval_sec int NOT NULL DEFAULT 30,
      enabled tinyint(1) NOT NULL DEFAULT 1,
      notes text DEFAULT NULL,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_device_connectivity_device (device_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function loadMqttProfiles(pool) {
  const sitesEnv = process.env.MQTT_BRIDGE_SITES;
  const sites = sitesEnv
    ? sitesEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  let rows;
  if (sites?.length) {
    const placeholders = sites.map(() => '?').join(',');
    [rows] = await pool.query(
      `SELECT site, host, port, username, password, topic, topic_prefix
       FROM mqtt_settings
       WHERE site IN (${placeholders})
       ORDER BY site`,
      sites
    );
  } else {
    [rows] = await pool.query(
      `SELECT site, host, port, username, password, topic, topic_prefix
       FROM mqtt_settings
       ORDER BY site`
    );
  }

  const fromDb = rows.map((r) => ({
    site: r.site,
    host: r.host,
    port: Number(r.port) || 1883,
    username: r.username || '',
    password: decodePassword(r.password),
    topic: r.topic?.trim() || null,
    topic_prefix: r.topic_prefix?.trim() || 'ge',
  }));

  if (fromDb.length > 0) return fromDb;

  const host = process.env.MQTT_BRIDGE_HOST;
  if (!host) return [];

  return [
    {
      site: 'env',
      host,
      port: Number(process.env.MQTT_BRIDGE_PORT || 1883),
      username: process.env.MQTT_BRIDGE_USER || '',
      password: process.env.MQTT_BRIDGE_PASS || '',
      topic: process.env.MQTT_BRIDGE_TOPIC?.trim() || null,
      topic_prefix: process.env.MQTT_BRIDGE_TOPIC_PREFIX?.trim() || 'ge',
    },
  ];
}

async function resolveDeviceId(pool, raw) {
  const direct = raw.device_id ?? raw.deviceId ?? raw.deviceID ?? raw.id;
  if (direct != null && !Number.isNaN(Number(direct))) return Number(direct);

  const GEsaveID = raw.GEsaveID ?? raw.GEsaveID ?? raw.ge_id;
  if (!GEsaveID) return null;

  const [rows] = await pool.query('SELECT deviceID FROM devices WHERE GEsaveID = ? LIMIT 1', [
    String(GEsaveID).trim(),
  ]);
  if (!rows.length) return null;
  return Number(rows[0].deviceID);
}

async function isDeviceEnabled(pool, deviceId) {
  const [rows] = await pool.query(
    'SELECT enabled FROM device_connectivity WHERE device_id = ? LIMIT 1',
    [deviceId]
  );
  if (!rows.length) return true;
  return rows[0].enabled === 1 || rows[0].enabled === true;
}

async function resolveRecordScope(pool, deviceId, payloadScope) {
  const normalized = normalizeScope(payloadScope);
  if (normalized) return normalized;

  const [cols] = await pool.query(
    `SELECT COUNT(*) AS total FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'record_scope'`
  );
  if (Number(cols[0]?.total || 0) === 0) return 'installed';

  const [rows] = await pool.query('SELECT record_scope FROM devices WHERE deviceID = ? LIMIT 1', [
    deviceId,
  ]);
  return normalizeScope(rows[0]?.record_scope) || 'installed';
}

async function savePowerRecord(pool, body) {
  const deviceId = body.device_id;
  const [check] = await pool.query(
    'SELECT deviceID, series_no FROM devices WHERE deviceID = ? LIMIT 1',
    [deviceId]
  );
  if (!check.length) return { ok: false, error: `Device ${deviceId} not found` };

  const deviceSeriesNo = check[0].series_no || null;
  const scope = await resolveRecordScope(pool, deviceId, body.record_scope);
  const targetTable = SCOPE_TO_TABLE[scope];
  const recordTime =
    body.record_time || new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Use AUTO_INCREMENT — do NOT specify id manually (avoids race condition)
  const columns = ['device_id', 'record_time'];
  const values = [deviceId, recordTime];

  // Populate series_no from devices table if not in payload
  const seriesNo = body.series_no || deviceSeriesNo;
  if (seriesNo && targetTable === 'power_records') {
    columns.push('series_no');
    values.push(seriesNo);
  }

  for (const field of OPTIONAL_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) {
      columns.push(field);
      values.push(body[field]);
    }
  }

  const [result] = await pool.query(
    `INSERT INTO ${targetTable} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  );
  const recordId = result.insertId;

  // Update device_connectivity: last_seen_at + online_status
  await pool.query(
    `INSERT INTO device_connectivity (device_id, last_seen_at, last_record_id, online_status)
     VALUES (?, NOW(), ?, 1)
     ON DUPLICATE KEY UPDATE
       last_seen_at   = NOW(),
       last_record_id = VALUES(last_record_id),
       online_status  = 1`,
    [deviceId, recordId]
  );

  return { ok: true, record_id: recordId, scope, targetTable, recordTime };
}

function payloadToBody(raw, deviceId) {
  const recordTime = raw.record_time ?? raw.recordTime ?? raw.timestamp;
  return {
    device_id: deviceId,
    record_scope: normalizeScope(raw.record_scope ?? raw.recordScope) || undefined,
    record_time: recordTime
      ? String(recordTime).replace('T', ' ').slice(0, 19)
      : undefined,
    before_meter_no: raw.before_meter_no != null ? String(raw.before_meter_no) : undefined,
    metrics_meter_no: raw.metrics_meter_no != null ? String(raw.metrics_meter_no) : undefined,
    before_L1: num(raw, 'before_L1'),
    before_L2: num(raw, 'before_L2'),
    before_L3: num(raw, 'before_L3'),
    before_current_L1: num(raw, 'before_current_L1'),
    before_current_L2: num(raw, 'before_current_L2'),
    before_current_L3: num(raw, 'before_current_L3'),
    before_kWh: num(raw, 'before_kWh'),
    before_P: num(raw, 'before_P'),
    before_Q: num(raw, 'before_Q'),
    before_S: num(raw, 'before_S'),
    before_PF: num(raw, 'before_PF'),
    before_THD: num(raw, 'before_THD', 'before_thd'),
    before_F: num(raw, 'before_F'),
    metrics_L1: num(raw, 'metrics_L1', 'after_L1'),
    metrics_L2: num(raw, 'metrics_L2', 'after_L2'),
    metrics_L3: num(raw, 'metrics_L3', 'after_L3'),
    metrics_kWh: num(raw, 'metrics_kWh', 'after_kWh'),
    metrics_P: num(raw, 'metrics_P', 'after_P'),
    metrics_Q: num(raw, 'metrics_Q', 'after_Q'),
    metrics_S: num(raw, 'metrics_S', 'after_S'),
    metrics_PF: num(raw, 'metrics_PF', 'after_PF'),
    metrics_THD: num(raw, 'metrics_THD', 'after_THD', 'metrics_thd', 'after_thd'),
    metrics_F: num(raw, 'metrics_F', 'after_F'),
  };
}

function subscribePattern(profile) {
  if (process.env.MQTT_BRIDGE_TOPIC) return process.env.MQTT_BRIDGE_TOPIC;
  if (profile.topic) return profile.topic;
  return `${profile.topic_prefix}/#`;
}

async function main() {
  const pool = mysql.createPool({ ...getDbConfig(), connectionLimit: 5, waitForConnections: true });
  await ensureSchema(pool);

  const profiles = await loadMqttProfiles(pool);
  if (!profiles.length) {
    log('error', 'No MQTT config. Set mqtt_settings in DB or MQTT_BRIDGE_HOST in .env.local');
    process.exit(1);
  }

  const clients = [];

  for (const profile of profiles) {
    const pattern = subscribePattern(profile);
    const url = `mqtt://${profile.host}:${profile.port}`;

    log('info', `Connecting ${url} site=${profile.site} subscribe=${pattern}`);

    const client = mqtt.connect(url, {
      username: profile.username || undefined,
      password: profile.password || undefined,
      reconnectPeriod: 5000,
      connectTimeout: 15000,
      clientId: `ge-mqtt-bridge-${profile.site}-${process.pid}`,
    });

    client.on('connect', () => {
      client.subscribe(pattern, { qos: 0 }, (err) => {
        if (err) log('error', 'Subscribe failed', { site: profile.site, err: err.message });
        else log('info', 'Subscribed', { site: profile.site, pattern });
      });
    });

    client.on('message', async (topic, buf) => {
      let raw;
      try {
        raw = JSON.parse(buf.toString('utf8'));
      } catch {
        log('warn', 'Invalid JSON', { topic });
        return;
      }

      if (!raw || typeof raw !== 'object') return;

      try {
        const deviceId = await resolveDeviceId(pool, raw);
        if (!deviceId) {
          log('warn', 'Unknown device', { topic, GEsaveID: raw.GEsaveID });
          return;
        }

        if (!(await isDeviceEnabled(pool, deviceId))) {
          log('debug', 'Device disabled, skip', { deviceId });
          return;
        }

        const body = payloadToBody(raw, deviceId);
        const hasMetrics =
          body.before_L1 != null ||
          body.metrics_L1 != null ||
          body.before_P != null ||
          body.metrics_P != null ||
          body.before_kWh != null ||
          body.metrics_kWh != null ||
          body.before_THD != null ||
          body.metrics_THD != null;

        if (!hasMetrics) {
          log('warn', 'Payload has no power fields', { deviceId, topic });
          return;
        }

        const result = await savePowerRecord(pool, body);
        if (result.ok) {
          log('info', 'Saved power record', {
            deviceId,
            record_id: result.record_id,
            topic,
          });
        } else {
          log('error', result.error, { deviceId, topic });
        }
      } catch (err) {
        log('error', err.message || String(err), { topic });
      }
    });

    client.on('error', (err) => log('error', 'MQTT error', { site: profile.site, err: err.message }));
    client.on('reconnect', () => log('info', 'Reconnecting', { site: profile.site }));

    clients.push(client);
  }

  const reloadMs = Number(process.env.MQTT_BRIDGE_RELOAD_MS || 300000);
  setInterval(async () => {
    try {
      const next = await loadMqttProfiles(pool);
      log('debug', 'Config reload check', { profiles: next.length });
    } catch (err) {
      log('warn', 'Config reload failed', { err: err.message });
    }
  }, reloadMs);

  const shutdown = () => {
    log('info', 'Shutting down');
    clients.forEach((c) => c.end(true));
    pool.end().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
