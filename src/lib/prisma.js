import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/**
 * Lazy Prisma init — avoids crashing API routes at import time when client is missing.
 */
export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  try {
    globalForPrisma.prisma = new PrismaClient();
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
