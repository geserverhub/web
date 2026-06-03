import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

function ensureAdmin(session) {
  return session?.user && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

export async function GET(req) {
  const session = await auth();
  if (!ensureAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

  try {
    const jobs = await prisma.fileConversionJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        results: {
          orderBy: [{ target: "asc" }, { width: "asc" }],
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileExtension: true,
            fileSize: true,
            sha1: true,
            signingSha1: true,
            width: true,
            height: true,
            target: true,
            usageNote: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        platform: job.platform,
        status: job.status,
        sourceName: job.sourceName,
        sourcePath: job.sourcePath,
        sourceExtension: job.sourceExtension,
        sourceSha1: job.sourceSha1,
        bundleName: job.bundleName,
        bundlePath: job.bundlePath,
        bundleExtension: job.bundleExtension,
        bundleSize: job.bundleSize,
        bundleSha1: job.bundleSha1,
        bundleSigningSha1: job.bundleSigningSha1,
        createdAt: job.createdAt,
        files: job.results,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Cannot load conversion history" },
      { status: 500 }
    );
  }
}
