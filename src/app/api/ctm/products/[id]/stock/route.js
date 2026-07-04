import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
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
  tableReady = true;
}

export async function POST(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { id } = await params;
  const { delta, note } = await req.json();
  const n = Math.trunc(Number(delta));
  if (!n) return NextResponse.json({ error: "กรุณาระบุจำนวนที่เพิ่ม" }, { status: 400 });

  const product = await prisma.ctmProduct.update({ where: { id }, data: { stock: { increment: n } } });
  await prisma.ctmStockLog.create({
    data: { id: require("crypto").randomBytes(12).toString("hex"), productId: id, delta: n, note: note || null },
  });
  return NextResponse.json(product);
}
