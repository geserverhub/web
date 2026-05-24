-- M-Factory booking form — extra columns (bookingNumber, status, termsAccepted)
-- Run: mysql -u geserverhub -p goeunserverhub < prisma/migrate-mfactory-booking-v2.sql

USE goeunserverhub;

CREATE TABLE IF NOT EXISTS `MFactoryInquiry` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'factory',
  `lang` varchar(191) NOT NULL DEFAULT 'th',
  `source` varchar(191) DEFAULT NULL,
  `company` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `taxId` varchar(191) DEFAULT NULL,
  `bookingDate` date DEFAULT NULL,
  `address` text,
  `warehouse` text,
  `rentalType` varchar(191) DEFAULT NULL,
  `paymentRef` varchar(191) DEFAULT NULL,
  `message` text,
  `bookingNumber` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `termsAccepted` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MFactoryInquiry_bookingNumber_key` (`bookingNumber`),
  KEY `MFactoryInquiry_createdAt_idx` (`createdAt`),
  KEY `MFactoryInquiry_type_idx` (`type`),
  KEY `MFactoryInquiry_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MFactoryInquiry' AND COLUMN_NAME = 'bookingNumber'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE MFactoryInquiry ADD COLUMN bookingNumber varchar(191) DEFAULT NULL AFTER message',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MFactoryInquiry' AND COLUMN_NAME = 'status'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE MFactoryInquiry ADD COLUMN status varchar(191) NOT NULL DEFAULT ''PENDING'' AFTER bookingNumber',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MFactoryInquiry' AND COLUMN_NAME = 'termsAccepted'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE MFactoryInquiry ADD COLUMN termsAccepted tinyint(1) NOT NULL DEFAULT 1 AFTER status',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MFactoryInquiry' AND INDEX_NAME = 'MFactoryInquiry_bookingNumber_key'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE MFactoryInquiry ADD UNIQUE KEY MFactoryInquiry_bookingNumber_key (bookingNumber)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'MFactoryInquiry' AND INDEX_NAME = 'MFactoryInquiry_status_idx'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE MFactoryInquiry ADD KEY MFactoryInquiry_status_idx (status)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
