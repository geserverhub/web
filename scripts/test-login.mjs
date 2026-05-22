import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({ where: { username: 'goeun' } });
  console.log('found', !!user, user?.role);
  if (user?.password) {
    console.log('password ok', await bcrypt.compare('23504000', user.password));
  }
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await prisma.$disconnect();
}
