import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function isAdmin(s) { return s?.user?.role === "ADMIN" || s?.user?.role === "SUPER_ADMIN"; }

export async function POST(req) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "ctm-packing");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return NextResponse.json({ url: `/api/uploads/ctm-packing/${filename}` });
}
