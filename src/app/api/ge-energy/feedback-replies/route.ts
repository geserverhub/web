import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ensureSchema() {
  await queryGe(`
    CREATE TABLE IF NOT EXISTS feedback_replies (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      feedback_id INT NOT NULL,
      sender_type ENUM('partner','customer') NOT NULL DEFAULT 'partner',
      sender_name VARCHAR(255),
      message     TEXT NOT NULL,
      created_at  DATETIME NOT NULL DEFAULT NOW(),
      INDEX idx_feedback_id (feedback_id)
    )
  `)
}

/** GET /api/ge-energy/feedback-replies?feedbackId=123 */
export async function GET(req: NextRequest) {
  try {
    await ensureSchema()
    const feedbackId = req.nextUrl.searchParams.get('feedbackId')
    if (!feedbackId || isNaN(Number(feedbackId))) {
      return NextResponse.json({ success: false, error: 'feedbackId required' }, { status: 400 })
    }
    const rows = await queryGe(
      `SELECT id, feedback_id, sender_type, sender_name, message, created_at
       FROM feedback_replies
       WHERE feedback_id = ?
       ORDER BY created_at ASC`,
      [Number(feedbackId)],
    )
    return NextResponse.json({ success: true, replies: rows })
  } catch (err: unknown) {
    console.error('feedback-replies GET error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}

/** POST /api/ge-energy/feedback-replies */
export async function POST(req: NextRequest) {
  try {
    await ensureSchema()
    const body = await req.json()
    const { feedbackId, message, senderName, senderType } = body

    if (!feedbackId || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'feedbackId and message required' }, { status: 400 })
    }

    const type = senderType === 'customer' ? 'customer' : 'partner'

    const result = await queryGe(
      `INSERT INTO feedback_replies (feedback_id, sender_type, sender_name, message)
       VALUES (?, ?, ?, ?)`,
      [Number(feedbackId), type, senderName || null, message.trim()],
    )

    const insertId = (result as Array<{ insertId?: number }>)[0]?.insertId

    const rows = await queryGe(
      `SELECT id, feedback_id, sender_type, sender_name, message, created_at
       FROM feedback_replies WHERE id = ?`,
      [insertId],
    )

    return NextResponse.json({ success: true, reply: (rows as unknown[])[0] }, { status: 201 })
  } catch (err: unknown) {
    console.error('feedback-replies POST error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'error' }, { status: 500 })
  }
}
