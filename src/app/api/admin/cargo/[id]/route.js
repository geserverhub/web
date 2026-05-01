import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

// GET /api/admin/cargo/[id] — order + statusLogs + transactions
export async function GET(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const order = await prisma.cargoOrder.findUnique({
      where: { id },
      include: {
        statusLogs: { orderBy: { createdAt: "asc" } },
        transactions: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/cargo/[id]
// When status changes, auto-creates a CargoStatusLog entry
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { senderName, senderPhone, receiverName, receiverPhone, receiverAddress,
            direction, weightKg, sizeNote, itemDesc, currency, income, expense,
            status, trackingCode, notes, shippedAt, deliveredAt, statusNote } = body;

    // Get current order to detect status change
    const current = await prisma.cargoOrder.findUnique({ where: { id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = {};
    if (senderName !== undefined) data.senderName = senderName;
    if (senderPhone !== undefined) data.senderPhone = senderPhone || null;
    if (receiverName !== undefined) data.receiverName = receiverName;
    if (receiverPhone !== undefined) data.receiverPhone = receiverPhone || null;
    if (receiverAddress !== undefined) data.receiverAddress = receiverAddress || null;
    if (direction !== undefined) data.direction = direction;
    if (weightKg !== undefined) data.weightKg = weightKg ? parseFloat(weightKg) : null;
    if (sizeNote !== undefined) data.sizeNote = sizeNote || null;
    if (itemDesc !== undefined) data.itemDesc = itemDesc || null;
    if (currency !== undefined) data.currency = currency;
    if (income !== undefined) data.income = parseFloat(income);
    if (expense !== undefined) data.expense = parseFloat(expense);
    if (status !== undefined) data.status = status;
    if (trackingCode !== undefined) data.trackingCode = trackingCode || null;
    if (notes !== undefined) data.notes = notes || null;
    if (shippedAt !== undefined) data.shippedAt = shippedAt ? new Date(shippedAt) : null;
    if (deliveredAt !== undefined) data.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;

    const order = await prisma.cargoOrder.update({ where: { id }, data });

    // Auto-log status change
    if (status !== undefined && status !== current.status) {
      await prisma.cargoStatusLog.create({
        data: {
          orderId: id,
          status,
          note: statusNote || null,
          createdBy: session.user?.name || session.user?.email || "admin",
        },
      });
    }

    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/cargo/[id]
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.cargoOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

