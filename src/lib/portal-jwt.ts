/** Client-safe JWT payload read (signature not verified). */
export function readJwtPortalUnsafe(token: string | null | undefined): string | null {
  const body = token?.split('.')?.[0];
  if (!body) return null;
  try {
    const normalized = body.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob !== 'undefined'
        ? atob(normalized)
        : Buffer.from(body, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { portal?: string };
    return payload.portal ?? null;
  } catch {
    return null;
  }
}

export function isJwtExpiredUnsafe(token: string | null | undefined): boolean {
  const body = token?.split('.')?.[0];
  if (!body) return true;
  try {
    const normalized = body.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob !== 'undefined'
        ? atob(normalized)
        : Buffer.from(body, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp !== 'number') return true;
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}
