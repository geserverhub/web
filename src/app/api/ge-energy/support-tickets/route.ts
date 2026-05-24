import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generate unique ticket ID in format: TKT-YYYYMMDD-XXXX
 */
async function generateTicketId(): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')

  const result = await queryGe(`
    SELECT COUNT(*) as count FROM support_tickets
    WHERE DATE(created_at) = CURDATE()
  `)

  const count = result[0]?.count || 0
  return `TKT-${today}-${String(count + 1).padStart(4, '0')}`
}

/**
 * GET /api/ge-energy/support-tickets
 * 錫붲마錫?support tickets 錫귖릎錫?user 錫왽르仙됢릎錫?filters
 * Query params:
 *   - userId: number (required)
 *   - status: Open | Closed | Pending
 *   - search: string (錫꾝퉱錫쇸릊錫꿋퉫錫?subject 錫ム르錫룅릎 ticket_id)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }

    let sql = `
      SELECT
        id, ticket_id, subject, type, priority, status,
        description, created_at, updated_at,
        TIMESTAMPDIFF(DAY, created_at, NOW()) as ageDays,
        TIMESTAMPDIFF(HOUR, created_at, NOW()) MOD 24 as ageHours
      FROM support_tickets
      WHERE user_id = ?
    `
    const params: any[] = [userId]

    if (status && status !== 'all') {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      sql += ' AND (subject LIKE ? OR ticket_id LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY created_at DESC LIMIT 100'

    const tickets = await queryGe(sql, params)

    // Format age
    const formattedTickets = tickets.map((t: any) => ({
      ...t,
      age: t.ageDays > 0
        ? `${t.ageDays}d ${t.ageHours}h`
        : `${t.ageHours}h`
    }))

    return NextResponse.json({
      success: true,
      count: formattedTickets.length,
      tickets: formattedTickets
    })
  } catch (err: any) {
    console.error('Support tickets GET error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to fetch tickets'
    }, { status: 500 })
  }
}

/**
 * POST /api/ge-energy/support-tickets
 * 錫む르仙됢림錫?ticket 仙꺺릊錫□퉰
 * Body: {
 *   userId: number,
 *   subject: string,
 *   type: string,
 *   priority: Low | Normal | High,
 *   description?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, subject, type, priority, description } = body

    // Validate required fields
    if (!userId || !subject || !type) {
      return NextResponse.json({
        success: false,
        error: 'userId, subject, and type are required'
      }, { status: 400 })
    }

    // Generate unique ticket ID
    const ticketId = await generateTicketId()

    // Insert ticket
    const result = await queryGe(`
      INSERT INTO support_tickets
        (ticket_id, user_id, subject, type, priority, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      ticketId,
      userId,
      subject,
      type,
      priority || 'Normal',
      description || null,
      `user_${userId}`
    ])

    return NextResponse.json({
      success: true,
      message: 'Ticket created successfully',
      ticketId,
      id: (result as any)[0]?.insertId
    })
  } catch (err: any) {
    console.error('Support tickets POST error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to create ticket'
    }, { status: 500 })
  }
}

/**
 * PUT /api/ge-energy/support-tickets
 * 錫?릴錫왽?錫붲툠 ticket (仙錫쎹른錫듀퉰錫№툢錫む툟錫꿋툢錫? priority, etc.)
 * Body: {
 *   ticketId: string,
 *   status?: Open | Closed | Pending,
 *   priority?: Low | Normal | High,
 *   description?: string
 * }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticketId, status, priority, description } = body

    if (!ticketId) {
      return NextResponse.json({
        success: false,
        error: 'ticketId is required'
      }, { status: 400 })
    }

    // Build update query
    const updates: string[] = []
    const params: any[] = []

    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update'
      }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    params.push(ticketId)

    await queryGe(`
      UPDATE support_tickets
      SET ${updates.join(', ')}
      WHERE ticket_id = ?
    `, params)

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully'
    })
  } catch (err: any) {
    console.error('Support tickets PUT error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to update ticket'
    }, { status: 500 })
  }
}
