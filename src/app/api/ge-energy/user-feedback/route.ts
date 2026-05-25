import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as queryGe } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BRANCH_KEYWORDS: Record<string, string[]> = {
  korea: ['korea', 'korean', 'kr'],
  thailand: ['thailand', 'thai', 'th'],
  vietnam: ['vietnam', 'vietnamese', 'vn'],
  malaysia: ['malaysia', 'malay', 'my'],
  brunei: ['brunei', 'bn'],
}

async function ensureFeedbackBranchColumn() {
  const rows = await queryGe(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_feedback'
       AND COLUMN_NAME = 'branch'`
  )

  const columnExists = Number((rows as Array<{ count: number }>)[0]?.count || 0) > 0
  if (!columnExists) {
    await queryGe(`ALTER TABLE user_feedback ADD COLUMN branch VARCHAR(50) DEFAULT NULL`)
  }
}

/** POST /api/ge-energy/user-feedback */
export async function POST(req: NextRequest) {
  try {
    await ensureFeedbackBranchColumn()

    const body = await req.json()
    const { userId, category, subject, message, rating, branch } = body

    if (!category || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'category, subject, and message are required',
      }, { status: 400 })
    }

    const validCategories = ['Suggestion', 'Bug Report', 'Feature Request', 'General Feedback']
    if (!validCategories.includes(category)) {
      return NextResponse.json({
        success: false,
        error: `category must be one of: ${validCategories.join(', ')}`,
      }, { status: 400 })
    }

    const numRating = rating !== undefined ? Number(rating) : 0
    if (numRating < 0 || numRating > 5) {
      return NextResponse.json({
        success: false,
        error: 'rating must be between 0 and 5',
      }, { status: 400 })
    }

    const result = await queryGe(
      `INSERT INTO user_feedback (user_id, category, subject, message, rating, branch, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        category,
        subject,
        message,
        numRating,
        branch || null,
        userId ? `user_${userId}` : 'anonymous',
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      feedbackId: (result as Array<{ insertId?: number }>)[0]?.insertId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit feedback'
    console.error('User feedback API error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** GET /api/ge-energy/user-feedback */
export async function GET(req: NextRequest) {
  try {
    await ensureFeedbackBranchColumn()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const branch = (searchParams.get('branch') || '').toLowerCase()
    const userId = searchParams.get('userId')

    let sql = `
      SELECT
        f.id,
        f.user_id,
        f.category,
        f.subject,
        f.message,
        f.rating,
        f.branch,
        f.status,
        f.created_at,
        f.created_by,
        u.name as user_name,
        u.email as user_email
      FROM user_feedback f
      LEFT JOIN User u ON f.user_id = u.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (userId) {
      sql += ' AND f.user_id = ?'
      params.push(userId)
    }

    if (status) {
      sql += ' AND f.status = ?'
      params.push(status)
    }

    if (category) {
      sql += ' AND f.category = ?'
      params.push(category)
    }

    if (branch && BRANCH_KEYWORDS[branch]) {
      const tokens = BRANCH_KEYWORDS[branch]
      const branchLikeConditions = tokens
        .map(() => '(f.subject LIKE ? OR f.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)')
        .join(' OR ')

      sql += ` AND (LOWER(COALESCE(f.branch, '')) = ? OR (${branchLikeConditions}))`
      params.push(branch)

      tokens.forEach((token) => {
        const like = `%${token}%`
        params.push(like, like, like, like)
      })
    }

    sql += ' ORDER BY f.created_at DESC LIMIT 100'

    const feedbacks = await queryGe(sql, params)

    return NextResponse.json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch feedback'
    console.error('Get feedback API error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
