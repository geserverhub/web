-- GE Energy ERP — full schema (PK / FK)
-- Run: mysql goeunserverhub < prisma/migrate-ge-energy-erp.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Meta: departments & pages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_department (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(40)  NOT NULL,
  name_th     VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_dept_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_page (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id INT UNSIGNED NOT NULL,
  page_key      VARCHAR(80)  NOT NULL,
  ui_type       VARCHAR(20)  NOT NULL DEFAULT 'form',
  table_name    VARCHAR(80)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_page_key (page_key),
  KEY idx_ge_erp_page_dept (department_id),
  CONSTRAINT fk_ge_erp_page_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ACL: page_id column stores page_key (legacy API name)
CREATE TABLE IF NOT EXISTS ge_erp_page_permissions (
  user_id    VARCHAR(191) NOT NULL,
  page_id    VARCHAR(80)  NOT NULL,
  is_allowed TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, page_id),
  KEY idx_ge_erp_perm_user (user_id),
  CONSTRAINT fk_ge_erp_perm_page
    FOREIGN KEY (page_id) REFERENCES ge_erp_page (page_key)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Shared masters ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_employee (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_code VARCHAR(40)  NOT NULL,
  user_id       VARCHAR(191) NULL,
  full_name     VARCHAR(120) NOT NULL,
  department_id INT UNSIGNED NULL,
  position      VARCHAR(80)  NULL,
  phone         VARCHAR(40)  NULL,
  email         VARCHAR(191) NULL,
  hire_date     DATE         NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_by    VARCHAR(191) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_employee_code (employee_code),
  KEY idx_ge_erp_employee_user (user_id),
  KEY idx_ge_erp_employee_dept (department_id),
  CONSTRAINT fk_ge_erp_employee_dept
    FOREIGN KEY (department_id) REFERENCES ge_erp_department (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_product (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku         VARCHAR(60)  NOT NULL,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(80)  NULL,
  unit        VARCHAR(20)  NOT NULL DEFAULT 'ชิ้น',
  price       DECIMAL(14,2) NOT NULL DEFAULT 0,
  stock_qty   INT          NOT NULL DEFAULT 0,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_product_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_customer (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  company     VARCHAR(200) NOT NULL,
  contact     VARCHAR(120) NULL,
  phone       VARCHAR(40)  NULL,
  email       VARCHAR(191) NULL,
  address     TEXT         NULL,
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_vendor (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200) NOT NULL,
  tax_id      VARCHAR(20)  NULL,
  phone       VARCHAR(40)  NULL,
  email       VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_project (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_code VARCHAR(40)  NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  lead_name    VARCHAR(120) NULL,
  budget       DECIMAL(14,2) NOT NULL DEFAULT 0,
  start_date   DATE         NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_by   VARCHAR(191) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_project_code (project_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Production ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_equipment_stock (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id         INT UNSIGNED NOT NULL,
  warehouse_location VARCHAR(80)  NOT NULL DEFAULT 'main',
  quantity           INT          NOT NULL DEFAULT 0,
  unit               VARCHAR(20)  NOT NULL DEFAULT 'ชิ้น',
  status             VARCHAR(20)  NOT NULL DEFAULT 'available',
  created_by         VARCHAR(191) NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_eq_stock_product (product_id),
  CONSTRAINT fk_ge_erp_eq_stock_product
    FOREIGN KEY (product_id) REFERENCES ge_erp_product (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_production_order (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no    VARCHAR(40)  NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  quantity    INT          NOT NULL DEFAULT 0,
  line_name   VARCHAR(80)  NULL,
  start_date  DATE         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'planned',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_prod_order_no (order_no),
  KEY idx_ge_erp_prod_order_product (product_id),
  CONSTRAINT fk_ge_erp_prod_order_product
    FOREIGN KEY (product_id) REFERENCES ge_erp_product (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_quality_check (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  production_order_id INT UNSIGNED NOT NULL,
  batch_no            VARCHAR(40)  NOT NULL,
  inspector_name      VARCHAR(120) NULL,
  result_status       VARCHAR(20)  NOT NULL DEFAULT 'pass',
  checked_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by          VARCHAR(191) NULL,
  PRIMARY KEY (id),
  KEY idx_ge_erp_qc_order (production_order_id),
  CONSTRAINT fk_ge_erp_qc_order
    FOREIGN KEY (production_order_id) REFERENCES ge_erp_production_order (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Marketing ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_customer_contact (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL,
  contact_date DATE        NOT NULL,
  channel     VARCHAR(40)  NULL,
  topic       VARCHAR(200) NULL,
  owner_name  VARCHAR(120) NULL,
  next_step   VARCHAR(200) NULL,
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_cust_contact (customer_id),
  CONSTRAINT fk_ge_erp_cust_contact
    FOREIGN KEY (customer_id) REFERENCES ge_erp_customer (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_marketing_campaign (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  campaign    VARCHAR(120) NOT NULL,
  period_label VARCHAR(80) NULL,
  channel     VARCHAR(40)  NULL,
  budget      DECIMAL(14,2) NOT NULL DEFAULT 0,
  owner_name  VARCHAR(120) NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_sales_order (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no    VARCHAR(40)  NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NULL,
  quantity    INT          NOT NULL DEFAULT 1,
  due_date    DATE         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'open',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_sales_order_no (order_no),
  KEY idx_ge_erp_sales_customer (customer_id),
  KEY idx_ge_erp_sales_product (product_id),
  CONSTRAINT fk_ge_erp_sales_customer
    FOREIGN KEY (customer_id) REFERENCES ge_erp_customer (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_sales_product
    FOREIGN KEY (product_id) REFERENCES ge_erp_product (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_shipment (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  shipment_no         VARCHAR(40)  NOT NULL,
  production_order_id INT UNSIGNED NULL,
  sales_order_id      INT UNSIGNED NULL,
  customer_id         INT UNSIGNED NULL,
  carrier             VARCHAR(80)  NULL,
  ship_date           DATE         NULL,
  status              VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_by          VARCHAR(191) NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_shipment_no (shipment_no),
  KEY idx_ge_erp_shipment_prod (production_order_id),
  KEY idx_ge_erp_shipment_sales (sales_order_id),
  KEY idx_ge_erp_shipment_customer (customer_id),
  CONSTRAINT fk_ge_erp_shipment_prod
    FOREIGN KEY (production_order_id) REFERENCES ge_erp_production_order (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_shipment_sales
    FOREIGN KEY (sales_order_id) REFERENCES ge_erp_sales_order (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_shipment_customer
    FOREIGN KEY (customer_id) REFERENCES ge_erp_customer (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Accounting ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_purchase_order (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  po_no       VARCHAR(40)  NOT NULL,
  vendor_id   INT UNSIGNED NOT NULL,
  item_desc   VARCHAR(200) NULL,
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  due_date    DATE         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'open',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_po_no (po_no),
  KEY idx_ge_erp_po_vendor (vendor_id),
  CONSTRAINT fk_ge_erp_po_vendor
    FOREIGN KEY (vendor_id) REFERENCES ge_erp_vendor (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_invoice (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_no  VARCHAR(40)  NOT NULL,
  customer_id INT UNSIGNED NOT NULL,
  sales_order_id INT UNSIGNED NULL,
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  due_date    DATE         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_invoice_no (invoice_no),
  KEY idx_ge_erp_invoice_customer (customer_id),
  CONSTRAINT fk_ge_erp_invoice_customer
    FOREIGN KEY (customer_id) REFERENCES ge_erp_customer (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_invoice_sales
    FOREIGN KEY (sales_order_id) REFERENCES ge_erp_sales_order (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_tax_invoice (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tax_invoice_no  VARCHAR(40)  NOT NULL,
  customer_id     INT UNSIGNED NOT NULL,
  invoice_id      INT UNSIGNED NULL,
  tax_id          VARCHAR(20)  NULL,
  vat_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by      VARCHAR(191) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_tax_inv_no (tax_invoice_no),
  CONSTRAINT fk_ge_erp_tax_inv_customer
    FOREIGN KEY (customer_id) REFERENCES ge_erp_customer (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_tax_inv_invoice
    FOREIGN KEY (invoice_id) REFERENCES ge_erp_invoice (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_credit_note (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  credit_note_no  VARCHAR(40)  NOT NULL,
  invoice_id      INT UNSIGNED NULL,
  reason          TEXT         NULL,
  amount          DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by      VARCHAR(191) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_cn_no (credit_note_no),
  CONSTRAINT fk_ge_erp_cn_invoice
    FOREIGN KEY (invoice_id) REFERENCES ge_erp_invoice (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_expense (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  expense_date DATE         NOT NULL,
  category     VARCHAR(80)  NOT NULL,
  payee        VARCHAR(120) NULL,
  amount       DECIMAL(14,2) NOT NULL DEFAULT 0,
  note         TEXT         NULL,
  created_by   VARCHAR(191) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Human Resources ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_leave_request (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  leave_type  VARCHAR(40)  NOT NULL,
  leave_from  DATE         NOT NULL,
  leave_to    DATE         NOT NULL,
  reason      TEXT         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_leave_emp (employee_id),
  CONSTRAINT fk_ge_erp_leave_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_attendance_log (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  log_date    DATE         NOT NULL,
  check_in    TIME         NULL,
  check_out   TIME         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'present',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_attendance_emp_date (employee_id, log_date),
  CONSTRAINT fk_ge_erp_attendance_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_payroll_record (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id  INT UNSIGNED NOT NULL,
  salary_month CHAR(7)     NOT NULL COMMENT 'YYYY-MM',
  base_salary  DECIMAL(14,2) NOT NULL DEFAULT 0,
  note         TEXT         NULL,
  created_by   VARCHAR(191) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ge_erp_payroll_emp (employee_id),
  CONSTRAINT fk_ge_erp_payroll_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_document_request (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id   INT UNSIGNED NOT NULL,
  document_type VARCHAR(80)  NOT NULL,
  purpose       TEXT         NULL,
  due_date      DATE         NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_doc_req_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_offsite_work_request (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id   INT UNSIGNED NOT NULL,
  work_date     DATE         NOT NULL,
  work_location VARCHAR(200) NULL,
  purpose       TEXT         NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_offsite_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_hr_purchase_request (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  item_desc   VARCHAR(200) NOT NULL,
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  purpose     TEXT         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_hr_pr_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_suggestion (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  idea_title  VARCHAR(200) NOT NULL,
  idea_detail TEXT         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'submitted',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_suggestion_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_expense_reimbursement (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  expense_date DATE        NOT NULL,
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  purpose     TEXT         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_reimb_emp
    FOREIGN KEY (employee_id) REFERENCES ge_erp_employee (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── R&D ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ge_erp_research_update (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NOT NULL,
  milestone   VARCHAR(120) NULL,
  progress_pct TINYINT UNSIGNED NOT NULL DEFAULT 0,
  summary     TEXT         NULL,
  created_by  VARCHAR(191) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_research_project
    FOREIGN KEY (project_id) REFERENCES ge_erp_project (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_budget_expense (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NOT NULL,
  category    VARCHAR(80)  NOT NULL,
  amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  expense_date DATE        NOT NULL,
  approver    VARCHAR(120) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_budget_exp_project
    FOREIGN KEY (project_id) REFERENCES ge_erp_project (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_research_budget_request (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id       INT UNSIGNED NOT NULL,
  requested_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  purpose          TEXT         NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_rb_req_project
    FOREIGN KEY (project_id) REFERENCES ge_erp_project (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_grant_income (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id    INT UNSIGNED NOT NULL,
  grant_no      VARCHAR(40)  NOT NULL,
  sponsor       VARCHAR(120) NULL,
  amount        DECIMAL(14,2) NOT NULL DEFAULT 0,
  received_date DATE         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_grant_project
    FOREIGN KEY (project_id) REFERENCES ge_erp_project (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_manual_doc (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  doc_key     VARCHAR(40)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  file_url    VARCHAR(500) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_manual_doc_key (doc_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_software_asset (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_key   VARCHAR(40)  NOT NULL,
  name        VARCHAR(200) NOT NULL,
  license_no  VARCHAR(80)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_software_asset_key (asset_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_ip_patent (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NULL,
  ip_no       VARCHAR(40)  NOT NULL,
  title       VARCHAR(200) NOT NULL,
  ip_type     VARCHAR(40)  NULL,
  filed_date  DATE         NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ge_erp_ip_project
    FOREIGN KEY (project_id) REFERENCES ge_erp_project (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ge_erp_issue_report (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_no   VARCHAR(40)  NOT NULL,
  page_key    VARCHAR(80)  NULL,
  module_name VARCHAR(80)  NULL,
  severity    VARCHAR(20)  NOT NULL DEFAULT 'normal',
  reporter_id INT UNSIGNED NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'open',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ge_erp_issue_ticket (ticket_no),
  CONSTRAINT fk_ge_erp_issue_page
    FOREIGN KEY (page_key) REFERENCES ge_erp_page (page_key)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ge_erp_issue_reporter
    FOREIGN KEY (reporter_id) REFERENCES ge_erp_employee (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
