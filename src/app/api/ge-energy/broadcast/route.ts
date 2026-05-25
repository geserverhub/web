import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureSchema() {
  await queryGe(`
    CREATE TABLE IF NOT EXISTS broadcast_messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      message    TEXT NOT NULL,
      category   ENUM('announcement','maintenance','promotion','alert') NOT NULL DEFAULT 'announcement',
      sent_by    VARCHAR(255),
      is_active  TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT NOW(),
      expires_at DATETIME DEFAULT NULL,
      INDEX idx_active (is_active),
      INDEX idx_created (created_at)
    )
  `)
}

/** GET /api/ge-energy/broadcast — returns active broadcasts for customer display */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema()
    const all = req.nextUrl.searchParams.get('all') === '1'

    let sql = `
      SELECT id, title, message, category, sent_by, is_active, created_at, expires_at
      FROM broadcast_messages
      WHERE 1=1
    `
    if (!all) {
      sql += ` AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())`
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`

    const rows = await queryGe(sql)
    return NextResponse.json({ success: true, broadcasts: rows })
  } catch (err: unknown) {
    console.error('broadcast GET error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}

/** POST /api/ge-energy/broadcast — create broadcast */
export async function POST(req: NextRequest) {
  try {
    await ensureSchema()
    const body = await req.json()
    const { title, message, category, sentBy, expiresAt } = body

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'title and message required' }, { status: 400 })
    }

    const validCategories = ['announcement', 'maintenance', 'promotion', 'alert']
    const cat = validCategories.includes(category) ? category : 'announcement'

    const result = await queryGe(
      `INSERT INTO broadcast_messages (title, message, category, sent_by, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), message.trim(), cat, sentBy || null, expiresAt || null],
    )

    const insertId = (result as Array<{ insertId?: number }>)[0]?.insertId
    const rows = await queryGe(`SELECT * FROM broadcast_messages WHERE id = ?`, [insertId])

    return NextResponse.json({ success: true, broadcast: (rows as unknown[])[0] }, { status: 201 })
  } catch (err: unknown) {
    console.error('broadcast POST error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}

/** PATCH /api/ge-energy/broadcast — toggle is_active */
export async function PATCH(req: NextRequest) {
  try {
    await ensureSchema()
    const body = await req.json()
    const { id, is_active } = body
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await queryGe(`UPDATE broadcast_messages SET is_active = ? WHERE id = ?`, [is_active ? 1 : 0, id])
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}

/** DELETE /api/ge-energy/broadcast?id=N */
export async function DELETE(req: NextRequest) {
  try {
    await ensureSchema()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await queryGe(`DELETE FROM broadcast_messages WHERE id = ?`, [Number(id)])
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}
