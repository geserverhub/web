-- Extend file conversion tables: bundle attachment + store upload extensions
-- Run after migrate-file-conversion-assets.sql if tables already exist.

ALTER TABLE `FileConversionJob`
  ADD COLUMN IF NOT EXISTS `sourceExtension` VARCHAR(191) NOT NULL DEFAULT '.png' AFTER `sourceSize`,
  ADD COLUMN IF NOT EXISTS `bundleName` VARCHAR(191) NULL AFTER `sourceExtension`,
  ADD COLUMN IF NOT EXISTS `bundlePath` TEXT NULL AFTER `bundleName`,
  ADD COLUMN IF NOT EXISTS `bundleMime` VARCHAR(191) NULL AFTER `bundlePath`,
  ADD COLUMN IF NOT EXISTS `bundleSize` INT NULL AFTER `bundleMime`,
  ADD COLUMN IF NOT EXISTS `bundleExtension` VARCHAR(191) NULL AFTER `bundleSize`,
  ADD COLUMN IF NOT EXISTS `storeUploadExtensions` TEXT NULL AFTER `bundleExtension`;

ALTER TABLE `FileConversionResult`
  ADD COLUMN IF NOT EXISTS `fileExtension` VARCHAR(191) NOT NULL DEFAULT '.png' AFTER `mimeType`,
  ADD COLUMN IF NOT EXISTS `storeEligible` TINYINT(1) NOT NULL DEFAULT 1 AFTER `target`,
  ADD COLUMN IF NOT EXISTS `usageNote` VARCHAR(191) NULL AFTER `storeEligible`,
  ADD INDEX IF NOT EXISTS `FileConversionResult_fileExtension_idx` (`fileExtension`);

-- MySQL 8.0 may not support IF NOT EXISTS on ADD COLUMN — use manual checks if this fails.

ALTER TABLE `FileConversionResult`
  MODIFY COLUMN `target` ENUM('APP_ICON', 'STORE_LISTING', 'APP_BUNDLE') NOT NULL;
