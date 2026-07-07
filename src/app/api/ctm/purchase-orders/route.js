import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");
  const status = searchParams.get("status");
  const unexpensed = searchParams.get("unexpensed");
  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;
  if (unexpensed) where.expensedAt = null;
  const purchaseOrders = await prisma.ctmPurchaseOrder.findMany({
    where, orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true, supplierCode: true, phone: true } }, items: true },
  });
  return NextResponse.json({ purchaseOrders });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { supplierId, supplierBillNo, paymentTerms, note, items } = await req.json();
  if (!supplierId) return NextResponse.json({ error: "กรุณาเลือกคู่ค้า" }, { status: 400 });
  if (!supplierBillNo?.trim()) return NextResponse.json({ error: "กรุณากรอกเลขที่บิลจากคู่ค้า" }, { status: 400 });
  if (!items?.length) return NextResponse.json({ error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });

  const now = new Date();
  const prefix = `PO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-`;
  const last = await prisma.ctmPurchaseOrder.findFirst({ where: { poNumber: { startsWith: prefix } }, orderBy: { poNumber: "desc" }, select: { poNumber: true } });
  const seq = last ? parseInt(last.poNumber.split("-")[1] || "0", 10) : 0;
  const poNumber = `${prefix}${String(seq + 1).padStart(4, "0")}`;

  const totalAmount = items.reduce((s, i) => s + Number(i.unitCost) * Number(i.quantity), 0);

  const po = await prisma.ctmPurchaseOrder.create({
    data: {
      poNumber, supplierBillNo: supplierBillNo.trim(), supplierId, paymentTerms: paymentTerms || "CASH", note: note || null, totalAmount,
      items: {
        create: items.map((i) => ({
          id: crypto.randomBytes(12).toString("hex"),
          productId: i.productId, productName: i.productName, unit: i.unit || null,
          quantity: Number(i.quantity), unitCost: Number(i.unitCost),
          totalCost: Number(i.unitCost) * Number(i.quantity),
        })),
      },
    },
    include: { items: true, supplier: { select: { name: true, supplierCode: true } } },
  });
  return NextResponse.json(po, { status: 201 });
}
