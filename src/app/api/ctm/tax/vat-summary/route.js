import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

function getHalfYearBuckets() {
  const now = new Date();
  const curYear = now.getFullYear();
  const periods = [];
  for (let y = curYear - 1; y <= curYear; y++) {
    periods.push({ year: y, half: 1, start: new Date(y, 0, 1), end: new Date(y, 6, 1), dueMonth: 7, dueYear: y });
    periods.push({ year: y, half: 2, start: new Date(y, 6, 1), end: new Date(y + 1, 0, 1), dueMonth: 1, dueYear: y + 1 });
  }
  return periods;
}

function getStatus(now, dueYear, dueMonth) {
  const dueMonthStart = new Date(dueYear, dueMonth - 1, 1);
  const dueMonthEnd = new Date(dueYear, dueMonth, 1);
  if (now >= dueMonthEnd) return "OVERDUE";
  if (now >= dueMonthStart) return "DUE_NOW";
  return "NOT_YET_DUE";
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const buckets = getHalfYearBuckets();
  const periods = await Promise.all(buckets.map(async (b) => {
    const sales = await prisma.ctmSale.findMany({ where: { saleDate: { gte: b.start, lt: b.end } }, select: { totalAmount: true, taxAmount: true } });
    const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const taxAmount = sales.reduce((s, r) => s + Number(r.taxAmount), 0);
    const subtotal = totalRevenue - taxAmount;
    return {
      year: b.year, half: b.half,
      label: b.half === 1 ? `งวดที่ 1: ม.ค.-มิ.ย. ${b.year + 543}` : `งวดที่ 2: ก.ค.-ธ.ค. ${b.year + 543}`,
      subtotal, taxAmount, totalRevenue,
      dueMonth: b.dueMonth, dueYear: b.dueYear,
      dueLabel: `เดือน ${b.dueMonth} ปี ${b.dueYear + 543}`,
      salesCount: sales.length,
      status: getStatus(now, b.dueYear, b.dueMonth),
    };
  }));
  return NextResponse.json({ periods });
}
