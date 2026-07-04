import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const promotions = await prisma.ctmPromotion.findMany({
    where: {
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      product: {
        select: { id: true, name: true, nameKo: true, sellPrice: true, imageUrl: true, category: true, unit: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ promotions });
}
