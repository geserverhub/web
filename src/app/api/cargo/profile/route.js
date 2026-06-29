import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CARGO_CLIENT_ID = "cmqyzvsqj0000jhsa11kicccu";

// GET /api/cargo/profile?customerId=xxx
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

    const [customer, cusDetail, orders] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: customerId, clientId: CARGO_CLIENT_ID },
        select: { id: true, name: true, phone: true, email: true, address: true, createdAt: true },
      }),
      prisma.cargoCusDetail.findFirst({
        where: { customerId },
        select: { passportNo: true, passportExp: true, idCard: true, customsNo: true, nationality: true, address: true },
      }),
      prisma.cargoOrder.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: { number: true, direction: true, status: true, weightKg: true, itemDesc: true, trackingCode: true, createdAt: true, shippedAt: true, deliveredAt: true },
      }),
    ]);

    if (!customer) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    return NextResponse.json({ customer, cusDetail, orders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
