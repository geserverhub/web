import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let tableReady = false

async function ensureBillHistoryTable() {
  if (tableReady) return
  await queryGe(`
    CREATE TABLE IF NOT EXISTS ge_meter_bill_history (
      id INT NOT NULL AUTO_INCREMENT,
      device_id INT NULL,
      customer_id INT NULL,
      site VARCHAR(32) NULL,
      bill_month DATE NOT NULL,
      energy_kwh DECIMAL(14,2) NULL,
      bill_cost DECIMAL(16,2) NULL,
      peak_kw DECIMAL(14,2) NULL,
      peak_cost DECIMAL(16,2) NULL,
      breaker_size_amp INT NULL,
      note VARCHAR(500) NULL,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      UNIQUE KEY uq_meter_month (device_id, bill_month),
      KEY idx_bill_customer (customer_id),
      KEY idx_bill_site (site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  tableReady = true
}

type BillRow = {
  billMonth: string
  energyKwh: number | null
  billCost: number | null
  peakKw: number | null
  peakCost: number | null
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

/** First day of the month (YYYY-MM-01) for any date-ish input. */
function normalizeMonth(v: unknown): string | null {
  const s = String(v ?? '').trim()
  const m = s.match(/^(\d{4})-(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}-01`
}

export async function GET(req: NextRequest) {
  try {
    await ensureBillHistoryTable()
    const deviceId = req.nextUrl.searchParams.get('deviceId')
    const customerId = req.nextUrl.searchParams.get('customerId')

    let where = ''
    const params: unknown[] = []
    if (deviceId && /^\d+$/.test(deviceId)) {
      where = 'WHERE device_id = ?'
      params.push(Number(deviceId))
    } else if (customerId && /^\d+$/.test(customerId)) {
      where = 'WHERE customer_id = ?'
      params.push(Number(customerId))
    }

    const rows = await queryGe(
      `SELECT id, device_id, customer_id, site, DATE_FORMAT(bill_month, '%Y-%m-%d') AS bill_month,
              energy_kwh, bill_cost, peak_kw, peak_cost, breaker_size_amp, note
       FROM ge_meter_bill_history
       ${where}
       ORDER BY bill_month ASC, id ASC`,
      params,
    )

    const list = (rows as Array<Record<string, unknown>>).map((r) => ({
      id: Number(r.id),
      deviceId: r.device_id != null ? Number(r.device_id) : null,
      customerId: r.customer_id != null ? Number(r.customer_id) : null,
      site: r.site as string | null,
      billMonth: r.bill_month as string,
      energyKwh: toNum(r.energy_kwh),
      billCost: toNum(r.bill_cost),
      peakKw: toNum(r.peak_kw),
      peakCost: toNum(r.peak_cost),
      breakerSizeAmp: r.breaker_size_amp != null ? Number(r.breaker_size_amp) : null,
      note: r.note as string | null,
    }))

    const breakerSizeAmp = list.find((r) => r.breakerSizeAmp != null)?.breakerSizeAmp ?? null

    return NextResponse.json({ success: true, bills: list, breakerSizeAmp })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load bill history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureBillHistoryTable()
    const body = await req.json()
    const deviceId = toNum(body.deviceId)
    if (deviceId == null) {
      return NextResponse.json({ success: false, error: 'deviceId is required' }, { status: 400 })
    }
    const customerId = toNum(body.customerId)
    const site = body.site != null ? String(body.site) : null
    const breakerSizeAmp = toNum(body.breakerSizeAmp)
    const note = body.note != null ? String(body.note).slice(0, 500) : null
    const rows = Array.isArray(body.rows) ? (body.rows as BillRow[]) : []

    // Replace the whole 12-month set for this meter (idempotent save).
    await queryGe('DELETE FROM ge_meter_bill_history WHERE device_id = ?', [deviceId])

    let saved = 0
    for (const row of rows) {
      const month = normalizeMonth(row.billMonth)
      if (!month) continue
      const energyKwh = toNum(row.energyKwh)
      const billCost = toNum(row.billCost)
      const peakKw = toNum(row.peakKw)
      const peakCost = toNum(row.peakCost)
      // Skip fully empty rows.
      if (energyKwh == null && billCost == null && peakKw == null && peakCost == null) continue
      await queryGe(
        `INSERT INTO ge_meter_bill_history
           (device_id, customer_id, site, bill_month, energy_kwh, bill_cost, peak_kw, peak_cost, breaker_size_amp, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [deviceId, customerId, site, month, energyKwh, billCost, peakKw, peakCost, breakerSizeAmp, note],
      )
      saved++
    }

    return NextResponse.json({ success: true, saved })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save bill history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureBillHistoryTable()
    const deviceId = req.nextUrl.searchParams.get('deviceId')
    if (!deviceId || !/^\d+$/.test(deviceId)) {
      return NextResponse.json({ success: false, error: 'deviceId required' }, { status: 400 })
    }
    await queryGe('DELETE FROM ge_meter_bill_history WHERE device_id = ?', [Number(deviceId)])
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete bill history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
