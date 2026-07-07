import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { sourceProductId, consumeQty, targetMode, targetProductId, newName, newSellPrice, newUnit } = body;
  const addQty = Number(body.addQty);

  if (!sourceProductId) return NextResponse.json({ error: "กรุณาเลือกสินค้าต้นทาง" }, { status: 400 });
  if (!consumeQty || Number(consumeQty) <= 0) return NextResponse.json({ error: "กรุณาระบุจำนวนที่ใช้แปลง" }, { status: 400 });
  if (!addQty || addQty <= 0) return NextResponse.json({ error: "กรุณาระบุจำนวนที่เพิ่มเข้าสต๊อก" }, { status: 400 });

  const source = await prisma.ctmProduct.findUnique({ where: { id: sourceProductId } });
  if (!source) return NextResponse.json({ error: "ไม่พบสินค้าต้นทาง" }, { status: 404 });
  const consume = Number(consumeQty);
  if (source.stock < consume) return NextResponse.json({ error: `สต๊อกต้นทางไม่พอ (คงเหลือ ${source.stock})` }, { status: 400 });

  let target;
  if (targetMode === "EXISTING") {
    if (!targetProductId) return NextResponse.json({ error: "กรุณาเลือกสินค้าปลายทาง" }, { status: 400 });
    if (targetProductId === sourceProductId) return NextResponse.json({ error: "สินค้าต้นทางและปลายทางต้องไม่ใช่สินค้าเดียวกัน" }, { status: 400 });
    const existing = await prisma.ctmProduct.findUnique({ where: { id: targetProductId } });
    if (!existing) return NextResponse.json({ error: "ไม่พบสินค้าปลายทาง" }, { status: 404 });
    target = await prisma.ctmProduct.update({ where: { id: targetProductId }, data: { stock: { increment: addQty } } });
  } else {
    if (!newName?.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อสินค้าใหม่" }, { status: 400 });
    if (!newSellPrice) return NextResponse.json({ error: "กรุณากรอกราคาขายใหม่" }, { status: 400 });
    if (!newUnit?.trim()) return NextResponse.json({ error: "กรุณากรอกหน่วยนับใหม่" }, { status: 400 });

    const allCodes = await prisma.ctmProduct.findMany({ where: { productCode: { not: null } }, select: { productCode: true } });
    let maxNum = 0;
    for (const p of allCodes) {
      const m = p.productCode?.match(/^CTM(\d+)$/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
    }
    const productCode = `CTM${String(maxNum + 1).padStart(4, "0")}`;
    const unitCost = Math.round((Number(source.buyPrice) * consume / addQty) * 100) / 100;

    target = await prisma.ctmProduct.create({
      data: {
        productCode, name: newName.trim(), unit: newUnit.trim(),
        buyPrice: unitCost, sellPrice: Number(newSellPrice), stock: addQty,
        category: source.category || null, supplierId: source.supplierId || null,
      },
    });
  }

  await prisma.ctmProduct.update({ where: { id: sourceProductId }, data: { stock: { decrement: consume } } });
  await prisma.ctmStockLog.create({
    data: { id: crypto.randomBytes(12).toString("hex"), productId: sourceProductId, delta: -consume, note: `แปลงเป็น "${target.name}"` },
  }).catch(() => {});
  await prisma.ctmStockLog.create({
    data: { id: crypto.randomBytes(12).toString("hex"), productId: target.id, delta: addQty, note: `แปลงจาก "${source.name}"` },
  }).catch(() => {});

  return NextResponse.json({ ok: true, source: sourceProductId, target });
}
