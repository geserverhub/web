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
    const { role, clientId } = session.user;

    // PARTNER must have a clientId assigned; ADMIN/SUPER_ADMIN falls back to GOEUN SERVER HUB
    let resolvedClientId = clientId ?? null;
    if (!resolvedClientId && (role === "ADMIN" || role === "SUPER_ADMIN")) {
      const fallback = await prisma.client.findFirst({
        where: { name: "GOEUN SERVER HUB" },
        select: { id: true },
      });
      resolvedClientId = fallback?.id ?? null;
    }

    const [receipts, invoices, expenses] = await Promise.all([
      resolvedClientId
        ? prisma.receipt.findMany({
            where: { clientId: resolvedClientId },
            select: {
              id: true, number: true, total: true, currency: true,
              issuedAt: true, customerName: true, clientId: true,
            },
            orderBy: { issuedAt: "asc" },
          })
        : [],
      resolvedClientId
        ? prisma.invoice.findMany({
            where: { clientId: resolvedClientId },
            select: {
              id: true, number: true, amount: true, currency: true,
              status: true, createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          })
        : [],
      prisma.expense.findMany({
        where: resolvedClientId ? { clientId: resolvedClientId } : {},
        select: {
          id: true, number: true, category: true, amount: true,
          currency: true, status: true, date: true,
        },
        orderBy: { date: "asc" },
      }),
    ]);

    return NextResponse.json({ receipts, invoices, expenses, clientId: resolvedClientId });
  } catch (err) {
    console.error("[GET /api/partner/ledger]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
