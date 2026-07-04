import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const { searchParams } = new URL(req.url);
  await prisma.ctmShipping.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
