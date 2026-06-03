-- Software downloads: catalog + orders (idempotent — safe to re-run)
-- Usage: npm run db:migrate-software-downloads

CREATE TABLE IF NOT EXISTS `SoftwareDownloadProduct` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `titleTh` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `platform` VARCHAR(191) NULL,
  `version` VARCHAR(191) NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
  `filePath` VARCHAR(191) NULL,
  `fileName` VARCHAR(191) NULL,
  `icon` VARCHAR(191) NULL,
  `sortOrder` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `free` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SoftwareDownloadProduct_slug_key` (`slug`),
  KEY `SoftwareDownloadProduct_active_idx` (`active`),
  KEY `SoftwareDownloadProduct_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SoftwareDownloadOrder` (
  `id` VARCHAR(191) NOT NULL,
  `orderCode` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `productSlug` VARCHAR(191) NOT NULL,
  `productTitle` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
  `status` ENUM('PENDING', 'AWAITING_REVIEW', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `stripeCheckoutSessionId` VARCHAR(191) NULL,
  `stripePaymentIntentId` VARCHAR(191) NULL,
  `paymentGateway` VARCHAR(191) NULL,
  `receiptFile` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `paidAt` DATETIME(3) NULL,
  `downloadCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SoftwareDownloadOrder_orderCode_key` (`orderCode`),
  KEY `SoftwareDownloadOrder_email_idx` (`email`),
  KEY `SoftwareDownloadOrder_status_idx` (`status`),
  KEY `SoftwareDownloadOrder_productSlug_idx` (`productSlug`),
  KEY `SoftwareDownloadOrder_productId_idx` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND COLUMN_NAME = 'productId');
SET @sql := IF(@c = 0, 'ALTER TABLE `SoftwareDownloadOrder` ADD COLUMN `productId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND INDEX_NAME = 'SoftwareDownloadOrder_productId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `SoftwareDownloadOrder_productId_idx` ON `SoftwareDownloadOrder`(`productId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND CONSTRAINT_NAME = 'SoftwareDownloadOrder_productId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `SoftwareDownloadOrder` ADD CONSTRAINT `SoftwareDownloadOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `SoftwareDownloadProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND COLUMN_NAME = 'accessPassword');
SET @sql := IF(@c = 0, 'ALTER TABLE `SoftwareDownloadOrder` ADD COLUMN `accessPassword` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

INSERT INTO `SoftwareDownloadProduct` (`id`, `slug`, `title`, `titleTh`, `description`, `platform`, `version`, `price`, `currency`, `filePath`, `fileName`, `icon`, `sortOrder`, `active`, `free`, `updatedAt`)
SELECT 'sd_phone_remote', 'phone-remote-android', 'Phone Remote (Android)', 'Phone Remote — แอป Android',
  'แอปรีโมทและแชร์หน้าจอ พร้อมควบคุมจาก Viewer หลังเปิด Accessibility',
  'Android', '1.0.0', 10000, 'KRW', 'phone-remote/PhoneRemote-android.apk', 'PhoneRemote-android.apk', '/logo-mark.svg', 1, 1, 0, CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `SoftwareDownloadProduct` WHERE `slug` = 'phone-remote-android');

INSERT INTO `SoftwareDownloadProduct` (`id`, `slug`, `title`, `titleTh`, `description`, `platform`, `version`, `price`, `currency`, `filePath`, `fileName`, `icon`, `sortOrder`, `active`, `free`, `updatedAt`)
SELECT 'sd_momoge_space', 'momoge-space-android', 'Momoge space (Android)', 'Momoge space — แอป Android',
  'แอป Customer Dashboard สำหรับ Momoge space',
  'Android', '1.0.1', 0, 'THB', 'momoge-space/MomogeSpace-android.apk', 'MomogeSpace-android.apk', '/momoge/Logo-brand.png', 2, 1, 1, CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `SoftwareDownloadProduct` WHERE `slug` = 'momoge-space-android');

INSERT INTO `SoftwareDownloadProduct` (`id`, `slug`, `title`, `titleTh`, `description`, `platform`, `version`, `price`, `currency`, `filePath`, `fileName`, `icon`, `sortOrder`, `active`, `free`, `updatedAt`)
SELECT 'sd_cargo', 'cargo-android', 'คาโก้ ไทย-เกาหลี (Android)', 'คาโก้ ไทย-เกาหลี — แอป Android',
  'แอพ บริการส่งสินค้าจากไทย ไปเกาหลี',
  'Android', '1.0.0', 0, 'THB', 'cargo/CargoThaiKorea-android.apk', 'CargoThaiKorea-android.apk', '/cargo/cargo-logo.png', 3, 1, 1, CURRENT_TIMESTAMP(3)
WHERE NOT EXISTS (SELECT 1 FROM `SoftwareDownloadProduct` WHERE `slug` = 'cargo-android');
