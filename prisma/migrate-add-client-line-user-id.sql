-- Align Client table with prisma/schema.prisma (lineUserId for LINE invoice reminders)
ALTER TABLE `Client`
  ADD COLUMN `lineUserId` VARCHAR(191) NULL AFTER `logoUrl`;
