import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureOrderAccessPassword, isOrderPaid, orderToPublicJson } from "@/lib/software-downloads";

function isDbNotReadyError(err) {
  const msg = err?.message || "";
  return (
    err?.code === "P2021" ||
    err?.code === "P2022" ||
    /SoftwareDownload(Order|Product)/i.test(msg) ||
    /accessPassword/i.test(msg) ||
    /does not exist/i.test(msg) ||
    /Unknown column/i.test(msg)
  );
}

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
    if (isDbNotReadyError(err)) {
      return NextResponse.json(
        {
          error:
            "ฐานข้อมูลยังไม่พร้อม — รัน npm run db:migrate-software-downloads (Windows จะ fallback ไป WSL อัตโนมัติ)",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || "ตรวจสอบสถานะไม่สำเร็จ" }, { status: 500 });
  }
}
