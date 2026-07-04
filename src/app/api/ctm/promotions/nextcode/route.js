import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allCodes = await prisma.ctmPromotion.findMany({ where: { promoCode: { not: null } }, select: { promoCode: true } });
  let maxNum = 0;
  for (const c of allCodes) {
    const m = c.promoCode?.match(/^PRO(\d+)$/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
  }
  const code = `PRO${String(maxNum + 1).padStart(4, "0")}`;
  return NextResponse.json({ code });
}
