import { getPrisma } from "@/lib/prisma";
import { fallbackClients, resolveClientPortalUrl } from "@/lib/data";

/** Keep homepage client cards in sync when DB rows lag behind fallback/seed data. */
const CLIENT_CARD_OVERRIDES = {
  "green-retail-group": {
    thumbnail: "/momoge/momoge-space.jpg",
    thumbnail_fit: "contain",
    thumbnail_style: "photo",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    system_url: "/energy-dashboard-login",
  },
  "green-retail-energy": {
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    system_url: "/energy-dashboard-login",
  },
  "m-group": {
    system_url: "/m-group",
  },
  "m-factory": {
    system_url: "https://m-factoryandresort.com/",
  },
  "momoge-space-product": {
    thumbnail: "/momoge/Logo-brand.png",
    thumbnail_fit: "contain",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
  },
  "online-classroom": {
    thumbnail: "/classroom/137806.jpg",
    contact_email: "goeunserverhub@gmail.com",
    contact_phone: "010-8105-0384",
    system_url: "https://strong-dory-enabled.ngrok-free.app/online-classroom-login",
  },
  "acc-tax": {
    thumbnail: "/ACC/134076.jpg",
    thumbnail_fit: "contain",
    thumbnail_style: "photo",
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
        const row = {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          status: c.status.toLowerCase().replace(/_/g, "-"),
          contact_email: patch.contact_email ?? c.contactEmail,
          contact_phone: patch.contact_phone ?? c.contactPhone,
          contact_fax: c.contactFax || null,
          system_url: patch.system_url ?? c.systemUrl,
          thumbnail: patch.thumbnail ?? c.logoUrl,
          thumbnail_fit: patch.thumbnail_fit ?? null,
          thumbnail_style: patch.thumbnail_style ?? null,
        };
        return {
          ...row,
          system_url: resolveClientPortalUrl(row),
        };
      }),
    });
  } catch {
    return Response.json({ clients: fallbackClients });
  }
}
