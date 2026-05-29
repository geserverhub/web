import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { formatDbConnectError } from '@/lib/db-connect-error';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import {
  isRoleAllowedForUserLogin,
  userLoginDeniedMessage,
  userLoginPortalKey,
} from '@/lib/login-portals';

export async function POST(request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: 'Database unavailable. Run: npx prisma generate && restart the dev server.' },
      { status: 503 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { username, password, pageName } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const page = String(pageName || '').trim();

    // Look up by username or email
    const identifier = String(username).trim();
    const user =
      (await prisma.user.findUnique({ where: { username: identifier } })) ??
      (await prisma.user.findUnique({ where: { email: identifier } })) ??
      (await prisma.user.findFirst({ where: { name: identifier } }));

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (!isRoleAllowedForUserLogin(page, user.role)) {
      return NextResponse.json({ error: userLoginDeniedMessage(page) }, { status: 403 });
    }

    // Check portal permissions (skip for SUPER_ADMIN)
    if (user.role !== 'SUPER_ADMIN') {
      const portalKey = userLoginPortalKey(page);
      try {
        const permRows = await queryGeserverhub(
          'SELECT is_allowed FROM user_permissions WHERE user_id = ? AND portal = ? LIMIT 1',
          [user.id, portalKey]
        );
        if (permRows.length > 0 && !permRows[0].is_allowed) {
          return NextResponse.json(
            { error: `บัญชีนี้ถูกระงับสิทธิ์การเข้าถึง ${portalKey}` },
            { status: 403 }
          );
        }
      } catch {
        // If permission check fails, allow login (fail open)
      }
    }

    const token = randomUUID();

    let name = user.name ?? user.username;
    let role = user.role;
    const uname = user.username ?? '';
    if (uname === 'goeun' || name === 'Super Admin') {
      name = 'pavinee boknoi';
      role = 'ADMIN';
    } else if (role === 'SUPER_ADMIN') {
      role = 'ADMIN';
    }

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username ?? user.email,
      name,
      email: user.email,
      role,
      clientId: user.clientId ?? null,
      site: null,
      typeID: null,
      departmentID: null,
    });
  } catch (err) {
    console.error('[api/user/login] error:', err);
    const msg = String(err?.message || '');
    if (
      msg.includes('Authentication failed') ||
      msg.includes('denied access') ||
      msg.includes('credentials') ||
      err?.name === 'PrismaClientInitializationError'
    ) {
      return NextResponse.json({ error: formatDbConnectError(err) }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
