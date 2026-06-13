import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { getDevicesColumnSet, meterIdSelectSql } from '@/lib/ge-energy/devices-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureBindingSchema() {
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ge_energy_meter_device_binding (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      device_id BIGINT NOT NULL,
      meter_id VARCHAR(191) NOT NULL,
      meter_channel VARCHAR(8) NOT NULL DEFAULT 'ch1',
      meter_role VARCHAR(16) NOT NULL DEFAULT 'output',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ge_energy_meter_binding_meter_channel (meter_id, meter_channel),
      UNIQUE KEY uq_ge_energy_meter_binding_device_role (device_id, meter_role),
      KEY idx_ge_energy_meter_binding_device (device_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const columns = (await queryGeserverhub(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ge_energy_meter_device_binding'`
  )) as Array<{ COLUMN_NAME?: string }>;
  const hasChannel = columns.some((c) => String(c.COLUMN_NAME || '') === 'meter_channel');

  if (!hasChannel) {
    await queryGeserverhub(
      `ALTER TABLE ge_energy_meter_device_binding
       ADD COLUMN meter_channel VARCHAR(8) NOT NULL DEFAULT 'ch1' AFTER meter_id`
    );
  }

  const indexes = (await queryGeserverhub(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'ge_energy_meter_device_binding'`
  )) as Array<{ INDEX_NAME?: string }>;
  const indexNames = new Set(indexes.map((i) => String(i.INDEX_NAME || '')));

  if (indexNames.has('uq_ge_energy_meter_binding_meter')) {
    await queryGeserverhub(
      `ALTER TABLE ge_energy_meter_device_binding
       DROP INDEX uq_ge_energy_meter_binding_meter`
    );
  }
  if (!indexNames.has('uq_ge_energy_meter_binding_meter_channel')) {
    await queryGeserverhub(
      `ALTER TABLE ge_energy_meter_device_binding
       ADD UNIQUE KEY uq_ge_energy_meter_binding_meter_channel (meter_id, meter_channel)`
    );
  }
}

function normalizeRole(value: unknown): 'input' | 'output' {
  const role = String(value || '').toLowerCase();
  return role === 'input' ? 'input' : 'output';
}

function normalizeChannel(value: unknown): 'ch1' | 'ch2' {
  const channel = String(value || '').toLowerCase().replace(/\s+/g, '');
  if (channel === '2' || channel === 'ch2' || channel === 'channel2') return 'ch2';
  return 'ch1';
}

export async function GET() {
  try {
    await ensureBindingSchema();
    const deviceColumns = await getDevicesColumnSet();
    const meterSelect = meterIdSelectSql(deviceColumns);

    const [devices, meters, bindings] = await Promise.all([
      queryGeserverhub(
        `SELECT d.deviceID, d.deviceName, ${meterSelect}, d.location, d.site
         FROM devices d
         ORDER BY d.deviceName ASC`
      ),
      queryGeserverhub(
        `SELECT COALESCE(d.GEsaveID, CAST(d.deviceID AS CHAR)) AS meterID,
                d.GEsaveID AS meterNo,
                d.deviceName AS meterType
         FROM devices d
         ORDER BY d.deviceName ASC`
      ),
      queryGeserverhub(
        `SELECT b.id, b.device_id, b.meter_id, b.meter_channel, b.meter_role, b.created_at, b.updated_at,
                d.deviceName, ${meterSelect}, d.location,
                dm.GEsaveID AS meterNo, dm.deviceName AS meterType
         FROM ge_energy_meter_device_binding b
         LEFT JOIN devices d ON d.deviceID = b.device_id
         LEFT JOIN devices dm ON COALESCE(dm.GEsaveID, CAST(dm.deviceID AS CHAR)) = b.meter_id
         ORDER BY d.deviceName ASC, FIELD(b.meter_role, 'input','output') ASC`
      ),
    ]);

    return NextResponse.json({
      success: true,
      devices,
      meters,
      bindings,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load binding data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBindingSchema();
    const body = await req.json();
    const deviceId = Number(body?.deviceId);
    const meterId = String(body?.meterId || '').trim();
    const meterChannel = normalizeChannel(body?.meterChannel);
    const meterRole = normalizeRole(body?.meterRole);

    if (!deviceId || !meterId) {
      return NextResponse.json(
        { success: false, error: 'deviceId and meterId are required' },
        { status: 400 }
      );
    }

    // 1) meter is unique: if it is bound elsewhere, remove old row (swap/move).
    await queryGeserverhub(
      `DELETE FROM ge_energy_meter_device_binding
       WHERE meter_id = ?
         AND meter_channel = ?
         AND NOT (device_id = ? AND meter_role = ? AND meter_channel = ?)`,
      [meterId, meterChannel, deviceId, meterRole, meterChannel]
    );

    // 2) device-role is unique: replace existing role on that device.
    await queryGeserverhub(
      `DELETE FROM ge_energy_meter_device_binding
       WHERE device_id = ? AND meter_role = ?`,
      [deviceId, meterRole]
    );

    await queryGeserverhub(
      `INSERT INTO ge_energy_meter_device_binding (device_id, meter_id, meter_channel, meter_role)
       VALUES (?, ?, ?, ?)`,
      [deviceId, meterId, meterChannel, meterRole]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to save binding' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureBindingSchema();
    const body = await req.json();
    const id = Number(body?.id);
    const deviceId = Number(body?.deviceId);
    const meterId = String(body?.meterId || '').trim();
    const meterChannel = normalizeChannel(body?.meterChannel);
    const meterRole = normalizeRole(body?.meterRole);

    if (!id || !deviceId || !meterId) {
      return NextResponse.json(
        { success: false, error: 'id, deviceId and meterId are required' },
        { status: 400 }
      );
    }

    await queryGeserverhub(
      `DELETE FROM ge_energy_meter_device_binding
       WHERE meter_id = ? AND meter_channel = ? AND id <> ?`,
      [meterId, meterChannel, id]
    );
    await queryGeserverhub(
      `DELETE FROM ge_energy_meter_device_binding
       WHERE device_id = ? AND meter_role = ? AND id <> ?`,
      [deviceId, meterRole, id]
    );

    await queryGeserverhub(
      `UPDATE ge_energy_meter_device_binding
       SET device_id = ?, meter_id = ?, meter_channel = ?, meter_role = ?, updated_at = NOW()
       WHERE id = ?`,
      [deviceId, meterId, meterChannel, meterRole, id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update binding' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureBindingSchema();
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    await queryGeserverhub(`DELETE FROM ge_energy_meter_device_binding WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete binding' },
      { status: 500 }
    );
  }
}
