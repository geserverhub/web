import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

// Korea corporate income tax brackets (progressive)
const BRACKETS = [
  { limit: 200_000_000, rate: 0.09 },
  { limit: 20_000_000_000, rate: 0.19 },
  { limit: 300_000_000_000, rate: 0.21 },
  { limit: Infinity, rate: 0.24 },
];

function calcProgressiveTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0, prevLimit = 0;
  for (const b of BRACKETS) {
    if (taxableIncome <= prevLimit) break;
    const inBracket = Math.min(taxableIncome, b.limit) - prevLimit;
    tax += inBracket * b.rate;
    prevLimit = b.limit;
  }
  return tax;
}

function getStatus(now, dueYear) {
  const dueMonthStart = new Date(dueYear, 4, 1); // May 1
  const dueMonthEnd = new Date(dueYear, 5, 1);   // Jun 1
  if (now >= dueMonthEnd) return "OVERDUE";
  if (now >= dueMonthStart) return "DUE_NOW";
  return "NOT_YET_DUE";
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const curYear = now.getFullYear();
  const years = [curYear - 2, curYear - 1, curYear];

  const results = await Promise.all(years.map(async (y) => {
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    const [sales, expenses] = await Promise.all([
      prisma.ctmSale.findMany({ where: { saleDate: { gte: start, lt: end } }, include: { items: true } }),
      prisma.ctmDailyExpense.findMany({ where: { date: { gte: start, lt: end } } }),
    ]);
    const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalTax = sales.reduce((s, r) => s + Number(r.taxAmount), 0);
    const totalCost = sales.reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.buyPrice) * i.quantity, 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const taxableIncome = (totalRevenue - totalTax - totalCost) - totalExpense;
    const taxAmount = calcProgressiveTax(taxableIncome);
    const dueYear = y + 1;

    return {
      year: y,
      totalRevenue, taxableIncome, taxAmount,
      dueYear, dueLabel: `เดือน 5 ปี ${dueYear + 543}`,
      status: getStatus(now, dueYear),
    };
  }));

  return NextResponse.json({ years: results });
}
