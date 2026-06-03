import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function storedFileAbsolutePath(filePath) {
  const rel = String(filePath || "").replace(/^\/+/, "");
  if (!rel.startsWith("uploads/file-converter/bundles/")) {
    return null;
  }
  return path.join(process.cwd(), "public", rel);
}

export async function GET(_req, { params }) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const record = await prisma.fileAppArchiveRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absPath = storedFileAbsolutePath(record.filePath);
  if (!absPath) {
    return NextResponse.json({ error: "Invalid stored file path" }, { status: 400 });
  }

  try {
    const buffer = await readFile(absPath);
    const safeName = record.fileName.replace(/[^\w.\-()+ ]+/g, "_") || "app-archive";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": record.fileMime || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(record.fileName)}`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์บนเซิร์ฟเวอร์" }, { status: 404 });
  }
}
