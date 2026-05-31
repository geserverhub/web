import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma, { getPrisma } from "@/lib/prisma";
import { ensurePartnerProductCategorySchema } from "@/lib/partner-product-category-db";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function clientFilter(session) {
  const { role, clientId } = session.user;
  if (role === "PARTNER") return { clientId: clientId ?? "__none__" };
  return {};
}

export async function GET() {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = await prisma.partnerProduct.findMany({
      where: clientFilter(session),
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    const products = rows.map(p => ({
      ...p,
      categoryName: p.category?.name ?? null,
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

    const { name, model, brand, costPrice, sellPrice, currency, imageUrls, categoryId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "ชื่อสินค้าจำเป็น" }, { status: 400 });

    const toNum = (v) => (v ? Number(String(v).replace(/,/g, "")) : null);
    const safeUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean).slice(0, 5) : [];
    const clientId = session.user.clientId ?? null;

    let resolvedCategoryId = categoryId?.trim() || null;
    if (resolvedCategoryId) {
      const db = getPrisma();
      if (db?.partnerProductCategory) {
        await ensurePartnerProductCategorySchema(db);
      }
      const cat = await prisma.partnerProductCategory.findUnique({
        where: { id: resolvedCategoryId },
      });
      if (!cat) resolvedCategoryId = null;
      else if (
        session.user.role === "PARTNER" &&
        cat.clientId &&
        cat.clientId !== clientId
      ) {
        return NextResponse.json({ error: "หมวดสินค้าไม่ถูกต้อง" }, { status: 400 });
      }
    }

    const product = await prisma.partnerProduct.create({
      data: {
        name: name.trim(),
        model: model?.trim() || null,
        brand: brand?.trim() || null,
        costPrice: toNum(costPrice),
        sellPrice: toNum(sellPrice),
        currency: ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW",
        imageUrls: safeUrls.length ? JSON.stringify(safeUrls) : null,
        categoryId: resolvedCategoryId,
        clientId,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({
      ...product,
      categoryName: product.category?.name ?? null,
      imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : [],
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
