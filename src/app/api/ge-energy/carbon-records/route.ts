import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as query } from '@/lib/geserverhub-db'
import { ensureCarbonSchema } from '@/lib/ge-energy/ensure-carbon-schema'
import { getDevicesColumnSet, meterIdSelectSql } from '@/lib/ge-energy/devices-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ge-energy/carbon-records?site=all
export async function GET(req: NextRequest) {
  try {
    await ensureCarbonSchema();
    const site = new URL(req.url).searchParams.get('site') || 'all'
    const deviceColumns = await getDevicesColumnSet()
    const meterSelect = meterIdSelectSql(deviceColumns)

    const rows = await query(`
      SELECT
        c.carbonID,
        c.meterID,
        c.LocationID,
        c.serailID,
        c.deviceID,
        c.power_record_id,
        c.power_preinstall_id,
        c.carbon_kg,
        c.energy_kwh,
        c.reduction_percent,
        c.record_date,
        c.note,
        c.created_at,
        c.updated_at,
        -- carbon_locations
        cl.locationName,
        cl.address,
        cl.site,
        cl.latitude,
        cl.longitude,
        -- carbon_meters
        cm.meterType,
        cm.meterNo,
        -- devices
        d.deviceName,
        ${meterSelect},
        d.series_no,
        d.location     AS deviceLocation,
        d.ipAddress,
        -- power_records (after install)
        pr.record_time      AS powerRecordTime,
        pr.metrics_kWh,
        pr.before_kWh,
        pr.energy_reduction AS powerEnergyReduction,
        pr.co2_reduction    AS powerCO2Reduction,
        -- power_records_preinstall
        pp.record_time      AS preinstallTime,
        pp.before_kWh       AS preinstallBeforeKwh,
        pp.metrics_kWh      AS preinstallMetricsKwh
      FROM carboncre_cacu c
      LEFT JOIN carbon_locations        cl ON c.LocationID          = cl.locationID
      LEFT JOIN carbon_meters           cm ON c.meterID             = cm.meterID
      LEFT JOIN devices                  d ON c.deviceID            = d.deviceID
      LEFT JOIN power_records           pr ON c.power_record_id     = pr.id
      LEFT JOIN power_records_preinstall pp ON c.power_preinstall_id = pp.id
      WHERE ? = 'all' OR cl.site = ?
      ORDER BY c.created_at DESC
    `, [site, site])

    // summary
    const records = rows as Record<string, unknown>[]
    const totalCarbonKg   = records.reduce((s, r) => s + (Number(r.carbon_kg)   || 0), 0)
    const totalEnergyKwh  = records.reduce((s, r) => s + (Number(r.energy_kwh)  || 0), 0)
    const totalReduction  = records.reduce((s, r) => s + (Number(r.co2_reduction) || Number(r.carbon_kg) || 0), 0)

    return NextResponse.json({
      success: true,
      count: records.length,
      summary: {
        totalCarbonKg: +totalCarbonKg.toFixed(4),
        totalEnergyKwh: +totalEnergyKwh.toFixed(3),
        totalReduction: +totalReduction.toFixed(4),
      },
      records,
    })
  } catch (err: unknown) {
    console.error('[carbon-records GET]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch' },
      { status: 500 }
    )
  }
}

// POST /api/ge-energy/carbon-records  — create new record
export async function POST(req: NextRequest) {
  try {
    await ensureCarbonSchema();
    const body = await req.json()
    const {
      meterID, LocationID, serailID, deviceID,
      power_record_id, power_preinstall_id,
      carbon_kg, energy_kwh, reduction_percent,
      record_date, note,
    } = body

    if (!meterID || !LocationID) {
      return NextResponse.json(
        { success: false, error: 'meterID and LocationID are required' },
        { status: 400 }
      )
    }

    const result = await query(`
      INSERT INTO carboncre_cacu
        (meterID, LocationID, serailID, deviceID, power_record_id, power_preinstall_id,
         carbon_kg, energy_kwh, reduction_percent, record_date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      meterID, LocationID, serailID || null, deviceID || null,
      power_record_id || null, power_preinstall_id || null,
      carbon_kg || null, energy_kwh || null, reduction_percent || null,
      record_date || null, note || null,
    ]) as unknown as { insertId: number }

    return NextResponse.json({ success: true, carbonID: result.insertId }, { status: 201 })
  } catch (err: unknown) {
    console.error('[carbon-records POST]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create' },
      { status: 500 }
    )
  }
}

// PUT /api/ge-energy/carbon-records  — update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { carbonID, carbon_kg, energy_kwh, reduction_percent, record_date, note } = body

    if (!carbonID) {
      return NextResponse.json({ success: false, error: 'carbonID is required' }, { status: 400 })
    }

    await query(`
      UPDATE carboncre_cacu
      SET carbon_kg = ?, energy_kwh = ?, reduction_percent = ?,
          record_date = ?, note = ?, updated_at = NOW()
      WHERE carbonID = ?
    `, [carbon_kg ?? null, energy_kwh ?? null, reduction_percent ?? null,
        record_date ?? null, note ?? null, carbonID])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[carbon-records PUT]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update' },
      { status: 500 }
    )
  }
}

// DELETE /api/ge-energy/carbon-records?id=123
export async function DELETE(req: NextRequest) {
  try {
    const carbonID = new URL(req.url).searchParams.get('id')
    if (!carbonID) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }
    await query('DELETE FROM carboncre_cacu WHERE carbonID = ?', [carbonID])
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[carbon-records DELETE]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete' },
      { status: 500 }
    )
  }
}
