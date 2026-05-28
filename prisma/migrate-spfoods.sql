-- ============================================================
-- SPFoods database full schema  (spfoods_db)
-- Creates all tables that are NOT in seed.js
-- seed.js already creates: departments, admin_users, registrations, orders
-- ============================================================

-- ── Lookup / master tables ────────────────────────────────

CREATE TABLE IF NOT EXISTS product_categories (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  description   TEXT         NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS registration_types (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_registration_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Debtor classification ─────────────────────────────────

CREATE TABLE IF NOT EXISTS debtor_types (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_debtor_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debtor_grades (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_debtor_grades_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debtor_areas (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_debtor_areas_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Expense master ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(120) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expense_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Core business tables ──────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  product_code    VARCHAR(40)     NOT NULL,
  product_name    VARCHAR(255)    NOT NULL,
  category_id     INT UNSIGNED    NULL,
  unit            VARCHAR(40)     NOT NULL DEFAULT 'กล่อง',
  price_cost      DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_cost_thb  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_cost_krw  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_cost_usd  DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  price_cost_cny  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_sell      DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_sell_thb  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_sell_krw  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  price_sell_usd  DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  price_sell_cny  DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  stock_qty       DECIMAL(14,3)   NOT NULL DEFAULT 0,
  min_stock       DECIMAL(14,3)   NOT NULL DEFAULT 0,
  description     TEXT            NULL,
  image_path      VARCHAR(255)    NULL,
  active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_code (product_code),
  KEY idx_products_category (category_id),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES product_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  customer_code   VARCHAR(20)   NOT NULL,
  customer_name   VARCHAR(255)  NOT NULL,
  contact_person  VARCHAR(120)  NULL,
  phone           VARCHAR(30)   NOT NULL,
  email           VARCHAR(120)  NULL,
  address         TEXT          NULL,
  subdistrict     VARCHAR(100)  NULL,
  district        VARCHAR(100)  NULL,
  province        VARCHAR(100)  NULL,
  country         VARCHAR(60)   NOT NULL DEFAULT 'ไทย',
  tax_id          VARCHAR(20)   NULL,
  payment_type    ENUM('cash','credit') NOT NULL DEFAULT 'cash',
  currency        VARCHAR(10)   NOT NULL DEFAULT 'THB',
  credit_limit    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  credit_days     INT           NOT NULL DEFAULT 0,
  debtor_type_id  INT UNSIGNED  NULL,
  debtor_grade_id INT UNSIGNED  NULL,
  debtor_area_id  INT UNSIGNED  NULL,
  note            TEXT          NULL,
  active          TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_code (customer_code),
  KEY idx_customers_phone (phone),
  CONSTRAINT fk_customers_debtor_type
    FOREIGN KEY (debtor_type_id)  REFERENCES debtor_types  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customers_debtor_grade
    FOREIGN KEY (debtor_grade_id) REFERENCES debtor_grades (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customers_debtor_area
    FOREIGN KEY (debtor_area_id)  REFERENCES debtor_areas  (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Inventory ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED  NOT NULL,
  qty         DECIMAL(14,3) NOT NULL DEFAULT 0,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stock_product (product_id),
  CONSTRAINT fk_stock_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id    INT UNSIGNED    NOT NULL,
  movement_type ENUM('in','out','adjust') NOT NULL,
  ref_type      VARCHAR(40)     NULL,
  ref_id        INT UNSIGNED    NULL,
  qty           DECIMAL(14,3)   NOT NULL,
  qty_before    DECIMAL(14,3)   NOT NULL DEFAULT 0,
  qty_after     DECIMAL(14,3)   NOT NULL DEFAULT 0,
  unit          VARCHAR(40)     NULL,
  note          TEXT            NULL,
  created_by    VARCHAR(80)     NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_stock_movements_product (product_id),
  KEY idx_stock_movements_ref     (ref_type, ref_id),
  CONSTRAINT fk_stock_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sales ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales_orders (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  so_no            VARCHAR(30)   NOT NULL,
  customer_id      INT UNSIGNED  NULL,
  customer_name    VARCHAR(255)  NOT NULL,
  customer_address TEXT          NULL,
  customer_tax_id  VARCHAR(20)   NULL,
  so_date          DATE          NULL,
  due_date         DATE          NULL,
  payment_type     VARCHAR(20)   NULL,
  payment_terms    VARCHAR(40)   NULL,
  currency         VARCHAR(10)   NOT NULL DEFAULT 'THB',
  contract_no      VARCHAR(40)   NULL,
  contract_id      INT UNSIGNED  NULL,
  subtotal         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  vat_amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  total_amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status           VARCHAR(30)   NOT NULL DEFAULT 'draft',
  note             TEXT          NULL,
  created_by       VARCHAR(80)   NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sales_orders_no (so_no),
  KEY idx_sales_orders_customer (customer_id),
  KEY idx_sales_orders_date     (so_date),
  CONSTRAINT fk_sales_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_order_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  so_id        INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NULL,
  product_name VARCHAR(255)  NOT NULL,
  unit         VARCHAR(40)   NULL,
  qty          DECIMAL(14,3) NOT NULL DEFAULT 0,
  price_unit   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  discount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_so_items_so      (so_id),
  KEY idx_so_items_product (product_id),
  CONSTRAINT fk_so_items_so
    FOREIGN KEY (so_id)       REFERENCES sales_orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_so_items_product
    FOREIGN KEY (product_id)  REFERENCES products     (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Purchase ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS purchase_orders (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  po_no             VARCHAR(30)   NOT NULL,
  supplier_name     VARCHAR(255)  NOT NULL,
  supplier_contact  VARCHAR(120)  NULL,
  order_date        DATE          NULL,
  due_date          DATE          NULL,
  total_amount      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  vat_amount        DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  net_amount        DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status            VARCHAR(30)   NOT NULL DEFAULT 'draft',
  note              TEXT          NULL,
  created_by        VARCHAR(80)   NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_purchase_orders_no (po_no),
  KEY idx_purchase_orders_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  po_id        INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NULL,
  product_name VARCHAR(255)  NOT NULL,
  unit         VARCHAR(40)   NULL,
  qty          DECIMAL(14,3) NOT NULL DEFAULT 0,
  price_unit   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_po_items_po      (po_id),
  KEY idx_po_items_product (product_id),
  CONSTRAINT fk_po_items_po
    FOREIGN KEY (po_id)      REFERENCES purchase_orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_po_items_product
    FOREIGN KEY (product_id) REFERENCES products        (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Goods Receipt ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goods_receipts (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  receipt_no    VARCHAR(30)   NOT NULL,
  po_id         INT UNSIGNED  NULL,
  supplier_name VARCHAR(255)  NOT NULL,
  receipt_date  DATE          NULL,
  total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status        VARCHAR(30)   NOT NULL DEFAULT 'draft',
  note          TEXT          NULL,
  created_by    VARCHAR(80)   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_goods_receipts_no (receipt_no),
  KEY idx_goods_receipts_po (po_id),
  CONSTRAINT fk_goods_receipts_po
    FOREIGN KEY (po_id) REFERENCES purchase_orders (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  receipt_id    INT UNSIGNED  NOT NULL,
  product_id    INT UNSIGNED  NULL,
  product_name  VARCHAR(255)  NOT NULL,
  unit          VARCHAR(40)   NULL,
  qty_ordered   DECIMAL(14,3) NOT NULL DEFAULT 0,
  qty_received  DECIMAL(14,3) NOT NULL DEFAULT 0,
  price_unit    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  amount        DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_gr_items_receipt (receipt_id),
  KEY idx_gr_items_product (product_id),
  CONSTRAINT fk_gr_items_receipt
    FOREIGN KEY (receipt_id) REFERENCES goods_receipts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_gr_items_product
    FOREIGN KEY (product_id) REFERENCES products       (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Invoicing ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  invoice_no       VARCHAR(30)   NOT NULL,
  customer_id      INT UNSIGNED  NULL,
  customer_name    VARCHAR(255)  NOT NULL,
  customer_address TEXT          NULL,
  customer_tax_id  VARCHAR(20)   NULL,
  invoice_date     DATE          NULL,
  due_date         DATE          NULL,
  total_amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  vat_amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  net_amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  sale_type_id     INT UNSIGNED  NULL,
  status           VARCHAR(30)   NOT NULL DEFAULT 'draft',
  note             TEXT          NULL,
  created_by       VARCHAR(80)   NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_no (invoice_no),
  KEY idx_invoices_customer (customer_id),
  KEY idx_invoices_date     (invoice_date),
  CONSTRAINT fk_invoices_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tax_invoices (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  tax_invoice_no   VARCHAR(30)   NOT NULL,
  invoice_id       INT UNSIGNED  NULL,
  customer_id      INT UNSIGNED  NULL,
  customer_name    VARCHAR(255)  NOT NULL,
  customer_address TEXT          NULL,
  customer_tax_id  VARCHAR(20)   NULL,
  issue_date       DATE          NULL,
  total_amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  vat_amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  net_amount       DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status           VARCHAR(30)   NOT NULL DEFAULT 'issued',
  note             TEXT          NULL,
  created_by       VARCHAR(80)   NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tax_invoices_no (tax_invoice_no),
  KEY idx_tax_invoices_invoice  (invoice_id),
  KEY idx_tax_invoices_customer (customer_id),
  CONSTRAINT fk_tax_invoices_invoice
    FOREIGN KEY (invoice_id)  REFERENCES invoices   (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tax_invoices_customer
    FOREIGN KEY (customer_id) REFERENCES customers  (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_notes (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  credit_note_no  VARCHAR(30)   NOT NULL,
  invoice_id      INT UNSIGNED  NULL,
  customer_id     INT UNSIGNED  NULL,
  customer_name   VARCHAR(255)  NOT NULL,
  issue_date      DATE          NULL,
  reason          TEXT          NULL,
  total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status          VARCHAR(30)   NOT NULL DEFAULT 'issued',
  created_by      VARCHAR(80)   NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_credit_notes_no (credit_note_no),
  KEY idx_credit_notes_invoice  (invoice_id),
  KEY idx_credit_notes_customer (customer_id),
  CONSTRAINT fk_credit_notes_invoice
    FOREIGN KEY (invoice_id)  REFERENCES invoices  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_credit_notes_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Delivery & Claims ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS delivery_notes (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  delivery_no      VARCHAR(30)  NOT NULL,
  invoice_id       INT UNSIGNED NULL,
  customer_id      INT UNSIGNED NULL,
  customer_name    VARCHAR(255) NOT NULL,
  delivery_address TEXT         NULL,
  delivery_date    DATE         NULL,
  driver_name      VARCHAR(120) NULL,
  vehicle_no       VARCHAR(40)  NULL,
  status           VARCHAR(30)  NOT NULL DEFAULT 'pending',
  note             TEXT         NULL,
  created_by       VARCHAR(80)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_delivery_notes_no (delivery_no),
  KEY idx_delivery_notes_invoice  (invoice_id),
  KEY idx_delivery_notes_customer (customer_id),
  CONSTRAINT fk_delivery_notes_invoice
    FOREIGN KEY (invoice_id)  REFERENCES invoices  (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_notes_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS delivery_note_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  delivery_id  INT UNSIGNED  NOT NULL,
  product_id   INT UNSIGNED  NULL,
  product_name VARCHAR(255)  NOT NULL,
  unit         VARCHAR(40)   NULL,
  qty          DECIMAL(14,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_delivery_items_delivery (delivery_id),
  KEY idx_delivery_items_product  (product_id),
  CONSTRAINT fk_delivery_items_delivery
    FOREIGN KEY (delivery_id) REFERENCES delivery_notes (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_delivery_items_product
    FOREIGN KEY (product_id)  REFERENCES products       (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS claims_returns (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  claim_no      VARCHAR(30)   NOT NULL,
  invoice_id    INT UNSIGNED  NULL,
  delivery_id   INT UNSIGNED  NULL,
  customer_id   INT UNSIGNED  NULL,
  customer_name VARCHAR(255)  NOT NULL,
  claim_date    DATE          NOT NULL,
  claim_type    ENUM('claim','return') NOT NULL DEFAULT 'claim',
  reason        TEXT          NOT NULL,
  total_amount  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status        VARCHAR(30)   NOT NULL DEFAULT 'open',
  created_by    VARCHAR(80)   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_claims_returns_no (claim_no),
  KEY idx_claims_invoice  (invoice_id),
  KEY idx_claims_delivery (delivery_id),
  KEY idx_claims_customer (customer_id),
  CONSTRAINT fk_claims_invoice
    FOREIGN KEY (invoice_id)  REFERENCES invoices       (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_claims_delivery
    FOREIGN KEY (delivery_id) REFERENCES delivery_notes (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_claims_customer
    FOREIGN KEY (customer_id) REFERENCES customers      (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Production & Quality ──────────────────────────────────

CREATE TABLE IF NOT EXISTS production_orders (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_no        VARCHAR(30)   NOT NULL,
  product_id      INT UNSIGNED  NULL,
  qty_ordered     DECIMAL(14,3) NOT NULL DEFAULT 0,
  qty_produced    DECIMAL(14,3) NOT NULL DEFAULT 0,
  production_date DATE          NULL,
  due_date        DATE          NULL,
  dept_id         INT UNSIGNED  NULL,
  status          VARCHAR(30)   NOT NULL DEFAULT 'pending',
  note            TEXT          NULL,
  created_by      VARCHAR(80)   NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_production_orders_no (order_no),
  KEY idx_production_product (product_id),
  KEY idx_production_dept    (dept_id),
  CONSTRAINT fk_production_product
    FOREIGN KEY (product_id) REFERENCES products    (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_production_dept
    FOREIGN KEY (dept_id)    REFERENCES departments (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quality_checks (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  check_no            VARCHAR(30)   NOT NULL,
  production_order_id INT UNSIGNED  NULL,
  product_id          INT UNSIGNED  NULL,
  check_date          DATE          NOT NULL,
  qty_checked         DECIMAL(14,3) NOT NULL DEFAULT 0,
  qty_passed          DECIMAL(14,3) NOT NULL DEFAULT 0,
  qty_failed          DECIMAL(14,3) NOT NULL DEFAULT 0,
  result              ENUM('passed','failed','partial') NOT NULL DEFAULT 'passed',
  note                TEXT          NULL,
  checked_by          VARCHAR(80)   NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quality_checks_no (check_no),
  KEY idx_quality_production (production_order_id),
  KEY idx_quality_product    (product_id),
  CONSTRAINT fk_quality_production
    FOREIGN KEY (production_order_id) REFERENCES production_orders (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_quality_product
    FOREIGN KEY (product_id)          REFERENCES products          (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Expenses ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expenses (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  expense_no     VARCHAR(30)   NOT NULL,
  category_id    INT UNSIGNED  NULL,
  expense_date   DATE          NOT NULL,
  description    TEXT          NOT NULL,
  amount         DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  vat_amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  net_amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(30)   NOT NULL DEFAULT 'cash',
  ref_document   VARCHAR(80)   NULL,
  dept_id        INT UNSIGNED  NULL,
  status         VARCHAR(30)   NOT NULL DEFAULT 'pending',
  note           TEXT          NULL,
  created_by     VARCHAR(80)   NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expenses_no (expense_no),
  KEY idx_expenses_category (category_id),
  KEY idx_expenses_dept     (dept_id),
  KEY idx_expenses_date     (expense_date),
  CONSTRAINT fk_expenses_category
    FOREIGN KEY (category_id) REFERENCES expense_categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_dept
    FOREIGN KEY (dept_id)     REFERENCES departments        (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CRM & Feedback ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_tracking (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id      INT UNSIGNED NOT NULL,
  contract_no      VARCHAR(40)  NULL,
  interaction_type VARCHAR(40)  NOT NULL,
  service_stage    VARCHAR(40)  NULL,
  description      TEXT         NULL,
  notes            TEXT         NULL,
  created_by       VARCHAR(80)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_crm_customer (customer_id),
  KEY idx_crm_date     (created_at),
  CONSTRAINT fk_crm_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_feedback (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  so_id       INT UNSIGNED NULL,
  so_no       VARCHAR(30)  NULL,
  customer_id INT UNSIGNED NULL,
  customer_name VARCHAR(255) NULL,
  issue_type  VARCHAR(60)  NULL,
  priority    VARCHAR(20)  NOT NULL DEFAULT 'normal',
  description TEXT         NULL,
  status      VARCHAR(30)  NOT NULL DEFAULT 'open',
  created_by  VARCHAR(80)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_feedback_so       (so_id),
  KEY idx_order_feedback_customer (customer_id),
  CONSTRAINT fk_order_feedback_so
    FOREIGN KEY (so_id)       REFERENCES sales_orders (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_order_feedback_customer
    FOREIGN KEY (customer_id) REFERENCES customers    (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
