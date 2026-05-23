import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const desired = [
  {
    slug: "m-group",
    name: "M-Group",
    description:
      '"ดูแล ใส่ใจ เกษตรไทย ครบวงจร" บริการสินค้าด้านการเกษตร ในราคาปลีก-ส่ง ด้วยสินค้าหลากหลายมากกว่า 10,000 รายการ',
    status: "ONLINE",
    contactEmail: "sale@m-group.in.th",
    contactPhone: "089-4871144",
    contactFax: "034-878369, 034-848022",
    logoUrl: "/m-group-building.jpg",
    systemUrl: "https://strong-dory-enabled.ngrok-free.app/m-group",
    sortOrder: 1,
  },
  {
    slug: "green-retail-group",
    name: "Green Retail Group",
    description: "ระบบมอนิเตอริ่ง ผู้ใช้ Demo",
    status: "ONLINE",
    contactEmail: "goeunserverhub@gmail.com",
    contactPhone: "010-8105-0384",
    contactFax: null,
    logoUrl: "/uploads/logos/G-monitoring.png",
    systemUrl: "/energy-dashboard-login",
    sortOrder: 2,
  },
  {
    slug: "m-factory",
    name: "M-Factory",
    description: "ขาย-ให้เช่าโกดัง โรงงาน พร้อมบริการที่พัก รีสอร์ทส่วนตัว",
    status: "ONLINE",
    contactEmail: "m.factoryandresort@gmail.com",
    contactPhone: "+66 095-241-1833",
    contactFax: null,
    logoUrl: "/m-factory/LINE_ALBUM_12369_260417_1.jpg",
    systemUrl: "https://m-factoryandresort.com",
    sortOrder: 3,
  },
  {
    slug: "m-retsort",
    name: "M-Resort",
    description: "เอ็มรีสอร์ท บริการที่พัก บรรยากาศส่วนตัว",
    status: "ONLINE",
    contactEmail: "mukhngamnuch@gmail.com",
    contactPhone: "095-241-1833",
    contactFax: null,
    logoUrl: "/uploads/logos/1776692894976-ecji3u.jpg",
    systemUrl: "https://m-factoryandresort.com/",
    sortOrder: 4,
  },
  {
    slug: "cargo",
    name: "คาโก้ ไทย-เกาหลี",
    description:
      "บริการส่งสินค้าทางเครื่องบิน ไทย ↔ เกาหลี ปลอดภัย รวดเร็ว พร้อมติดตามสถานะออนไลน์",
    status: "ONLINE",
    contactEmail: "goeunserverhub@gmail.com",
    contactPhone: "+66 095-241-1833",
    contactFax: null,
    logoUrl: "/uploads/logos/cargo.jpg",
    systemUrl: "/cargo/track",
    sortOrder: 5,
  },
  {
    slug: "green-retail-energy",
    name: "Green Retail Group",
    description: "ระบบมอนิเตอริ่งพลังงานไฟฟ้า",
    status: "ONLINE",
    contactEmail: "goeunserverhub@gmail.com",
    contactPhone: "010-8105-0384",
    contactFax: null,
    logoUrl: "/uploads/logos/G-monitoring.png",
    systemUrl: "/momoge-product",
    sortOrder: 6,
  },
];

export async function GET() {
  const log = [];

  try {
    // Add contactFax column if not exists
    try {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE Client ADD COLUMN contactFax VARCHAR(191) NULL AFTER contactPhone"
      );
      log.push("Added contactFax column");
    } catch (e) {
      if (e.message.includes("Duplicate column") || e.message.includes("already exists")) {
        log.push("contactFax column already exists");
      } else {
        log.push(`ALTER error: ${e.message}`);
      }
    }

    // Delete goeun-server-hub
    const deleted = await prisma.client.deleteMany({
      where: { slug: "goeun-server-hub" },
    });
    log.push(`Deleted ${deleted.count} goeun-server-hub record(s)`);

    // Upsert desired clients
    const baseDate = new Date("2026-01-01T00:00:00Z");
    for (const c of desired) {
      const createdAt = new Date(baseDate.getTime() + c.sortOrder * 3600 * 1000);
      const { sortOrder, ...data } = c;
      await prisma.client.upsert({
        where: { slug: c.slug },
        update: { ...data, createdAt },
        create: { ...data, createdAt },
      });
      log.push(`Upserted: ${c.slug}`);
    }

    // Verify
    const result = await prisma.client.findMany({
      orderBy: { createdAt: "asc" },
      select: { name: true, slug: true, contactFax: true },
    });

    return Response.json({ success: true, log, clients: result });
  } catch (e) {
    return Response.json({ success: false, error: e.message, log }, { status: 500 });
  }
}
