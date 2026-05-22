import { getPrisma } from "@/lib/prisma";
import { fallbackClients } from "@/lib/data";

/** Keep homepage client cards in sync when DB rows lag behind fallback/seed data. */
const CLIENT_CARD_OVERRIDES = {
  "green-retail-group": {
    thumbnail: "/uploads/logos/G-monitoring.png",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
  },
  "green-retail-energy": {
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
  },
};

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return Response.json({ clients: fallbackClients });
  }
  try {
    const rows = await prisma.client.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) {
      return Response.json({ clients: fallbackClients });
    }

    return Response.json({
      clients: rows.map((c) => {
        const patch = CLIENT_CARD_OVERRIDES[c.slug] || {};
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          status: c.status.toLowerCase().replace(/_/g, "-"),
          contact_email: patch.contact_email ?? c.contactEmail,
          contact_phone: patch.contact_phone ?? c.contactPhone,
          contact_fax: c.contactFax || null,
          system_url: c.systemUrl,
          thumbnail: patch.thumbnail ?? c.logoUrl,
        };
      }),
    });
  } catch {
    return Response.json({ clients: fallbackClients });
  }
}
