import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const transactionId = String(formData.get("transactionId") || "").trim();
    const file = formData.get("file");

    if (!transactionId) {
      return NextResponse.json({ error: "ไม่พบ transactionId" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "ไม่พบไฟล์สลิป" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF/JPG/JPEG/PNG/WEBP" }, { status: 400 });
    }

    if (Number(file.size || 0) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ไฟล์มีขนาดใหญ่เกิน 10MB" }, { status: 400 });
    }

    const tx = await prisma.partnerTransaction.findUnique({
      where: { id: transactionId },
      select: { id: true, category: true, notes: true },
    });

    if (!tx) {
      return NextResponse.json({ error: "ไม่พบรายการธุรกรรม" }, { status: 404 });
    }

    if (tx.category !== "MARKETPLACE") {
      return NextResponse.json({ error: "อนุญาตเฉพาะรายการประเภท MARKETPLACE" }, { status: 400 });
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "partner-receipts");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));
    const receiptPath = `/uploads/partner-receipts/${safeName}`;

    let updatedNotes;
    try {
      const parsed = tx.notes ? JSON.parse(tx.notes) : {};
      parsed.paymentSlip = {
        path: receiptPath,
        originalName: file.name || safeName,
        uploadedAt: new Date().toISOString(),
      };
      updatedNotes = JSON.stringify(parsed);
    } catch {
      updatedNotes = JSON.stringify({
        raw: tx.notes || "",
        paymentSlip: {
          path: receiptPath,
          originalName: file.name || safeName,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    await prisma.partnerTransaction.update({
      where: { id: tx.id },
      data: {
        receiptFile: receiptPath,
        notes: updatedNotes,
      },
    });

    return NextResponse.json({ ok: true, path: receiptPath });
  } catch (err) {
    return NextResponse.json({ error: err.message || "อัปโหลดสลิปไม่สำเร็จ" }, { status: 500 });
  }
}
