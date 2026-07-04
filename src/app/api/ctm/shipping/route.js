import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CtmShipping (
      id               VARCHAR(191) NOT NULL PRIMARY KEY,
      invoiceNo        VARCHAR(191) NOT NULL,
      saleId           VARCHAR(191) NULL,
      type             VARCHAR(191) NOT NULL DEFAULT 'DELIVERY',
      recipientName    VARCHAR(191) NULL,
      recipientPhone   VARCHAR(191) NULL,
      recipientAddress TEXT NULL,
      trackingNo       VARCHAR(191) NULL,
      carrier          VARCHAR(191) NULL,
      status           VARCHAR(191) NOT NULL DEFAULT 'PENDING',
      note             TEXT NULL,
      shippedAt        DATETIME(3) NULL,
      deliveredAt      DATETIME(3) NULL,
      createdAt        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_ctmshipping_invoiceno (invoiceNo),
      INDEX idx_ctmshipping_status (status),
      INDEX idx_ctmshipping_type (type)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  tableReady = true;
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  const shippings = await prisma.ctmShipping.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ shippings });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { invoiceNo, saleId, type, recipientName, recipientPhone, recipientAddress, trackingNo, carrier, status, note } = await req.json();
  if (!invoiceNo) return NextResponse.json({ error: "กรุณาระบุเลขที่บิล" }, { status: 400 });
  const shipping = await prisma.ctmShipping.create({
    data: {
      id: require("crypto").randomBytes(12).toString("hex"),
      invoiceNo,
      saleId: saleId || null,
      type: type || "DELIVERY",
      recipientName: recipientName || null,
      recipientPhone: recipientPhone || null,
      recipientAddress: recipientAddress || null,
      trackingNo: trackingNo || null,
      carrier: carrier || null,
      status: status || "PENDING",
      note: note || null,
    },
  });
  return NextResponse.json(shipping, { status: 201 });
}

export async function PATCH(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { id, trackingNo, carrier, status, recipientName, recipientPhone, recipientAddress, note, shippedAt, deliveredAt } = await req.json();
  if (!id) return NextResponse.json({ error: "กรุณาระบุ id" }, { status: 400 });
  const data = {};
  if (trackingNo !== undefined) data.trackingNo = trackingNo || null;
  if (carrier !== undefined) data.carrier = carrier || null;
  if (status !== undefined) {
    data.status = status;
    if (status === "SHIPPED" && !shippedAt) data.shippedAt = new Date();
    if (status === "DELIVERED") data.deliveredAt = new Date();
  }
  if (recipientName !== undefined) data.recipientName = recipientName || null;
  if (recipientPhone !== undefined) data.recipientPhone = recipientPhone || null;
  if (recipientAddress !== undefined) data.recipientAddress = recipientAddress || null;
  if (note !== undefined) data.note = note || null;
  if (shippedAt !== undefined) data.shippedAt = shippedAt ? new Date(shippedAt) : null;
  if (deliveredAt !== undefined) data.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
  const shipping = await prisma.ctmShipping.update({ where: { id }, data });
  return NextResponse.json(shipping);
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { searchParams } = new URL(req.url);
  await prisma.ctmShipping.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
