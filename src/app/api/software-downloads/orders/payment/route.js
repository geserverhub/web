import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { mergeNotesJson } from "@/lib/stripe-server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const orderCode = String(formData.get("orderCode") || "").trim().toUpperCase();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const file = formData.get("file");

    if (!orderCode || !email) {
      return NextResponse.json({ error: "ต้องระบุ orderCode และ email" }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "กรุณาแนบไฟล์สลิป" }, { status: 400 });
    }

    const order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order || order.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }
    if (order.status === "PAID") {
      return NextResponse.json({ error: "ชำระเงินแล้ว" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "รองรับเฉพาะ PDF และรูปภาพ" }, { status: 400 });
    }

    const safeName = `${orderCode}-${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "software-download-receipts");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));
    const filePath = `/uploads/software-download-receipts/${safeName}`;

    await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data: {
        receiptFile: filePath,
        status: "AWAITING_REVIEW",
        notes: mergeNotesJson(order.notes, {
          paymentGateway: "BANK_SLIP",
          slipUploadedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ ok: true, receiptFile: filePath, status: "AWAITING_REVIEW" });
  } catch (err) {
    return NextResponse.json({ error: err.message || "อัปโหลดสลิปไม่สำเร็จ" }, { status: 500 });
  }
}
