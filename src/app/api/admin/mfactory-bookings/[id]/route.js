import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateMFactoryBookingStatus } from '@/lib/mfactory/booking-service';

function isSuperAdmin(session) {
  return session?.user?.role === 'SUPER_ADMIN';
}

/** PATCH /api/admin/mfactory-bookings/[id] — update booking status */
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const status = body?.status;

    const result = await updateMFactoryBookingStatus(id, status);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
