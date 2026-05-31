import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listMFactoryBookings } from '@/lib/mfactory/booking-service';

function isSuperAdmin(session) {
  return session?.user?.role === 'SUPER_ADMIN';
}

/** GET /api/admin/mfactory-bookings — list M-Factory booking form submissions */
export async function GET(req) {
  const session = await auth();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit');
    const result = await listMFactoryBookings({ limit: limit ? Number(limit) : 200 });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      bookings: result.bookings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load bookings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
