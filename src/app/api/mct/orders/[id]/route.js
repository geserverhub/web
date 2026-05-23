import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getScope(session) {
  const role = session?.user?.role;
  const clientId = session?.user?.clientId || null;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isClient = role === "CLIENT";
  return { isAdmin, isClient, clientId };
}

const ALLOWED_STATUS = new Set([
  "PENDING_PAYMENT",
  "CONFIRMING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export async function GET(req, { params }) {
  const session = await auth();
  const scope = getScope(session);
  if (!scope.isAdmin && !scope.isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await prisma.mGroupOrder.findUnique({
      where: { id },
      include: { items: true, client: { select: { id: true, name: true, slug: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (scope.isClient && order.clientId !== scope.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const session = await auth();
  const scope = getScope(session);
  if (!scope.isAdmin && !scope.isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.mGroupOrder.findUnique({ where: { id }, select: { clientId: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (scope.isClient && existing.clientId !== scope.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const nextStatus = String(body?.status || "").trim().toUpperCase();

    if (!ALLOWED_STATUS.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const now = new Date();
    const timestamps = {
      paidAt: nextStatus === "CONFIRMING" ? now : undefined,
      confirmedAt: nextStatus === "CONFIRMED" ? now : undefined,
      shippedAt: nextStatus === "SHIPPED" ? now : undefined,
      deliveredAt: nextStatus === "DELIVERED" ? now : undefined,
      cancelledAt: nextStatus === "CANCELLED" ? now : undefined,
    };

    const order = await prisma.mGroupOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        note: body?.note !== undefined ? String(body.note || "").trim() || null : undefined,
        paymentSlipUrl: body?.paymentSlipUrl !== undefined ? String(body.paymentSlipUrl || "").trim() || null : undefined,
        ...timestamps,
      },
      include: { items: true, client: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to update order" }, { status: 500 });
  }
}
