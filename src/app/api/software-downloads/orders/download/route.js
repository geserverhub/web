import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSoftwareProduct } from "@/lib/software-downloads-catalog";
import {
  buildProductFileResponse,
  canDownloadOrder,
} from "@/lib/software-downloads";

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

    const product = getSoftwareProduct(order.productSlug);
    if (!canDownloadOrder(order, product)) {
      return NextResponse.json(
        { error: "ยังดาวน์โหลดไม่ได้ — รอการยืนยันการชำระเงิน" },
        { status: 403 }
      );
    }

    const result = await buildProductFileResponse(product);
    if (!result.response) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data: { downloadCount: { increment: 1 } },
    });

    return result.response;
  } catch (err) {
    return NextResponse.json({ error: err.message || "ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
