import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function canManage(session) {
  return ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role);
}

async function genSku() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `SKU${yy}${mm}${dd}`;

  const last = await prisma.martProduct.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });
  const seq = last?.sku ? (parseInt(last.sku.slice(-4), 10) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// GET /api/mart/products
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const activeOnly = searchParams.get("active") !== "0";

  const where = {
    ...(activeOnly && { active: true }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
      ],
    }),
  };

  const products = await prisma.martProduct.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ products });
}

// POST /api/mart/products
export async function POST(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      sku, category, name, nameEn, nameZh,
      currency, price, priceWholesale, unit, minOrder, minWholesale,
      stock, desc, img, active, promotion, promotionPrice,
    } = body;

    if (!category || !name || !price) {
      return NextResponse.json({ error: "category / name / price จำเป็น" }, { status: 400 });
    }

    const finalSku = sku?.trim() || await genSku();

    const existing = await prisma.martProduct.findUnique({ where: { sku: finalSku } });
    if (existing) return NextResponse.json({ error: `SKU ${finalSku} มีอยู่แล้ว` }, { status: 409 });

    const product = await prisma.martProduct.create({
      data: {
        sku: finalSku,
        currency: ["THB","KRW","USD"].includes(currency) ? currency : "THB",
        category: category.trim(),
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        nameZh: nameZh?.trim() || null,
        price: parseFloat(price),
        priceWholesale: priceWholesale ? parseFloat(priceWholesale) : null,
        unit: unit || "ชิ้น",
        minOrder: parseInt(minOrder || "1", 10),
        minWholesale: parseInt(minWholesale || "10", 10),
        stock: parseInt(stock || "0", 10),
        desc: desc?.trim() || null,
        img: img?.trim() || null,
        active: active !== false,
        promotion: promotion?.trim() || null,
        promotionPrice: promotionPrice ? parseFloat(promotionPrice) : null,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mart/products]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
