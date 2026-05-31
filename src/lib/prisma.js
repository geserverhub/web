import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/**
 * Lazy Prisma init — avoids crashing API routes at import time when client is missing.
 */
function createPrismaClient() {
  return new PrismaClient();
}

/** Drop cached client when schema was regenerated (new models missing on old instance). */
function isStalePrismaClient(client) {
  if (!client) return true;
  return Boolean(client.partnerProduct) && !client.partnerProductCategory;
}

export function getPrisma() {
  if (globalForPrisma.prisma && !isStalePrismaClient(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect();
    } catch {
      /* ignore */
    }
    globalForPrisma.prisma = undefined;
  }
  try {
    globalForPrisma.prisma = createPrismaClient();
    return globalForPrisma.prisma;
  } catch (err) {
    console.error("[prisma] init failed:", err?.message || err);
    return null;
  }
}

const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "then") return undefined;
      const client = getPrisma();
      if (!client) {
        throw new Error("Prisma client unavailable. Run: npx prisma generate");
      }
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

export default prisma;
