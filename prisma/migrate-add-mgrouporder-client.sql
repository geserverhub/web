-- Add client ownership to M-Group orders for role-based visibility
ALTER TABLE `MGroupOrder`
  ADD COLUMN `clientId` VARCHAR(191) NULL;

CREATE INDEX `MGroupOrder_clientId_idx` ON `MGroupOrder`(`clientId`);

ALTER TABLE `MGroupOrder`
  ADD CONSTRAINT `MGroupOrder_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
