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
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

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

    if (user.role !== 'CLIENT' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'บัญชีนี้ไม่มีสิทธิ์เข้าถึงพอร์ทัลลูกค้า' }, { status: 403 });
    }

    const token = randomUUID();

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username ?? user.email,
      name: user.name ?? user.username,
      email: user.email,
      site: null,
      typeID: null,
      departmentID: null,
    });
  } catch (err) {
    console.error('[api/user/login] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
