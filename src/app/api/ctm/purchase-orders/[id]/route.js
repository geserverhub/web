import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status, paymentTerms, note, markExpensed } = await req.json();

  const existing = await prisma.ctmPurchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "ไม่พบใบสั่งซื้อ" }, { status: 404 });

  const data = {};
  if (paymentTerms !== undefined) data.paymentTerms = paymentTerms;
  if (note !== undefined) data.note = note;
  if (markExpensed) data.expensedAt = new Date();

  if (status && status !== existing.status) {
    data.status = status;
    if (status === "RECEIVED" && existing.status !== "RECEIVED") {
      data.receivedAt = new Date();
      for (const item of existing.items) {
        const remaining = item.quantity - item.receivedQty;
        if (remaining <= 0) continue;
        await prisma.ctmProduct.update({ where: { id: item.productId }, data: { stock: { increment: remaining } } }).catch(() => {});
        await prisma.ctmStockLog.create({
          data: { id: crypto.randomBytes(12).toString("hex"), productId: item.productId, delta: remaining, note: `รับสินค้าเข้าสต๊อกจากใบสั่งซื้อ ${existing.poNumber}` },
        }).catch(() => {});
        await prisma.ctmPurchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: item.quantity } });
      }
    }
  }

  const po = await prisma.ctmPurchaseOrder.update({
    where: { id }, data,
    include: { items: true, supplier: { select: { name: true, supplierCode: true } } },
  });
  return NextResponse.json(po);
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const existing = await prisma.ctmPurchaseOrder.findUnique({ where: { id } });
  if (existing?.status === "RECEIVED") return NextResponse.json({ error: "ไม่สามารถลบใบสั่งซื้อที่รับสินค้าแล้วได้" }, { status: 400 });
  await prisma.ctmPurchaseOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
