-- Align Client table with prisma/schema.prisma (contactFax)
ALTER TABLE `Client`
  ADD COLUMN `contactFax` VARCHAR(191) NULL AFTER `contactPhone`;
