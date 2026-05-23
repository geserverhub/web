-- Add partner product images + client scope (run once on MySQL goeunserverhub)
ALTER TABLE `PartnerProduct`
  ADD COLUMN `imageUrls` TEXT NULL AFTER `currency`,
  ADD COLUMN `clientId` VARCHAR(191) NULL AFTER `imageUrls`;

CREATE INDEX `PartnerProduct_clientId_idx` ON `PartnerProduct` (`clientId`);
