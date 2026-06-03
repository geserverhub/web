CREATE TABLE IF NOT EXISTS `FileAppArchiveRecord` (
  `id` VARCHAR(191) NOT NULL,
  `platform` ENUM('ANDROID', 'IOS') NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `filePath` TEXT NOT NULL,
  `fileMime` VARCHAR(191) NULL,
  `fileSize` INT NOT NULL,
  `fileExtension` VARCHAR(191) NOT NULL,
  `fileSha1` VARCHAR(191) NOT NULL,
  `signingSha1` VARCHAR(191) NULL,
  `packageName` VARCHAR(191) NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `FileAppArchiveRecord_platform_createdAt_idx` (`platform`, `createdAt`),
  INDEX `FileAppArchiveRecord_createdById_idx` (`createdById`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
