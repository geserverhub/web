import { queryGeserverhub } from '@/lib/geserverhub-db';

let ensured = false;

/** Create mqtt_settings + device_connectivity tables if missing (goeunserverhub). */
export async function ensureConnectivitySchema(): Promise<void> {
  if (ensured) return;

  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS mqtt_settings (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      site varchar(20) NOT NULL DEFAULT 'thailand',
      host varchar(255) NOT NULL,
      port int NOT NULL DEFAULT 1883,
      username varchar(255) DEFAULT NULL,
      password varchar(512) DEFAULT NULL,
      topic varchar(255) DEFAULT NULL,
      topic_prefix varchar(255) DEFAULT 'ge',
      \`interval\` int NOT NULL DEFAULT 30,
      gateway_model varchar(50) DEFAULT 'T310',
      serial_port varchar(100) DEFAULT '/dev/ttyS1',
      baud_rate int NOT NULL DEFAULT 9600,
      parity varchar(10) NOT NULL DEFAULT 'none',
      data_bits tinyint NOT NULL DEFAULT 8,
      stop_bits tinyint NOT NULL DEFAULT 1,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_mqtt_user_site (user_id, site)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS device_connectivity (
      id int NOT NULL AUTO_INCREMENT,
      device_id int NOT NULL,
      gateway_model varchar(50) DEFAULT 'T310',
      serial_port varchar(100) DEFAULT '/dev/ttyS1',
      baud_rate int NOT NULL DEFAULT 9600,
      parity varchar(10) NOT NULL DEFAULT 'none',
      data_bits tinyint NOT NULL DEFAULT 8,
      stop_bits tinyint NOT NULL DEFAULT 1,
      slave_before int NOT NULL DEFAULT 1,
      slave_metrics int NOT NULL DEFAULT 2,
      reg_v_l1 int NOT NULL DEFAULT 0,
      reg_v_l2 int NOT NULL DEFAULT 2,
      reg_v_l3 int NOT NULL DEFAULT 4,
      scale_voltage decimal(10,4) NOT NULL DEFAULT 10.0000,
      mqtt_topic varchar(255) DEFAULT NULL,
      publish_interval_sec int NOT NULL DEFAULT 30,
      enabled tinyint(1) NOT NULL DEFAULT 1,
      notes text DEFAULT NULL,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_device_connectivity_device (device_id),
      KEY idx_device_connectivity_enabled (enabled)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const addColumn = async (sql: string) => {
    try {
      await queryGeserverhub(sql);
    } catch {
      /* column may already exist */
    }
  };

  await addColumn(
    `ALTER TABLE mqtt_settings ADD COLUMN topic_prefix varchar(255) DEFAULT 'ge' AFTER topic`
  );
  await addColumn(
    `ALTER TABLE mqtt_settings ADD COLUMN gateway_model varchar(50) DEFAULT 'T310' AFTER \`interval\``
  );
  await addColumn(
    `ALTER TABLE mqtt_settings ADD COLUMN serial_port varchar(100) DEFAULT '/dev/ttyS1' AFTER gateway_model`
  );
  await addColumn(`ALTER TABLE mqtt_settings ADD COLUMN baud_rate int NOT NULL DEFAULT 9600 AFTER serial_port`);
  await addColumn(
    `ALTER TABLE mqtt_settings ADD COLUMN parity varchar(10) NOT NULL DEFAULT 'none' AFTER baud_rate`
  );
  await addColumn(`ALTER TABLE mqtt_settings ADD COLUMN data_bits tinyint NOT NULL DEFAULT 8 AFTER parity`);
  await addColumn(`ALTER TABLE mqtt_settings ADD COLUMN stop_bits tinyint NOT NULL DEFAULT 1 AFTER data_bits`);

  ensured = true;
}
