import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024;

function decodeBase64Image(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return {
    mime: m[1],
    buffer: Buffer.from(m[2], "base64"),
  };
}

function extFromMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function toLegacy(order) {
  const statusMap = {
    PENDING_PAYMENT: "pending_payment",
    CONFIRMING: "confirming",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
  };

  return {
    id: order.id,
    number: order.number,
    status: statusMap[order.status] || "pending_payment",
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
    },
    shippingAddress: order.shippingAddress,
    note: order.note,
    total: Number(order.total || 0),
    paymentSlip: order.paymentSlipUrl,
    slipName: order.slipName,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    items: (order.items || []).map((it) => ({
      id: it.id,
      productId: it.productId,
      sku: it.sku,
      name: it.name,
      qty: it.qty,
      price: Number(it.unitPrice || 0),
      amount: Number(it.amount || 0),
    })),
  };
}

// POST /api/orders/[id]/payment — submit payment slip (base64 or URL)
export async function POST(req, { params }) {
  const { id } = await params;
  const order = await prisma.mGroupOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Order already paid or cancelled" }, { status: 400 });
  }

  const body = await req.json();
  const { slipData, slipName } = body; // slipData = base64 data URL

  if (!slipData) return NextResponse.json({ error: "No slip provided" }, { status: 400 });

  const decoded = decodeBase64Image(slipData);
  if (!decoded || !ALLOWED_TYPES.includes(decoded.mime)) {
    return NextResponse.json({ error: "Invalid slip image" }, { status: 400 });
  }
  if (decoded.buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: "Slip too large (max 8MB)" }, { status: 400 });
  }

  const ext = extFromMime(decoded.mime);
  const safeName = `mgo-slip-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), decoded.buffer);

  const paymentSlipUrl = `/uploads/receipts/${safeName}`;

  const updated = await prisma.mGroupOrder.update({
    where: { id },
    data: {
      paymentSlipUrl,
      slipName: slipName || safeName,
      status: "CONFIRMING",
      paidAt: new Date(),
    },
    include: { items: true },
  });

  return NextResponse.json(toLegacy(updated));
}
