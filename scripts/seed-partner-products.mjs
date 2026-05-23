/**
 * Seed PartnerProduct rows for /momoge-product and partner dashboard.
 * Run: node scripts/seed-partner-products.mjs
 */
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

const SAMPLE_PRODUCTS = [
  {
    name: 'AI Smart Energy Monitor (Basic)',
    model: 'SEM-B100',
    brand: 'MOMOGE SPACE',
    costPrice: 89000,
    sellPrice: 129000,
    currency: 'KRW',
    imageUrls: ['/momoge/Logo-brand.png'],
  },
  {
    name: 'Current Sensor Module 100A',
    model: 'CSM-100A',
    brand: 'MOMOGE SPACE',
    costPrice: 45000,
    sellPrice: 69000,
    currency: 'KRW',
    imageUrls: [],
  },
  {
    name: '3-Phase Power Logger',
    model: 'PL-3P200',
    brand: 'GE SERVER HUB',
    costPrice: 180000,
    sellPrice: 249000,
    currency: 'KRW',
    imageUrls: [],
  },
  {
    name: 'Cloud Dashboard Annual Plan',
    model: 'CD-12M',
    brand: 'MOMOGE SPACE',
    costPrice: 120000,
    sellPrice: 198000,
    currency: 'KRW',
    imageUrls: [],
  },
  {
    name: 'Installation & Commissioning',
    model: 'SVC-INST',
    brand: 'GE SERVER HUB',
    costPrice: 150000,
    sellPrice: 220000,
    currency: 'KRW',
    imageUrls: [],
  },
];

async function main() {
  const existing = await prisma.partnerProduct.count();
  if (existing > 0) {
    console.log(`PartnerProduct already has ${existing} row(s). Skipping seed.`);
    console.log('To re-seed, delete rows first or set FORCE_SEED_PARTNER=1');
    if (process.env.FORCE_SEED_PARTNER !== '1') return;
  }

  const client =
    (await prisma.client.findUnique({ where: { slug: 'goeun-server-hub' } })) ||
    (await prisma.client.findFirst({ orderBy: { createdAt: 'asc' } }));

  const clientId = client?.id ?? null;
  if (client) console.log('Linking products to client:', client.name);

  for (const p of SAMPLE_PRODUCTS) {
    await prisma.partnerProduct.create({
      data: {
        name: p.name,
        model: p.model,
        brand: p.brand,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        currency: p.currency,
        imageUrls: p.imageUrls?.length ? JSON.stringify(p.imageUrls) : null,
        clientId,
      },
    });
    console.log('  +', p.name);
  }

  const total = await prisma.partnerProduct.count();
  console.log(`\nDone. PartnerProduct rows: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
