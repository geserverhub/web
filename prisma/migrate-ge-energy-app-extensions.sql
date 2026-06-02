-- GE Energy app extension tables & column upgrades (goeunserverhub)
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- Run after: prisma db push OR database/geserverhub.sql (needs User, Client tables)

USE goeunserverhub;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── Electricity rate rules (customer-dashboard cost) ───────────────────────
CREATE TABLE IF NOT EXISTS ge_electricity_rates (
  id INT NOT NULL AUTO_INCREMENT,
  site VARCHAR(32) NOT NULL,
  rate_per_kwh DECIMAL(12,4) NOT NULL,
  effective_from DATETIME NULL,
  effective_to DATETIME NULL,
  label VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_ge_rates_site (site),
  KEY idx_ge_rates_range (site, effective_from, effective_to),
  KEY idx_ge_rates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Meter ↔ device binding ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_energy_meter_device_binding (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id BIGINT NOT NULL,
  meter_id VARCHAR(191) NOT NULL,
  meter_channel VARCHAR(8) NOT NULL DEFAULT 'ch1',
  meter_role VARCHAR(16) NOT NULL DEFAULT 'output',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ge_energy_meter_binding_meter_channel (meter_id, meter_channel),
  UNIQUE KEY uq_ge_energy_meter_binding_device_role (device_id, meter_role),
  KEY idx_ge_energy_meter_binding_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE ge_energy_meter_device_binding
  ADD COLUMN IF NOT EXISTS meter_channel VARCHAR(8) NOT NULL DEFAULT 'ch1' AFTER meter_id;

-- ─── Energy saver customer orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_customer_energy_saver_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  breaker_size VARCHAR(64) NOT NULL,
  machine_kva VARCHAR(64) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL DEFAULT 0,
  total_price INT NOT NULL DEFAULT 0,
  site_photo_path VARCHAR(512) NOT NULL,
  payment_slip_path VARCHAR(512) NOT NULL,
  monthly_bill_paths_json LONGTEXT NULL,
  monthly_bill_count INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_energy_saver_order_no (order_no),
  KEY idx_customer_energy_saver_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Broadcast messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category ENUM('announcement','maintenance','promotion','alert') NOT NULL DEFAULT 'announcement',
  sent_by VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  KEY idx_broadcast_active (is_active),
  KEY idx_broadcast_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Product catalog (energy dashboard) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_list (
  productID INT NOT NULL AUTO_INCREMENT,
  sku VARCHAR(100) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  `Capacity (kVA)` VARCHAR(100) DEFAULT NULL,
  MCB VARCHAR(100) DEFAULT NULL,
  `Size (WxLxH) cm.` VARCHAR(150) DEFAULT NULL,
  Weight VARCHAR(100) DEFAULT NULL,
  price DECIMAL(12,2) DEFAULT 0.00,
  Pin_VAT DECIMAL(12,2) DEFAULT 0.00,
  unit VARCHAR(50) DEFAULT 'unit',
  category VARCHAR(100) DEFAULT 'General',
  Pro_Image VARCHAR(500) DEFAULT NULL,
  stock_qty INT DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (productID),
  KEY idx_product_list_active (is_active),
  KEY idx_product_list_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Dashboard notifications (distinct from device_notifications) ───────────
CREATE TABLE IF NOT EXISTS notifications (
  id INT NOT NULL AUTO_INCREMENT,
  type ENUM('alert','warning','info','success') NOT NULL DEFAULT 'info',
  category VARCHAR(100) NOT NULL DEFAULT 'System',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  device_id INT DEFAULT NULL,
  site VARCHAR(50) DEFAULT NULL,
  metadata TEXT DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_device (device_id),
  KEY idx_notifications_site (site),
  KEY idx_notifications_is_read (is_read),
  KEY idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── API keys ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT DEFAULT NULL,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(64) NOT NULL,
  api_secret VARCHAR(128) NOT NULL DEFAULT '',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_used_at DATETIME DEFAULT NULL,
  expires_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_key (api_key),
  KEY idx_api_keys_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Feedback thread replies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  feedback_id INT NOT NULL,
  sender_type ENUM('partner','customer') NOT NULL DEFAULT 'partner',
  sender_name VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_feedback_replies_feedback (feedback_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── User portal permissions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(191) NOT NULL,
  portal VARCHAR(50) NOT NULL,
  is_allowed TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_portal (user_id, portal),
  KEY idx_user_permissions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── After-sales chat ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_after_sales_chat_thread (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_code VARCHAR(64) NOT NULL,
  customer_lang VARCHAR(16) NULL,
  customer_name VARCHAR(191) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  last_message_preview VARCHAR(500) NULL,
  last_customer_message_at DATETIME NULL,
  last_agent_message_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_after_sales_chat_thread_code (thread_code),
  KEY idx_ge_after_sales_chat_thread_status (status),
  KEY idx_ge_after_sales_chat_thread_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_after_sales_chat_message (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  sender VARCHAR(20) NOT NULL,
  sender_name VARCHAR(191) NULL,
  message_text TEXT NOT NULL,
  read_by_customer TINYINT(1) NOT NULL DEFAULT 0,
  read_by_agent TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_after_sales_chat_message_thread (thread_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @fk_chat = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ge_after_sales_chat_message'
    AND CONSTRAINT_NAME = 'fk_ge_after_sales_chat_message_thread'
);
SET @sql_chat = IF(@fk_chat = 0,
  'ALTER TABLE ge_after_sales_chat_message ADD CONSTRAINT fk_ge_after_sales_chat_message_thread
   FOREIGN KEY (thread_id) REFERENCES ge_after_sales_chat_thread(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt_chat FROM @sql_chat;
EXECUTE stmt_chat;
DEALLOCATE PREPARE stmt_chat;

-- ─── Platform device registration (requires User + devices) ─────────────────
CREATE TABLE IF NOT EXISTS ge_platform_device_registration (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(191) NOT NULL,
  device_id BIGINT NULL,
  serial_no VARCHAR(191) NOT NULL,
  model_name VARCHAR(191) NOT NULL,
  connection_type VARCHAR(32) NULL,
  sim_phone VARCHAR(64) NULL,
  wifi_detail VARCHAR(255) NULL,
  install_address TEXT NULL,
  install_postal VARCHAR(32) NULL,
  install_country VARCHAR(120) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ge_platform_registration_user (user_id),
  UNIQUE KEY uq_ge_platform_registration_device (device_id),
  UNIQUE KEY uq_ge_platform_registration_serial_model (serial_no, model_name),
  KEY idx_ge_platform_registration_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @fk_reg_user = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ge_platform_device_registration'
    AND CONSTRAINT_NAME = 'fk_ge_platform_registration_user'
);
SET @has_user = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User'
);
SET @sql_reg_user = IF(@fk_reg_user = 0 AND @has_user > 0,
  'ALTER TABLE ge_platform_device_registration ADD CONSTRAINT fk_ge_platform_registration_user
   FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE',
  'SELECT 1');
PREPARE stmt_reg_user FROM @sql_reg_user;
EXECUTE stmt_reg_user;
DEALLOCATE PREPARE stmt_reg_user;

SET @fk_reg_dev = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ge_platform_device_registration'
    AND CONSTRAINT_NAME = 'fk_ge_platform_registration_device'
);
SET @sql_reg_dev = IF(@fk_reg_dev = 0,
  'ALTER TABLE ge_platform_device_registration ADD CONSTRAINT fk_ge_platform_registration_device
   FOREIGN KEY (device_id) REFERENCES devices(deviceID) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt_reg_dev FROM @sql_reg_dev;
EXECUTE stmt_reg_dev;
DEALLOCATE PREPARE stmt_reg_dev;

-- ─── Column upgrades on existing tables ─────────────────────────────────────
ALTER TABLE user_feedback
  ADD COLUMN IF NOT EXISTS branch VARCHAR(50) DEFAULT NULL;

-- User.id is VARCHAR (Prisma cuid); legacy energy schema used INT.
ALTER TABLE user_feedback
  MODIFY COLUMN user_id VARCHAR(191) NULL;

ALTER TABLE ai_settings
  ADD COLUMN IF NOT EXISTS anthropic_api_key VARCHAR(512) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anthropic_model VARCHAR(64) NOT NULL DEFAULT 'claude-haiku-4-5-20251001';

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS client_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

SET FOREIGN_KEY_CHECKS = 1;
