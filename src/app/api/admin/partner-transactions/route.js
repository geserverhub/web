import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isSuperAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const transactions = await prisma.partnerTransaction.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("[GET /api/admin/partner-transactions]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
