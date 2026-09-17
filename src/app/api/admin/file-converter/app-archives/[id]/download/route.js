import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

export async function GET(req, { params }) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const record = await prisma.fileAppArchiveRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = String(record.filePath || "");
  if (!filePath.startsWith("/uploads/file-converter/bundles/")) {
    return NextResponse.json({ error: "Invalid stored file path" }, { status: 400 });
  }

  // Let the platform serve the static asset. Reading the file here makes
  // Next.js trace the entire public/uploads tree into this Function bundle.
  return NextResponse.redirect(new URL(filePath, req.url));
}
