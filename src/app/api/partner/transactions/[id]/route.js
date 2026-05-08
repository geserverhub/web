import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { amount, currency, description, customerName, category, type, status, notes, date, receiptFile } = body;

    const data = {};
    if (amount !== undefined) {
      const n = Number(String(amount).replace(/,/g, ""));
      if (isNaN(n)) return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
      const cur = currency ?? (await prisma.partnerTransaction.findUnique({ where: { id }, select: { currency: true } }))?.currency ?? "KRW";
      data.amount = cur === "KRW" ? Math.round(n) : Number(n.toFixed(2));
    }
    if (currency !== undefined)     data.currency     = ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW";
    if (description !== undefined)  data.description  = description || null;
    if (customerName !== undefined) data.customerName = customerName || null;
    if (category !== undefined)     data.category     = category || null;
    if (type !== undefined)         data.type         = type;
    if (status !== undefined)       data.status       = status;
    if (notes !== undefined)        data.notes        = notes || null;
    if (date !== undefined)         data.date         = new Date(date);
    if (receiptFile !== undefined)  data.receiptFile  = receiptFile || null;

    const tx = await prisma.partnerTransaction.update({ where: { id }, data });
    return NextResponse.json(tx);
  } catch (err) {
    console.error("[PATCH /api/partner/transactions/[id]]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.partnerTransaction.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
