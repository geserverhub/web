-- Migration: Add PARTNER to User.role enum
-- Run this on the MariaDB/MySQL server before deploying partner feature

ALTER TABLE `User`
  MODIFY COLUMN `role`
  enum('SUPER_ADMIN','ADMIN','CLIENT','PARTNER')
  NOT NULL DEFAULT 'CLIENT';
