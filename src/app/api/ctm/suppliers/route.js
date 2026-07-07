import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const suppliers = await prisma.ctmSupplier.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  return NextResponse.json({ suppliers });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, company, phone, email, address, country, bankAccount, note } = await req.json();
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });

  const allCodes = await prisma.ctmSupplier.findMany({ where: { supplierCode: { not: null } }, select: { supplierCode: true } });
  let maxNum = 0;
  for (const s of allCodes) {
    const m = s.supplierCode?.match(/^SUP(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const supplierCode = `SUP${String(maxNum + 1).padStart(4, "0")}`;

  const supplier = await prisma.ctmSupplier.create({ data: { supplierCode, name, company: company || null, phone: phone || null, email: email || null, address: address || null, country: country || null, bankAccount: bankAccount || null, note: note || null } });
  return NextResponse.json(supplier, { status: 201 });
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...data } = await req.json();
  const supplier = await prisma.ctmSupplier.update({ where: { id }, data });
  return NextResponse.json(supplier);
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const poCount = await prisma.ctmPurchaseOrder.count({ where: { supplierId: id } });
  if (poCount > 0) return NextResponse.json({ error: "คู่ค้านี้มีประวัติการซื้อขายอยู่ ไม่สามารถลบได้" }, { status: 400 });
  await prisma.ctmSupplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
