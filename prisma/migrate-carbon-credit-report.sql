-- Carbon Credit ISO 14064-2 report registry (cc_reports)
-- Run: npm run db:migrate-carbon-credit-report

CREATE TABLE IF NOT EXISTS `cc_reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_number` VARCHAR(64) NOT NULL,
  `site` VARCHAR(32) NOT NULL DEFAULT 'all',
  `period_days` INT NOT NULL DEFAULT 30,
  `locale` VARCHAR(10) NOT NULL DEFAULT 'th',
  `device_ids` JSON NULL,
  `meter_count` INT NOT NULL DEFAULT 0,
  `total_energy_saved_kwh` DECIMAL(14,4) NULL,
  `total_co2_kg` DECIMAL(14,4) NULL,
  `carbon_credits_tonnes` DECIMAL(14,6) NULL,
  `estimated_value` DECIMAL(14,2) NULL,
  `currency` VARCHAR(8) NULL,
  `issue_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `prepared_by` VARCHAR(255) DEFAULT 'GE Energy Tech',
  `report_status` ENUM('printed','draft','archived') NOT NULL DEFAULT 'printed',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cc_reports_number` (`report_number`),
  KEY `idx_cc_reports_site` (`site`),
  KEY `idx_cc_reports_issue` (`issue_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
