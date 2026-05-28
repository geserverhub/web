/** User-facing hint when Prisma/MySQL auth fails (Windows MySQL80 vs WSL). */
export function formatDbConnectError(err) {
  const msg = String(err?.message || err || '');
  const isDbAuth =
    msg.includes('Authentication failed') ||
    msg.includes('ER_ACCESS_DENIED') ||
    msg.includes('denied access on the database') ||
    msg.includes('credentials for `geserverhub`') ||
    msg.includes('credentials for `goeunserverhub`') ||
    msg.includes('PrismaClientInitializationError');

  if (isDbAuth) {
    return [
      'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (geserverhub / goeunserverhub)',
      'บน Windows: รัน npm run dev:wsl หรือสร้าง user — node scripts/setup-windows-db-user.mjs',
      'บน WSL: ตรวจสอบ DATABASE_URL ใน .env.local และสิทธิ์ MySQL',
    ].join(' — ');
  }
  return msg;
}

/** Map browser fetch failures to a clearer ERP login message. */
export function formatFetchError(err) {
  const msg = String(err?.message || err || '');
  if (
    msg === 'Failed to fetch' ||
    msg.includes('NetworkError') ||
    msg.includes('Load failed') ||
    msg.includes('ECONNREFUSED')
  ) {
    return [
      'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
      'ตรวจสอบว่า dev server ทำงานอยู่ (npm run dev หรือ npm run dev:wsl)',
      'และเปิดหน้านี้ที่ http://localhost:3005/ge-energy-erp-login',
    ].join(' — ');
  }
  return msg || 'เชื่อมต่อไม่สำเร็จ';
}
