import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CtmPacking (
      id        VARCHAR(191) NOT NULL PRIMARY KEY,
      saleId    VARCHAR(191) NOT NULL UNIQUE,
      status    VARCHAR(191) NOT NULL DEFAULT 'PENDING',
      photoUrl  VARCHAR(191) NULL,
      packedAt  DATETIME(3) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_ctmpacking_status (status),
      CONSTRAINT fk_ctmpacking_sale FOREIGN KEY (saleId) REFERENCES CtmSale(id) ON DELETE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  tableReady = true;
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.ctmSale.findMany({
    where: { saleDate: { gte: since } },
    orderBy: { saleDate: "desc" },
    include: { items: true, customer: { select: { name: true } }, packing: true },
  });
  return NextResponse.json({ sales });
}

export async function PATCH(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { saleId, status, photoUrl } = await req.json();
  if (!saleId) return NextResponse.json({ error: "กรุณาระบุ saleId" }, { status: 400 });

  const data = {};
  if (status !== undefined) {
    data.status = status;
    data.packedAt = status === "PACKED" ? new Date() : null;
  }
  if (photoUrl !== undefined) data.photoUrl = photoUrl || null;

  const packing = await prisma.ctmPacking.upsert({
    where: { saleId },
    update: data,
    create: { id: require("crypto").randomBytes(12).toString("hex"), saleId, status: status || "PENDING", photoUrl: photoUrl || null, packedAt: status === "PACKED" ? new Date() : null },
  });
  return NextResponse.json(packing);
}
