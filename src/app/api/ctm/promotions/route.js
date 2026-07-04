import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "1";
  const where = activeOnly ? { isActive: true } : {};
  const promotions = await prisma.ctmPromotion.findMany({
    where,
    include: { product: { select: { id: true, name: true, nameKo: true, sellPrice: true, imageUrl: true, category: true, unit: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ promotions });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { productId, promoPrice, label, note, endDate } = await req.json();
  if (!productId || !promoPrice) return NextResponse.json({ error: "กรุณาระบุสินค้าและราคาโปร" }, { status: 400 });
  const allCodes = await prisma.ctmPromotion.findMany({ where: { promoCode: { not: null } }, select: { promoCode: true } });
  let maxNum = 0;
  for (const c of allCodes) {
    const m = c.promoCode?.match(/^PRO(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const promoCode = `PRO${String(maxNum + 1).padStart(4, "0")}`;

  const promo = await prisma.ctmPromotion.create({
    data: {
      id: require("crypto").randomBytes(12).toString("hex"),
      promoCode,
      productId,
      promoPrice: Number(promoPrice),
      label: label || null,
      note: note || null,
      endDate: endDate ? new Date(endDate) : null,
    },
    include: { product: { select: { name: true, sellPrice: true } } },
  });
  return NextResponse.json(promo, { status: 201 });
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, promoPrice, label, note, isActive, endDate } = await req.json();
  const promo = await prisma.ctmPromotion.update({
    where: { id },
    data: {
      ...(promoPrice !== undefined && { promoPrice: Number(promoPrice) }),
      ...(label !== undefined && { label }),
      ...(note !== undefined && { note }),
      ...(isActive !== undefined && { isActive }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
  });
  return NextResponse.json(promo);
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  await prisma.ctmPromotion.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
