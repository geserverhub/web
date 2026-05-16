import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getScope(session) {
  const role = session?.user?.role;
  const clientId = session?.user?.clientId || null;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isClient = role === "CLIENT";
  return { isAdmin, isClient, clientId };
}

export async function GET(req) {
  const session = await auth();
  const { isAdmin, isClient, clientId } = getScope(session);
  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const queryClientId = (searchParams.get("clientId") || "").trim();
    const effectiveClientId = isAdmin ? (queryClientId || null) : clientId;

    const customers = await prisma.customer.findMany({
      where: {
        ...(effectiveClientId ? { clientId: effectiveClientId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  const { isAdmin, isClient, clientId: sessionClientId } = getScope(session);
  if (!isAdmin && !isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const requestedClientId = String(body?.clientId || "").trim() || null;
    const effectiveClientId = isAdmin ? requestedClientId : sessionClientId;

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อลูกค้า" }, { status: 400 });
    }

    if (!effectiveClientId) {
      return NextResponse.json({ error: "กรุณาเลือกบริษัทลูกค้า" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        clientId: effectiveClientId,
        name,
        phone: String(body?.phone || "").trim() || null,
        email: String(body?.email || "").trim() || null,
        address: String(body?.address || "").trim() || null,
        idCard: String(body?.idCard || "").trim() || null,
        notes: String(body?.notes || "").trim() || null,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to create customer" }, { status: 500 });
  }
}
