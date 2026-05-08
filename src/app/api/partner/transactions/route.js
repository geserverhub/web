import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear());

    const yearStart = new Date(`${year}-01-01T00:00:00`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00`);

    const transactions = await prisma.partnerTransaction.findMany({
      where: { date: { gte: yearStart, lt: yearEnd } },
      orderBy: { date: "desc" },
    });

    const revenueTypes = new Set(["SALE", "PROFIT_SHARE"]);
    const sales    = transactions.filter(t => revenueTypes.has(t.type) && t.status !== "CANCELLED");
    const expenses = transactions.filter(t => t.type === "EXPENSE" && t.status !== "CANCELLED");
    const pending  = transactions.filter(t => t.status === "PENDING");

    // KRW-only totals for main stats
    const totalRevenue = sales.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = expenses.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);
    const totalPending = pending.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);

    // Non-KRW breakdown per currency
    function groupByCurrency(list) {
      return list.filter(t => t.currency !== "KRW").reduce((acc, t) => {
        const cur = t.currency || "KRW";
        acc[cur] = (acc[cur] || 0) + Number(t.amount);
        return acc;
      }, {});
    }
    const revenueByCurrency = groupByCurrency(sales);
    const expenseByCurrency = groupByCurrency(expenses);
    const pendingByCurrency = groupByCurrency(pending);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString("ko-KR", { month: "short" }),
      revenue: 0,
      expense: 0,
      count: 0,
    }));

    for (const t of sales.filter(t => t.currency === "KRW")) {
      const m = new Date(t.date).getMonth();
      monthlyRevenue[m].revenue += Number(t.amount);
      monthlyRevenue[m].count += 1;
    }

    for (const t of expenses.filter(t => t.currency === "KRW")) {
      const m = new Date(t.date).getMonth();
      monthlyRevenue[m].expense += Number(t.amount);
    }

    const byCategory = {};
    for (const t of sales.filter(t => t.currency === "KRW")) {
      const key = t.category || "기타";
      byCategory[key] = (byCategory[key] || 0) + Number(t.amount);
    }

    // Partner income: all-time cumulative grouped by customerName (PROFIT_SHARE)
    const allProfitShare = await prisma.partnerTransaction.findMany({
      where: { type: "PROFIT_SHARE", status: { not: "CANCELLED" } },
      select: { customerName: true, amount: true, currency: true, status: true },
    });
    const partnerIncomeMap = {};
    for (const t of allProfitShare) {
      const name = t.customerName || "ไม่ระบุ";
      if (!partnerIncomeMap[name]) partnerIncomeMap[name] = { total: 0, byCurrency: {} };
      if (t.currency === "KRW") {
        partnerIncomeMap[name].total += Number(t.amount);
      } else {
        partnerIncomeMap[name].byCurrency[t.currency] = (partnerIncomeMap[name].byCurrency[t.currency] || 0) + Number(t.amount);
      }
    }
    const partnerIncomeSummary = Object.entries(partnerIncomeMap)
      .map(([name, data]) => ({ name, total: data.total, byCurrency: data.byCurrency }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      year,
      summary: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalPending,
        saleCount: sales.length,
        expenseCount: expenses.length,
        pendingCount: pending.length,
        revenueByCurrency,
        expenseByCurrency,
        pendingByCurrency,
      },
      monthlyRevenue,
      recentTransactions: transactions.slice(0, 50),
      byCategory: Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      profitShareTransactions: transactions.filter(t => t.type === "PROFIT_SHARE"),
      partnerIncomeSummary,
    });
  } catch (err) {
    console.error("[GET /api/partner/transactions]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, description, customerName, amount, currency, status, category, notes, date, brand } = body;

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "กรุณากรอกจำนวนเงิน" }, { status: 400 });
    }

    const txType = type || "SALE";
    const prefix = { SALE: "SAL", EXPENSE: "EXP", REFUND: "REF", PROFIT_SHARE: "PSH" }[txType] || "TXN";
    const count = await prisma.partnerTransaction.count({ where: { type: txType } });
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const number = `${prefix}${yyyy}${mm}${dd}-${String(count + 1).padStart(4, "0")}`;

    const tx = await prisma.partnerTransaction.create({
      data: {
        number,
        brand: brand || "MOMOGE SPACE",
        type: type || "SALE",
        description: description || null,
        customerName: customerName || null,
        amount: currency === "KRW" ? Math.round(Number(amount)) : Number(Number(amount).toFixed(2)),
        currency: ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW",
        status: status || "COMPLETED",
        category: category || null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error("[POST /api/partner/transactions]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
