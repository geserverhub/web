import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

let stockLogTableReady = false;
async function ensureStockLogTable() {
  if (stockLogTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CtmStockLog (
      id        VARCHAR(191) NOT NULL PRIMARY KEY,
      productId VARCHAR(191) NOT NULL,
      delta     INT NOT NULL,
      note      TEXT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_ctmstocklog_productid (productId)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  stockLogTableReady = true;
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureStockLogTable();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const supplierId = searchParams.get("supplierId");
  const onlyWithSupplier = searchParams.get("onlyWithSupplier");
  const where = {};
  if (q) where.OR = [{ name: { contains: q } }, { barcode: { contains: q } }, { category: { contains: q } }];
  if (supplierId) where.supplierId = supplierId;
  if (onlyWithSupplier) where.supplierId = { not: null };
  const products = await prisma.ctmProduct.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      stockLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      supplier: { select: { id: true, name: true, supplierCode: true } },
    },
  });
  return NextResponse.json({ products });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, nameKo, barcode, category, buyPrice, sellPrice, stock, unit, imageUrl, description, supplierId } = body;
  if (!name || !buyPrice || !sellPrice) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

  const allCodes = await prisma.ctmProduct.findMany({ where: { productCode: { not: null } }, select: { productCode: true } });
  let maxNum = 0;
  for (const p of allCodes) {
    const m = p.productCode?.match(/^CTM(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const productCode = `CTM${String(maxNum + 1).padStart(4, "0")}`;

  const product = await prisma.ctmProduct.create({
    data: { productCode, name, nameKo: nameKo || null, barcode: barcode || null, category: category || null, buyPrice: Number(buyPrice), sellPrice: Number(sellPrice), stock: Number(stock || 0), unit: unit || "ชิ้น", imageUrl: imageUrl || null, description: description || null, supplierId: supplierId || null },
  });
  return NextResponse.json(product, { status: 201 });
}
