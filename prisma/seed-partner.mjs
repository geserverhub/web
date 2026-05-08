import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "partner";
  const password = "Partner2026";
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: "PARTNER", name: "Partner User" },
    create: { email, password: hashed, role: "PARTNER", name: "Partner User" },
  });

  console.log("✅ PARTNER user ready:", user.email, "role:", user.role);
  console.log("   Login: partner / Partner2026");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
