import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "mct-market-products.json");

function canView(session) {
  return !!session?.user && ["ADMIN", "SUPER_ADMIN", "CLIENT"].includes(session.user.role);
}

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

function normalizeProduct(body, prev = null) {
  const now = new Date().toISOString();
  return {
    id: prev?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sku: String(body?.sku || prev?.sku || "").trim(),
    category: String(body?.category || prev?.category || "misc").trim().toLowerCase(),
    name: String(body?.name || prev?.name || "").trim(),
    nameEn: String(body?.nameEn || prev?.nameEn || "").trim(),
    nameZh: String(body?.nameZh || prev?.nameZh || "").trim(),
    price: Number(body?.price ?? prev?.price ?? 0),
    priceWholesale: Number(body?.priceWholesale ?? prev?.priceWholesale ?? body?.price ?? prev?.price ?? 0),
    unit: String(body?.unit || prev?.unit || "ชิ้น").trim(),
    minOrder: Number(body?.minOrder ?? prev?.minOrder ?? 1),
    minWholesale: Number(body?.minWholesale ?? prev?.minWholesale ?? 10),
    stock: Number(body?.stock ?? prev?.stock ?? 0),
    desc: String(body?.desc || prev?.desc || "").trim(),
    img: String(body?.img || prev?.img || "").trim(),
    active: body?.active !== undefined ? !!body.active : (prev?.active ?? true),
    promotion: String(body?.promotion || prev?.promotion || "").trim(),
    promotionPrice: body?.promotionPrice === null || body?.promotionPrice === "" || body?.promotionPrice === undefined
      ? null
      : Number(body.promotionPrice),
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  };
}

export async function GET(req) {
  const session = await auth();
  if (!canView(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const category = String(searchParams.get("category") || "").trim().toLowerCase();

  const products = await readProducts();
  const filtered = products.filter((p) => {
    if (category && category !== "all" && String(p.category || "").toLowerCase() !== category) return false;
    if (!q) return true;
    return [p.sku, p.name, p.nameEn, p.nameZh, p.category].some((v) => String(v || "").toLowerCase().includes(q));
  });

  return NextResponse.json({ products: filtered });
}

export async function POST(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const incoming = normalizeProduct(body);
  if (!incoming.sku || !incoming.name || !incoming.category) {
    return NextResponse.json({ error: "กรุณากรอก SKU / ชื่อสินค้า / หมวดสินค้า" }, { status: 400 });
  }

  const products = await readProducts();
  const exists = products.some((p) => String(p.sku || "").toLowerCase() === incoming.sku.toLowerCase());
  if (exists) {
    return NextResponse.json({ error: "SKU นี้มีอยู่แล้วในฐานข้อมูลสินค้า mart" }, { status: 409 });
  }

  const next = [incoming, ...products];
  await writeProducts(next);

  return NextResponse.json({ product: incoming }, { status: 201 });
}
