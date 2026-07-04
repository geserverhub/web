import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const records = await prisma.ctmIncomeTax.findMany({ orderBy: { year: "desc" } });
  return NextResponse.json({ records });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { year, totalRevenue, taxableIncome, taxRate, note, status } = await req.json();
  if (!year || !totalRevenue || !taxableIncome) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  const rate = Number(taxRate || 0.20);
  const taxAmount = Number(taxableIncome) * rate;
  const record = await prisma.ctmIncomeTax.upsert({
    where: { year },
    update: { totalRevenue: Number(totalRevenue), taxableIncome: Number(taxableIncome), taxRate: rate, taxAmount, status: status || "DRAFT", note: note || null },
    create: { id: require("crypto").randomBytes(12).toString("hex"), year, totalRevenue: Number(totalRevenue), taxableIncome: Number(taxableIncome), taxRate: rate, taxAmount, status: status || "DRAFT", note: note || null },
  });
  return NextResponse.json(record, { status: 201 });
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status, note } = await req.json();
  const record = await prisma.ctmIncomeTax.update({ where: { id }, data: { status, note } });
  return NextResponse.json(record);
}
