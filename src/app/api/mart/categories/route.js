import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "mart-categories.json");

function canManage(session) {
  return !!session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

async function readFileCategories() {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

async function writeFileCategories(categories) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(categories, null, 2) + "\n", "utf8");
}

export async function GET() {
  const [fromFile, fromProducts] = await Promise.all([
    readFileCategories(),
    prisma.product.findMany({ select: { category: true }, distinct: ["category"] }),
  ]);

  const merged = Array.from(
    new Set([
      ...fromFile,
      ...fromProducts.map((p) => String(p.category || "").trim()).filter(Boolean),
    ])
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ categories: merged });
}

export async function POST(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body?.name || "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อหมวดสินค้า" }, { status: 400 });

  const current = await readFileCategories();
  const next = Array.from(new Set([...current, name])).sort((a, b) => a.localeCompare(b));
  await writeFileCategories(next);

  return NextResponse.json({ ok: true, categories: next });
}

export async function DELETE(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = String(searchParams.get("name") || "").trim().toLowerCase();
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อหมวดสินค้า" }, { status: 400 });

  const usedCount = await prisma.product.count({ where: { category: name } });
  if (usedCount > 0) {
    return NextResponse.json({ error: "หมวดนี้ยังมีสินค้าอยู่ ไม่สามารถลบได้" }, { status: 409 });
  }

  const current = await readFileCategories();
  const next = current.filter((c) => c !== name);
  await writeFileCategories(next);

  return NextResponse.json({ ok: true, categories: next });
}
