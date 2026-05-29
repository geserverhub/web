import { randomUUID } from 'crypto';

/** Ensure PartnerProductCategory table + PartnerProduct.categoryId exist (idempotent). */
export async function ensurePartnerProductCategorySchema(prisma) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`PartnerProductCategory\` (
      \`id\`        VARCHAR(191) NOT NULL,
      \`name\`      VARCHAR(191) NOT NULL,
      \`sortOrder\` INT          NOT NULL DEFAULT 0,
      \`clientId\`  VARCHAR(191) NULL,
      \`createdAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`PartnerProductCategory_clientId_name_key\` (\`clientId\`, \`name\`),
      KEY \`PartnerProductCategory_clientId_idx\` (\`clientId\`),
      KEY \`PartnerProductCategory_sortOrder_idx\` (\`sortOrder\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `PartnerProduct` ADD COLUMN `categoryId` VARCHAR(191) NULL'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX `PartnerProduct_categoryId_idx` ON `PartnerProduct` (`categoryId`)'
    );
  } catch (err) {
    const msg = String(err?.message || err);
    if (!/duplicate column|duplicate key name/i.test(msg)) throw err;
  }

  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO \`PartnerProductCategory\` (\`id\`, \`name\`, \`sortOrder\`, \`clientId\`)
    VALUES
      ('cat-iot-default', 'อุปกรณ์ IoT', 10, NULL),
      ('cat-energy-default', 'เครื่องประหยัดพลังงาน', 20, NULL),
      ('cat-service-default', 'บริการ / ติดตั้ง', 30, NULL),
      ('cat-other-default', 'อื่นๆ', 99, NULL)
  `);
}

export function newCategoryId() {
  return randomUUID().replace(/-/g, '').slice(0, 25);
}
