const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Update green-retail-group → MOMOGE SPACE (Demo)
  const r1 = await prisma.client.updateMany({
    where: { slug: 'green-retail-group' },
    data: {
      name: 'MOMOGE SPACE',
      description: 'AI SMART ENERGY MONITORING PLATFORM Demo',
      contactPhone: '010-8105-0384',
      contactEmail: 'goeunserverhub@gmail.com',
      logoUrl: '/uploads/logos/G-monitoring.png',
      systemUrl: '/energy-dashboard-login',
    },
  });
  console.log('green-retail-group updated:', r1.count);

  // Update green-retail-energy → MOMOGE SPACE
  const r2 = await prisma.client.updateMany({
    where: { slug: 'green-retail-energy' },
    data: {
      name: 'MOMOGE SPACE',
      description: 'AI SMART ENERGY MONITORING PLATFORM ระบบมอนิเตอริ่งพลังงานอัจฉริยะ',
      contactPhone: '010-8105-0384',
      contactEmail: 'goeunserverhub@gmail.com',
      logoUrl: '/uploads/logos/G-monitoring.png',
    },
  });
  console.log('green-retail-energy updated:', r2.count);

  // SP Foods — use raw SQL to avoid missing column issue
  const [rows] = await prisma.$queryRaw`SELECT id FROM Client WHERE slug = 'spfoods' LIMIT 1`;
  if (!rows) {
    await prisma.$executeRaw`
      INSERT INTO Client (id, name, slug, description, status, logoUrl, systemUrl, createdAt, updatedAt)
      VALUES (
        UUID(),
        'SP Foods Co.,Ltd.',
        'spfoods',
        'ส.ภาวิณีร์ อีสานฟู้ดส์ ผู้ผลิตและจำหน่าย นำเข้า-ส่งออก อาหารแปรรูป อาหารแช่แข็ง ผู้ผลิตและจำหน่ายอาหารไทยแปรรูปที่ได้มาตรฐานเจ้าเดียวในเกาหลี ครบวงจรด้านอุตสาหกรรมอาหาร ผสมผสานเทคโนโลยีร่วมกับอุตสาหกรรมอาหารและการเกษตร เพื่อผลิตอาหารแปรรูปที่มีคุณภาพและได้มาตรฐานสากล',
        'ONLINE',
        '/uploads/logos/spfoods-main.jpg',
        'https://spfoodskorea.com/',
        NOW(),
        NOW()
      )
    `;
    console.log('SP Foods created');
  } else {
    await prisma.$executeRaw`
      UPDATE Client SET
        name = 'SP Foods Co.,Ltd.',
        description = 'ส.ภาวิณีร์ อีสานฟู้ดส์ ผู้ผลิตและจำหน่าย นำเข้า-ส่งออก อาหารแปรรูป อาหารแช่แข็ง ผู้ผลิตและจำหน่ายอาหารไทยแปรรูปที่ได้มาตรฐานเจ้าเดียวในเกาหลี ครบวงจรด้านอุตสาหกรรมอาหาร ผสมผสานเทคโนโลยีร่วมกับอุตสาหกรรมอาหารและการเกษตร เพื่อผลิตอาหารแปรรูปที่มีคุณภาพและได้มาตรฐานสากล',
        logoUrl = '/uploads/logos/spfoods-main.jpg',
        systemUrl = 'https://spfoodskorea.com/',
        updatedAt = NOW()
      WHERE slug = 'spfoods'
    `;
    console.log('SP Foods updated');
  }
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
