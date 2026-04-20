import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isSuperAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN";
}

// PUT /api/admin/expenses/[id]
export async function PUT(req, { params }) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { category, amount, currency, status, notes, date, receiptNumber, receiptFile } = body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency !== undefined && { currency }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(receiptNumber !== undefined && { receiptNumber: receiptNumber || null }),
        ...(receiptFile !== undefined && { receiptFile: receiptFile || null }),
      },
    });
    return NextResponse.json({ expense });
  } catch (err) {
    console.error("PUT /api/admin/expenses/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/expenses/[id]
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/expenses/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
