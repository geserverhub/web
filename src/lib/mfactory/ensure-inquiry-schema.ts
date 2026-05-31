import { queryGeserverhub } from '@/lib/geserverhub-db';

let ensured = false;

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function indexExists(table: string, indexName: string): Promise<boolean> {
  const rows = await queryGeserverhub(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

/** Create MFactoryInquiry table if missing (goeunserverhub). */
export async function ensureMFactoryInquirySchema(): Promise<void> {
  if (ensured) return;

  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS MFactoryInquiry (
      id varchar(191) NOT NULL,
      type varchar(191) NOT NULL DEFAULT 'factory',
      lang varchar(191) NOT NULL DEFAULT 'th',
      source varchar(191) DEFAULT NULL,
      company varchar(191) DEFAULT NULL,
      name varchar(191) NOT NULL,
      phone varchar(191) DEFAULT NULL,
      email varchar(191) DEFAULT NULL,
      taxId varchar(191) DEFAULT NULL,
      bookingDate date DEFAULT NULL,
      address text,
      warehouse text,
      rentalType varchar(191) DEFAULT NULL,
      paymentRef varchar(191) DEFAULT NULL,
      message text,
      bookingNumber varchar(191) DEFAULT NULL,
      status varchar(191) NOT NULL DEFAULT 'PENDING',
      termsAccepted tinyint(1) NOT NULL DEFAULT 1,
      createdAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY MFactoryInquiry_createdAt_idx (createdAt),
      KEY MFactoryInquiry_type_idx (type),
      KEY MFactoryInquiry_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  if (!(await columnExists('MFactoryInquiry', 'bookingNumber'))) {
    await queryGeserverhub(
      'ALTER TABLE MFactoryInquiry ADD COLUMN bookingNumber varchar(191) DEFAULT NULL AFTER message'
    );
  }
  if (!(await columnExists('MFactoryInquiry', 'status'))) {
    await queryGeserverhub(
      "ALTER TABLE MFactoryInquiry ADD COLUMN status varchar(191) NOT NULL DEFAULT 'PENDING' AFTER bookingNumber"
    );
  }
  if (!(await columnExists('MFactoryInquiry', 'termsAccepted'))) {
    await queryGeserverhub(
      'ALTER TABLE MFactoryInquiry ADD COLUMN termsAccepted tinyint(1) NOT NULL DEFAULT 1 AFTER status'
    );
  }
  if (!(await indexExists('MFactoryInquiry', 'MFactoryInquiry_bookingNumber_key'))) {
    await queryGeserverhub(
      'ALTER TABLE MFactoryInquiry ADD UNIQUE KEY MFactoryInquiry_bookingNumber_key (bookingNumber)'
    );
  }
  if (!(await indexExists('MFactoryInquiry', 'MFactoryInquiry_status_idx'))) {
    await queryGeserverhub(
      'ALTER TABLE MFactoryInquiry ADD KEY MFactoryInquiry_status_idx (status)'
    );
  }

  ensured = true;
}
