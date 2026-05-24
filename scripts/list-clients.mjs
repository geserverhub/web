import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();
const clients = await prisma.client.findMany({
  select: { name: true, slug: true, status: true },
});
console.table(clients);
await prisma.$disconnect();
