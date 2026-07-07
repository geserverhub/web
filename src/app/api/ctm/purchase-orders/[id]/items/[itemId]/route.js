import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, itemId } = await params;

  const po = await prisma.ctmPurchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) return NextResponse.json({ error: "ไม่พบใบสั่งซื้อ" }, { status: 404 });
  const item = po.items.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: "ไม่พบรายการสินค้านี้" }, { status: 404 });
  if (item.receivedQty > 0) return NextResponse.json({ error: "รายการนี้รับเข้าสต๊อกไปแล้วบางส่วน ไม่สามารถลบได้" }, { status: 400 });
  if (po.items.length <= 1) return NextResponse.json({ error: "ใบสั่งซื้อต้องมีอย่างน้อย 1 รายการสินค้า ถ้าต้องการลบทั้งหมดให้ลบทั้งใบแทน" }, { status: 400 });

  await prisma.ctmPurchaseOrderItem.delete({ where: { id: itemId } });

  const remaining = po.items.filter(i => i.id !== itemId);
  const totalAmount = remaining.reduce((s, i) => s + Number(i.unitCost) * i.quantity, 0);

  const updated = await prisma.ctmPurchaseOrder.update({
    where: { id }, data: { totalAmount },
    include: { items: true, supplier: { select: { name: true, supplierCode: true } } },
  });
  return NextResponse.json(updated);
}
