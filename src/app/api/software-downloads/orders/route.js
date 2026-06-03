import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSoftwareProduct } from "@/lib/software-downloads-catalog";
import { generateOrderCode, orderToPublicJson } from "@/lib/software-downloads";
import { mergeNotesJson } from "@/lib/stripe-server";

export async function POST(req) {
  try {
    const body = await req.json();
    const productSlug = String(body.productSlug || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();

    if (!productSlug) {
      return NextResponse.json({ error: "กรุณาเลือกโปรแกรม" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลที่ถูกต้อง" }, { status: 400 });
    }

    const product = getSoftwareProduct(productSlug);
    if (!product) {
      return NextResponse.json({ error: "ไม่พบรายการดาวน์โหลด" }, { status: 404 });
    }

    const amount = Number(product.price) || 0;
    const isFree = Boolean(product.free || amount <= 0);

    let orderCode = generateOrderCode();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
      if (!exists) break;
      orderCode = generateOrderCode();
    }

    const dbProduct = await prisma.softwareDownloadProduct.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    const order = await prisma.softwareDownloadOrder.create({
      data: {
        orderCode,
        email,
        productId: dbProduct?.id ?? null,
        productSlug: product.slug,
        productTitle: product.titleTh || product.title,
        amount,
        currency: product.currency || "THB",
        status: isFree ? "PAID" : "PENDING",
        paidAt: isFree ? new Date() : null,
        notes: isFree
          ? mergeNotesJson(null, { freeDownload: true, confirmedAt: new Date().toISOString() })
          : null,
      },
    });

    return NextResponse.json({
      ok: true,
      order: orderToPublicJson(order, { includeDownload: isFree }),
      free: isFree,
    });
  } catch (err) {
    const msg = err?.message || "";
    const missingTable =
      err?.code === "P2021" ||
      /SoftwareDownload(Order|Product)/i.test(msg) ||
      /does not exist/i.test(msg);
    if (missingTable) {
      return NextResponse.json(
        {
          error:
            "ฐานข้อมูลยังไม่พร้อม — รัน npm run db:migrate-software-downloads (Windows จะ fallback ไป WSL อัตโนมัติ)",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || "สร้างคำสั่งซื้อไม่สำเร็จ" }, { status: 500 });
  }
}
