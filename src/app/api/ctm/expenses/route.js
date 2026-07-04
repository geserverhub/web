import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  let where = {};
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    where = { date: { gte: start, lt: end } };
  }
  const expenses = await prisma.ctmDailyExpense.findMany({ where, orderBy: { date: "desc" } });
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; }, {});
  return NextResponse.json({ expenses, total, byCategory });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { date, category, description, amount, paymentType, note } = await req.json();
  if (!category || !amount) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  const expense = await prisma.ctmDailyExpense.create({
    data: { id: require("crypto").randomBytes(12).toString("hex"), date: date ? new Date(date) : new Date(), category, description: description || null, amount: Number(amount), paymentType: paymentType || "CASH", note: note || null },
  });
  return NextResponse.json(expense, { status: 201 });
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  await prisma.ctmDailyExpense.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
