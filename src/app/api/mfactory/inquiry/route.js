import { NextResponse } from 'next/server';
import { createMFactoryBooking } from '@/lib/mfactory/booking-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/mfactory/inquiry — alias for booking (legacy + site forms) */
export async function POST(req) {
  try {
    const body = await req.json();
    const result = await createMFactoryBooking(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, id: result.id }, { status: result.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save inquiry' },
      { status: 500 }
    );
  }
}
