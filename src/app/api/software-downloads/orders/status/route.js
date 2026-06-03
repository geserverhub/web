import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureOrderAccessPassword, isOrderPaid, orderToPublicJson } from "@/lib/software-downloads";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderCode = String(searchParams.get("orderCode") || "").trim().toUpperCase();
    const email = String(searchParams.get("email") || "").trim().toLowerCase();

    if (!orderCode || !email) {
      return NextResponse.json({ error: "ต้องระบุ orderCode และ email" }, { status: 400 });
    }

    let order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order || order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (isOrderPaid(order)) {
      order = await ensureOrderAccessPassword(prisma, order);
    }

    return NextResponse.json({
      order: orderToPublicJson(order, { includeAccess: true }),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ตรวจสอบสถานะไม่สำเร็จ" }, { status: 500 });
  }
}
