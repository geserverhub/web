import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function genOrderNumber() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `MG-${yy}${mm}${dd}-${rand}`;
}

export async function GET() {
  try {
    const orders = await prisma.mGroupOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, customer, shippingAddress, note } = body;

    if (!items?.length || !customer?.name || !customer?.phone || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

    let number = genOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.mGroupOrder.findUnique({ where: { number } });
      if (!exists) break;
      number = genOrderNumber();
      attempts++;
    }

    const order = await prisma.mGroupOrder.create({
      data: {
        number,
        customerName: customer.name,
        customerPhone: customer.phone || null,
        customerEmail: customer.email || null,
        shippingAddress: shippingAddress || null,
        note: note || null,
        subtotal,
        total: subtotal,
        status: "PENDING_PAYMENT",
        items: {
          create: items.map((item) => ({
            productId: item.id || null,
            sku: item.sku || null,
            name: item.name,
            unitPrice: Number(item.price),
            qty: Number(item.qty),
            amount: Number(item.price) * Number(item.qty),
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
