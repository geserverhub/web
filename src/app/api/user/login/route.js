import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getPrisma } from '@/lib/prisma';

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
    const isEnergyDashboard =
      page === '/energy-dashboard' ||
      page.startsWith('/energy-dashboard/') ||
      page === '/energy-dashboard-login';

    const isOnlineClassroom =
      page === '/online-classroom' ||
      page.startsWith('/online-classroom/') ||
      page === '/online-classroom-login';

    const allowedRoles = isEnergyDashboard
      ? ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER']
      : isOnlineClassroom
        ? ['CLIENT', 'ADMIN', 'SUPER_ADMIN', 'PARTNER']
        : ['CLIENT', 'ADMIN', 'SUPER_ADMIN'];

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

    if (!allowedRoles.includes(user.role)) {
      const error = isEnergyDashboard
        ? 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบ Energy Dashboard'
        : isOnlineClassroom
          ? 'บัญชีนี้ไม่มีสิทธิ์เข้าห้องเรียนออนไลน์'
          : 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงพอร์ทัลลูกค้า';
      return NextResponse.json({ error }, { status: 403 });
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
      msg.includes('credentials') ||
      err?.name === 'PrismaClientInitializationError'
    ) {
      return NextResponse.json(
        {
          error:
            'Database connection failed. Start dev in WSL (npm run dev:wsl) or create goeunserverhub DB user on Windows MySQL.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
