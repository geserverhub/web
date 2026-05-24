-- Energy monitoring tables for ksystem database (GE Energy / K-Save)
-- Run: mysql -u root -p ksystem < prisma/migrate-energy-ksystem.sql

CREATE DATABASE IF NOT EXISTS ksystem
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ksystem;

CREATE TABLE IF NOT EXISTS `devices` (
  `deviceID` int NOT NULL AUTO_INCREMENT,
  `deviceName` varchar(255) NOT NULL,
  `ksaveID` varchar(255) DEFAULT NULL,
  `series_no` varchar(50) DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `site` varchar(20) DEFAULT 'thailand',
  `status` varchar(50) DEFAULT 'OK',
  `beforeMeterNo` varchar(255) DEFAULT '1',
  `metricsMeterNo` varchar(255) DEFAULT '2',
  `U_email` varchar(225) NOT NULL DEFAULT '',
  `P_email` varchar(225) NOT NULL DEFAULT '',
  `phone` varchar(225) NOT NULL DEFAULT '',
  `pass_phone` varchar(225) NOT NULL DEFAULT '',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `create_by` varchar(100) DEFAULT 'administrator',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `customerName` varchar(255) DEFAULT NULL,
  `customerPhone` varchar(50) DEFAULT NULL,
  `customerAddress` text DEFAULT NULL,
  PRIMARY KEY (`deviceID`),
  KEY `idx_devices_site` (`site`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `power_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `before_meter_no` varchar(255) DEFAULT NULL,
  `metrics_meter_no` varchar(255) DEFAULT NULL,
  `record_time` datetime NOT NULL,
  `before_L1` decimal(10,2) DEFAULT NULL,
  `before_L2` decimal(10,2) DEFAULT NULL,
  `before_L3` decimal(10,2) DEFAULT NULL,
  `before_kWh` decimal(12,3) DEFAULT NULL,
  `before_P` decimal(12,3) DEFAULT NULL,
  `before_Q` decimal(12,3) DEFAULT NULL,
  `before_S` decimal(12,3) DEFAULT NULL,
  `before_PF` decimal(6,3) DEFAULT NULL,
  `before_THD` decimal(8,3) DEFAULT NULL,
  `before_F` decimal(8,3) DEFAULT NULL,
  `metrics_L1` decimal(10,2) DEFAULT NULL,
  `metrics_L2` decimal(10,2) DEFAULT NULL,
  `metrics_L3` decimal(10,2) DEFAULT NULL,
  `metrics_kWh` decimal(12,3) DEFAULT NULL,
  `metrics_P` decimal(12,3) DEFAULT NULL,
  `metrics_Q` decimal(12,3) DEFAULT NULL,
  `metrics_S` decimal(12,3) DEFAULT NULL,
  `metrics_PF` decimal(6,3) DEFAULT NULL,
  `metrics_THD` decimal(8,3) DEFAULT NULL,
  `metrics_F` decimal(8,3) DEFAULT NULL,
  `energy_reduction` decimal(12,3) GENERATED ALWAYS AS (`before_kWh` - `metrics_kWh`) STORED,
  `co2_reduction` decimal(12,4) GENERATED ALWAYS AS ((`before_kWh` - `metrics_kWh`) * 0.5135) STORED,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) NOT NULL DEFAULT 'Auto influxdb',
  `deviceID` int DEFAULT NULL,
  `series_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_power_records_device_id` (`device_id`),
  KEY `idx_power_records_record_time` (`record_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `power_records_preinstall` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int NOT NULL,
  `record_time` datetime NOT NULL,
  `before_kWh` decimal(12,3) DEFAULT NULL,
  `metrics_kWh` decimal(12,3) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_preinstall_device` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `rating` int DEFAULT 0,
  `branch` varchar(50) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) DEFAULT 'anonymous',
  PRIMARY KEY (`id`),
  KEY `idx_feedback_status` (`status`),
  KEY `idx_feedback_branch` (`branch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(50) NOT NULL,
  `user_id` int NOT NULL DEFAULT 1,
  `subject` text NOT NULL,
  `type` varchar(100) NOT NULL,
  `priority` varchar(50) NOT NULL DEFAULT 'Normal',
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `description` text DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `created_by` varchar(100) DEFAULT 'system',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ticket_id` (`ticket_id`),
  KEY `idx_tickets_user` (`user_id`),
  KEY `idx_tickets_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `device_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `device_id` int DEFAULT NULL,
  `site` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `severity` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_site` (`site`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
