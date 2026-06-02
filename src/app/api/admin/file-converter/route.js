import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const SIZE_PRESETS = {
  android: [48, 72, 96, 144, 192, 512],
  ios: [60, 76, 120, 152, 167, 180, 1024],
};

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function safeBaseName(originalName) {
  const stem = originalName.replace(/\.[^.]+$/, "");
  return stem.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export async function POST(req) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const platformRaw = String(form.get("platform") || "").toLowerCase();
  const sizes = SIZE_PRESETS[platformRaw];

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!sizes) {
    return NextResponse.json({ error: "Invalid platform. Use android or ios" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, WEBP are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 10MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const now = Date.now();
  const base = safeBaseName(file.name);
  const sourceFileName = `${now}-${base}.png`;
  const publicRoot = path.join(process.cwd(), "public", "uploads", "file-converter");
  const beforeDir = path.join(publicRoot, "before");
  const afterDir = path.join(publicRoot, "after");

  await mkdir(beforeDir, { recursive: true });
  await mkdir(afterDir, { recursive: true });

  const normalizedSource = await sharp(bytes).png().toBuffer();
  await writeFile(path.join(beforeDir, sourceFileName), normalizedSource);

  let job;
  try {
    job = await prisma.fileConversionJob.create({
      data: {
        platform: platformRaw === "android" ? "ANDROID" : "IOS",
        sourceName: file.name,
        sourcePath: `/uploads/file-converter/before/${sourceFileName}`,
        sourceMime: "image/png",
        sourceSize: normalizedSource.length,
        createdById: session.user.id || null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Database error: ${err?.message || "cannot create conversion job"}` },
      { status: 500 }
    );
  }

  try {
    const results = [];
    for (const size of sizes) {
      const outputFile = `${now}-${base}-${platformRaw}-${size}.png`;
      const outputBuffer = await sharp(bytes)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      await writeFile(path.join(afterDir, outputFile), outputBuffer);
      results.push({
        jobId: job.id,
        fileName: outputFile,
        filePath: `/uploads/file-converter/after/${outputFile}`,
        mimeType: "image/png",
        fileSize: outputBuffer.length,
        width: size,
        height: size,
        target: "APP_ICON",
      });
    }

    await prisma.fileConversionResult.createMany({ data: results });
    const created = await prisma.fileConversionResult.findMany({
      where: { jobId: job.id },
      orderBy: { width: "asc" },
      select: {
        fileName: true,
        filePath: true,
        fileSize: true,
        width: true,
        height: true,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      platform: platformRaw,
      source: job.sourcePath,
      files: created,
    });
  } catch (err) {
    await prisma.fileConversionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: err?.message || "conversion failed",
      },
    });
    return NextResponse.json({ error: err?.message || "Conversion failed" }, { status: 500 });
  }
}
