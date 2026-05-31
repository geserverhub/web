import { NextResponse } from 'next/server';
import { parseErpUserHeader } from '@/lib/erp-user-header';
import {
  clockByDescriptor,
  listFaceAttendance,
  saveFacePhoto,
} from '@/lib/erp-face-attendance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = new URL(req.url).searchParams.get('limit') || '50';
    const rows = await listFaceAttendance({ limit });
    return NextResponse.json({ ok: true, rows });
  } catch (err) {
    console.error('[face-attendance GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load records' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const eventType = body.eventType === 'check_out' ? 'check_out' : 'check_in';
    const descriptor = body.descriptor;
    const photoData = body.photoData;

    if (!Array.isArray(descriptor) || descriptor.length < 64) {
      return NextResponse.json({ error: 'Invalid face descriptor' }, { status: 400 });
    }
    if (!photoData) {
      return NextResponse.json({ error: 'photoData required' }, { status: 400 });
    }

    const photoPath = await saveFacePhoto(photoData);
    const result = await clockByDescriptor({
      descriptor,
      photoPath,
      eventType,
      deviceNote: body.deviceNote || null,
      createdBy: user.userId || user.email || null,
    });

    if (!result.ok) {
      const status =
        result.error === 'face_not_recognized' || result.error === 'ambiguous_match'
          ? 422
          : result.error === 'already_checked_in' || result.error === 'already_checked_out'
            ? 409
            : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[face-attendance POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Clock failed' },
      { status: 500 }
    );
  }
}
