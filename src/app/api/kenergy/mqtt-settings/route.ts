import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db';
import { ensureConnectivitySchema } from '@/lib/energy/ensure-connectivity-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MASKED_PASSWORD = '********';

const DEFAULT_SETTINGS = {
  host: 'broker.example.com',
  port: 1883,
  username: '',
  password: MASKED_PASSWORD,
  topic: '',
  topic_prefix: 'ge',
  interval: 30,
  gateway_model: 'T310',
  serial_port: '/dev/ttyS1',
  baud_rate: 9600,
  parity: 'none',
  data_bits: 8,
  stop_bits: 1,
};

function encryptPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

/**
 * GET /api/kenergy/mqtt-settings
 */
export async function GET(req: NextRequest) {
  try {
    await ensureConnectivitySchema();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const site = searchParams.get('site') || 'thailand';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const settings = await queryGe(
      `SELECT host, port, username, topic, topic_prefix, \`interval\`,
              gateway_model, serial_port, baud_rate, parity, data_bits, stop_bits, updated_at
       FROM mqtt_settings
       WHERE user_id = ? AND site = ?
       LIMIT 1`,
      [userId, site]
    );

    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        settings: { ...DEFAULT_SETTINGS },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...(settings[0] as object),
        password: MASKED_PASSWORD,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch MQTT settings';
    console.error('MQTT settings GET error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/kenergy/mqtt-settings
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureConnectivitySchema();
    const body = await req.json();
    const {
      userId,
      site,
      host,
      port,
      username,
      password,
      topic,
      topic_prefix,
      topicPrefix,
      interval,
      gateway_model,
      gatewayModel,
      serial_port,
      serialPort,
      baud_rate,
      baudRate,
      parity,
      data_bits,
      dataBits,
      stop_bits,
      stopBits,
    } = body;

    if (!userId || !site || !host || !port) {
      return NextResponse.json(
        { success: false, error: 'userId, site, host, and port are required' },
        { status: 400 }
      );
    }

    const encryptedPassword =
      password && password !== MASKED_PASSWORD ? encryptPassword(password) : null;

    const values = [
      userId,
      site,
      host,
      port,
      username || null,
      encryptedPassword ?? '',
      topic || null,
      topic_prefix ?? topicPrefix ?? 'ge',
      interval || 30,
      gateway_model ?? gatewayModel ?? 'T310',
      serial_port ?? serialPort ?? '/dev/ttyS1',
      Number(baud_rate ?? baudRate ?? 9600),
      parity ?? 'none',
      Number(data_bits ?? dataBits ?? 8),
      Number(stop_bits ?? stopBits ?? 1),
    ];

    if (encryptedPassword) {
      await queryGe(
        `INSERT INTO mqtt_settings (
          user_id, site, host, port, username, password, topic, topic_prefix, \`interval\`,
          gateway_model, serial_port, baud_rate, parity, data_bits, stop_bits
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          port = VALUES(port),
          username = VALUES(username),
          password = VALUES(password),
          topic = VALUES(topic),
          topic_prefix = VALUES(topic_prefix),
          \`interval\` = VALUES(\`interval\`),
          gateway_model = VALUES(gateway_model),
          serial_port = VALUES(serial_port),
          baud_rate = VALUES(baud_rate),
          parity = VALUES(parity),
          data_bits = VALUES(data_bits),
          stop_bits = VALUES(stop_bits),
          updated_at = NOW()`,
        values
      );
    } else {
      await queryGe(
        `INSERT INTO mqtt_settings (
          user_id, site, host, port, username, password, topic, topic_prefix, \`interval\`,
          gateway_model, serial_port, baud_rate, parity, data_bits, stop_bits
        ) VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          port = VALUES(port),
          username = VALUES(username),
          topic = VALUES(topic),
          topic_prefix = VALUES(topic_prefix),
          \`interval\` = VALUES(\`interval\`),
          gateway_model = VALUES(gateway_model),
          serial_port = VALUES(serial_port),
          baud_rate = VALUES(baud_rate),
          parity = VALUES(parity),
          data_bits = VALUES(data_bits),
          stop_bits = VALUES(stop_bits),
          updated_at = NOW()`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: 'MQTT settings saved successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save MQTT settings';
    console.error('MQTT settings PUT error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
