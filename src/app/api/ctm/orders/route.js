import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

const SHIPPING_FEE = 6000;

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CtmOrder (
      id               VARCHAR(191) NOT NULL PRIMARY KEY,
      orderNo          VARCHAR(191) NOT NULL UNIQUE,
      itemsJson        TEXT NOT NULL,
      subtotal         DECIMAL(10,2) NOT NULL,
      taxAmount        DECIMAL(10,2) NOT NULL,
      shippingFee      DECIMAL(10,2) NOT NULL,
      totalAmount      DECIMAL(10,2) NOT NULL,
      recipientName    VARCHAR(191) NOT NULL,
      recipientPhone   VARCHAR(191) NOT NULL,
      recipientAddress TEXT NOT NULL,
      slipUrl          VARCHAR(191) NULL,
      status           VARCHAR(191) NOT NULL DEFAULT 'PENDING',
      createdAt        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_ctmorder_status (status)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  tableReady = true;
}

async function findOrCreateCustomer(name, phone, address) {
  const existing = await prisma.ctmCustomer.findFirst({ where: { phone } });
  if (existing) return existing;

  const allCodes = await prisma.ctmCustomer.findMany({ where: { customerCode: { not: null } }, select: { customerCode: true } });
  let maxNum = 0;
  for (const c of allCodes) {
    const m = c.customerCode?.match(/^CUS(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const customerCode = `CUS${String(maxNum + 1).padStart(4, "0")}`;
  return prisma.ctmCustomer.create({ data: { customerCode, name, phone, address, note: "สร้างอัตโนมัติจากคำสั่งซื้อออนไลน์" } });
}

export async function POST(req) {
  await ensureTable();
  const { items, recipientName, recipientPhone, recipientAddress, slipUrl } = await req.json();
  if (!items?.length) return NextResponse.json({ error: "ตะกร้าว่างเปล่า" }, { status: 400 });
  if (!recipientName || !recipientPhone || !recipientAddress) return NextResponse.json({ error: "กรุณากรอกที่อยู่จัดส่งให้ครบ" }, { status: 400 });

  await findOrCreateCustomer(recipientName, recipientPhone, recipientAddress).catch(() => {});

  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
  const totalAmount = subtotal + taxAmount + SHIPPING_FEE;

  const now = new Date();
  const prefix = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-`;
  const last = await prisma.ctmOrder.findFirst({ where: { orderNo: { startsWith: prefix } }, orderBy: { orderNo: "desc" }, select: { orderNo: true } });
  const seq = last ? parseInt(last.orderNo.split("-")[1] || "0", 10) : 0;
  const orderNo = `${prefix}${String(seq + 1).padStart(4, "0")}`;

  const order = await prisma.ctmOrder.create({
    data: {
      orderNo,
      itemsJson: JSON.stringify(items),
      subtotal, taxAmount, shippingFee: SHIPPING_FEE, totalAmount,
      recipientName, recipientPhone, recipientAddress,
      slipUrl: slipUrl || null,
    },
  });
  return NextResponse.json(order, { status: 201 });
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const orders = await prisma.ctmOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ orders: orders.map(o => ({ ...o, items: JSON.parse(o.itemsJson) })) });
}

export async function PATCH(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  const order = await prisma.ctmOrder.update({ where: { id }, data: { status } });
  return NextResponse.json(order);
}
