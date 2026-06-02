CREATE TABLE IF NOT EXISTS `FileConversionJob` (
  `id` VARCHAR(191) NOT NULL,
  `platform` ENUM('ANDROID', 'IOS') NOT NULL,
  `sourceName` VARCHAR(191) NOT NULL,
  `sourcePath` TEXT NOT NULL,
  `sourceMime` VARCHAR(191) NOT NULL,
  `sourceSize` INT NOT NULL,
  `status` ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
  `errorMessage` TEXT NULL,
  `createdById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `FileConversionJob_platform_createdAt_idx` (`platform`, `createdAt`),
  INDEX `FileConversionJob_createdById_idx` (`createdById`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `FileConversionResult` (
  `id` VARCHAR(191) NOT NULL,
  `jobId` VARCHAR(191) NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `filePath` TEXT NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `fileSize` INT NOT NULL,
  `width` INT NOT NULL,
  `height` INT NOT NULL,
  `target` ENUM('APP_ICON') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `FileConversionResult_jobId_idx` (`jobId`),
  INDEX `FileConversionResult_target_idx` (`target`),
  CONSTRAINT `FileConversionResult_jobId_fkey`
    FOREIGN KEY (`jobId`) REFERENCES `FileConversionJob`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
