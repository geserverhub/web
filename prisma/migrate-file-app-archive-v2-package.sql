-- Add package name extracted from APK/AAB manifest
ALTER TABLE `FileAppArchiveRecord`
  ADD COLUMN IF NOT EXISTS `packageName` VARCHAR(191) NULL AFTER `signingSha1`;
