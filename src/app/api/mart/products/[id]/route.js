import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function canManage(session) {
  return ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role);
}

// GET /api/mart/products/[id]
export async function GET(_, { params }) {
  const { id } = await params;
  const product = await prisma.martProduct.findUnique({ where: { id: parseInt(id) } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

// PUT /api/mart/products/[id]
export async function PUT(req, { params }) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      sku, category, name, nameEn, nameZh,
      currency, price, priceWholesale, unit, minOrder, minWholesale,
      stock, desc, img, active, promotion, promotionPrice,
    } = body;

    const product = await prisma.martProduct.update({
      where: { id: parseInt(id) },
      data: {
        ...(currency && { currency: ["THB","KRW","USD"].includes(currency) ? currency : "THB" }),
        ...(sku && { sku: sku.trim() }),
        ...(category && { category: category.trim() }),
        ...(name && { name: name.trim() }),
        ...(nameEn !== undefined && { nameEn: nameEn?.trim() || null }),
        ...(nameZh !== undefined && { nameZh: nameZh?.trim() || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceWholesale !== undefined && { priceWholesale: priceWholesale ? parseFloat(priceWholesale) : null }),
        ...(unit && { unit }),
        ...(minOrder !== undefined && { minOrder: parseInt(minOrder, 10) }),
        ...(minWholesale !== undefined && { minWholesale: parseInt(minWholesale, 10) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(desc !== undefined && { desc: desc?.trim() || null }),
        ...(img !== undefined && { img: img?.trim() || null }),
        ...(active !== undefined && { active: !!active }),
        ...(promotion !== undefined && { promotion: promotion?.trim() || null }),
        ...(promotionPrice !== undefined && { promotionPrice: promotionPrice ? parseFloat(promotionPrice) : null }),
      },
    });

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[PUT /api/mart/products/[id]]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/mart/products/[id]
export async function DELETE(_, { params }) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.martProduct.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
