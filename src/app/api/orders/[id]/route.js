import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

export async function GET(req, { params }) {
  const { id } = await params;
  const order = await prisma.mGroupOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toLegacy(order));
}
