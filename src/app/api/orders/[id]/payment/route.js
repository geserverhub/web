import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/orders/[id]/payment — submit payment slip URL
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const order = await prisma.mGroupOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "Order already paid or cancelled" }, { status: 400 });
    }

    const body = await req.json();
    const { slipData, slipName } = body;
    if (!slipData) return NextResponse.json({ error: "No slip provided" }, { status: 400 });

    const updated = await prisma.mGroupOrder.update({
      where: { id },
      data: {
        paymentSlipUrl: slipData,
        slipName: slipName || "slip.jpg",
        status: "CONFIRMING",
        paidAt: new Date(),
      },
      include: { items: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
