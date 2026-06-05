import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as query } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const toDecimal = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// GET /api/ge-energy/momoge-cus?deviceId=4&search=xxx
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const deviceId = url.searchParams.get('deviceId')
    const search = url.searchParams.get('search') || ''
    const mmgID = url.searchParams.get('id')

    let sql = `
      SELECT
        mc.mmgID,
        mc.meterID,
        mc.LocationID,
        mc.serailID,
        mc.device_id,
        mc.nameTH,
        mc.nameEN,
        mc.nameKR,
        mc.phone,
        mc.address,
        mc.latitude,
        mc.longitude,
        mc.created_at,
        mc.updated_at,
        -- carbon_meters
        cm.meterType,
        cm.meterNo,
        -- carbon_locations
        cl.locationName,
        cl.site,
        cl.address     AS locationAddress,
        cl.latitude    AS locationLat,
        cl.longitude   AS locationLng,
        -- devices
        d.deviceName,
        d.GEsaveID,
        d.series_no,
        d.ipAddress,
        d.location     AS deviceLocation
      FROM momoge_cus mc
      LEFT JOIN carbon_meters    cm ON mc.meterID    = cm.meterID
      LEFT JOIN carbon_locations cl ON mc.LocationID = cl.locationID
      LEFT JOIN devices           d ON mc.device_id  = d.deviceID
    `
    const params: unknown[] = []
    const where: string[] = []

    if (mmgID) {
      where.push('mc.mmgID = ?')
      params.push(Number(mmgID))
    }
    if (deviceId) {
      where.push('mc.device_id = ?')
      params.push(Number(deviceId))
    }
    if (search) {
      where.push('(mc.nameTH LIKE ? OR mc.nameEN LIKE ? OR mc.phone LIKE ? OR mc.address LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like, like)
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY mc.updated_at DESC'

    const rows = await query(sql, params)
    return NextResponse.json({ success: true, count: (rows as unknown[]).length, records: rows })
  } catch (err) {
    console.error('[momoge-cus GET]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch' },
      { status: 500 }
    )
  }
}

// POST /api/ge-energy/momoge-cus
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      meterID, LocationID, serailID, device_id,
      nameTH, nameEN, nameKR, phone, address, latitude, longitude,
    } = body

    const result = await query(`
      INSERT INTO momoge_cus
        (meterID, LocationID, serailID, device_id, nameTH, nameEN, nameKR, phone, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      meterID || null, LocationID || null, serailID || null, device_id || null,
      nameTH || null, nameEN || null, nameKR || null, phone || null, address || null,
      toDecimal(latitude), toDecimal(longitude),
    ]) as unknown as { insertId: number }

    return NextResponse.json({ success: true, mmgID: result.insertId }, { status: 201 })
  } catch (err) {
    console.error('[momoge-cus POST]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create' },
      { status: 500 }
    )
  }
}

// PUT /api/ge-energy/momoge-cus
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      mmgID, meterID, LocationID, serailID, device_id,
      nameTH, nameEN, nameKR, phone, address, latitude, longitude,
    } = body

    if (!mmgID) {
      return NextResponse.json({ success: false, error: 'mmgID is required' }, { status: 400 })
    }

    await query(`
      UPDATE momoge_cus
      SET meterID=?, LocationID=?, serailID=?, device_id=?,
          nameTH=?, nameEN=?, nameKR=?, phone=?, address=?,
          latitude=?, longitude=?, updated_at=NOW()
      WHERE mmgID=?
    `, [
      meterID || null, LocationID || null, serailID || null, device_id || null,
      nameTH || null, nameEN || null, nameKR || null, phone || null, address || null,
      toDecimal(latitude), toDecimal(longitude), mmgID,
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[momoge-cus PUT]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to update' },
      { status: 500 }
    )
  }
}

// DELETE /api/ge-energy/momoge-cus?id=5
export async function DELETE(req: NextRequest) {
  try {
    const mmgID = new URL(req.url).searchParams.get('id')
    if (!mmgID) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })
    }
    await query('DELETE FROM momoge_cus WHERE mmgID = ?', [Number(mmgID)])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[momoge-cus DELETE]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to delete' },
      { status: 500 }
    )
  }
}
