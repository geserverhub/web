import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, itemId } = await params;

  const sale = await prisma.ctmSale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 });
  const item = sale.items.find(i => i.id === itemId);
  if (!item) return NextResponse.json({ error: "ไม่พบรายการสินค้านี้" }, { status: 404 });
  if (sale.items.length <= 1) return NextResponse.json({ error: "บิลต้องมีอย่างน้อย 1 รายการสินค้า ถ้าต้องการลบทั้งหมดให้ลบทั้งบิลแทน" }, { status: 400 });

  await prisma.ctmProduct.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } }).catch(() => {});
  await prisma.ctmStockLog.create({
    data: { id: crypto.randomBytes(12).toString("hex"), productId: item.productId, delta: item.quantity, note: `ลบรายการออกจากบิล ${sale.number}` },
  }).catch(() => {});
  await prisma.ctmSaleItem.delete({ where: { id: itemId } });

  const remaining = sale.items.filter(i => i.id !== itemId);
  const subtotal = remaining.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
  const totalAmount = subtotal + taxAmount;

  const updated = await prisma.ctmSale.update({
    where: { id }, data: { taxAmount, totalAmount },
    include: { customer: { select: { name: true, phone: true, address: true } }, items: true },
  });
  return NextResponse.json(updated);
}
