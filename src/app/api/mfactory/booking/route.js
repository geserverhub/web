import { NextResponse } from 'next/server';
import { createMFactoryBooking } from '@/lib/mfactory/booking-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/mfactory/booking — warehouse booking form */
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await createMFactoryBooking(body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      { success: true, ok: true, id: result.id, createdAt: result.createdAt },
      { status: result.status }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save booking';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
