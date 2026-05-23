import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { name: true, username: true, email: true, role: true },
  orderBy: { role: 'asc' },
});
console.table(users);
await prisma.$disconnect();
