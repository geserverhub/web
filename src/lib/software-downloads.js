import path from "path";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { publicHubBaseUrl } from "@/lib/data";
import { getProductLoginPath, getSoftwareProduct } from "@/lib/software-downloads-catalog";

export const SOFTWARE_STORAGE_ROOT = path.join(process.cwd(), "storage", "software-downloads");

export function resolveCheckoutOrigin(req) {
  const hub = process.env.NEXT_PUBLIC_PUBLIC_HUB_URL || publicHubBaseUrl;
  if (hub) return String(hub).replace(/\/$/, "");
  const origin = req?.headers?.get?.("origin");
  if (origin) return origin;
  if (req?.url) {
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
  }
  return publicHubBaseUrl.replace(/\/$/, "");
}

export function generateOrderCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function generateAccessPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export async function ensureOrderAccessPassword(prisma, order) {
  if (!order || order.accessPassword) return order;
  const accessPassword = generateAccessPassword();
  return prisma.softwareDownloadOrder.update({
    where: { id: order.id },
    data: { accessPassword },
  });
}

export function resolveProductFilePath(product) {
  const rel = String(product?.filePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!rel || rel.includes("..")) return null;
  const abs = path.resolve(SOFTWARE_STORAGE_ROOT, rel);
  const root = path.resolve(SOFTWARE_STORAGE_ROOT);
  if (!abs.startsWith(root)) return null;
  return abs;
}

export function isOrderPaid(order) {
  return order?.status === "PAID";
}

export function canDownloadOrder(order, product) {
  if (!order || !product) return false;
  if (!isOrderPaid(order)) return false;
  return order.productSlug === product.slug;
}

export function isFreeSoftwareProduct(product) {
  return Boolean(product && (product.free || Number(product.price) <= 0));
}

export async function buildProductFileResponse(product) {
  const filePath = resolveProductFilePath(product);
  if (!filePath) {
    return { error: "ไฟล์ไม่ถูกต้อง", status: 500 };
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return { error: "ไฟล์ยังไม่พร้อมบนเซิร์ฟเวอร์ — ติดต่อผู้ดูแลระบบ", status: 404 };
  }

  if (!fileStat.isFile()) {
    return { error: "ไม่พบไฟล์ดาวน์โหลด", status: 404 };
  }

  const ext = path.extname(product.fileName || filePath).toLowerCase();
  const mime =
    ext === ".apk"
      ? "application/vnd.android.package-archive"
      : ext === ".zip"
        ? "application/zip"
        : ext === ".pdf"
          ? "application/pdf"
          : "application/octet-stream";

  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream);

  return {
    response: new Response(webStream, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(fileStat.size),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(product.fileName || "download")}"`,
        "Cache-Control": "private, no-store",
      },
    }),
  };
}

export function orderToPublicJson(order, { includeDownload = false, includeAccess = false } = {}) {
  if (!order) return null;
  const product = getSoftwareProduct(order.productSlug);
  const paid = isOrderPaid(order);
  const loginPath = getProductLoginPath(order.productSlug);
  const result = {
    orderCode: order.orderCode,
    email: order.email,
    productSlug: order.productSlug,
    productTitle: order.productTitle,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
    paid,
    paidAt: order.paidAt,
    downloadCount: order.downloadCount,
    canDownload: includeDownload && paid && Boolean(product),
    product: product
      ? {
          slug: product.slug,
          fileName: product.fileName,
          platform: product.platform,
          version: product.version,
        }
      : null,
  };

  if (includeAccess && paid) {
    result.loginPath = loginPath;
    result.accessPassword = order.accessPassword || null;
  }

  return result;
}
