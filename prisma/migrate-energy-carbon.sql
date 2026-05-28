-- ============================================================
-- Carbon Credit Tables for goeunserverhub database
-- Run AFTER migrate-energy-geserverhub.sql (devices table must exist)
-- ============================================================

CREATE TABLE IF NOT EXISTS carbon_locations (
  locationID   VARCHAR(64)  NOT NULL,
  locationName VARCHAR(255) NOT NULL,
  address      TEXT         NULL,
  site         VARCHAR(32)  NOT NULL DEFAULT 'thailand',
  latitude     DECIMAL(10,7) NULL,
  longitude    DECIMAL(10,7) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (locationID),
  KEY idx_carbon_locations_site (site)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS carbon_meters (
  meterID   VARCHAR(64)                NOT NULL,
  deviceID  INT UNSIGNED               NULL,
  meterType ENUM('before','metrics')   NOT NULL DEFAULT 'before',
  meterNo   VARCHAR(64)                NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (meterID),
  KEY idx_carbon_meters_device (deviceID),
  CONSTRAINT fk_carbon_meters_device
    FOREIGN KEY (deviceID) REFERENCES devices (deviceID)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS carboncre_cacu (
  carbonID           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  meterID            VARCHAR(64)     NOT NULL,
  LocationID         VARCHAR(64)     NOT NULL,
  serailID           VARCHAR(64)     NULL,
  deviceID           INT UNSIGNED    NULL,
  power_record_id    BIGINT UNSIGNED NULL,
  power_preinstall_id BIGINT UNSIGNED NULL,
  carbon_kg          DECIMAL(14,6)   NULL,
  energy_kwh         DECIMAL(14,4)   NULL,
  reduction_percent  DECIMAL(8,4)    NULL,
  record_date        DATE            NULL,
  note               TEXT            NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (carbonID),
  KEY idx_carboncre_device   (deviceID),
  KEY idx_carboncre_meter    (meterID),
  KEY idx_carboncre_location (LocationID),
  KEY idx_carboncre_date     (record_date),
  CONSTRAINT fk_carboncre_device
    FOREIGN KEY (deviceID)   REFERENCES devices (deviceID)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_carboncre_meter
    FOREIGN KEY (meterID)    REFERENCES carbon_meters (meterID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_carboncre_location
    FOREIGN KEY (LocationID) REFERENCES carbon_locations (locationID)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_carboncre_power_record
    FOREIGN KEY (power_record_id)     REFERENCES power_records (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_carboncre_preinstall
    FOREIGN KEY (power_preinstall_id) REFERENCES power_records_preinstall (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
