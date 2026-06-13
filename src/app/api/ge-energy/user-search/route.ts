import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ge-energy/user-search?q=keyword&limit=20
// Returns users matching name/username/email — for linking momoge_cus.user_id
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)))

  const prisma = getPrisma()
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { username: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}

    const users = await (prisma as any).user.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, users })
  } catch (err) {
    console.error('[user-search]', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to search users' },
      { status: 500 },
    )
  }
}
