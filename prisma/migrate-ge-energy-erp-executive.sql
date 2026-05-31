-- GE Energy ERP — Executive department tables (PK / FK)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ge_erp_kpi_snapshot (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id INT UNSIGNED NULL COMMENT 'NULL = company-wide total',
  period_key    VARCHAR(12)  NOT NULL COMMENT 'YYYY-MM or YYYY-Qn',
  metric_key    VARCHAR(40)  NOT NULL,
  metric_label  VARCHAR(120) NULL,
  metric_value  DECIMAL(16,4) NOT NULL DEFAULT 0,
  unit          VARCHAR(24)  NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_kpi_period (department_id, period_key, metric_key),
  KEY idx_ge_erp_kpi_dept (department_id),
  KEY idx_ge_erp_kpi_period (period_key),
  CONSTRAINT fk_ge_erp_kpi_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_approval_request (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_no              VARCHAR(40)  NOT NULL,
  department_id           INT UNSIGNED NOT NULL,
  source_type             VARCHAR(40)  NOT NULL,
  source_id               INT UNSIGNED NOT NULL,
  title                   VARCHAR(200) NOT NULL,
  amount                  DECIMAL(14,2) NULL,
  requested_by            INT UNSIGNED NULL,
  status                  VARCHAR(20)  NOT NULL DEFAULT 'pending',
  priority                VARCHAR(20)  NOT NULL DEFAULT 'normal',
  due_date                DATE         NULL,
  reviewed_by_user_id     VARCHAR(191) NULL,
  reviewed_at             DATETIME     NULL,
  review_note             TEXT         NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_approval_no (request_no),
  UNIQUE KEY uk_ge_erp_approval_source (source_type, source_id),
  KEY idx_ge_erp_approval_status (status),
  KEY idx_ge_erp_approval_dept (department_id),
  CONSTRAINT fk_ge_erp_approval_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_approval_employee
    FOREIGN KEY (requested_by) REFERENCES ge_erp_employee (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_ai_insight (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  insight_type        VARCHAR(20)  NOT NULL COMMENT 'performance|issue|growth',
  department_id       INT UNSIGNED NULL,
  period_key          VARCHAR(12)  NULL,
  title               VARCHAR(200) NOT NULL,
  summary             TEXT         NULL,
  problem_detail      TEXT         NULL,
  fix_recommendation  TEXT         NULL,
  trend_direction     VARCHAR(12)  NULL COMMENT 'up|down|stable',
  trend_pct           DECIMAL(8,2) NULL,
  severity            VARCHAR(20)  NOT NULL DEFAULT 'info',
  is_resolved         TINYINT(1)   NOT NULL DEFAULT 0,
  generated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_ai_type (insight_type),
  KEY idx_ge_erp_ai_dept (department_id),
  KEY idx_ge_erp_ai_generated (generated_at),
  CONSTRAINT fk_ge_erp_ai_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_daily_work_report (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_date   DATE         NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  employee_id   INT UNSIGNED NULL,
  reporter_name VARCHAR(120) NULL,
  work_summary  TEXT         NOT NULL,
  hours_worked  DECIMAL(5,2) NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'submitted',
  created_by    VARCHAR(191) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_daily_report_date (report_date),
  KEY idx_ge_erp_daily_report_dept (department_id),
  KEY idx_ge_erp_daily_report_emp (employee_id),
  CONSTRAINT fk_ge_erp_daily_report_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_daily_report_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
