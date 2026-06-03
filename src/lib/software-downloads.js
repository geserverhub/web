import path from "path";
import { publicHubBaseUrl } from "@/lib/data";
import { getSoftwareProduct } from "@/lib/software-downloads-catalog";

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

export function orderToPublicJson(order, { includeDownload = false } = {}) {
  if (!order) return null;
  const product = getSoftwareProduct(order.productSlug);
  return {
    orderCode: order.orderCode,
    email: order.email,
    productSlug: order.productSlug,
    productTitle: order.productTitle,
    amount: Number(order.amount),
    currency: order.currency,
    status: order.status,
    paid: isOrderPaid(order),
    paidAt: order.paidAt,
    downloadCount: order.downloadCount,
    canDownload: includeDownload && isOrderPaid(order) && Boolean(product),
    product: product
      ? {
          slug: product.slug,
          fileName: product.fileName,
          platform: product.platform,
          version: product.version,
        }
      : null,
  };
}
