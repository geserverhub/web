import { NextResponse } from 'next/server';
import { parseErpUserHeader } from '@/lib/erp-user-header';
import {
  listEmployeesWithFaceStatus,
  saveFacePhoto,
  upsertEmployeeFace,
} from '@/lib/erp-face-attendance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const user = parseErpUserHeader(req);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employees = await listEmployeesWithFaceStatus();
    return NextResponse.json({ ok: true, employees });
  } catch (err) {
    console.error('[face-enrollment GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load employees' },
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
    const employeeId = Number(body.employeeId);
    const descriptor = body.descriptor;
    const photoData = body.photoData;

    if (!employeeId || !Number.isFinite(employeeId)) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
    }
    if (!Array.isArray(descriptor) || descriptor.length < 64) {
      return NextResponse.json({ error: 'Invalid face descriptor' }, { status: 400 });
    }
    if (!photoData) {
      return NextResponse.json({ error: 'photoData required' }, { status: 400 });
    }

    const photoPath = await saveFacePhoto(photoData);
    await upsertEmployeeFace({
      employeeId,
      descriptor,
      photoPath,
      enrolledBy: user.userId || user.email || null,
    });

    return NextResponse.json({ ok: true, photoPath, employeeId });
  } catch (err) {
    console.error('[face-enrollment POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Enrollment failed' },
      { status: 500 }
    );
  }
}
