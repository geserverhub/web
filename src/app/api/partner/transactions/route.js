import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  REVENUE_TYPES,
  INVESTMENT_TYPES,
  buildPartnerIncomeSummary,
  syncPartnerMonthlyFinancial,
  syncPartnerPersonFinancialFromTransaction,
  sumInvestmentBalanceBefore,
} from "@/lib/partner-financial";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function clientFilter(_session) {
  return {};
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

    const baseFilter = clientFilter(session);

    const transactions = await prisma.partnerTransaction.findMany({
      where: { ...baseFilter, date: { gte: yearStart, lt: yearEnd } },
      orderBy: { date: "desc" },
    });

    const sales = transactions.filter(t => REVENUE_TYPES.has(t.type) && t.status !== "CANCELLED");
    const investments = transactions.filter(t => INVESTMENT_TYPES.has(t.type) && t.status !== "CANCELLED");
    const expenses = transactions.filter(t => t.type === "EXPENSE" && t.status !== "CANCELLED");
    const pending = transactions.filter(t => t.status === "PENDING");

    const totalRevenue = sales.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);
    const totalInvestment = investments.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = expenses.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);
    const totalPending = pending.filter(t => t.currency === "KRW").reduce((s, t) => s + Number(t.amount), 0);

    function groupByCurrency(list) {
      return list.filter(t => t.currency !== "KRW").reduce((acc, t) => {
        const cur = t.currency || "KRW";
        acc[cur] = (acc[cur] || 0) + Number(t.amount);
        return acc;
      }, {});
    }
    const revenueByCurrency = groupByCurrency(sales);
    const investmentByCurrency = groupByCurrency(investments);
    const expenseByCurrency = groupByCurrency(expenses);
    const pendingByCurrency = groupByCurrency(pending);

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString("ko-KR", { month: "short" }),
      revenue: 0,
      investment: 0,
      expense: 0,
      count: 0,
    }));

    for (const t of sales.filter(t => t.currency === "KRW")) {
      const m = new Date(t.date).getMonth();
      monthlyRevenue[m].revenue += Number(t.amount);
      monthlyRevenue[m].count += 1;
    }

    for (const t of investments.filter(t => t.currency === "KRW")) {
      const m = new Date(t.date).getMonth();
      monthlyRevenue[m].investment += Number(t.amount);
    }

    for (const t of expenses.filter(t => t.currency === "KRW")) {
      const m = new Date(t.date).getMonth();
      monthlyRevenue[m].expense += Number(t.amount);
    }

    for (const m of monthlyRevenue) {
      try {
        await syncPartnerMonthlyFinancial(year, m.month, {
          revenueKrw: m.revenue,
          investmentKrw: m.investment,
          expenseKrw: m.expense,
        });
      } catch (syncErr) {
        console.warn("[GET /api/partner/transactions] monthly sync:", syncErr.message);
      }
    }

    const byCategory = {};
    for (const t of sales.filter(t => t.currency === "KRW")) {
      const key = t.category || "기타";
      byCategory[key] = (byCategory[key] || 0) + Number(t.amount);
    }

    const allPersonRows = await prisma.partnerTransaction.findMany({
      where: {
        ...baseFilter,
        type: { in: ["PROFIT_SHARE", "PARTNER_INVESTMENT"] },
        status: { not: "CANCELLED" },
      },
      select: { customerName: true, description: true, notes: true, amount: true, currency: true, status: true, type: true },
    });
    const partnerIncomeSummary = buildPartnerIncomeSummary(allPersonRows);

    const priorFundingRows = await prisma.partnerTransaction.findMany({
      where: {
        ...baseFilter,
        date: { lt: yearStart },
        type: { in: [...INVESTMENT_TYPES, "EXPENSE"] },
        status: { not: "CANCELLED" },
        currency: "KRW",
      },
      select: { type: true, amount: true, currency: true, status: true, date: true },
    });
    const investmentOpeningBalance = sumInvestmentBalanceBefore(priorFundingRows, yearStart);

    return NextResponse.json({
      year,
      investmentOpeningBalance,
      summary: {
        totalRevenue,
        totalInvestment,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalPending,
        saleCount: sales.length,
        investmentCount: investments.length,
        expenseCount: expenses.length,
        pendingCount: pending.length,
        revenueByCurrency,
        investmentByCurrency,
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
    if ((txType === "PROFIT_SHARE" || txType === "PARTNER_INVESTMENT") && !String(customerName || "").trim()) {
      return NextResponse.json({ error: "กรุณากรอกชื่อพาร์ทเนอร์" }, { status: 400 });
    }
    const prefix = { SALE: "SAL", EXPENSE: "EXP", REFUND: "REF", PROFIT_SHARE: "PSH", PARTNER_INVESTMENT: "PIN" }[txType] || "TXN";
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${prefix}${yyyy}${mm}${dd}-`;
    const last = await prisma.partnerTransaction.findFirst({
      where: { number: { startsWith: datePrefix } },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const lastSeq = last ? parseInt(last.number.split("-")[1] || "0", 10) : 0;
    const number = `${datePrefix}${String(lastSeq + 1).padStart(4, "0")}`;

    const tx = await prisma.partnerTransaction.create({
      data: {
        number,
        brand: brand || "MOMOGE SPACE",
        type: txType,
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

    await syncPartnerPersonFinancialFromTransaction(tx).catch((err) => {
      console.warn("[POST /api/partner/transactions] ledger sync:", err.message);
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    console.error("[POST /api/partner/transactions]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
