import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "mct-market-categories.json");

function canManage(session) {
  return !!session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

async function readCategories() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeCategories(categories) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(categories, null, 2) + "\n", "utf8");
}

export async function GET() {
  const categories = await readCategories();
  return NextResponse.json({ categories });
}

export async function POST(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body?.name || "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อหมวดสินค้า" }, { status: 400 });

  const current = await readCategories();
  const next = Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b));
  await writeCategories(next);

  return NextResponse.json({ ok: true, categories: next });
}

export async function DELETE(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = String(searchParams.get("name") || "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อหมวดสินค้า" }, { status: 400 });

  const current = await readCategories();
  const next = current.filter((c) => c !== name);
  await writeCategories(next);

  return NextResponse.json({ ok: true, categories: next });
}
