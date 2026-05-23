import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();
const q = process.argv[2];

const users = await prisma.user.findMany({
  where: q
    ? {
        OR: [
          { name: { contains: q } },
          { username: { contains: q } },
          { email: { contains: q } },
        ],
      }
    : { role: 'PARTNER' },
  select: { id: true, name: true, username: true, email: true, role: true, clientId: true },
  take: 30,
});

console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
