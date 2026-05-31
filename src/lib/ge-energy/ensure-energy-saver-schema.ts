import { queryGeserverhub } from '@/lib/geserverhub-db';

export async function ensureEnergySaverOrderSchema() {
  await queryGeserverhub(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
