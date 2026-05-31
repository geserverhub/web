import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ensureConnectivitySchema } from '@/lib/energy/ensure-connectivity-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ConnectivityRow = {
  device_id: number;
  deviceName?: string;
  geID?: string;
  site?: string;
  location?: string;
  ipAddress?: string;
  beforeMeterNo?: string;
  metricsMeterNo?: string;
  gateway_model?: string;
  serial_port?: string;
  baud_rate?: number;
  parity?: string;
  data_bits?: number;
  stop_bits?: number;
  slave_before?: number;
  slave_metrics?: number;
  reg_v_l1?: number;
  reg_v_l2?: number;
  reg_v_l3?: number;
  scale_voltage?: number;
  mqtt_topic?: string | null;
  publish_interval_sec?: number;
  enabled?: number | boolean;
  notes?: string | null;
  configured?: boolean;
};

function siteWhereClause(site: string): { sql: string; params: string[] } {
  if (site === 'all') {
    return { sql: '1=1', params: [] };
  }
  const pattern =
    site === 'thailand'
      ? '%Thailand%'
      : site === 'korea'
        ? '%Korea%'
        : site === 'vietnam'
          ? '%Vietnam%'
          : site === 'malaysia'
            ? '%Malaysia%'
            : `%${site}%`;
  return { sql: 'd.location LIKE ?', params: [pattern] };
}

/**
 * GET /api/ge-energy/device-connectivity?site=thailand&deviceId=5
 */
export async function GET(req: NextRequest) {
  try {
    await ensureConnectivitySchema();
    const { searchParams } = new URL(req.url);
    const site = searchParams.get('site') || 'thailand';
    const deviceId = searchParams.get('deviceId');

    if (deviceId) {
      const rows = await queryGeserverhub(
        `SELECT
          d.deviceID AS device_id,
          d.deviceName,
          d.geID,
          d.site,
          d.location,
          d.ipAddress,
          d.beforeMeterNo,
          d.metricsMeterNo,
          c.gateway_model,
          c.serial_port,
          c.baud_rate,
          c.parity,
          c.data_bits,
          c.stop_bits,
          c.slave_before,
          c.slave_metrics,
          c.reg_v_l1,
          c.reg_v_l2,
          c.reg_v_l3,
          c.scale_voltage,
          c.mqtt_topic,
          c.publish_interval_sec,
          c.enabled,
          c.notes,
          (c.id IS NOT NULL) AS configured
         FROM devices d
         LEFT JOIN device_connectivity c ON c.device_id = d.deviceID
         WHERE d.deviceID = ?
         LIMIT 1`,
        [deviceId]
      );

      if (!rows.length) {
        return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, device: rows[0] as ConnectivityRow });
    }

    const { sql: siteSql, params: siteParams } = siteWhereClause(site);
    const rows = await queryGeserverhub(
      `SELECT
        d.deviceID AS device_id,
        d.deviceName,
        d.geID,
        d.site,
        d.location,
        d.ipAddress,
        d.beforeMeterNo,
        d.metricsMeterNo,
        c.gateway_model,
        c.serial_port,
        c.baud_rate,
        c.parity,
        c.data_bits,
        c.stop_bits,
        c.slave_before,
        c.slave_metrics,
        c.reg_v_l1,
        c.reg_v_l2,
        c.reg_v_l3,
        c.scale_voltage,
        c.mqtt_topic,
        c.publish_interval_sec,
        c.enabled,
        c.notes,
        (c.id IS NOT NULL) AS configured
       FROM devices d
       LEFT JOIN device_connectivity c ON c.device_id = d.deviceID
       WHERE ${siteSql}
       ORDER BY d.deviceName ASC`,
      siteParams
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      devices: rows as ConnectivityRow[],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch device connectivity';
    console.error('device-connectivity GET:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/ge-energy/device-connectivity
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureConnectivitySchema();
    const body = await req.json();
    const deviceId = Number(body.deviceId ?? body.device_id);

    if (!deviceId || Number.isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: 'deviceId is required' }, { status: 400 });
    }

    const exists = await queryGeserverhub('SELECT deviceID FROM devices WHERE deviceID = ? LIMIT 1', [
      deviceId,
    ]);
    if (!exists.length) {
      return NextResponse.json({ success: false, error: `Device ${deviceId} not found` }, { status: 404 });
    }

    const slaveBefore = Number(body.slave_before ?? body.slaveBefore ?? 1);
    const slaveMetrics = Number(body.slave_metrics ?? body.slaveMetrics ?? 2);

    await queryGeserverhub(
      `INSERT INTO device_connectivity (
        device_id, gateway_model, serial_port, baud_rate, parity, data_bits, stop_bits,
        slave_before, slave_metrics, reg_v_l1, reg_v_l2, reg_v_l3, scale_voltage,
        mqtt_topic, publish_interval_sec, enabled, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gateway_model = VALUES(gateway_model),
        serial_port = VALUES(serial_port),
        baud_rate = VALUES(baud_rate),
        parity = VALUES(parity),
        data_bits = VALUES(data_bits),
        stop_bits = VALUES(stop_bits),
        slave_before = VALUES(slave_before),
        slave_metrics = VALUES(slave_metrics),
        reg_v_l1 = VALUES(reg_v_l1),
        reg_v_l2 = VALUES(reg_v_l2),
        reg_v_l3 = VALUES(reg_v_l3),
        scale_voltage = VALUES(scale_voltage),
        mqtt_topic = VALUES(mqtt_topic),
        publish_interval_sec = VALUES(publish_interval_sec),
        enabled = VALUES(enabled),
        notes = VALUES(notes),
        updated_at = NOW()`,
      [
        deviceId,
        body.gateway_model ?? body.gatewayModel ?? 'T310',
        body.serial_port ?? body.serialPort ?? '/dev/ttyS1',
        Number(body.baud_rate ?? body.baudRate ?? 9600),
        body.parity ?? 'none',
        Number(body.data_bits ?? body.dataBits ?? 8),
        Number(body.stop_bits ?? body.stopBits ?? 1),
        slaveBefore,
        slaveMetrics,
        Number(body.reg_v_l1 ?? body.regVL1 ?? 0),
        Number(body.reg_v_l2 ?? body.regVL2 ?? 2),
        Number(body.reg_v_l3 ?? body.regVL3 ?? 4),
        Number(body.scale_voltage ?? body.scaleVoltage ?? 10),
        body.mqtt_topic ?? body.mqttTopic ?? null,
        Number(body.publish_interval_sec ?? body.publishIntervalSec ?? 30),
        body.enabled === false || body.enabled === 0 ? 0 : 1,
        body.notes ?? null,
      ]
    );

    if (body.beforeMeterNo !== undefined || body.metricsMeterNo !== undefined) {
      await queryGeserverhub(
        `UPDATE devices SET
          beforeMeterNo = COALESCE(?, beforeMeterNo),
          metricsMeterNo = COALESCE(?, metricsMeterNo),
          updated_at = NOW()
         WHERE deviceID = ?`,
        [
          body.beforeMeterNo != null ? String(body.beforeMeterNo) : null,
          body.metricsMeterNo != null ? String(body.metricsMeterNo) : null,
          deviceId,
        ]
      );
    }

    return NextResponse.json({ success: true, message: 'Device connectivity saved' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save device connectivity';
    console.error('device-connectivity PUT:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
