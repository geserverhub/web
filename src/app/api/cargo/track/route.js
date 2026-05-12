import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/cargo/track?phone=0812345678
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim().replace(/[-\s]/g, "");

  if (!phone) return NextResponse.json({ error: "กรุณาระบุเบอร์โทรผู้รับ" }, { status: 400 });

  try {
    const select = {
      number: true,
      senderName: true,
      receiverName: true,
      direction: true,
      weightKg: true,
      itemDesc: true,
      status: true,
      trackingCode: true,
      notes: true,
      shippedAt: true,
      deliveredAt: true,
      createdAt: true,
      updatedAt: true,
    };

    // Find all orders matching receiver OR sender phone
    const allOrders = await prisma.cargoOrder.findMany({
      select: { ...select, receiverPhone: true, senderPhone: true },
      orderBy: { createdAt: "desc" },
    });

    const matched = allOrders
      .filter(o => {
        const rp = (o.receiverPhone || "").replace(/[-\s]/g, "");
        const sp = (o.senderPhone || "").replace(/[-\s]/g, "");
        return rp === phone || sp === phone;
      })
      .map(({ receiverPhone: _r, senderPhone: _s, ...o }) => o);

    if (matched.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพัสดุสำหรับเบอร์โทรนี้" }, { status: 404 });
    }

    return NextResponse.json({ orders: matched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
