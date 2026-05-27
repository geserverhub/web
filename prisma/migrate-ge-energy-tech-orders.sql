-- GE Energy Tech — meter orders & shipment tracking (goeunserverhub)
-- Run: mysql goeunserverhub < prisma/migrate-ge-energy-tech-orders.sql

USE goeunserverhub;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS geet_meter_order (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no         VARCHAR(32)     NOT NULL,
  buyer_name       VARCHAR(200)    NOT NULL,
  ship_address     TEXT            NOT NULL,
  email            VARCHAR(191)    NOT NULL,
  phone            VARCHAR(40)     NOT NULL,
  breaker_amps     VARCHAR(40)     NOT NULL,
  machine_kva      VARCHAR(40)     NOT NULL,
  quantity         INT UNSIGNED    NOT NULL DEFAULT 1,
  unit_price       INT UNSIGNED    NOT NULL,
  total_price      INT UNSIGNED    NOT NULL,
  lang             VARCHAR(10)     NOT NULL DEFAULT 'th',
  product_code     VARCHAR(80)     NOT NULL DEFAULT 'smart-meter',
  payment_status   VARCHAR(30)     NOT NULL DEFAULT 'pending',
  shipment_status  VARCHAR(30)     NOT NULL DEFAULT 'pending',
  site_photo_path  VARCHAR(500)    NULL,
  payment_slip_path VARCHAR(500)   NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_geet_meter_order_no (order_no),
  KEY idx_geet_meter_order_email (email),
  KEY idx_geet_meter_order_shipment (shipment_status),
  KEY idx_geet_meter_order_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geet_meter_order_event (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    BIGINT UNSIGNED NOT NULL,
  status_key  VARCHAR(30)     NOT NULL,
  note        VARCHAR(500)    NULL,
  event_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_geet_meter_event_order (order_id),
  KEY idx_geet_meter_event_status (status_key),
  CONSTRAINT fk_geet_meter_event_order
    FOREIGN KEY (order_id) REFERENCES geet_meter_order (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
