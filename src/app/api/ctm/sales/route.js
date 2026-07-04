import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  let where = {};
  if (month) {
    const start = new Date(`${month}-01T00:00:00`);
    const end = new Date(start); end.setMonth(end.getMonth() + 1);
    where = { saleDate: { gte: start, lt: end } };
  }
  const sales = await prisma.ctmSale.findMany({
    where, orderBy: { saleDate: "desc" },
    include: { customer: { select: { name: true } }, items: true },
  });
  const totalRevenue = sales.reduce((s, r) => s + Number(r.totalAmount), 0);
  const totalCost = sales.reduce((s, r) => s + r.items.reduce((a, i) => a + Number(i.buyPrice) * i.quantity, 0), 0);
  return NextResponse.json({ sales, totalRevenue, totalCost, profit: totalRevenue - totalCost });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { customerId, items, paymentType, note } = body;
  if (!items?.length) return NextResponse.json({ error: "ต้องมีรายการสินค้า" }, { status: 400 });

  const now = new Date();
  const prefix = `CTM${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-`;
  const last = await prisma.ctmSale.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? parseInt(last.number.split("-")[1] || "0", 10) : 0;
  const number = `${prefix}${String(seq + 1).padStart(4, "0")}`;

  const totalAmount = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
  const sale = await prisma.ctmSale.create({
    data: {
      number, totalAmount, paymentType: paymentType || "CASH", note: note || null,
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
  // Update stock
  for (const i of items) {
    await prisma.ctmProduct.update({ where: { id: i.productId }, data: { stock: { decrement: i.quantity } } }).catch(() => {});
  }
  return NextResponse.json(sale, { status: 201 });
}
