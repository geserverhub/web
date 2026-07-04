import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function GET(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const shares = await prisma.ctmPartnerShare.findMany({
    where: period ? { period } : {},
    orderBy: [{ period: "desc" }, { partnerName: "asc" }],
  });
  return NextResponse.json({ shares });
}

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { period, partnerName, sharePercent, netProfit, deductionAmount, deductionNote, note } = await req.json();
  if (!period || !partnerName || !sharePercent || netProfit === undefined) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  const baseShare = Number(netProfit) * (Number(sharePercent) / 100);
  const deduction = Number(deductionAmount) || 0;
  const shareAmount = baseShare - deduction;
  const share = await prisma.ctmPartnerShare.create({
    data: { id: require("crypto").randomBytes(12).toString("hex"), period, partnerName, sharePercent: Number(sharePercent), netProfit: Number(netProfit), shareAmount, deductionAmount: deduction, deductionNote: deductionNote || null, note: note || null },
  });
  return NextResponse.json(share, { status: 201 });
}

export async function DELETE(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  await prisma.ctmPartnerShare.delete({ where: { id: searchParams.get("id") } });
  return NextResponse.json({ ok: true });
}
