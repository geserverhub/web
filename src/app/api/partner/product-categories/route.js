import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import {
  ensurePartnerProductCategorySchema,
  newCategoryId,
} from '@/lib/partner-product-category-db';

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === 'PARTNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

function categoryWhere(session) {
  const { role, clientId } = session.user;
  if (role === 'PARTNER' && clientId) {
    return { OR: [{ clientId: null }, { clientId }] };
  }
  if (role === 'PARTNER') {
    return { clientId: null };
  }
  return {};
}

function prismaUnavailable() {
  return NextResponse.json(
    {
      error:
        'Prisma client ยังไม่อัปเดต — รัน npx prisma generate แล้ว restart dev server',
    },
    { status: 503 }
  );
}

export async function GET() {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prisma = getPrisma();
    if (!prisma?.partnerProductCategory) return prismaUnavailable();

    await ensurePartnerProductCategorySchema(prisma);

    const rows = await prisma.partnerProductCategory.findMany({
      where: categoryWhere(session),
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[product-categories GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prisma = getPrisma();
    if (!prisma?.partnerProductCategory) return prismaUnavailable();

    await ensurePartnerProductCategorySchema(prisma);

    const { name, sortOrder } = await req.json();
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'ชื่อหมวดสินค้าจำเป็น' }, { status: 400 });
    }

    const clientId =
      session.user.role === 'PARTNER' ? session.user.clientId ?? null : null;

    const existing = await prisma.partnerProductCategory.findFirst({
      where: { name: trimmed, clientId },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const maxSort = await prisma.partnerProductCategory.aggregate({
      where: categoryWhere(session),
      _max: { sortOrder: true },
    });

    const category = await prisma.partnerProductCategory.create({
      data: {
        id: newCategoryId(),
        name: trimmed,
        sortOrder:
          sortOrder != null
            ? Number(sortOrder)
            : Number(maxSort._max.sortOrder || 0) + 10,
        clientId,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error('[product-categories POST]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'หมวดนี้มีอยู่แล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
