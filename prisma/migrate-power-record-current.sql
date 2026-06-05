-- Add dedicated CH1 current columns and full pre-install history schema.
-- Run: mysql -u root -p goeunserverhub < prisma/migrate-power-record-current.sql

USE goeunserverhub;

-- power_records: CH1 phase current (A) — separate from before_L* voltage
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN before_current_L1 DECIMAL(10,2) DEFAULT NULL AFTER before_L3',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'before_current_L1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN before_current_L2 DECIMAL(10,2) DEFAULT NULL AFTER before_current_L1',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'before_current_L2'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN before_current_L3 DECIMAL(10,2) DEFAULT NULL AFTER before_current_L2',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'before_current_L3'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- power_records_preinstall: mirror installed schema for CH1-only history
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_L1 DECIMAL(10,2) DEFAULT NULL AFTER record_time',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_L1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_L2 DECIMAL(10,2) DEFAULT NULL AFTER before_L1',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_L2'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_L3 DECIMAL(10,2) DEFAULT NULL AFTER before_L2',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_L3'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_current_L1 DECIMAL(10,2) DEFAULT NULL AFTER before_L3',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_current_L1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_current_L2 DECIMAL(10,2) DEFAULT NULL AFTER before_current_L1',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_current_L2'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_current_L3 DECIMAL(10,2) DEFAULT NULL AFTER before_current_L2',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_current_L3'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_P DECIMAL(12,3) DEFAULT NULL AFTER before_current_L3',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_P'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_Q DECIMAL(12,3) DEFAULT NULL AFTER before_P',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_Q'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_S DECIMAL(12,3) DEFAULT NULL AFTER before_Q',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_S'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_PF DECIMAL(6,3) DEFAULT NULL AFTER before_S',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_PF'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_THD DECIMAL(8,3) DEFAULT NULL AFTER before_PF',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_THD'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records_preinstall ADD COLUMN before_F DECIMAL(8,3) DEFAULT NULL AFTER before_THD',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records_preinstall' AND COLUMN_NAME = 'before_F'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Migrate mis-stored seed: values in before_L* that look like current (A) → before_current_*
UPDATE power_records
SET
  before_current_L1 = IF(before_L1 IS NOT NULL AND before_L1 > 0 AND before_L1 < 50, before_L1, before_current_L1),
  before_current_L2 = IF(before_L2 IS NOT NULL AND before_L2 > 0 AND before_L2 < 50, before_L2, before_current_L2),
  before_current_L3 = IF(before_L3 IS NOT NULL AND before_L3 > 0 AND before_L3 < 50, before_L3, before_current_L3),
  before_L1 = IF(before_L1 IS NOT NULL AND before_L1 > 0 AND before_L1 < 50, 400.00, before_L1),
  before_L2 = IF(before_L2 IS NOT NULL AND before_L2 > 0 AND before_L2 < 50, 401.00, before_L2),
  before_L3 = IF(before_L3 IS NOT NULL AND before_L3 > 0 AND before_L3 < 50, 399.00, before_L3)
WHERE created_by = 'eq-report-seed'
   OR (before_L1 > 50 AND before_current_L1 IS NULL AND before_P IS NOT NULL);

SELECT 'migrate-power-record-current: done' AS status;
