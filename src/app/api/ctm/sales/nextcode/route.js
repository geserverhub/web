import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const prefix = `INV${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-`;
  const last = await prisma.ctmSale.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" }, select: { number: true } });
  const seq = last ? parseInt(last.number.split("-")[1] || "0", 10) : 0;
  const code = `${prefix}${String(seq + 1).padStart(4, "0")}`;
  return NextResponse.json({ code });
}
