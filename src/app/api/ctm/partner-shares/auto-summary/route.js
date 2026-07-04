import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

const SHARE_RATE = 0.40;

// Korea corporate income tax brackets (progressive) — same schedule used on the income-tax page
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

function getRecentMonthBuckets(n) {
  const now = new Date();
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, start, end });
  }
  return buckets;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const buckets = getRecentMonthBuckets(6);
  const months = await Promise.all(buckets.map(async (b) => {
    const [sales, expenses, recorded] = await Promise.all([
      prisma.ctmSale.findMany({ where: { saleDate: { gte: b.start, lt: b.end } }, include: { items: true } }),
      prisma.ctmDailyExpense.findMany({ where: { date: { gte: b.start, lt: b.end } } }),
      prisma.ctmPartnerShare.findMany({ where: { period: b.key } }),
    ]);
    const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalTax = sales.reduce((s, r) => s + Number(r.taxAmount), 0);
    const totalCost = sales.reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.buyPrice) * i.quantity, 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const afterExpense = totalRevenue - totalTax - totalCost - totalExpense;
    const incomeTax = calcProgressiveTax(afterExpense);
    const remaining = afterExpense - incomeTax;
    const shareAmount = remaining * SHARE_RATE;

    const totalRecordedShare = recorded.reduce((s, r) => s + Number(r.shareAmount), 0);
    const pendingAmount = shareAmount - totalRecordedShare;

    return {
      period: b.key,
      totalRevenue, vatAmount: totalTax, totalCost, totalExpense, incomeTax, remaining,
      shareAmount, totalRecordedShare,
      pendingAmount,
      status: pendingAmount > 1 ? (totalRecordedShare > 0 ? "PARTIAL" : "PENDING") : "PAID",
    };
  }));

  return NextResponse.json({ months });
}
