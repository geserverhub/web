import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function isPartnerOrAdmin(session) {
  const role = session?.user?.role;
  return role === "PARTNER" || role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function POST(req) {
  const session = await auth();
  if (!isPartnerOrAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "รองรับเฉพาะ PDF และรูปภาพ" }, { status: 400 });
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "partner-receipts");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ path: `/uploads/partner-receipts/${safeName}` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
