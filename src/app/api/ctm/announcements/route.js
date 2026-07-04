import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

// Public GET — no auth needed
export async function GET() {
  const rows = await prisma.ctmAnnouncement.findMany();
  const map = {};
  rows.forEach(r => { map[r.lang] = r.text; });
  return NextResponse.json({ announcements: map });
}

export async function PUT(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { lang, text } = await req.json();
  if (!lang || !text) return NextResponse.json({ error: "lang and text required" }, { status: 400 });
  const existing = await prisma.ctmAnnouncement.findUnique({ where: { lang } });
  if (existing) {
    await prisma.ctmAnnouncement.update({ where: { lang }, data: { text } });
  } else {
    await prisma.ctmAnnouncement.create({ data: { id: require("crypto").randomBytes(12).toString("hex"), lang, text } });
  }
  return NextResponse.json({ ok: true });
}
