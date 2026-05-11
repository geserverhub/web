import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const goeunClient = await prisma.client.findFirst({
      where: { name: "GOEUN SERVER HUB" },
      select: { id: true, name: true },
    });

    const clientId = goeunClient?.id;

    const [receipts, invoices, expenses] = await Promise.all([
      clientId
        ? prisma.receipt.findMany({
            where: { clientId },
            select: {
              id: true, number: true, total: true, currency: true,
              issuedAt: true, customerName: true, clientId: true,
            },
            orderBy: { issuedAt: "asc" },
          })
        : [],
      clientId
        ? prisma.invoice.findMany({
            where: { clientId },
            select: {
              id: true, number: true, amount: true, currency: true,
              status: true, createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          })
        : [],
      prisma.expense.findMany({
        select: {
          id: true, number: true, category: true, amount: true,
          currency: true, status: true, date: true,
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({ receipts, invoices, expenses, clientId });
  } catch (err) {
    console.error("[GET /api/partner/ledger]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
