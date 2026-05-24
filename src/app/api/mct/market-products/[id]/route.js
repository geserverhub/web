import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "mct-market-products.json");

function canManage(session) {
  return !!session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

async function readProducts() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

async function writeProducts(products) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(products, null, 2) + "\n", "utf8");
}

export async function PUT(req, { params }) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const products = await readProducts();
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  const prev = products[idx];
  const nextItem = {
    ...prev,
    ...body,
    id: prev.id,
    sku: String(body?.sku ?? prev.sku ?? "").trim(),
    category: String(body?.category ?? prev.category ?? "misc").trim().toLowerCase(),
    name: String(body?.name ?? prev.name ?? "").trim(),
    nameEn: String(body?.nameEn ?? prev.nameEn ?? "").trim(),
    nameZh: String(body?.nameZh ?? prev.nameZh ?? "").trim(),
    price: Number(body?.price ?? prev.price ?? 0),
    priceWholesale: Number(body?.priceWholesale ?? prev.priceWholesale ?? prev.price ?? 0),
    unit: String(body?.unit ?? prev.unit ?? "ชิ้น").trim(),
    minOrder: Number(body?.minOrder ?? prev.minOrder ?? 1),
    minWholesale: Number(body?.minWholesale ?? prev.minWholesale ?? 10),
    stock: Number(body?.stock ?? prev.stock ?? 0),
    desc: String(body?.desc ?? prev.desc ?? "").trim(),
    img: String(body?.img ?? prev.img ?? "").trim(),
    active: body?.active !== undefined ? !!body.active : !!prev.active,
    promotion: String(body?.promotion ?? prev.promotion ?? "").trim(),
    promotionPrice: body?.promotionPrice === null || body?.promotionPrice === "" || body?.promotionPrice === undefined
      ? null
      : Number(body.promotionPrice),
    updatedAt: new Date().toISOString(),
  };

  products[idx] = nextItem;
  await writeProducts(products);
  return NextResponse.json({ product: nextItem });
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const products = await readProducts();
  const next = products.filter((p) => String(p.id) !== String(id));
  if (next.length === products.length) {
    return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  }

  await writeProducts(next);
  return NextResponse.json({ ok: true });
}
