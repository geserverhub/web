import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

async function ownsProduct(session, id) {
  const { role, clientId } = session.user;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  const p = await prisma.partnerProduct.findUnique({ where: { id }, select: { clientId: true } });
  return p?.clientId === clientId;
}

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!(await ownsProduct(session, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, model, brand, costPrice, sellPrice, currency, imageUrls, categoryId } = body;
    const toNum = (v) => (v ? Number(String(v).replace(/,/g, "")) : null);
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (model !== undefined) data.model = model?.trim() || null;
    if (brand !== undefined) data.brand = brand?.trim() || null;
    if (costPrice !== undefined) data.costPrice = toNum(costPrice);
    if (sellPrice !== undefined) data.sellPrice = toNum(sellPrice);
    if (currency !== undefined) data.currency = ["KRW", "USD", "THB"].includes(currency) ? currency : "KRW";
    if (imageUrls !== undefined) {
      const safeUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean).slice(0, 5) : [];
      data.imageUrls = safeUrls.length ? JSON.stringify(safeUrls) : null;
    }
    if (categoryId !== undefined) {
      const cid = categoryId?.trim() || null;
      if (!cid) {
        data.categoryId = null;
      } else {
        const cat = await prisma.partnerProductCategory.findUnique({ where: { id: cid } });
        if (!cat) return NextResponse.json({ error: "หมวดสินค้าไม่พบ" }, { status: 400 });
        const { role, clientId } = session.user;
        if (role === "PARTNER" && cat.clientId && cat.clientId !== clientId) {
          return NextResponse.json({ error: "หมวดสินค้าไม่ถูกต้อง" }, { status: 400 });
        }
        data.categoryId = cid;
      }
    }
    const product = await prisma.partnerProduct.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json({
      ...product,
      categoryName: product.category?.name ?? null,
      imageUrls: product.imageUrls ? JSON.parse(product.imageUrls) : [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const session = await auth();
    if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (!(await ownsProduct(session, id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.partnerProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
