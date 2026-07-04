import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "3");
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [items, products, sales] = await Promise.all([
    prisma.ctmSaleItem.findMany({
      where: { sale: { saleDate: { gte: since } } },
      select: { productId: true, productName: true, quantity: true, totalPrice: true },
    }),
    prisma.ctmProduct.findMany({ select: { id: true, name: true, stock: true, category: true } }),
    prisma.ctmSale.findMany({
      where: { saleDate: { gte: since } },
      select: { id: true, totalAmount: true, note: true, customerId: true, customer: { select: { customerCode: true, name: true } } },
    }),
  ]);

  // Top products by qty
  const prodMap = {};
  for (const item of items) {
    if (!prodMap[item.productId]) prodMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
    prodMap[item.productId].qty += item.quantity;
    prodMap[item.productId].revenue += Number(item.totalPrice);
  }
  const topProducts = Object.entries(prodMap)
    .map(([id, v]) => ({ productId: id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // Dead products (never sold in period)
  const soldIds = new Set(Object.keys(prodMap));
  const deadProducts = products.filter(p => !soldIds.has(p.id)).slice(0, 15);

  // Customer ranking
  const custMap = {};
  for (const sale of sales) {
    const key = sale.customerId || `anon_${sale.note || ""}`;
    const name = sale.customer
      ? `${sale.customer.customerCode ? sale.customer.customerCode + " · " : ""}${sale.customer.name}`
      : (sale.note || "ลูกค้าทั่วไป");
    if (!custMap[key]) custMap[key] = { name, total: 0, count: 0 };
    custMap[key].total += Number(sale.totalAmount);
    custMap[key].count += 1;
  }
  const topCustomers = Object.entries(custMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({ topProducts, deadProducts, topCustomers });
}
