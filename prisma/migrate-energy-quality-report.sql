-- Energy Quality Report Platform (GE Energy Tech)
-- Maps to spec: customers, sites, devices (existing), energy_data, analysis_results, recommendations, reports
-- Database: goeunserverhub (geserverhub legacy)
-- Run: mysql -u root -p goeunserverhub < prisma/migrate-energy-quality-report.sql

USE goeunserverhub;

-- ---------------------------------------------------------------------------
-- 1. customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_customers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(255) NOT NULL,
  `business_type` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `contact_person` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `legacy_client_id` VARCHAR(191) DEFAULT NULL COMMENT 'Optional link to Client.id',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_eq_customers_name` (`customer_name`),
  KEY `idx_eq_customers_legacy_client` (`legacy_client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. sites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_sites` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NOT NULL,
  `site_name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `site_region` VARCHAR(50) DEFAULT 'thailand' COMMENT 'thailand|korea|vietnam|malaysia',
  `transformer_size` VARCHAR(100) DEFAULT NULL,
  `contract_demand` DECIMAL(12,3) DEFAULT NULL,
  `voltage_system` VARCHAR(50) DEFAULT '3-Phase 400V',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_eq_sites_customer` (`customer_id`),
  KEY `idx_eq_sites_region` (`site_region`),
  CONSTRAINT `fk_eq_sites_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `eq_customers` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. Link existing devices → site (devices table already exists)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_device_sites` (
  `device_id` INT NOT NULL COMMENT 'devices.deviceID',
  `site_id` INT NOT NULL,
  `measurement_point` VARCHAR(255) DEFAULT NULL,
  `gateway_id` VARCHAR(100) DEFAULT NULL,
  `installed_date` DATE DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`device_id`),
  UNIQUE KEY `uq_eq_device_sites_site_device` (`site_id`, `device_id`),
  CONSTRAINT `fk_eq_device_sites_device`
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`deviceID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_device_sites_site`
    FOREIGN KEY (`site_id`) REFERENCES `eq_sites` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. energy_data (normalized snapshots; complements power_records)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_energy_data` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL,
  `recorded_at` DATETIME NOT NULL,
  `voltage_l1` DECIMAL(10,2) DEFAULT NULL,
  `voltage_l2` DECIMAL(10,2) DEFAULT NULL,
  `voltage_l3` DECIMAL(10,2) DEFAULT NULL,
  `current_l1` DECIMAL(10,2) DEFAULT NULL,
  `current_l2` DECIMAL(10,2) DEFAULT NULL,
  `current_l3` DECIMAL(10,2) DEFAULT NULL,
  `power_kw` DECIMAL(12,3) DEFAULT NULL,
  `energy_kwh` DECIMAL(14,3) DEFAULT NULL,
  `power_factor` DECIMAL(6,3) DEFAULT NULL,
  `frequency` DECIMAL(8,3) DEFAULT NULL,
  `thdi_l1` DECIMAL(8,3) DEFAULT NULL,
  `thdi_l2` DECIMAL(8,3) DEFAULT NULL,
  `thdi_l3` DECIMAL(8,3) DEFAULT NULL,
  `thdv_l1` DECIMAL(8,3) DEFAULT NULL,
  `thdv_l2` DECIMAL(8,3) DEFAULT NULL,
  `thdv_l3` DECIMAL(8,3) DEFAULT NULL,
  `reactive_kvar` DECIMAL(12,3) DEFAULT NULL,
  `apparent_kva` DECIMAL(12,3) DEFAULT NULL,
  `source` VARCHAR(32) NOT NULL DEFAULT 'live',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_eq_energy_data_device_time` (`device_id`, `recorded_at`),
  CONSTRAINT `fk_eq_energy_data_device`
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`deviceID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_number` VARCHAR(64) NOT NULL,
  `customer_id` INT DEFAULT NULL,
  `site_id` INT DEFAULT NULL,
  `device_id` INT NOT NULL,
  `report_title` VARCHAR(255) DEFAULT 'Customer Energy Analysis Report',
  `measurement_start` DATETIME DEFAULT NULL,
  `measurement_end` DATETIME DEFAULT NULL,
  `issue_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `prepared_by` VARCHAR(255) DEFAULT 'GE Energy Tech',
  `report_status` ENUM('draft','analyzed','reviewed','approved','sent','archived') NOT NULL DEFAULT 'draft',
  `pdf_file_path` VARCHAR(512) DEFAULT NULL,
  `locale` VARCHAR(10) DEFAULT 'th',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_reports_number` (`report_number`),
  KEY `idx_eq_reports_device` (`device_id`),
  KEY `idx_eq_reports_status` (`report_status`),
  CONSTRAINT `fk_eq_reports_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `eq_customers` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_reports_site`
    FOREIGN KEY (`site_id`) REFERENCES `eq_sites` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_reports_device`
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`deviceID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. analysis_results
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_analysis_results` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `site_id` INT DEFAULT NULL,
  `report_id` INT NOT NULL,
  `device_id` INT NOT NULL,
  `total_energy` DECIMAL(14,3) DEFAULT NULL,
  `average_load` DECIMAL(10,2) DEFAULT NULL,
  `max_demand` DECIMAL(10,2) DEFAULT NULL,
  `load_factor` DECIMAL(8,2) DEFAULT NULL,
  `average_pf` DECIMAL(6,3) DEFAULT NULL,
  `current_imbalance` DECIMAL(8,2) DEFAULT NULL,
  `voltage_imbalance` DECIMAL(8,2) DEFAULT NULL,
  `thdi_avg` DECIMAL(8,3) DEFAULT NULL,
  `thdv_avg` DECIMAL(8,3) DEFAULT NULL,
  `risk_level` VARCHAR(20) DEFAULT 'good',
  `peak_demand` DECIMAL(10,2) DEFAULT NULL,
  `peak_time` VARCHAR(64) DEFAULT NULL,
  `peak_ratio` DECIMAL(8,3) DEFAULT NULL,
  `monthly_cost_est` DECIMAL(14,2) DEFAULT NULL,
  `penalty_cost_est` DECIMAL(14,2) DEFAULT NULL,
  `potential_saving` DECIMAL(14,2) DEFAULT NULL,
  `snapshot_json` JSON DEFAULT NULL COMMENT 'Full report sections for UI/print',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eq_analysis_report` (`report_id`),
  KEY `idx_eq_analysis_device` (`device_id`),
  CONSTRAINT `fk_eq_analysis_site`
    FOREIGN KEY (`site_id`) REFERENCES `eq_sites` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_analysis_report`
    FOREIGN KEY (`report_id`) REFERENCES `eq_reports` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eq_analysis_device`
    FOREIGN KEY (`device_id`) REFERENCES `devices` (`deviceID`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eq_recommendations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_id` INT NOT NULL,
  `priority` INT NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `expected_saving` DECIMAL(14,2) DEFAULT NULL,
  `investment_cost` DECIMAL(14,2) DEFAULT NULL,
  `payback_period` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_eq_recommendations_report` (`report_id`, `priority`),
  CONSTRAINT `fk_eq_recommendations_report`
    FOREIGN KEY (`report_id`) REFERENCES `eq_reports` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View aliases (spec names) for reporting tools
CREATE OR REPLACE VIEW `customers` AS
  SELECT
    id,
    customer_name,
    business_type,
    address,
    contact_person,
    phone,
    email,
    created_at,
    updated_at
  FROM eq_customers;

CREATE OR REPLACE VIEW `sites` AS
  SELECT
    id,
    customer_id,
    site_name,
    location,
    site_region,
    transformer_size,
    contract_demand,
    voltage_system,
    created_at,
    updated_at
  FROM eq_sites;

CREATE OR REPLACE VIEW `energy_data` AS
  SELECT
    id,
    device_id,
    recorded_at AS timestamp,
    voltage_l1,
    voltage_l2,
    voltage_l3,
    current_l1,
    current_l2,
    current_l3,
    power_kw,
    energy_kwh,
    power_factor,
    frequency,
    thdi_l1,
    thdi_l2,
    thdi_l3,
    thdv_l1,
    thdv_l2,
    thdv_l3
  FROM eq_energy_data;

CREATE OR REPLACE VIEW `analysis_results` AS
  SELECT
    id,
    site_id,
    report_id,
    device_id,
    total_energy,
    average_load,
    max_demand,
    load_factor,
    average_pf,
    current_imbalance,
    voltage_imbalance,
    thdi_avg,
    thdv_avg,
    risk_level,
    created_at
  FROM eq_analysis_results;

CREATE OR REPLACE VIEW `recommendations` AS
  SELECT
    id,
    report_id,
    priority,
    title,
    description,
    expected_saving,
    investment_cost,
    payback_period
  FROM eq_recommendations;

CREATE OR REPLACE VIEW `reports` AS
  SELECT
    id,
    customer_id,
    site_id,
    device_id,
    report_number,
    report_title,
    measurement_start,
    measurement_end,
    issue_date,
    prepared_by,
    report_status,
    pdf_file_path,
    created_at,
    updated_at
  FROM eq_reports;
