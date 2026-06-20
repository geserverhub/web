import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ge-energy/device-ingest
 * Accepts ANY payload from T310 — logs raw body to t310_raw_log table
 * so we can see exactly what the T310 sends before writing final parser.
 */
export async function POST(req: NextRequest) {
  try {
    await queryGeserverhub(`
      CREATE TABLE IF NOT EXISTS t310_raw_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source_ip VARCHAR(50),
        topic VARCHAR(255),
        raw_body LONGTEXT,
        headers TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const sourceIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const topic = req.headers.get('x-topic') || req.nextUrl.searchParams.get('topic') || '';

    let rawBody = '';
    let parsedBody: unknown = null;
    try {
      rawBody = await req.text();
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }

    const headerObj: Record<string, string> = {};
    req.headers.forEach((v, k) => { headerObj[k] = v; });

    console.log('[device-ingest] T310 payload received:', JSON.stringify(parsedBody, null, 2));

    await queryGeserverhub(
      `INSERT INTO t310_raw_log (source_ip, topic, raw_body, headers) VALUES (?, ?, ?, ?)`,
      [sourceIp, topic, rawBody, JSON.stringify(headerObj)]
    );

    return NextResponse.json({ success: true, received: parsedBody });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[device-ingest] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/** GET /api/ge-energy/device-ingest — ดู logs ล่าสุด */
export async function GET() {
  try {
    await queryGeserverhub(`
      CREATE TABLE IF NOT EXISTS t310_raw_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        source_ip VARCHAR(50),
        topic VARCHAR(255),
        raw_body LONGTEXT,
        headers TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const rows = await queryGeserverhub(
      `SELECT id, received_at, source_ip, topic, raw_body FROM t310_raw_log ORDER BY id DESC LIMIT 20`
    );

    return NextResponse.json({ success: true, count: (rows as unknown[]).length, logs: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
