import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const records = await prisma.ctmTaxRecord.findMany({ orderBy: { period: "desc" } });
  return NextResponse.json({ records });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { period, totalSales, vatRate, note } = await req.json();
  if (!period || !totalSales) return NextResponse.json({ error: "กรุณากรอก period และ totalSales" }, { status: 400 });
  const rate = Number(vatRate || 0.10);
  const vatAmount = Number(totalSales) * rate;
  const record = await prisma.ctmTaxRecord.upsert({
    where: { period },
    update: { totalSales: Number(totalSales), vatAmount, vatRate: rate, note: note || null },
    create: { period, totalSales: Number(totalSales), vatAmount, vatRate: rate, note: note || null },
  });
  return NextResponse.json(record, { status: 201 });
}
