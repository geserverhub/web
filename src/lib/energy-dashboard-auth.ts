import { createHmac, timingSafeEqual } from 'crypto';
import { getAuthSecret } from '@/lib/auth-secret';

const TOKEN_TTL_SEC = 60 * 60 * 24 * 30;

export type EnergyJwtPayload = {
  sub: string;
  clientId: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  portal: 'energy';
  iat: number;
  exp: number;
};

function signBody(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function signEnergyDashboardToken(input: {
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
  const payload: EnergyJwtPayload = {
    sub: input.userId,
    clientId: input.clientId ?? null,
    email: input.email ?? null,
    username: input.username ?? null,
    phone: input.phone ?? null,
    portal: 'energy',
    iat: now,
    exp: now + TOKEN_TTL_SEC,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signBody(body, secret)}`;
}

export function verifyEnergyDashboardToken(token: string): EnergyJwtPayload | null {
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
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as EnergyJwtPayload;
    if (payload.portal !== 'energy' || !payload.sub) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
