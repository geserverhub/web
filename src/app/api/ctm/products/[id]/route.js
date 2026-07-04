import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function PUT(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const product = await prisma.ctmProduct.update({
    where: { id },
    data: {
      name: body.name, nameKo: body.nameKo || null, barcode: body.barcode || null,
      category: body.category || null, buyPrice: Number(body.buyPrice), sellPrice: Number(body.sellPrice),
      stock: Number(body.stock || 0), unit: body.unit || "ชิ้น",
      imageUrl: body.imageUrl || null, description: body.description || null,
      isActive: body.isActive !== false,
    },
  });
  return NextResponse.json(product);
}

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { isActive } = await req.json();
  const product = await prisma.ctmProduct.update({ where: { id }, data: { isActive: !!isActive } });
  return NextResponse.json(product);
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.ctmProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
