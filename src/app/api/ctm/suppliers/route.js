import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const suppliers = await prisma.ctmSupplier.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ suppliers });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, company, phone, email, address, country, note } = await req.json();
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
  const supplier = await prisma.ctmSupplier.create({ data: { name, company: company || null, phone: phone || null, email: email || null, address: address || null, country: country || null, note: note || null } });
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
  await prisma.ctmSupplier.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
