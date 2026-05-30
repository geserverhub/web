import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSecret } from '@/lib/auth-secret';
import {
  resolveCustomerMeters,
  type CustomerScopeInput,
} from '@/lib/ge-energy/customer-scope';

const TOKEN_TTL_SEC = 60 * 60 * 24 * 30;

export type CustomerJwtPayload = {
  sub: string;
  clientId: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  portal: 'customer';
  iat: number;
  exp: number;
};

function signBody(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signCustomerDashboardToken(input: {
  userId: string;
  clientId?: string | null;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
}): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }
  const now = Math.floor(Date.now() / 1000);
  const payload: CustomerJwtPayload = {
    sub: input.userId,
    clientId: input.clientId ?? null,
    email: input.email ?? null,
    username: input.username ?? null,
    phone: input.phone ?? null,
    portal: 'customer',
    iat: now,
    exp: now + TOKEN_TTL_SEC,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signBody(body, secret)}`;
}

export function verifyCustomerDashboardToken(token: string): CustomerJwtPayload | null {
  const secret = getAuthSecret();
  if (!secret || !token?.includes('.')) return null;

  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = signBody(body, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CustomerJwtPayload;
    if (payload.portal !== 'customer' || !payload.sub) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCustomerBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-customer-token')?.trim() || null;
}

export function requireCustomerDashboardAuth(
  request: NextRequest,
):
  | { ok: true; payload: CustomerJwtPayload; scope: CustomerScopeInput }
  | { ok: false; response: NextResponse } {
  const raw = readCustomerBearerToken(request);
  if (!raw) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const payload = verifyCustomerDashboardToken(raw);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired session. Please sign in again.' },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    payload,
    scope: {
      userId: payload.sub,
      clientId: payload.clientId,
      email: payload.email,
      phone: payload.phone,
      username: payload.username,
    },
  };
}

export async function assertCustomerDeviceAccess(
  scope: CustomerScopeInput,
  deviceId: string | null | undefined,
): Promise<NextResponse | null> {
  if (deviceId == null || deviceId === '') return null;
  const id = Number(deviceId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid deviceId' }, { status: 400 });
  }
  const meters = await resolveCustomerMeters(scope);
  if (!meters.some((m) => m.deviceId === id)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
