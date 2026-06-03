import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  getFileExtension,
  isAllowedBundle,
  isAndroidAppArchive,
  platformToEnum,
} from "@/lib/mobile-file-converter";
import { hashMetaForBuffer } from "@/lib/file-hash";

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function safeBaseName(originalName) {
  const stem = originalName.replace(/\.[^.]+$/, "");
  return stem.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export async function GET(req) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  try {
    const records = await prisma.fileAppArchiveRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Cannot load app archive records" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const bundleFile = form.get("bundle");
  const platformRaw = String(form.get("platform") || "android").toLowerCase();

  if (!bundleFile || typeof bundleFile === "string") {
    return NextResponse.json({ error: "No app archive uploaded" }, { status: 400 });
  }

  const check = isAllowedBundle(platformRaw, bundleFile.name, bundleFile.type, bundleFile.size);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const bytes = Buffer.from(await bundleFile.arrayBuffer());
  const now = Date.now();
  const base = safeBaseName(bundleFile.name);
  const storedName = `${now}-${base}${check.ext}`;
  const bundleDir = path.join(process.cwd(), "public", "uploads", "file-converter", "bundles");
  await mkdir(bundleDir, { recursive: true });
  await writeFile(path.join(bundleDir, storedName), bytes);

  const filePath = `/uploads/file-converter/bundles/${storedName}`;
  const { sha1: fileSha1, signingSha1, packageName } = hashMetaForBuffer(bytes, {
    isAndroidSigningArchive: platformRaw === "android" && isAndroidAppArchive(check.ext),
  });

  try {
    const record = await prisma.fileAppArchiveRecord.create({
      data: {
        platform: platformToEnum(platformRaw),
        fileName: bundleFile.name,
        filePath,
        fileMime: bundleFile.type || "application/octet-stream",
        fileSize: bytes.length,
        fileExtension: check.ext,
        fileSha1,
        signingSha1,
        packageName,
        createdById: session.user.id || null,
      },
    });

    return NextResponse.json({ record });
  } catch (err) {
    const msg = err?.message || "";
    if (err?.code === "P2021" || msg.includes("FileAppArchiveRecord") && msg.includes("does not exist")) {
      return NextResponse.json(
        {
          error:
            "ตาราง FileAppArchiveRecord ยังไม่มีในฐานข้อมูล — รันบนเซิร์ฟเวอร์: npm run db:migrate-file-converter",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: `Database error: ${msg || "cannot save app archive record"}` },
      { status: 500 }
    );
  }
}
