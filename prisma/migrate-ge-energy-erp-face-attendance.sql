-- GE ERP — face enrollment + face scan attendance (HR)
USE goeunserverhub;

CREATE TABLE IF NOT EXISTS ge_erp_employee_face (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id     INT UNSIGNED NOT NULL,
  face_descriptor JSON         NOT NULL COMMENT '128-d float array from face-api',
  photo_path      VARCHAR(512) NOT NULL,
  is_primary      TINYINT(1)   NOT NULL DEFAULT 1,
  enrolled_by     VARCHAR(191) NULL,
  enrolled_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_face_employee (employee_id),
  KEY idx_ge_erp_face_primary (is_primary),
  CONSTRAINT fk_ge_erp_face_employee
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_face_attendance (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id  INT UNSIGNED NOT NULL,
  event_type   ENUM('check_in','check_out') NOT NULL,
  captured_at  DATETIME     NOT NULL,
  photo_path   VARCHAR(512) NOT NULL,
  match_score  DECIMAL(8,5) NOT NULL COMMENT 'lower = better match',
  face_id      INT UNSIGNED NULL,
  device_note  VARCHAR(255) NULL,
  created_by   VARCHAR(191) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_face_att_emp (employee_id),
  KEY idx_ge_erp_face_att_time (captured_at),
  KEY idx_ge_erp_face_att_type (event_type),
  CONSTRAINT fk_ge_erp_face_att_employee
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_face_att_face
    FOREIGN KEY (face_id) REFERENCES ge_erp_employee_face (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
