import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mergeNotesJson } from "@/lib/stripe-server";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const orderCode = String(body.orderCode || "").trim().toUpperCase();
    if (!orderCode) {
      return NextResponse.json({ error: "ต้องระบุ orderCode" }, { status: 400 });
    }

    const order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    const updated = await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        notes: mergeNotesJson(order.notes, {
          manualConfirmed: true,
          confirmedBy: session.user.email || session.user.id,
          confirmedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ ok: true, orderCode: updated.orderCode, status: updated.status });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ยืนยันไม่สำเร็จ" }, { status: 500 });
  }
}
