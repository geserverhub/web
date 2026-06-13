import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { queryGe } from '@/lib/mysql-ge'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const devices = await queryGe(`
      SELECT *
      FROM devices
      ORDER BY created_at DESC, deviceID DESC
    `)

    return NextResponse.json({
      success: true,
      devices,
      total: devices.length
    })
  } catch (error: unknown) {
    console.error('Meter setting API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch devices'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      deviceName, GEsaveID, series_no, ipAddress, location,
      site, status, beforeMeterNo, metricsMeterNo,
      phone, latitude, longitude,
      customerName, customerPhone, customerAddress,
      // new: customer login credentials
      customerLoginEmail, customerLoginPassword,
    } = body

    if (!deviceName?.trim()) {
      return NextResponse.json({ success: false, error: 'deviceName is required' }, { status: 400 })
    }

    const loginEmail = customerLoginEmail?.trim().toLowerCase() || null
    const loginPassword = customerLoginPassword?.trim() || null

    // Insert device — use customerLoginEmail as U_email for backward-compat matching
    const result = await queryGe(
      `INSERT INTO devices
        (deviceName, GEsaveID, series_no, ipAddress, location, site, status,
         beforeMeterNo, metricsMeterNo, U_email, P_email, phone, pass_phone,
         latitude, longitude, customerName, customerPhone, customerAddress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceName.trim(),
        GEsaveID?.trim() || null,
        series_no?.trim() || null,
        ipAddress?.trim() || null,
        location?.trim() || null,
        site || 'thailand',
        status || 'OK',
        beforeMeterNo?.trim() || '1',
        metricsMeterNo?.trim() || '2',
        loginEmail || '',
        '',
        phone?.trim() || '',
        '',
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        customerName?.trim() || null,
        customerPhone?.trim() || null,
        customerAddress?.trim() || null,
      ]
    ) as unknown as { insertId: number }

    const newDeviceId = result.insertId
    let linkedUserId: string | null = null
    let accountStatus: 'created' | 'existing' | 'skipped' = 'skipped'

    // Create or find customer login account
    if (loginEmail && loginPassword) {
      const prisma = getPrisma()
      if (prisma) {
        try {
          let user = await (prisma as any).user.findFirst({
            where: { email: loginEmail },
            select: { id: true },
          })

          if (user) {
            linkedUserId = String(user.id)
            accountStatus = 'existing'
          } else {
            const hashed = await bcrypt.hash(loginPassword, 12)
            user = await (prisma as any).user.create({
              data: {
                email: loginEmail,
                password: hashed,
                name: customerName?.trim() || loginEmail,
                role: 'CLIENT',
              },
              select: { id: true },
            })
            linkedUserId = String(user.id)
            accountStatus = 'created'
          }
        } catch (userErr) {
          console.warn('[meter-seting] user account creation failed:', userErr)
        }
      }
    }

    // Link device to user via momoge_cus
    if (newDeviceId && linkedUserId) {
      try {
        // Ensure user_id column exists
        const cols = await queryGe(
          `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'momoge_cus' AND COLUMN_NAME = 'user_id'`
        ) as Array<{ cnt: number | string }>
        if (Number(cols[0]?.cnt || 0) === 0) {
          await queryGe(
            `ALTER TABLE momoge_cus
             ADD COLUMN user_id varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL`
          ).catch(() => {})
        }

        await queryGe(
          `INSERT INTO momoge_cus (device_id, nameTH, nameEN, phone, user_id)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
          [
            newDeviceId,
            customerName?.trim() || null,
            customerName?.trim() || null,
            customerPhone?.trim() || phone?.trim() || null,
            linkedUserId,
          ]
        )
      } catch (linkErr) {
        console.warn('[meter-seting] momoge_cus link failed:', linkErr)
      }
    }

    return NextResponse.json({ success: true, deviceId: newDeviceId, accountStatus, linkedUserId })
  } catch (error: unknown) {
    console.error('Add machine API error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to add device'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
