import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function buildOrderNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const t = String(d.getTime()).slice(-6);
  return `MG-${y}${m}${day}-${t}`;
}

function toLegacy(order) {
  const statusMap = {
    PENDING_PAYMENT: "pending_payment",
    CONFIRMING: "confirming",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  };

  return {
    id: order.id,
    number: order.number,
    status: statusMap[order.status] || "pending_payment",
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
    },
    shippingAddress: order.shippingAddress,
    note: order.note,
    total: Number(order.total || 0),
    paymentSlip: order.paymentSlipUrl,
    slipName: order.slipName,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    items: (order.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      sku: it.sku,
      name: it.name,
      qty: it.qty,
      price: Number(it.unitPrice || 0),
      amount: Number(it.amount || 0),
    })),
  };
}

export async function GET() {
  const orders = await prisma.mGroupOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 300,
  });
  return NextResponse.json(orders.map(toLegacy));
}

export async function POST(req) {
  const body = await req.json();
  const { items, customer, shippingAddress, note } = body;

  if (!items?.length || !customer?.name || !customer?.phone || !shippingAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedItems = items
    .map((item) => {
      const qty = Number(item?.qty || 0);
      const unitPrice = Number(item?.price || 0);
      const name = String(item?.name || "").trim();
      return {
        productId: item?.id ? Number(item.id) : null,
        sku: String(item?.sku || "").trim() || null,
        name,
        qty,
        unitPrice,
        amount: qty * unitPrice,
      };
    })
    .filter((it) => it.name && it.qty > 0 && it.unitPrice >= 0);

  if (!normalizedItems.length) {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 });
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.amount, 0);

  const order = await prisma.mGroupOrder.create({
    data: {
      number: buildOrderNumber(),
      customerName: String(customer?.name || "").trim(),
      customerPhone: String(customer?.phone || "").trim() || null,
      customerEmail: String(customer?.email || "").trim() || null,
      shippingAddress: String(shippingAddress || "").trim() || null,
      note: String(note || "").trim() || null,
      subtotal: total,
      total,
      status: "PENDING_PAYMENT",
      items: {
        create: normalizedItems.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(toLegacy(order), { status: 201 });
}
