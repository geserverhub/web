-- Add package name extracted from APK/AAB manifest (skip if column already in CREATE TABLE)
ALTER TABLE `FileAppArchiveRecord`
  ADD COLUMN `packageName` VARCHAR(191) NULL AFTER `signingSha1`;
