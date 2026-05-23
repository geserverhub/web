/**
 * Set energy dashboard login: username goeun / password 23504000
 * Run: node scripts/set-energy-login.mjs
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

const USERNAME = 'goeun';
const PASSWORD = '23504000';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: {
      password: hash,
      role: 'ADMIN',
      name: 'pavinee boknoi',
      email: 'superadmin',
    },
    create: {
      username: USERNAME,
      email: 'superadmin',
      name: 'pavinee boknoi',
      password: hash,
      role: 'ADMIN',
    },
  });
  console.log('OK — energy login ready:', user.username, '/', user.email, 'role:', user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
