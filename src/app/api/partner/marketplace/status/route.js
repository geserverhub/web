import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJsonSafe } from "@/lib/stripe-server";

function normalizeStatus(tx, noteObj) {
  if (noteObj?.stripePaymentStatus === "paid") return "COMPLETED";
  if (noteObj?.stripePaymentStatus === "failed") return "PENDING";
  return tx.status || "PENDING";
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const number = String(searchParams.get("number") || "").trim();
    if (!number) {
      return NextResponse.json({ error: "กรุณากรอกเลขออเดอร์" }, { status: 400 });
    }

    const tx = await prisma.partnerTransaction.findUnique({
      where: { number },
      select: {
        id: true,
        number: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        customerName: true,
        description: true,
        receiptFile: true,
        date: true,
        updatedAt: true,
        notes: true,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: "ไม่พบเลขออเดอร์นี้" }, { status: 404 });
    }

    const noteObj = parseJsonSafe(tx.notes) || {};
    const items = Array.isArray(noteObj.items) ? noteObj.items : [];

    return NextResponse.json({
      order: {
        id: tx.id,
        number: tx.number,
        customerName: tx.customerName,
        amount: tx.amount,
        currency: tx.currency,
        status: normalizeStatus(tx, noteObj),
        paymentGateway: noteObj.paymentGateway || null,
        paymentStatus: noteObj.stripePaymentStatus || null,
        receiptFile: tx.receiptFile,
        createdAt: tx.date,
        updatedAt: tx.updatedAt,
        items,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ไม่สามารถตรวจสอบสถานะได้" }, { status: 500 });
  }
}
