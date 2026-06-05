-- Rename devices.ksaveID / devices.geID → GEsaveID (goeunserverhub / geserverhub)
-- Run: mysql -u root -p goeunserverhub < prisma/migrate-rename-gesave-id.sql

USE goeunserverhub;

-- ksaveID → GEsaveID (oldest installs)
SET @has_ksave = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'ksaveID'
);
SET @has_gesave = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'GEsaveID'
);
SET @sql_ksave = IF(@has_ksave > 0 AND @has_gesave = 0,
  'ALTER TABLE devices CHANGE COLUMN ksaveID GEsaveID varchar(255) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt_ksave FROM @sql_ksave;
EXECUTE stmt_ksave;
DEALLOCATE PREPARE stmt_ksave;

-- geID → GEsaveID (intermediate installs)
SET @has_ge = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'geID'
);
SET @has_gesave2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'GEsaveID'
);
SET @sql_ge = IF(@has_ge > 0 AND @has_gesave2 = 0,
  'ALTER TABLE devices CHANGE COLUMN geID GEsaveID varchar(255) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt_ge FROM @sql_ge;
EXECUTE stmt_ge;
DEALLOCATE PREPARE stmt_ge;

-- Rename unique index geID → GEsaveID
SET @has_old_idx = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND INDEX_NAME = 'unique_geID'
);
SET @sql_drop = IF(@has_old_idx > 0,
  'ALTER TABLE devices DROP INDEX unique_geID',
  'SELECT 1'
);
PREPARE stmt_drop FROM @sql_drop;
EXECUTE stmt_drop;
DEALLOCATE PREPARE stmt_drop;

SET @has_new_idx = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND INDEX_NAME = 'unique_GEsaveID'
);
SET @sql_add = IF(@has_new_idx = 0,
  'ALTER TABLE devices ADD UNIQUE KEY unique_GEsaveID (GEsaveID)',
  'SELECT 1'
);
PREPARE stmt_add FROM @sql_add;
EXECUTE stmt_add;
DEALLOCATE PREPARE stmt_add;
