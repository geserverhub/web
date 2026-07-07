import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { items } = await req.json(); // [{ itemId, receiveQty }]
  if (!items?.length) return NextResponse.json({ error: "กรุณาเลือกรายการที่จะรับเข้า" }, { status: 400 });

  const po = await prisma.ctmPurchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) return NextResponse.json({ error: "ไม่พบใบสั่งซื้อ" }, { status: 404 });
  if (po.status === "CANCELLED") return NextResponse.json({ error: "ใบสั่งซื้อนี้ถูกยกเลิกแล้ว" }, { status: 400 });

  for (const entry of items) {
    const item = po.items.find(i => i.id === entry.itemId);
    if (!item) continue;
    const remaining = item.quantity - item.receivedQty;
    const receiveQty = Math.max(0, Math.min(Number(entry.receiveQty) || 0, remaining));
    if (receiveQty <= 0) continue;

    await prisma.ctmProduct.update({ where: { id: item.productId }, data: { stock: { increment: receiveQty } } }).catch(() => {});
    await prisma.ctmStockLog.create({
      data: { id: crypto.randomBytes(12).toString("hex"), productId: item.productId, delta: receiveQty, note: `รับสินค้าเข้าสต๊อกจากใบสั่งซื้อ ${po.poNumber}` },
    }).catch(() => {});
    await prisma.ctmPurchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: { increment: receiveQty } } });
  }

  const refreshed = await prisma.ctmPurchaseOrder.findUnique({ where: { id }, include: { items: true } });
  const allReceived = refreshed.items.every(i => i.receivedQty >= i.quantity);
  const updated = await prisma.ctmPurchaseOrder.update({
    where: { id },
    data: allReceived ? { status: "RECEIVED", receivedAt: new Date() } : {},
    include: { items: true, supplier: { select: { name: true, supplierCode: true } } },
  });
  return NextResponse.json(updated);
}
