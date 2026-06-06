-- Additional PK/FK links for goeunserverhub energy schema.
-- Safe to re-run (checks INFORMATION_SCHEMA before adding constraints).

-- Remove orphan telemetry rows before FK enforcement
DELETE pr FROM power_records pr
LEFT JOIN devices d ON d.deviceID = pr.device_id
WHERE d.deviceID IS NULL;

DELETE pp FROM power_records_preinstall pp
LEFT JOIN devices d ON d.deviceID = pp.device_id
WHERE d.deviceID IS NULL;

-- power_records.device_id → devices.deviceID
SET @fk_pr_device = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'power_records'
    AND CONSTRAINT_NAME = 'fk_power_records_device'
);
SET @sql_pr_device = IF(@fk_pr_device = 0,
  'ALTER TABLE power_records
     ADD CONSTRAINT fk_power_records_device
     FOREIGN KEY (device_id) REFERENCES devices(deviceID)
     ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT ''fk_power_records_device already exists''');
PREPARE s_pr_device FROM @sql_pr_device; EXECUTE s_pr_device; DEALLOCATE PREPARE s_pr_device;

-- power_records_preinstall.device_id → devices.deviceID
SET @fk_pre_device = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'power_records_preinstall'
    AND CONSTRAINT_NAME = 'fk_power_records_preinstall_device'
);
SET @sql_pre_device = IF(@fk_pre_device = 0,
  'ALTER TABLE power_records_preinstall
     ADD CONSTRAINT fk_power_records_preinstall_device
     FOREIGN KEY (device_id) REFERENCES devices(deviceID)
     ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT ''fk_power_records_preinstall_device already exists''');
PREPARE s_pre_device FROM @sql_pre_device; EXECUTE s_pre_device; DEALLOCATE PREPARE s_pre_device;

-- device_notifications.device_id → devices.deviceID (when table exists)
SET @has_dn = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'device_notifications'
);
SET @fk_dn = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'device_notifications'
    AND CONSTRAINT_NAME = 'fk_device_notifications_device'
);
SET @sql_dn = IF(@has_dn > 0 AND @fk_dn = 0,
  'ALTER TABLE device_notifications
     ADD CONSTRAINT fk_device_notifications_device
     FOREIGN KEY (device_id) REFERENCES devices(deviceID)
     ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT ''fk_device_notifications_device skipped or exists''');
PREPARE s_dn FROM @sql_dn; EXECUTE s_dn; DEALLOCATE PREPARE s_dn;

-- Backfill devices.client_id from hub client slug when empty
UPDATE devices d
LEFT JOIN Client c ON c.slug = 'goeun-server-hub'
SET d.client_id = c.id
WHERE d.client_id IS NULL AND c.id IS NOT NULL;

-- eq_customers FK when both tables exist
SET @has_eq = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'eq_customers'
);
SET @fk_eq = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'devices'
    AND CONSTRAINT_NAME = 'fk_devices_eq_customer'
);
SET @sql_eq = IF(@has_eq > 0 AND @fk_eq = 0,
  'ALTER TABLE devices
     ADD CONSTRAINT fk_devices_eq_customer
     FOREIGN KEY (customer_id) REFERENCES eq_customers(id)
     ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_devices_eq_customer skipped or exists''');
PREPARE s_eq FROM @sql_eq; EXECUTE s_eq; DEALLOCATE PREPARE s_eq;

-- Sync carbon_meters.deviceID from devices when meter numbers match (when table exists)
SET @has_cm = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carbon_meters'
);
SET @sql_cm = IF(@has_cm > 0,
  'UPDATE carbon_meters cm
   INNER JOIN devices d ON (
     (cm.meterType = ''before'' AND d.beforeMeterNo IS NOT NULL AND d.beforeMeterNo = cm.meterNo)
     OR (cm.meterType = ''metrics'' AND d.metricsMeterNo IS NOT NULL AND d.metricsMeterNo = cm.meterNo)
   )
   SET cm.deviceID = d.deviceID
   WHERE cm.deviceID IS NULL OR cm.deviceID <> d.deviceID',
  'SELECT ''carbon_meters sync skipped''');
PREPARE s_cm FROM @sql_cm; EXECUTE s_cm; DEALLOCATE PREPARE s_cm;
