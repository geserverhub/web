import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

function getScope(session) {
  const role = session?.user?.role;
  const clientId = session?.user?.clientId || null;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isClient = role === "CLIENT";
  return { isAdmin, isClient, clientId };
}

export async function POST(req, { params }) {
  const session = await auth();
  const scope = getScope(session);
  if (!scope.isAdmin && !scope.isClient) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productList = await prisma.mGroupOrder.findUnique({ where: { id }, select: { id: true, clientId: true, status: true } });
    if (!productList) return NextResponse.json({ error: "Product list not found" }, { status: 404 });
    if (scope.isClient && productList.clientId !== scope.clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: JPG, PNG, WEBP, GIF" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
    }

    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeName = `mpl-slip-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));

    const paymentSlipUrl = `/uploads/receipts/${safeName}`;

    const updated = await prisma.mGroupOrder.update({
      where: { id },
      data: {
        paymentSlipUrl,
        slipName: file.name || safeName,
        status: productList.status === "PENDING_PAYMENT" ? "CONFIRMING" : productList.status,
        paidAt: productList.status === "PENDING_PAYMENT" ? new Date() : undefined,
      },
      include: { items: true, client: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ productList: updated, paymentSlipUrl });
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Failed to upload payment slip" }, { status: 500 });
  }
}
