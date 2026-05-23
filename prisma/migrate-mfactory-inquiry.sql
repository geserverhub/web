-- M-Factory booking inquiries — database: goeunserverhub
-- Run: mysql -u root -p goeunserverhub < prisma/migrate-mfactory-inquiry.sql

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
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MFactoryInquiry_createdAt_idx` (`createdAt`),
  KEY `MFactoryInquiry_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
