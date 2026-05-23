import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(session) {
  return session?.user?.role === "SUPER_ADMIN" || session?.user?.role === "ADMIN";
}

// POST — bulk auto-link unlinked CargoOrders to registered Customers by receiverPhone
export async function POST() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [unlinked, customers] = await Promise.all([
      prisma.cargoOrder.findMany({ where: { customerId: null, receiverPhone: { not: null } }, select: { id: true, receiverPhone: true } }),
      prisma.customer.findMany({ select: { id: true, phone: true } }),
    ]);

    let linked = 0;
    for (const order of unlinked) {
      const norm = (order.receiverPhone || "").replace(/[-\s]/g, "");
      const match = customers.find(c => c.phone && c.phone.replace(/[-\s]/g, "") === norm);
      if (match) {
        await prisma.cargoOrder.update({ where: { id: order.id }, data: { customerId: match.id } });
        linked++;
      }
    }

    return NextResponse.json({ ok: true, linked, total: unlinked.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — manually link one order to a customer
export async function PATCH(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { orderId, customerId } = await req.json();
    await prisma.cargoOrder.update({ where: { id: orderId }, data: { customerId: customerId || null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
