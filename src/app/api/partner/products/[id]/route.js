import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const { name, model, brand, costPrice, sellPrice, currency } = await req.json();
    const toNum = (v) => (v ? Number(String(v).replace(/,/g, "")) : null);
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (model !== undefined) data.model = model?.trim() || null;
    if (brand !== undefined) data.brand = brand?.trim() || null;
    if (costPrice !== undefined) data.costPrice = toNum(costPrice);
    if (sellPrice !== undefined) data.sellPrice = toNum(sellPrice);
    if (currency !== undefined) data.currency = ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW";
    const product = await prisma.partnerProduct.update({ where: { id }, data });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    await prisma.partnerProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
