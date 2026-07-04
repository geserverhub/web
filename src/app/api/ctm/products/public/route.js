import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const where = {};
  if (category && category !== "all") where.category = category;

  const [products, catRows] = await Promise.all([
    prisma.ctmProduct.findMany({ where, orderBy: { name: "asc" } }),
    prisma.ctmProduct.findMany({
      where: { NOT: { category: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categories = catRows.map(r => r.category).filter(Boolean);
  return NextResponse.json({ products, categories });
}
