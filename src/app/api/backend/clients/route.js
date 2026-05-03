import prisma from "@/lib/prisma";
import { fallbackClients } from "@/lib/data";

export const dynamic = "force-dynamic";

const spFoodsCard = {
  id: "spfoods-static-card",
  name: "SP FOODS CO.,LTD",
  slug: "sp",
  description:
    "ส.ภาวิณีร์ อีสานฟู้ดส์\nผู้ผลิตและจำหน่าย นำเข้า-ส่งออก อาหารแปรรูป อาหารแช่แข็ง\n\nผู้ผลิตและจำหน่ายอาหารไทยแปรรูปที่ได้มาตรฐานเจ้าเดียวในเกาหลี ครบวงจรด้านอุตสาหกรรมอาหาร ผสมผสานเทคโนโลยีร่วมกับอุตสาหกรรมอาหารและการเกษตร เพื่อผลิตอาหารแปรรูปที่มีคุณภาพและได้มาตรฐานสากล โดยมีการควบคุมคุณภาพอย่างเข้มงวดในทุกขั้นตอนการผลิต ตั้งแต่การเลือกวัตถุดิบ การผลิต การบรรจุ และการจัดส่ง เพื่อให้ลูกค้าได้รับสินค้าที่ดีที่สุดและปลอดภัยที่สุด นอกจากนี้ยังมีการพัฒนาผลิตภัณฑ์ใหม่ๆ อย่างต่อเนื่องเพื่อตอบสนองความต้องการของตลาดและผู้บริโภคในยุคปัจจุบัน",
  status: "online",
  contact_email: "goeunserverhub@gmail.com",
  contact_phone: "+66 095-241-1833",
  system_url: "https://spfoodskorea.com/",
  thumbnail: "/sp/main-Photo.jpg",
};

function isSpFoodsCard(client) {
  const name = String(client?.name || "").toLowerCase();
  const slug = String(client?.slug || "").toLowerCase();
  const systemUrl = String(client?.system_url || "").toLowerCase();
  return (
    slug === "sp" ||
    slug === "spfoods" ||
    name.includes("sp foods") ||
    systemUrl === "/sp" ||
    systemUrl.endsWith("/sp") ||
    systemUrl.includes("spfoodskorea.com")
  );
}

function normalizeSpFoodsCard(client = {}) {
  return {
    ...spFoodsCard,
    ...client,
    id: client.id || spFoodsCard.id,
    name: "SP FOODS CO.,LTD",
    slug: "sp",
    description: spFoodsCard.description,
    contact_email: spFoodsCard.contact_email,
    contact_phone: spFoodsCard.contact_phone,
    system_url: "https://spfoodskorea.com/",
    thumbnail: "/sp/main-Photo.jpg",
  };
}

export async function GET() {
  try {
    const rows = await prisma.client.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) {
      const hasSpFoods = fallbackClients.some(isSpFoodsCard);
      return Response.json({
        clients: hasSpFoods ? fallbackClients : [spFoodsCard, ...fallbackClients],
      });
    }

    const mapped = rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        status: c.status.toLowerCase().replace(/_/g, "-"),
        contact_email: c.contactEmail,
        contact_phone: c.contactPhone,
        system_url: c.systemUrl,
        thumbnail: c.logoUrl,
      }));

    const withSpEnriched = mapped.map((client) =>
      isSpFoodsCard(client) ? normalizeSpFoodsCard(client) : client
    );

    const hasSpFoods = withSpEnriched.some(isSpFoodsCard);

    return Response.json({
      clients: hasSpFoods
        ? withSpEnriched
        : [spFoodsCard, ...withSpEnriched],
    });
  } catch {
    const hasSpFoods = fallbackClients.some(isSpFoodsCard);
    return Response.json({
      clients: hasSpFoods ? fallbackClients : [spFoodsCard, ...fallbackClients],
    });
  }
}
