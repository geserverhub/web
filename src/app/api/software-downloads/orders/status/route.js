import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { orderToPublicJson } from "@/lib/software-downloads";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderCode = String(searchParams.get("orderCode") || "").trim().toUpperCase();
    const email = String(searchParams.get("email") || "").trim().toLowerCase();

    if (!orderCode || !email) {
      return NextResponse.json({ error: "ต้องระบุ orderCode และ email" }, { status: 400 });
    }

    const order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order || order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    return NextResponse.json({
      order: orderToPublicJson(order, { includeDownload: true }),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ตรวจสอบสถานะไม่สำเร็จ" }, { status: 500 });
  }
}
