import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { getSoftwareProduct } from "@/lib/software-downloads-catalog";
import {
  canDownloadOrder,
  resolveProductFilePath,
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

    const filePath = resolveProductFilePath(product);
    if (!filePath) {
      return NextResponse.json({ error: "ไฟล์ไม่ถูกต้อง" }, { status: 500 });
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      return NextResponse.json(
        { error: "ไฟล์ยังไม่พร้อมบนเซิร์ฟเวอร์ — ติดต่อผู้ดูแลระบบ" },
        { status: 404 }
      );
    }

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "ไม่พบไฟล์ดาวน์โหลด" }, { status: 404 });
    }

    await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data: { downloadCount: { increment: 1 } },
    });

    const ext = path.extname(product.fileName || filePath).toLowerCase();
    const mime =
      ext === ".apk"
        ? "application/vnd.android.package-archive"
        : ext === ".zip"
          ? "application/zip"
          : ext === ".pdf"
            ? "application/pdf"
            : "application/octet-stream";

    const nodeStream = createReadStream(filePath);
    const webStream = Readable.toWeb(nodeStream);

    return new Response(webStream, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(fileStat.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(product.fileName || "download")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
