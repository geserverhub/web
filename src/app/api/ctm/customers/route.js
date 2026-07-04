import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const customers = await prisma.ctmCustomer.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { sales: true } } } });
  return NextResponse.json({ customers });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, phone, email, address, nationality, note } = await req.json();
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });

  const allCodes = await prisma.ctmCustomer.findMany({ where: { customerCode: { not: null } }, select: { customerCode: true } });
  let maxNum = 0;
  for (const c of allCodes) {
    const m = c.customerCode?.match(/^CUS(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const customerCode = `CUS${String(maxNum + 1).padStart(4, "0")}`;

  const customer = await prisma.ctmCustomer.create({ data: { customerCode, name, phone: phone || null, email: email || null, address: address || null, nationality: nationality || null, note: note || null } });
  return NextResponse.json(customer, { status: 201 });
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...data } = await req.json();
  const customer = await prisma.ctmCustomer.update({ where: { id }, data });
  return NextResponse.json(customer);
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  await prisma.ctmCustomer.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
