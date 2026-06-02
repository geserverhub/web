import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  BUNDLE_ACCEPT,
  ICON_SIZE_PRESETS,
  SOURCE_IMAGE_ACCEPT,
  getFileExtension,
  isAllowedBundle,
  listingIconSize,
  platformToEnum,
  storeExtensionsForPlatform,
} from "@/lib/mobile-file-converter";
import { hashMetaForBuffer, sha1Formatted } from "@/lib/file-hash";

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

function safeBaseName(originalName) {
  const stem = originalName.replace(/\.[^.]+$/, "");
  return stem.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export async function GET() {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    platforms: {
      android: {
        iconSizes: ICON_SIZE_PRESETS.android,
        bundle: BUNDLE_ACCEPT.android,
        storeUploadExtensions: storeExtensionsForPlatform("android"),
      },
      ios: {
        iconSizes: ICON_SIZE_PRESETS.ios,
        bundle: BUNDLE_ACCEPT.ios,
        storeUploadExtensions: storeExtensionsForPlatform("ios"),
      },
    },
  });
}

export async function POST(req) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const bundleFile = form.get("bundle");
  const platformRaw = String(form.get("platform") || "").toLowerCase();
  const sizes = ICON_SIZE_PRESETS[platformRaw];
  const storeExts = storeExtensionsForPlatform(platformRaw);

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No source image uploaded" }, { status: 400 });
  }

  if (!sizes) {
    return NextResponse.json({ error: "Invalid platform. Use android or ios" }, { status: 400 });
  }

  if (!SOURCE_IMAGE_ACCEPT.mimeTypes.includes(file.type)) {
    return NextResponse.json({ error: "Source image: only PNG, JPG, WEBP allowed" }, { status: 400 });
  }

  if (file.size > SOURCE_IMAGE_ACCEPT.maxBytes) {
    return NextResponse.json({ error: "Source image too large. Max 10MB" }, { status: 400 });
  }

  let bundleMeta = null;
  if (bundleFile && typeof bundleFile !== "string") {
    const check = isAllowedBundle(platformRaw, bundleFile.name, bundleFile.type, bundleFile.size);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    bundleMeta = {
      name: bundleFile.name,
      ext: check.ext,
      mime: bundleFile.type || "application/octet-stream",
      bytes: Buffer.from(await bundleFile.arrayBuffer()),
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sourceExt = getFileExtension(file.name) || ".png";
  const now = Date.now();
  const base = safeBaseName(file.name);
  const sourceFileName = `${now}-${base}.png`;
  const publicRoot = path.join(process.cwd(), "public", "uploads", "file-converter");
  const beforeDir = path.join(publicRoot, "before");
  const afterDir = path.join(publicRoot, "after");
  const bundleDir = path.join(publicRoot, "bundles");

  await mkdir(beforeDir, { recursive: true });
  await mkdir(afterDir, { recursive: true });
  await mkdir(bundleDir, { recursive: true });

  const normalizedSource = await sharp(bytes).png().toBuffer();
  const sourceSha1 = sha1Formatted(normalizedSource);
  await writeFile(path.join(beforeDir, sourceFileName), normalizedSource);

  let bundlePath = null;
  let bundleSize = null;
  let bundleSha1 = null;
  let bundleSigningSha1 = null;
  if (bundleMeta) {
    const bundleFileName = `${now}-${base}${bundleMeta.ext}`;
    await writeFile(path.join(bundleDir, bundleFileName), bundleMeta.bytes);
    bundlePath = `/uploads/file-converter/bundles/${bundleFileName}`;
    bundleSize = bundleMeta.bytes.length;
    const bundleHash = hashMetaForBuffer(bundleMeta.bytes, {
      isAndroidBundle: platformRaw === "android" && bundleMeta.ext === ".aab",
    });
    bundleSha1 = bundleHash.sha1;
    bundleSigningSha1 = bundleHash.signingSha1;
  }

  let job;
  try {
    job = await prisma.fileConversionJob.create({
      data: {
        platform: platformToEnum(platformRaw),
        sourceName: file.name,
        sourcePath: `/uploads/file-converter/before/${sourceFileName}`,
        sourceMime: "image/png",
        sourceSize: normalizedSource.length,
        sourceExtension: sourceExt,
        sourceSha1,
        bundleName: bundleMeta?.name || null,
        bundlePath,
        bundleMime: bundleMeta?.mime || null,
        bundleSize,
        bundleExtension: bundleMeta?.ext || null,
        bundleSha1,
        bundleSigningSha1,
        storeUploadExtensions: JSON.stringify(storeExts),
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
    const listingSize = listingIconSize(platformRaw);

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
      const fileSha1 = sha1Formatted(outputBuffer);
      results.push({
        jobId: job.id,
        fileName: outputFile,
        filePath: `/uploads/file-converter/after/${outputFile}`,
        mimeType: "image/png",
        fileExtension: ".png",
        sha1: fileSha1,
        signingSha1: null,
        fileSize: outputBuffer.length,
        width: size,
        height: size,
        target: size === listingSize ? "STORE_LISTING" : "APP_ICON",
        storeEligible: true,
        usageNote:
          size === listingSize
            ? platformRaw === "android"
              ? "Play Store listing icon 512×512 (.png)"
              : "App Store listing icon 1024×1024 (.png)"
            : `Launcher icon ${size}×${size} (.png)`,
      });
    }

    if (bundleMeta && bundlePath) {
      results.push({
        jobId: job.id,
        fileName: path.basename(bundlePath),
        filePath: bundlePath,
        mimeType: bundleMeta.mime,
        fileExtension: bundleMeta.ext,
        sha1: bundleSha1,
        signingSha1: bundleSigningSha1,
        fileSize: bundleSize,
        width: 0,
        height: 0,
        target: "APP_BUNDLE",
        storeEligible: true,
        usageNote:
          platformRaw === "android"
            ? "อัปโหลด .aab ใน Play Console → Release"
            : "อัปโหลด .ipa ผ่าน Transporter / App Store Connect",
      });
    }

    await prisma.fileConversionResult.createMany({ data: results });
    const created = await prisma.fileConversionResult.findMany({
      where: { jobId: job.id },
      orderBy: [{ target: "asc" }, { width: "asc" }],
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileExtension: true,
        sha1: true,
        signingSha1: true,
        width: true,
        height: true,
        target: true,
        storeEligible: true,
        usageNote: true,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      platform: platformRaw,
      source: job.sourcePath,
      sourceExtension: sourceExt,
      sourceSha1,
      bundle: bundlePath
        ? {
            name: bundleMeta.name,
            path: bundlePath,
            extension: bundleMeta.ext,
            size: bundleSize,
            sha1: bundleSha1,
            signingSha1: bundleSigningSha1,
          }
        : null,
      storeUploadExtensions: storeExts,
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
