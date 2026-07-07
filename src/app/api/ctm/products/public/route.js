import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const HIDDEN_CATEGORIES = ["ขนส่ง"];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const where = { AND: [{ category: { notIn: HIDDEN_CATEGORIES } }] };
  if (category && category !== "all" && !HIDDEN_CATEGORIES.includes(category)) where.AND.push({ category });

  const [products, catRows] = await Promise.all([
    prisma.ctmProduct.findMany({ where, orderBy: { name: "asc" } }),
    prisma.ctmProduct.findMany({
      where: { NOT: { category: null }, category: { notIn: HIDDEN_CATEGORIES } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = catRows.map(r => r.category).filter(Boolean);
  return NextResponse.json({ products, categories });
}
