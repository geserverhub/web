import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

function getDateRange(params) {
  const date = params.get("date");   // YYYY-MM-DD
  const month = params.get("month"); // YYYY-MM
  const year = params.get("year");   // YYYY
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    return { saleDate: { gte: start, lte: end } };
  }
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    return { saleDate: { gte: start, lt: end } };
  }
  if (year) {
    const start = new Date(`${year}-01-01T00:00:00`);
    const end = new Date(`${Number(year) + 1}-01-01T00:00:00`);
    return { saleDate: { gte: start, lt: end } };
  }
  return {};
}

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const where = getDateRange(searchParams);
  const sales = await prisma.ctmSale.findMany({
    where, orderBy: { saleDate: "desc" },
    include: { customer: { select: { name: true } }, items: true },
  });
  const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
  const totalTax = sales.reduce((s, r) => s + Number(r.taxAmount), 0);
  const totalCost = sales.reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.buyPrice) * i.quantity, 0), 0);
  const subtotal = totalRevenue - totalTax;
  return NextResponse.json({ sales, totalRevenue, totalTax, totalCost, profit: subtotal - totalCost });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { customerId, items, paymentType, note } = await req.json();
  if (!items?.length) return NextResponse.json({ error: "ต้องมีรายการสินค้า" }, { status: 400 });

  const now = new Date();
  const prefix = `CTM${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-`;
  const last = await prisma.ctmSale.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? parseInt(last.number.split("-")[1] || "0", 10) : 0;
  const number = `${prefix}${String(seq + 1).padStart(4, "0")}`;

  const subtotal = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.10 * 100) / 100;
  const totalAmount = subtotal + taxAmount;

  const sale = await prisma.ctmSale.create({
    data: {
      number, totalAmount, taxAmount, paymentType: paymentType || "CASH", note: note || null,
      customerId: customerId || null,
      items: {
        create: items.map(i => ({
          productId: i.productId, productName: i.productName,
          quantity: i.quantity, unitPrice: Number(i.unitPrice),
          buyPrice: Number(i.buyPrice), totalPrice: Number(i.unitPrice) * i.quantity,
        })),
      },
    },
    include: { items: true },
  });
  for (const i of items) {
    await prisma.ctmProduct.update({ where: { id: i.productId }, data: { stock: { decrement: i.quantity } } }).catch(() => {});
  }
  return NextResponse.json(sale, { status: 201 });
}
