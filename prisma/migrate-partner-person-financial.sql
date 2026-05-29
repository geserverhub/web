-- Per-person profit share & investment ledger (synced from PartnerTransaction + manual rows)
CREATE TABLE IF NOT EXISTS `PartnerPersonFinancial` (
  `id` VARCHAR(191) NOT NULL,
  `personName` VARCHAR(191) NOT NULL,
  `ledgerType` VARCHAR(32) NOT NULL COMMENT 'PROFIT_SHARE | INVESTMENT',
  `amount` DECIMAL(14, 2) NOT NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'KRW',
  `transactionId` VARCHAR(191) NULL,
  `recordedAt` DATETIME(3) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartnerPersonFinancial_transactionId_key` (`transactionId`),
  KEY `PartnerPersonFinancial_personName_ledgerType_idx` (`personName`, `ledgerType`),
  KEY `PartnerPersonFinancial_recordedAt_idx` (`recordedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Monthly revenue / investment / expense snapshot (computed from transactions)
CREATE TABLE IF NOT EXISTS `PartnerMonthlyFinancial` (
  `id` VARCHAR(191) NOT NULL,
  `year` SMALLINT NOT NULL,
  `month` TINYINT NOT NULL,
  `revenueKrw` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `investmentKrw` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `expenseKrw` DECIMAL(14, 2) NOT NULL DEFAULT 0,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PartnerMonthlyFinancial_year_month_key` (`year`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
