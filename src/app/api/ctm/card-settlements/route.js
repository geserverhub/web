import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS CtmCardSettlement (
      id        VARCHAR(191) NOT NULL PRIMARY KEY,
      date      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      amount    DECIMAL(12,2) NOT NULL,
      imageUrl  VARCHAR(191) NULL,
      note      TEXT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_ctmcardsettlement_date (date)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  tableReady = true;
}

function getDateRange(params) {
  const date = params.get("date");   // YYYY-MM-DD
  const month = params.get("month"); // YYYY-MM
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    return { date: { gte: start, lte: end } };
  }
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    return { date: { gte: start, lt: end } };
  }
  return {};
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const where = getDateRange(searchParams);
  const settlements = await prisma.ctmCardSettlement.findMany({ where, orderBy: { date: "desc" } });
  const total = settlements.reduce((s, r) => s + Number(r.amount), 0);
  return NextResponse.json({ settlements, total });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { date, amount, imageUrl, note } = await req.json();
  if (!date || !amount) return NextResponse.json({ error: "กรุณากรอกวันที่และยอดเงิน" }, { status: 400 });
  const settlement = await prisma.ctmCardSettlement.create({
    data: { date: new Date(`${date}T12:00:00`), amount: Number(amount), imageUrl: imageUrl || null, note: note || null },
  });
  return NextResponse.json(settlement, { status: 201 });
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await ensureTable();
  const { searchParams } = new URL(req.url);
  await prisma.ctmCardSettlement.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
