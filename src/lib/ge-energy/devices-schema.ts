import { queryGeserverhub } from '@/lib/geserverhub-db';

/** Canonical meter ID column on devices (never ksaveID). */
export const DEVICE_METER_ID_COLUMN = 'GEsaveID' as const;

let devicesColumnCache: Set<string> | null = null;

export async function getDevicesColumnSet(): Promise<Set<string>> {
  await ensureDevicesSchema();
  if (devicesColumnCache) return devicesColumnCache;
  const rows = await queryGeserverhub(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'`,
  );
  devicesColumnCache = new Set((rows as { COLUMN_NAME: string }[]).map((r) => String(r.COLUMN_NAME)));
  return devicesColumnCache;
}

/** Invalidate after migrations that rename meter ID columns. */
export function resetDevicesColumnCache(): void {
  devicesColumnCache = null;
}

/**
 * Resolve physical meter ID column: GEsaveID (canonical) or legacy geID.
 * ksaveID is never used — run ensureDevicesMeterIdColumn() to migrate it away.
 */
export function resolveMeterIdColumn(columns: Iterable<string>): string | null {
  const set = columns instanceof Set ? columns : new Set(columns);
  if (set.has(DEVICE_METER_ID_COLUMN)) return DEVICE_METER_ID_COLUMN;
  if (set.has('geID')) return 'geID';
  return null;
}

export async function resolveDevicesMeterIdColumn(): Promise<string | null> {
  return resolveMeterIdColumn(await getDevicesColumnSet());
}

/** SQL fragment: `d.geID AS GEsaveID` or `d.GEsaveID AS GEsaveID`. */
export function meterIdSelectSql(columns: Set<string>, alias = 'd'): string {
  const col = resolveMeterIdColumn(columns);
  if (!col) return 'NULL AS GEsaveID';
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}${col} AS GEsaveID`;
}

export function meterIdGroupBySql(columns: Set<string>, alias = 'd'): string {
  const col = resolveMeterIdColumn(columns);
  if (!col) return 'NULL';
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}${col}`;
}

export function meterIdWhereSql(columns: Set<string>, alias = 'd'): string {
  const col = resolveMeterIdColumn(columns);
  if (!col) return 'NULL';
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}${col}`;
}

let devicesMeterIdEnsured = false;
let devicesCustomerColumnsEnsured = false;

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  const row = rows[0] as { count?: number | string } | undefined;
  return Number(row?.count || 0) > 0;
}

/**
 * Normalize legacy meter ID columns → GEsaveID.
 * Renames ksaveID or geID when GEsaveID does not exist yet.
 */
export async function ensureDevicesMeterIdColumn(): Promise<void> {
  if (devicesMeterIdEnsured) return;

  try {
    const hasGEsaveID = await columnExists('devices', DEVICE_METER_ID_COLUMN);
    const hasGeID = await columnExists('devices', 'geID');
    const hasKsaveID = await columnExists('devices', 'ksaveID');

    if (!hasGEsaveID && hasKsaveID) {
      await queryGeserverhub(
        `ALTER TABLE devices CHANGE COLUMN ksaveID ${DEVICE_METER_ID_COLUMN} varchar(255) DEFAULT NULL`,
      );
      console.info('[devices-schema] migrated devices.ksaveID → GEsaveID');
    } else if (!hasGEsaveID && hasGeID) {
      await queryGeserverhub(
        `ALTER TABLE devices CHANGE COLUMN geID ${DEVICE_METER_ID_COLUMN} varchar(255) DEFAULT NULL`,
      );
      console.info('[devices-schema] migrated devices.geID → GEsaveID');
    } else if (hasKsaveID && hasGEsaveID) {
      await queryGeserverhub('ALTER TABLE devices DROP COLUMN ksaveID');
      console.info('[devices-schema] dropped obsolete devices.ksaveID');
    }

    if (await columnExists('devices', DEVICE_METER_ID_COLUMN)) {
      try {
        await queryGeserverhub(
          `ALTER TABLE devices ADD UNIQUE INDEX unique_GEsaveID (${DEVICE_METER_ID_COLUMN})`,
        );
      } catch {
        /* index may already exist under another name */
      }
    }

    resetDevicesColumnCache();
  } catch (err) {
    console.warn('[devices-schema] ensureDevicesMeterIdColumn:', err);
  } finally {
    devicesMeterIdEnsured = true;
  }
}

/** Legacy DBs may lack customer_* columns on devices — add them once. */
export async function ensureDevicesCustomerColumns(): Promise<void> {
  if (devicesCustomerColumnsEnsured) return;

  const alters: Array<{ name: string; sql: string }> = [
    {
      name: 'customerName',
      sql: 'ADD COLUMN customerName varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL',
    },
    {
      name: 'customerPhone',
      sql: 'ADD COLUMN customerPhone varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL',
    },
    {
      name: 'customerAddress',
      sql: 'ADD COLUMN customerAddress text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci',
    },
    {
      name: 'customer_id',
      sql: 'ADD COLUMN customer_id int DEFAULT NULL',
    },
    {
      name: 'record_scope',
      sql: "ADD COLUMN record_scope varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'installed'",
    },
  ];

  try {
    for (const col of alters) {
      if (!(await columnExists('devices', col.name))) {
        await queryGeserverhub(`ALTER TABLE devices ${col.sql}`);
      }
    }
    if (await columnExists('devices', 'customer_id')) {
      try {
        await queryGeserverhub('ALTER TABLE devices ADD INDEX idx_devices_customer_id (customer_id)');
      } catch {
        /* index may already exist */
      }
    }
    resetDevicesColumnCache();
  } catch (err) {
    console.warn('[devices-schema] ensureDevicesCustomerColumns:', err);
  } finally {
    devicesCustomerColumnsEnsured = true;
  }
}

/** Align devices.site with GE-KR / GE-TH prefix in GEsaveID. */
export async function syncDeviceSitesFromMeterId(): Promise<void> {
  const col = await resolveDevicesMeterIdColumn();
  if (!col) return;

  const pairs: Array<[string, string]> = [
    ['GE-KR-%', 'korea'],
    ['GE-TH-%', 'thailand'],
    ['GE-VN-%', 'vietnam'],
    ['GE-MY-%', 'malaysia'],
  ];

  try {
    for (const [pattern, site] of pairs) {
      await queryGeserverhub(
        `UPDATE devices SET site = ?
         WHERE UPPER(COALESCE(\`${col}\`, '')) LIKE ?
           AND LOWER(COALESCE(site, '')) != ?`,
        [site, pattern, site],
      );
    }
  } catch (err) {
    console.warn('[devices-schema] syncDeviceSitesFromMeterId:', err);
  }
}

/** Run meter ID + customer column normalization once per process. */
export async function ensureDevicesSchema(): Promise<void> {
  await ensureDevicesMeterIdColumn();
  await syncDeviceSitesFromMeterId();
  await ensureDevicesCustomerColumns();
}
