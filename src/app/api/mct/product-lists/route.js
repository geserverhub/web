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

function buildListNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const t = String(d.getTime()).slice(-6);
  return `MPL-${y}${m}${day}-${t}`;
}

export async function GET() {
  const session = await auth();
  const { isAdmin, isClient, clientId } = getScope(session);
  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const productLists = await prisma.mGroupOrder.findMany({
      where: isClient ? { clientId: clientId || "" } : undefined,
      orderBy: { createdAt: "desc" },
      include: { items: true, client: { select: { id: true, name: true, slug: true } } },
      take: 200,
    });

    return NextResponse.json({ productLists });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to fetch product lists" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  const { isAdmin, isClient, clientId: sessionClientId } = getScope(session);
  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const customerName = String(body?.customerName || "").trim();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "กรุณากรอกชื่อลูกค้า" }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    const normalized = items
      .map((item) => {
        const qty = Number(item?.qty || 0);
        const unitPrice = Number(item?.unitPrice || 0);
        const name = String(item?.name || "").trim();
        return {
          productId: item?.productId ? Number(item.productId) : null,
          sku: String(item?.sku || "").trim() || null,
          name,
          qty,
          unitPrice,
          amount: qty * unitPrice,
        };
      })
      .filter((item) => item.name && item.qty > 0 && item.unitPrice >= 0);

    if (!normalized.length) {
      return NextResponse.json({ error: "ข้อมูลรายการสินค้าไม่ถูกต้อง" }, { status: 400 });
    }

    const subtotal = normalized.reduce((sum, item) => sum + item.amount, 0);
    const shippingFee = Number(body?.shippingFee || 0);
    const total = subtotal + shippingFee;
    const requestedClientId = String(body?.clientId || "").trim() || null;
    const effectiveClientId = isAdmin ? requestedClientId : sessionClientId;

    if (!effectiveClientId) {
      return NextResponse.json({ error: "ไม่พบบริษัทเจ้าของรายการสินค้า" }, { status: 400 });
    }

    const productList = await prisma.mGroupOrder.create({
      data: {
        number: buildListNumber(),
        clientId: effectiveClientId,
        customerName,
        customerPhone: String(body?.customerPhone || "").trim() || null,
        customerEmail: String(body?.customerEmail || "").trim() || null,
        shippingAddress: String(body?.shippingAddress || "").trim() || null,
        note: String(body?.note || "").trim() || null,
        subtotal,
        total,
        status: "PENDING_PAYMENT",
        currency: String(body?.currency || "THB") || "THB",
        items: {
          create: normalized.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: { items: true, client: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ productList }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to create product list" }, { status: 500 });
  }
}
