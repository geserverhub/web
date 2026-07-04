import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const wages = await prisma.ctmWage.findMany({
    where: period ? { period } : {},
    orderBy: [{ period: "desc" }, { employeeName: "asc" }],
  });
  const total = wages.reduce((s, w) => s + Number(w.totalPay), 0);
  return NextResponse.json({ wages, total });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { period, employeeName, baseSalary, overtimeHours, overtimePay, bonus, note } = await req.json();
  if (!period || !employeeName || !baseSalary) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  const totalPay = Number(baseSalary) + Number(overtimePay || 0) + Number(bonus || 0);
  const wage = await prisma.ctmWage.create({
    data: { id: require("crypto").randomBytes(12).toString("hex"), period, employeeName, baseSalary: Number(baseSalary), overtimeHours: Number(overtimeHours || 0), overtimePay: Number(overtimePay || 0), bonus: Number(bonus || 0), totalPay, note: note || null },
  });
  return NextResponse.json(wage, { status: 201 });
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  await prisma.ctmWage.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
