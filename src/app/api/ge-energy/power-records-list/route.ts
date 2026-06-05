import { NextRequest, NextResponse } from 'next/server';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

function buildWhere(site: string | null, deviceId: string | null, from: string | null, to: string | null) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (site && site !== 'all') {
    conditions.push(`LOWER(COALESCE(d.site, d.location, '')) LIKE ?`);
    params.push(`%${site.toLowerCase()}%`);
  }
  if (deviceId) {
    const id = parseInt(deviceId, 10);
    if (Number.isFinite(id) && id > 0) {
      conditions.push('pr.device_id = ?');
      params.push(id);
    }
  }
  if (from) {
    conditions.push('pr.record_time >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('pr.record_time <= ?');
    params.push(to);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, params };
}

const SELECT_FIELDS = `
  pr.id,
  pr.device_id,
  d.deviceName   AS device_name,
  d.GEsaveID         AS gesave_id,
  d.site,
  d.location,
  d.series_no,
  pr.record_time,
  pr.before_kWh,
  pr.metrics_kWh,
  pr.energy_reduction,
  pr.co2_reduction,
  pr.before_P,  pr.before_Q,  pr.before_S,
  pr.before_PF, pr.before_THD, pr.before_F,
  pr.metrics_P, pr.metrics_Q, pr.metrics_S,
  pr.metrics_PF, pr.metrics_THD, pr.metrics_F,
  pr.before_L1, pr.before_L2, pr.before_L3,
  pr.metrics_L1, pr.metrics_L2, pr.metrics_L3,
  pr.created_at,
  pr.created_by
`;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const site     = sp.get('site');
    const deviceId = sp.get('deviceId');
    const from     = sp.get('from');
    const to       = sp.get('to');
    const format   = sp.get('format'); // 'excel' → download
    const page     = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit    = Math.min(500, Math.max(10, parseInt(sp.get('limit') || '50', 10)));
    const offset   = (page - 1) * limit;

    const { where, params } = buildWhere(site, deviceId, from, to);

    // ── Excel export ────────────────────────────────────────────────
    if (format === 'excel') {
      const rows = (await queryGeserverhub(
        `SELECT ${SELECT_FIELDS}
         FROM power_records pr
         JOIN devices d ON pr.device_id = d.deviceID
         ${where}
         ORDER BY pr.record_time DESC
         LIMIT 10000`,
        params
      )) as Row[];

      const sheetData = rows.map((r) => ({
        ID: r.id,
        'Device Name': r.device_name,
        'GE ID': r.gesave_id,
        Site: r.site || r.location,
        'Series No': r.series_no,
        'Record Time': r.record_time,
        'Before kWh': r.before_kWh,
        'Metrics kWh': r.metrics_kWh,
        'Energy Saved (kWh)': r.energy_reduction,
        'CO₂ Reduction (kg)': r.co2_reduction,
        'Before P (W)': r.before_P,
        'Metrics P (W)': r.metrics_P,
        'Before PF': r.before_PF,
        'Metrics PF': r.metrics_PF,
        'Before THD (%)': r.before_THD,
        'Metrics THD (%)': r.metrics_THD,
        'Before F (Hz)': r.before_F,
        'Metrics F (Hz)': r.metrics_F,
        'Before Q (var)': r.before_Q,
        'Metrics Q (var)': r.metrics_Q,
        'Before S (VA)': r.before_S,
        'Metrics S (VA)': r.metrics_S,
        'Before L1': r.before_L1,
        'Before L2': r.before_L2,
        'Before L3': r.before_L3,
        'Metrics L1': r.metrics_L1,
        'Metrics L2': r.metrics_L2,
        'Metrics L3': r.metrics_L3,
        'Created At': r.created_at,
        'Created By': r.created_by,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetData);

      // Column widths
      ws['!cols'] = [
        { wch: 6 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Power Records');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const dateTag = new Date().toISOString().slice(0, 10);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="power_records_${dateTag}.xlsx"`,
          'Content-Length': String(buf.length),
        },
      });
    }

    // ── Count ────────────────────────────────────────────────────────
    const countResult = (await queryGeserverhub(
      `SELECT COUNT(*) AS total
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${where}`,
      params
    )) as Row[];
    const total = Number(countResult[0]?.total ?? 0);

    // ── Paginated rows ───────────────────────────────────────────────
    const rows = (await queryGeserverhub(
      `SELECT ${SELECT_FIELDS}
       FROM power_records pr
       JOIN devices d ON pr.device_id = d.deviceID
       ${where}
       ORDER BY pr.record_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )) as Row[];

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    console.error('power-records-list error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
