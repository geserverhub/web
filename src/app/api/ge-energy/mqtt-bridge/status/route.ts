import { NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ensureConnectivitySchema } from '@/lib/energy/ensure-connectivity-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ge-energy/mqtt-bridge/status
 * Returns MQTT profiles from DB for ops / UI (no passwords).
 */
export async function GET() {
  try {
    await ensureConnectivitySchema();

    const rows = await queryGeserverhub(
      `SELECT site, host, port, username, topic, topic_prefix, \`interval\`, updated_at
       FROM mqtt_settings
       ORDER BY site`
    );

    const subscribePatterns = (
      rows as { topic?: string; topic_prefix?: string; site: string; host?: string; port?: number }[]
    ).map(
      (r) => ({
        site: r.site,
        pattern: r.topic?.trim() || `${r.topic_prefix || 'ge'}/#`,
        host: r.host,
        port: r.port,
      })
    );

    const envFallback = process.env.MQTT_BRIDGE_HOST
      ? {
          host: process.env.MQTT_BRIDGE_HOST,
          port: Number(process.env.MQTT_BRIDGE_PORT || 1883),
          pattern: process.env.MQTT_BRIDGE_TOPIC || `${process.env.MQTT_BRIDGE_TOPIC_PREFIX || 'ge'}/#`,
        }
      : null;

    return NextResponse.json({
      success: true,
      bridge_command: 'npm run mqtt:bridge',
      profiles: subscribePatterns,
      env_fallback: envFallback,
      hint: 'Run mqtt-bridge as a separate process (pm2/systemd). It subscribes MQTT and writes power_records.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read bridge status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
