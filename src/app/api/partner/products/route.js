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
    const products = await prisma.partnerProduct.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { name, model, brand, costPrice, sellPrice, currency } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "ชื่อสินค้าจำเป็น" }, { status: 400 });
    const toNum = (v) => (v ? Number(String(v).replace(/,/g, "")) : null);
    const product = await prisma.partnerProduct.create({
      data: {
        name: name.trim(),
        model: model?.trim() || null,
        brand: brand?.trim() || null,
        costPrice: toNum(costPrice),
        sellPrice: toNum(sellPrice),
        currency: ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW",
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
