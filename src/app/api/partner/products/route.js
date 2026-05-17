import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = await prisma.partnerProduct.findMany({ orderBy: { name: "asc" } });
    const products = rows.map(p => ({
      ...p,
      imageUrls: (() => { try { return JSON.parse(p.imageUrls || "[]"); } catch { return []; } })(),
    }));
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, model, brand, costPrice, sellPrice, currency, imageUrls } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "ชื่อสินค้าจำเป็น" }, { status: 400 });
    const toNum = (v) => (v ? Number(String(v).replace(/,/g, "")) : null);
    const safeUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean).slice(0, 5) : [];
    const product = await prisma.partnerProduct.create({
      data: {
        name: name.trim(),
        model: model?.trim() || null,
        brand: brand?.trim() || null,
        costPrice: toNum(costPrice),
        sellPrice: toNum(sellPrice),
        currency: ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW",
        imageUrls: safeUrls.length ? JSON.stringify(safeUrls) : null,
      },
    });
    return NextResponse.json({
      ...product,
      imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : [],
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
