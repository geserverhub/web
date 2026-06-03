import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";
import { getProductLoginPath } from "@/lib/software-downloads-catalog";
import { ensureOrderAccessPassword, isOrderPaid } from "@/lib/software-downloads";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

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

export async function POST(req) {
  try {
    const body = await req.json();
    const orderCode = String(body.orderCode || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!orderCode || !email || !password) {
      return NextResponse.json({ error: "กรุณากรอก ORDER NO., อีเมล และรหัสผ่าน" }, { status: 400 });
    }

    let order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order || order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อหรืออีเมลไม่ตรง" }, { status: 401 });
    }

    if (!isOrderPaid(order)) {
      return NextResponse.json(
        { error: "คำสั่งซื้อยังไม่ชำระเงิน — โอนเงินและรอแอดมินยืนยันก่อนเข้าแอป" },
        { status: 403 }
      );
    }

    order = await ensureOrderAccessPassword(prisma, order);

    if (!order.accessPassword || !safeEqual(password, order.accessPassword)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const appPath = getProductLoginPath(order.productSlug);

    return NextResponse.json({
      ok: true,
      appPath,
      order: {
        orderCode: order.orderCode,
        email: order.email,
        productSlug: order.productSlug,
        productTitle: order.productTitle,
      },
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
    return NextResponse.json({ error: err.message || "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
