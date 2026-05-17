import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { readFileSync } from "fs";

// Load .env.local — strip surrounding quotes from values
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Phase 2: sync DB with live site data
const updates = [
  // green-retail-group: update contact to real address
  {
    slug: "green-retail-group",
    data: {
      contactEmail: "goeunserverhub@gmail.com",
      contactPhone: "010-8105-0384",
    },
  },
  // cargo: fix slug from auto-generated to clean slug + update name
  {
    slug: "cargo-th-kr-1778401116473",
    data: {
      slug: "cargo",
      name: "คาโก้ ไทย-เกาหลี",
      contactEmail: "goeunserverhub@gmail.com",
      contactPhone: "+66 095-241-1833",
      logoUrl: "/uploads/logos/cargo.jpg",
      systemUrl: "/cargo/track",
    },
  },
  // sp-food: fix slug to spfoods + update name and description
  {
    slug: "sp-food",
    data: {
      slug: "spfoods",
      name: "SP Foods Co.,Ltd.",
      description:
        "ส.ภาวิณีร์ อีสานฟู้ดส์ ผู้ผลิตและจำหน่าย นำเข้า-ส่งออก อาหารแปรรูป อาหารแช่แข็ง ผู้ผลิตและจำหน่ายอาหารไทยแปรรูปที่ได้มาตรฐานเจ้าเดียวในเกาหลี ครบวงจรด้านอุตสาหกรรมอาหาร ผสมผสานเทคโนโลยีร่วมกับอุตสาหกรรมอาหารและการเกษตร เพื่อผลิตอาหารแปรรูปที่มีคุณภาพและได้มาตรฐานสากล",
      systemUrl: "https://spfoodskorea.com/",
    },
  },
];

// green-retail-energy: add to DB if missing
const upserts = [
  {
    where: { slug: "green-retail-energy" },
    create: {
      name: "Green Retail Group",
      slug: "green-retail-energy",
      description: "ระบบมอนิเตอริ่งพลังงานไฟฟ้า",
      status: "ONLINE",
      contactEmail: "goeunserverhub@gmail.com",
      contactPhone: "010-8105-0384",
      logoUrl: "/uploads/logos/G-monitoring.png",
      systemUrl: "/energy-dashboard-login",
    },
    update: {
      contactEmail: "goeunserverhub@gmail.com",
      contactPhone: "010-8105-0384",
    },
  },
];

async function main() {
  let ok = 0;
  let skip = 0;

  for (const { slug, data } of updates) {
    const existing = await prisma.client.findUnique({ where: { slug } });
    if (!existing) {
      console.log(`⚠️  ไม่พบ: ${slug}`);
      skip++;
      continue;
    }
    await prisma.client.update({ where: { slug }, data });
    console.log(`✅ อัพเดต: ${slug}`);
    ok++;
  }

  for (const { where, create, update } of upserts) {
    await prisma.client.upsert({ where, create, update });
    console.log(`✅ upsert: ${where.slug}`);
    ok++;
  }

  console.log(`\nสำเร็จ ${ok} รายการ, ข้าม ${skip} รายการ`);
}

main()
  .catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
