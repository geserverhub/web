const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.client.updateMany({
    where: { slug: 'spfoods' },
    data: { contactPhone: '010***********' },
  });
  console.log('updated:', result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
