-- Idempotent hub schema: missing tables, columns, indexes, and foreign keys.
-- Safe to re-run after prisma db push on existing databases.

-- ─── M-Group orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `MGroupOrder` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NULL,
  `customerName` VARCHAR(191) NOT NULL,
  `customerPhone` VARCHAR(191) NULL,
  `customerEmail` VARCHAR(191) NULL,
  `shippingAddress` TEXT NULL,
  `note` TEXT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_PAYMENT',
  `paymentSlipUrl` VARCHAR(191) NULL,
  `slipName` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NULL,
  `confirmedAt` DATETIME(3) NULL,
  `shippedAt` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MGroupOrder_number_key` (`number`),
  KEY `MGroupOrder_clientId_idx` (`clientId`),
  KEY `MGroupOrder_status_idx` (`status`),
  KEY `MGroupOrder_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MGroupOrderItem` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `productId` INT NULL,
  `sku` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `qty` INT NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `MGroupOrderItem_orderId_idx` (`orderId`),
  KEY `MGroupOrderItem_productId_idx` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Mart (separate from wholesale Product) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `MartProduct` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(191) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
  `category` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `nameEn` VARCHAR(191) NULL,
  `nameZh` VARCHAR(191) NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `priceWholesale` DECIMAL(10, 2) NULL,
  `unit` VARCHAR(191) NOT NULL DEFAULT 'ชิ้น',
  `minOrder` INT NOT NULL DEFAULT 1,
  `minWholesale` INT NOT NULL DEFAULT 10,
  `desc` TEXT NULL,
  `img` VARCHAR(191) NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `promotion` VARCHAR(191) NULL,
  `promotionPrice` DECIMAL(10, 2) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MartProduct_sku_key` (`sku`),
  KEY `MartProduct_category_idx` (`category`),
  KEY `MartProduct_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Cargo extensions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `CargoTransaction` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
  `note` TEXT NULL,
  `receiptRef` VARCHAR(191) NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CargoTransaction_orderId_idx` (`orderId`),
  KEY `CargoTransaction_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CargoStatusLog` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `note` TEXT NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CargoStatusLog_orderId_idx` (`orderId`),
  KEY `CargoStatusLog_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CargoCusDetail` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `nationality` VARCHAR(191) NULL,
  `passportNo` VARCHAR(191) NULL,
  `passportExp` DATETIME(3) NULL,
  `idCard` VARCHAR(191) NULL,
  `customsNo` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `customerId` VARCHAR(191) NULL,
  `cargoOrderId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CargoCusDetail_customerId_idx` (`customerId`),
  KEY `CargoCusDetail_cargoOrderId_idx` (`cargoOrderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Resort bookings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ResortBooking` (
  `id` VARCHAR(191) NOT NULL,
  `number` VARCHAR(191) NOT NULL,
  `guestName` VARCHAR(191) NOT NULL,
  `guestPhone` VARCHAR(191) NULL,
  `guestEmail` VARCHAR(191) NULL,
  `checkIn` DATETIME(3) NOT NULL,
  `checkOut` DATETIME(3) NULL,
  `stayType` VARCHAR(191) NOT NULL DEFAULT 'OVERNIGHT',
  `adults` INT NOT NULL DEFAULT 1,
  `children` INT NOT NULL DEFAULT 0,
  `pricePerNight` DECIMAL(10, 2) NOT NULL DEFAULT 800,
  `totalPrice` DECIMAL(10, 2) NULL,
  `note` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ResortBooking_number_key` (`number`),
  KEY `ResortBooking_guestPhone_idx` (`guestPhone`),
  KEY `ResortBooking_checkIn_idx` (`checkIn`),
  KEY `ResortBooking_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Software download catalog ────────────────────────────────────────────────
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

-- ─── Columns on existing tables ─────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND COLUMN_NAME = 'clientId');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoOrder` ADD COLUMN `clientId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND COLUMN_NAME = 'customerId');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoOrder` ADD COLUMN `customerId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND COLUMN_NAME = 'clientId');
SET @sql := IF(@c = 0, 'ALTER TABLE `Expense` ADD COLUMN `clientId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTask' AND COLUMN_NAME = 'clientId');
SET @sql := IF(@c = 0, 'ALTER TABLE `PartnerTask` ADD COLUMN `clientId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTransaction' AND COLUMN_NAME = 'clientId');
SET @sql := IF(@c = 0, 'ALTER TABLE `PartnerTransaction` ADD COLUMN `clientId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND COLUMN_NAME = 'productId');
SET @sql := IF(@c = 0, 'ALTER TABLE `SoftwareDownloadOrder` ADD COLUMN `productId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MGroupOrder' AND COLUMN_NAME = 'confirmedAt');
SET @sql := IF(@c = 0, 'ALTER TABLE `MGroupOrder` ADD COLUMN `confirmedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MGroupOrder' AND COLUMN_NAME = 'cancelledAt');
SET @sql := IF(@c = 0, 'ALTER TABLE `MGroupOrder` ADD COLUMN `cancelledAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ─── Indexes (if missing) ─────────────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND INDEX_NAME = 'CargoOrder_clientId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `CargoOrder_clientId_idx` ON `CargoOrder`(`clientId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND INDEX_NAME = 'CargoOrder_customerId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `CargoOrder_customerId_idx` ON `CargoOrder`(`customerId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND INDEX_NAME = 'Expense_clientId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `Expense_clientId_idx` ON `Expense`(`clientId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTask' AND INDEX_NAME = 'PartnerTask_clientId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `PartnerTask_clientId_idx` ON `PartnerTask`(`clientId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTransaction' AND INDEX_NAME = 'PartnerTransaction_clientId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `PartnerTransaction_clientId_idx` ON `PartnerTransaction`(`clientId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND INDEX_NAME = 'SoftwareDownloadOrder_productId_idx');
SET @sql := IF(@c = 0, 'CREATE INDEX `SoftwareDownloadOrder_productId_idx` ON `SoftwareDownloadOrder`(`productId`)', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ─── Foreign keys ─────────────────────────────────────────────────────────────
SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'MGroupOrder' AND CONSTRAINT_NAME = 'MGroupOrder_clientId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `MGroupOrder` ADD CONSTRAINT `MGroupOrder_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'MGroupOrderItem' AND CONSTRAINT_NAME = 'MGroupOrderItem_orderId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `MGroupOrderItem` ADD CONSTRAINT `MGroupOrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `MGroupOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'MGroupOrderItem' AND CONSTRAINT_NAME = 'MGroupOrderItem_productId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `MGroupOrderItem` ADD CONSTRAINT `MGroupOrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND CONSTRAINT_NAME = 'CargoOrder_clientId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoOrder` ADD CONSTRAINT `CargoOrder_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoOrder' AND CONSTRAINT_NAME = 'CargoOrder_customerId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoOrder` ADD CONSTRAINT `CargoOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoTransaction' AND CONSTRAINT_NAME = 'CargoTransaction_orderId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoTransaction` ADD CONSTRAINT `CargoTransaction_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `CargoOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoStatusLog' AND CONSTRAINT_NAME = 'CargoStatusLog_orderId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoStatusLog` ADD CONSTRAINT `CargoStatusLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `CargoOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoCusDetail' AND CONSTRAINT_NAME = 'CargoCusDetail_customerId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoCusDetail` ADD CONSTRAINT `CargoCusDetail_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'CargoCusDetail' AND CONSTRAINT_NAME = 'CargoCusDetail_cargoOrderId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `CargoCusDetail` ADD CONSTRAINT `CargoCusDetail_cargoOrderId_fkey` FOREIGN KEY (`cargoOrderId`) REFERENCES `CargoOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Expense' AND CONSTRAINT_NAME = 'Expense_clientId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `Expense` ADD CONSTRAINT `Expense_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTask' AND CONSTRAINT_NAME = 'PartnerTask_clientId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `PartnerTask` ADD CONSTRAINT `PartnerTask_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerTransaction' AND CONSTRAINT_NAME = 'PartnerTransaction_clientId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `PartnerTransaction` ADD CONSTRAINT `PartnerTransaction_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerPersonFinancial' AND CONSTRAINT_NAME = 'PartnerPersonFinancial_transactionId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `PartnerPersonFinancial` ADD CONSTRAINT `PartnerPersonFinancial_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `PartnerTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'FileConversionJob' AND CONSTRAINT_NAME = 'FileConversionJob_createdById_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `FileConversionJob` ADD CONSTRAINT `FileConversionJob_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'FileAppArchiveRecord' AND CONSTRAINT_NAME = 'FileAppArchiveRecord_createdById_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `FileAppArchiveRecord` ADD CONSTRAINT `FileAppArchiveRecord_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'SoftwareDownloadOrder' AND CONSTRAINT_NAME = 'SoftwareDownloadOrder_productId_fkey');
SET @sql := IF(@c = 0, 'ALTER TABLE `SoftwareDownloadOrder` ADD CONSTRAINT `SoftwareDownloadOrder_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `SoftwareDownloadProduct`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ─── Seed software download products (catalog slugs) ──────────────────────────
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
