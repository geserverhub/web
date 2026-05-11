import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

// GET /api/admin/cargo/[id]/transactions
export async function GET(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const transactions = await prisma.cargoTransaction.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    // Summary totals
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + Number(t.amount), 0);

    return NextResponse.json({ transactions, totalIncome, totalExpense, profit: totalIncome - totalExpense });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/cargo/[id]/transactions — add income or expense record
export async function POST(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { type, category, amount, currency, note, receiptRef } = body;

    if (!type || !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "type must be INCOME or EXPENSE" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const tx = await prisma.cargoTransaction.create({
      data: {
        orderId: id,
        type,
        category: category || null,
        amount: Number(amount),
        currency: currency || "THB",
        note: note || null,
        receiptRef: receiptRef || null,
        createdBy: session.user?.name || session.user?.email || "admin",
      },
    });

    // Update running income/expense totals on the CargoOrder
    const agg = await prisma.cargoTransaction.groupBy({
      by: ["type"],
      where: { orderId: id },
      _sum: { amount: true },
    });
    const incomeTotal = agg.find((r) => r.type === "INCOME")?._sum?.amount ?? 0;
    const expenseTotal = agg.find((r) => r.type === "EXPENSE")?._sum?.amount ?? 0;
    await prisma.cargoOrder.update({
      where: { id },
      data: { income: Number(incomeTotal), expense: Number(expenseTotal) },
    });

    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/cargo/[id]/transactions?txId=xxx
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const txId = searchParams.get("txId");
    if (!txId) return NextResponse.json({ error: "txId required" }, { status: 400 });

    await prisma.cargoTransaction.delete({ where: { id: txId } });

    // Recalculate totals
    const agg = await prisma.cargoTransaction.groupBy({
      by: ["type"],
      where: { orderId: id },
      _sum: { amount: true },
    });
    const incomeTotal = agg.find((r) => r.type === "INCOME")?._sum?.amount ?? 0;
    const expenseTotal = agg.find((r) => r.type === "EXPENSE")?._sum?.amount ?? 0;
    await prisma.cargoOrder.update({
      where: { id },
      data: { income: Number(incomeTotal), expense: Number(expenseTotal) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
