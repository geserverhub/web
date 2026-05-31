-- Partner product categories + link on PartnerProduct (MySQL goeunserverhub)

CREATE TABLE IF NOT EXISTS `PartnerProductCategory` (
  `id`        VARCHAR(191) NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `sortOrder` INT          NOT NULL DEFAULT 0,
  `clientId`  VARCHAR(191) NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartnerProductCategory_clientId_name_key` (`clientId`, `name`),
  KEY `PartnerProductCategory_clientId_idx` (`clientId`),
  KEY `PartnerProductCategory_sortOrder_idx` (`sortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `PartnerProduct`
  ADD COLUMN `categoryId` VARCHAR(191) NULL AFTER `imageUrls`;

CREATE INDEX `PartnerProduct_categoryId_idx` ON `PartnerProduct` (`categoryId`);

-- Default global categories (clientId NULL)
INSERT IGNORE INTO `PartnerProductCategory` (`id`, `name`, `sortOrder`, `clientId`, `createdAt`, `updatedAt`)
VALUES
  ('cat-iot-default',     'อุปกรณ์ IoT',           10, NULL, NOW(3), NOW(3)),
  ('cat-energy-default',  'เครื่องประหยัดพลังงาน', 20, NULL, NOW(3), NOW(3)),
  ('cat-service-default', 'บริการ / ติดตั้ง',      30, NULL, NOW(3), NOW(3)),
  ('cat-other-default',   'อื่นๆ',                 99, NULL, NOW(3), NOW(3));
