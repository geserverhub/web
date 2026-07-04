import { NextResponse } from 'next/server';
import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Server-side portal login — sets session cookie without browser CSRF flow. */
export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.username || body.email || '').trim();
    const password = String(body.password || '');
    const portal = String(body.portal || '').trim();

    if (!identifier || !password || !portal) {
      return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
    }

    const result = await signIn('credentials', {
      email: identifier,
      password,
      portal,
      redirect: false,
    });

    if (result?.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.type || 'auth_error' }, { status: 401 });
    }
    console.error('[api/portal-login]', error);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
