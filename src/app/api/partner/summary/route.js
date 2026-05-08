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

    const [receipts, invoices, expenses, clients] = await Promise.all([
      prisma.receipt.findMany({
        where: { issuedAt: { gte: yearStart, lt: yearEnd } },
        select: {
          id: true,
          number: true,
          total: true,
          currency: true,
          issuedAt: true,
          customerName: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: yearStart, lt: yearEnd } },
        select: {
          id: true,
          number: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          dueDate: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: { date: { gte: yearStart, lt: yearEnd } },
        select: { id: true, amount: true, category: true, date: true, status: true },
        orderBy: { date: "desc" },
      }),
      prisma.client.findMany({
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Aggregate monthly revenue from receipts
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString("th-TH", { month: "short" }),
      revenue: 0,
      count: 0,
    }));

    for (const r of receipts) {
      const m = new Date(r.issuedAt).getMonth();
      monthlyRevenue[m].revenue += Number(r.total);
      monthlyRevenue[m].count += 1;
    }

    // Totals
    const totalRevenue = receipts.reduce((s, r) => s + Number(r.total), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalInvoicePaid = invoices
      .filter(i => i.status === "PAID")
      .reduce((s, i) => s + Number(i.amount), 0);
    const totalInvoicePending = invoices
      .filter(i => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((s, i) => s + Number(i.amount), 0);

    // Revenue by client
    const revenueByClient = {};
    for (const r of receipts) {
      const key = r.client?.name || "ไม่ระบุ";
      revenueByClient[key] = (revenueByClient[key] || 0) + Number(r.total);
    }

    return NextResponse.json({
      year,
      summary: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalInvoicePaid,
        totalInvoicePending,
        receiptCount: receipts.length,
        invoiceCount: invoices.length,
        clientCount: clients.length,
      },
      monthlyRevenue,
      recentReceipts: receipts.slice(0, 10),
      recentInvoices: invoices.slice(0, 10),
      revenueByClient: Object.entries(revenueByClient)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
      clients,
    });
  } catch (err) {
    console.error("[GET /api/partner/summary]", err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
