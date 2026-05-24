import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { formatDbConnectError } from "@/lib/db-connect-error";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const products = await prisma.partnerProduct.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        model: true,
        brand: true,
        costPrice: true,
        sellPrice: true,
        currency: true,
        imageUrls: true,
        updatedAt: true,
      },
    });

    const parsed = products.map(p => ({
      ...p,
      imageUrls: (() => { try { return JSON.parse(p.imageUrls || "[]"); } catch { return []; } })(),
    }));
    return NextResponse.json({ products: parsed });
  } catch (err) {
    const message = formatDbConnectError(err);
    const status = message.includes('goeunserverhub') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    const body = await req.json();
    const customerName = String(body.customerName || "").trim();
    const customerContact = String(body.customerContact || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const shippingAddress = String(body.shippingAddress || "").trim();
    const customerNote = String(body.note || "").trim();
    const paymentMethod = String(body.paymentMethod || "BANK_TRANSFER").trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "กรุณากรอกชื่อลูกค้า" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" }, { status: 400 });
    }

    const ids = items.map((it) => String(it.productId)).filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    const products = await prisma.partnerProduct.findMany({ where: { id: { in: uniqueIds } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const orderLines = [];
    for (const it of items) {
      const pid = String(it.productId || "");
      const qty = Math.max(1, Math.floor(safeNumber(it.qty || 1)));
      const p = byId.get(pid);
      if (!p) continue;
      const unitPrice = safeNumber(p.sellPrice ?? p.costPrice ?? 0);
      orderLines.push({
        productId: p.id,
        name: p.name,
        model: p.model,
        brand: p.brand,
        qty,
        unitPrice,
        lineTotal: unitPrice * qty,
        currency: p.currency || "KRW",
      });
    }

    if (orderLines.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสินค้าที่เลือก" }, { status: 400 });
    }

    const currency = orderLines[0]?.currency || "KRW";
    const totalAmount = orderLines.reduce((s, l) => s + l.lineTotal, 0);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const count = await prisma.partnerTransaction.count({ where: { type: "SALE" } });
    const number = `MKT${yyyy}${mm}${dd}-${String(count + 1).padStart(4, "0")}`;

    const notePayload = {
      source: "momoge-product-marketplace",
      customerName,
      customerContact,
      customerEmail,
      shippingAddress,
      customerNote,
      paymentMethod,
      items: orderLines,
      submittedAt: now.toISOString(),
    };

    const description = orderLines
      .map((l) => `${l.name}${l.model ? ` (${l.model})` : ""} x ${l.qty}`)
      .join(" | ");

    const tx = await prisma.partnerTransaction.create({
      data: {
        number,
        brand: "MOMOGE SPACE",
        type: "SALE",
        description: `Marketplace Order: ${description}`,
        customerName,
        amount: currency === "KRW" ? Math.round(totalAmount) : Number(totalAmount.toFixed(2)),
        currency,
        status: "PENDING",
        category: "MARKETPLACE",
        notes: JSON.stringify(notePayload),
        date: now,
      },
    });

    return NextResponse.json({
      ok: true,
      transactionId: tx.id,
      number: tx.number,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      items: orderLines,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "ไม่สามารถสร้างคำสั่งซื้อได้" }, { status: 500 });
  }
}
