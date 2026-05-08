import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isSuperAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN";
}

// PUT /api/admin/invoices/[id]
export async function PUT(req, { params }) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, currency, status, dueDate, notes, receiptNumber } = body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(status && {
          status,
          paidAt: status === "PAID" ? new Date() : status !== "PAID" ? null : undefined,
        }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(receiptNumber !== undefined && { receiptNumber: receiptNumber || null }),
      },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ invoice });
  } catch (err) {
    console.error("[PUT /api/admin/invoices]", err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

// DELETE /api/admin/invoices/[id]
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/invoices]", err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
