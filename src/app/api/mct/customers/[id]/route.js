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

async function canAccessCustomer(customerId, scope) {
  if (scope.isAdmin) return true;
  if (!scope.isClient || !scope.clientId) return false;
  const c = await prisma.customer.findUnique({ where: { id: customerId }, select: { clientId: true } });
  return c?.clientId === scope.clientId;
}

export async function PUT(req, { params }) {
  const session = await auth();
  const scope = getScope(session);
  if (!scope.isAdmin && !scope.isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const allowed = await canAccessCustomer(id, scope);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อลูกค้า" }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone: String(body?.phone || "").trim() || null,
        email: String(body?.email || "").trim() || null,
        address: String(body?.address || "").trim() || null,
        idCard: String(body?.idCard || "").trim() || null,
        notes: String(body?.notes || "").trim() || null,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await auth();
  const scope = getScope(session);
  if (!scope.isAdmin && !scope.isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const allowed = await canAccessCustomer(id, scope);
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to delete customer" }, { status: 500 });
  }
}
