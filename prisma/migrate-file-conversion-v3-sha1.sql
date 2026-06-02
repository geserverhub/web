-- SHA-1 columns for file conversion history
ALTER TABLE `FileConversionJob`
  ADD COLUMN `sourceSha1` VARCHAR(191) NULL AFTER `sourceExtension`,
  ADD COLUMN `bundleSha1` VARCHAR(191) NULL AFTER `bundleExtension`,
  ADD COLUMN `bundleSigningSha1` VARCHAR(191) NULL AFTER `bundleSha1`;

ALTER TABLE `FileConversionResult`
  ADD COLUMN `sha1` VARCHAR(191) NULL AFTER `fileExtension`,
  ADD COLUMN `signingSha1` VARCHAR(191) NULL AFTER `sha1`;
