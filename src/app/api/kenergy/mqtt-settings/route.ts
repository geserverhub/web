import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MASKED_PASSWORD = '********'

function encryptPassword(password: string): string {
  return Buffer.from(password).toString('base64')
}

/**
 * GET /api/kenergy/mqtt-settings
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const site = searchParams.get('site') || 'thailand'

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required',
      }, { status: 400 })
    }

    const settings = await queryGe(
      `SELECT host, port, username, topic, \`interval\`, updated_at
       FROM mqtt_settings
       WHERE user_id = ? AND site = ?
       LIMIT 1`,
      [userId, site]
    )

    if (settings.length === 0) {
      return NextResponse.json({
        success: true,
        settings: {
          host: 'broker.example.com',
          port: 1883,
          username: '',
          password: MASKED_PASSWORD,
          topic: '',
          interval: 30,
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...(settings[0] as object),
        password: MASKED_PASSWORD,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch MQTT settings'
    console.error('MQTT settings GET error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * PUT /api/kenergy/mqtt-settings
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, site, host, port, username, password, topic, interval } = body

    if (!userId || !site || !host || !port) {
      return NextResponse.json({
        success: false,
        error: 'userId, site, host, and port are required',
      }, { status: 400 })
    }

    const encryptedPassword =
      password && password !== MASKED_PASSWORD ? encryptPassword(password) : null

    if (encryptedPassword) {
      await queryGe(
        `INSERT INTO mqtt_settings
          (user_id, site, host, port, username, password, topic, \`interval\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          port = VALUES(port),
          username = VALUES(username),
          password = VALUES(password),
          topic = VALUES(topic),
          \`interval\` = VALUES(\`interval\`),
          updated_at = NOW()`,
        [userId, site, host, port, username || null, encryptedPassword, topic || null, interval || 30]
      )
    } else {
      await queryGe(
        `INSERT INTO mqtt_settings
          (user_id, site, host, port, username, password, topic, \`interval\`)
        VALUES (?, ?, ?, ?, ?, '', ?, ?)
        ON DUPLICATE KEY UPDATE
          host = VALUES(host),
          port = VALUES(port),
          username = VALUES(username),
          topic = VALUES(topic),
          \`interval\` = VALUES(\`interval\`),
          updated_at = NOW()`,
        [userId, site, host, port, username || null, topic || null, interval || 30]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'MQTT settings saved successfully',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save MQTT settings'
    console.error('MQTT settings PUT error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
