import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function appendPaymentProofNote(prev, filePath) {
  const patch = {
    paymentProofUploadedAt: new Date().toISOString(),
    paymentProofFile: filePath,
  };

  if (!prev) return JSON.stringify(patch);

  try {
    const parsed = JSON.parse(prev);
    return JSON.stringify({ ...parsed, ...patch });
  } catch {
    return JSON.stringify({ rawNote: prev, ...patch });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const transactionId = String(formData.get("transactionId") || "").trim();
    const file = formData.get("file");

    if (!transactionId) {
      return NextResponse.json({ error: "ไม่พบ transactionId" }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "กรุณาแนบไฟล์สลิป" }, { status: 400 });
    }

    const tx = await prisma.partnerTransaction.findUnique({ where: { id: transactionId } });
    if (!tx) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "รองรับเฉพาะ PDF และรูปภาพ" }, { status: 400 });
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "partner-receipts");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));

    const filePath = `/uploads/partner-receipts/${safeName}`;

    await prisma.partnerTransaction.update({
      where: { id: transactionId },
      data: {
        receiptFile: filePath,
        status: "PENDING",
        notes: appendPaymentProofNote(tx.notes, filePath),
      },
    });

    return NextResponse.json({ ok: true, receiptFile: filePath });
  } catch (err) {
    return NextResponse.json({ error: err.message || "อัปโหลดสลิปไม่สำเร็จ" }, { status: 500 });
  }
}
