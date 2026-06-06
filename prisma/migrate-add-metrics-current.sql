-- Add metrics_current_L1/L2/L3 columns to power_records
-- Run: mysql -u root -p goeunserverhub < prisma/migrate-add-metrics-current.sql

USE goeunserverhub;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN metrics_current_L1 DECIMAL(10,2) DEFAULT NULL AFTER before_current_L3',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'metrics_current_L1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN metrics_current_L2 DECIMAL(10,2) DEFAULT NULL AFTER metrics_current_L1',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'metrics_current_L2'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE power_records ADD COLUMN metrics_current_L3 DECIMAL(10,2) DEFAULT NULL AFTER metrics_current_L2',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'power_records' AND COLUMN_NAME = 'metrics_current_L3'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'migrate-add-metrics-current: done' AS status;
