import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getActiveSoftwareProducts, productToPublicJson } from "@/lib/software-downloads-catalog";
import { mergeNotesJson, parseJsonSafe } from "@/lib/stripe-server";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

function serializeOrder(order) {
  if (!order) return null;
  return {
    id: order.id,
    orderCode: order.orderCode,
    email: order.email,
    productSlug: order.productSlug,
    productTitle: order.productTitle,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    paymentGateway: order.paymentGateway,
    receiptFile: order.receiptFile,
    notes: order.notes,
    notesObj: parseJsonSafe(order.notes),
    paidAt: order.paidAt?.toISOString?.() ?? null,
    downloadCount: order.downloadCount,
    createdAt: order.createdAt?.toISOString?.() ?? null,
    updatedAt: order.updatedAt?.toISOString?.() ?? null,
  };
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = String(searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") || 200)));

    const where = {};
    if (status && ["PENDING", "AWAITING_REVIEW", "PAID", "CANCELLED"].includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { orderCode: { contains: q.toUpperCase() } },
        { email: { contains: q } },
        { productTitle: { contains: q } },
        { productSlug: { contains: q } },
      ];
    }

    const [orders, pending, awaitingReview, paid, cancelled, total] = await Promise.all([
      prisma.softwareDownloadOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.softwareDownloadOrder.count({ where: { status: "PENDING" } }),
      prisma.softwareDownloadOrder.count({ where: { status: "AWAITING_REVIEW" } }),
      prisma.softwareDownloadOrder.count({ where: { status: "PAID" } }),
      prisma.softwareDownloadOrder.count({ where: { status: "CANCELLED" } }),
      prisma.softwareDownloadOrder.count(),
    ]);

    const stats = {
      PENDING: pending,
      AWAITING_REVIEW: awaitingReview,
      PAID: paid,
      CANCELLED: cancelled,
      total,
    };

    const products = getActiveSoftwareProducts().map(productToPublicJson);

    return NextResponse.json({
      orders: orders.map(serializeOrder),
      stats,
      products,
    });
  } catch (err) {
    const msg = err?.message || "";
    if (msg.includes("SoftwareDownloadOrder") || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "ตาราง SoftwareDownloadOrder ยังไม่มี — รัน scripts/db-migrate-software-downloads.sql" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const orderCode = String(body.orderCode || "").trim().toUpperCase();
    const action = String(body.action || body.status || "").trim().toUpperCase();

    if (!orderCode) {
      return NextResponse.json({ error: "ต้องระบุ orderCode" }, { status: 400 });
    }

    const order = await prisma.softwareDownloadOrder.findUnique({ where: { orderCode } });
    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    let data;
    if (action === "PAID" || action === "CONFIRM") {
      data = {
        status: "PAID",
        paidAt: new Date(),
        notes: mergeNotesJson(order.notes, {
          manualConfirmed: true,
          confirmedBy: session.user.email || session.user.id,
          confirmedAt: new Date().toISOString(),
        }),
      };
    } else if (action === "CANCELLED" || action === "CANCEL") {
      data = {
        status: "CANCELLED",
        notes: mergeNotesJson(order.notes, {
          cancelledBy: session.user.email || session.user.id,
          cancelledAt: new Date().toISOString(),
        }),
      };
    } else if (action === "PENDING") {
      data = {
        status: "PENDING",
        paidAt: null,
        notes: mergeNotesJson(order.notes, {
          resetBy: session.user.email || session.user.id,
          resetAt: new Date().toISOString(),
        }),
      };
    } else {
      return NextResponse.json({ error: "action ไม่ถูกต้อง (CONFIRM, CANCEL, PENDING)" }, { status: 400 });
    }

    const updated = await prisma.softwareDownloadOrder.update({
      where: { id: order.id },
      data,
    });

    return NextResponse.json({ ok: true, order: serializeOrder(updated) });
  } catch (err) {
    return NextResponse.json({ error: err.message || "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
}
