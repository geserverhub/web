import { readFileSync } from 'fs';
import { join } from 'path';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ERP_NAV_STRUCTURE } from '@/lib/ge-energy-erp-i18n';
import { ERP_PAGE_UI } from '@/lib/erp-page-ui';
import { getErpPageData, ERP_REPORT_PAGES, ERP_CARD_PAGES } from '@/lib/erp-page-registry';

let schemaReady = false;

const UI_TYPE_ALIASES = {
  'after-sales-chat-live': 'chat-live',
  'dept-daily-report': 'dept-daily',
  'dept-monthly-summary': 'dept-monthly',
  'face-attendance-scan': 'face-attendance',
};

function normalizeUiType(type) {
  const raw = String(type || 'form');
  const mapped = UI_TYPE_ALIASES[raw] || raw;
  return mapped.length > 20 ? mapped.slice(0, 20) : mapped;
}

export async function ensureGeErpSchema() {
  await ensureUiTypeColumnWidth();
  if (schemaReady) return;

  const sqlPath = join(process.cwd(), 'prisma', 'migrate-ge-energy-erp.sql');
  const raw = readFileSync(sqlPath, 'utf8');
  const statements = raw
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0 && !/^SET /i.test(s));

  for (const stmt of statements) {
    try {
      await queryGeserverhub(stmt);
    } catch (err) {
      const msg = err?.message || '';
      if (
        /already exists|Duplicate column|Duplicate key name|Can't DROP|errno: 121|errno: 1061|errno: 1826/i.test(
          msg
        )
      ) {
        continue;
      }
      throw err;
    }
  }

  await seedErpMeta();
  schemaReady = true;
}

/** Existing DBs may still have ui_type VARCHAR(20); widen for longer page types. */
async function ensureUiTypeColumnWidth() {
  try {
    await queryGeserverhub(
      `ALTER TABLE ge_erp_page MODIFY COLUMN ui_type VARCHAR(64) NOT NULL DEFAULT 'form'`
    );
  } catch (err) {
    const msg = err?.message || '';
    if (/doesn't exist|Unknown column/i.test(msg)) return;
    throw err;
  }
}

export async function seedErpMeta() {
  await ensureUiTypeColumnWidth();

  const deptRows = [
    ['executive', 'ฝ่ายผู้บริหาร', 'Executive', 0],
    ['production', 'ฝ่ายผลิต', 'Production', 1],
    ['marketing', 'ฝ่ายการตลาด', 'Marketing', 2],
    ['accounting', 'ฝ่ายบัญชี', 'Accounting', 3],
    ['hr', 'ฝ่ายทรัพยากรบุคคล', 'Human Resources', 4],
    ['rnd', 'ฝ่ายวิจัยและพัฒนา', 'R&D', 5],
  ];

  for (const [code, nameTh, nameEn, sort] of deptRows) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_department (code, name_th, name_en, sort_order)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name_th = VALUES(name_th), name_en = VALUES(name_en)`,
      [code, nameTh, nameEn, sort]
    );
  }

  for (const dept of ERP_NAV_STRUCTURE) {
    const [dRow] = await queryGeserverhub(
      `SELECT id FROM ge_erp_department WHERE code = ? LIMIT 1`,
      [dept.id]
    );
    if (!dRow?.id) continue;
    const deptId = dRow.id;

    for (const pageKey of dept.pages) {
      const ui = ERP_PAGE_UI[pageKey];
      const data = getErpPageData(pageKey);
      const uiType = normalizeUiType(ui?.type || 'form');
      const tableName = data?.table || data?.cardsTable || null;
      await queryGeserverhub(
        `INSERT INTO ge_erp_page (department_id, page_key, ui_type, table_name)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE department_id = VALUES(department_id), ui_type = VALUES(ui_type), table_name = VALUES(table_name)`,
        [deptId, pageKey, uiType, tableName]
      );
    }
  }

  const manualKeys = ['sop', 'safety', 'equipment', 'training'];
  for (const key of manualKeys) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_manual_doc (doc_key, title) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title)`,
      [key, key]
    );
  }
  const softwareKeys = ['cad', 'simulation', 'data', 'license'];
  for (const key of softwareKeys) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_software_asset (asset_key, name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [key, key]
    );
  }
}

async function resolveFk(resolve, value) {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (/^\d+$/.test(v)) return Number(v);

  const resolvers = {
    productBySku: async () => {
      const [r] = await queryGeserverhub(`SELECT id FROM ge_erp_product WHERE sku = ? LIMIT 1`, [v]);
      return r?.id ?? null;
    },
    productByName: async () => {
      const [r] = await queryGeserverhub(`SELECT id FROM ge_erp_product WHERE name = ? LIMIT 1`, [v]);
      return r?.id ?? null;
    },
    customerByCompany: async () => {
      const [r] = await queryGeserverhub(`SELECT id FROM ge_erp_customer WHERE company = ? LIMIT 1`, [v]);
      return r?.id ?? null;
    },
    vendorByName: async () => {
      const [r] = await queryGeserverhub(`SELECT id FROM ge_erp_vendor WHERE name = ? LIMIT 1`, [v]);
      if (r?.id) return r.id;
      const ins = await queryGeserverhub(`INSERT INTO ge_erp_vendor (name) VALUES (?)`, [v]);
      return ins[0]?.insertId;
    },
    invoiceByNo: async () => {
      const [r] = await queryGeserverhub(`SELECT id FROM ge_erp_invoice WHERE invoice_no = ? LIMIT 1`, [v]);
      return r?.id ?? null;
    },
    employeeByCode: async () => {
      const [r] = await queryGeserverhub(
        `SELECT id FROM ge_erp_employee WHERE employee_code = ? LIMIT 1`,
        [v]
      );
      return r?.id ?? null;
    },
    employeeByName: async () => {
      const [r] = await queryGeserverhub(
        `SELECT id FROM ge_erp_employee WHERE full_name = ? LIMIT 1`,
        [v]
      );
      if (r?.id) return r.id;
      const code = `EMP-${Date.now().toString(36).slice(-6)}`;
      const ins = await queryGeserverhub(
        `INSERT INTO ge_erp_employee (employee_code, full_name) VALUES (?, ?)`,
        [code, v]
      );
      return ins[0]?.insertId;
    },
    projectByName: async () => {
      const [r] = await queryGeserverhub(
        `SELECT id FROM ge_erp_project WHERE project_name = ? OR project_code = ? LIMIT 1`,
        [v, v]
      );
      return r?.id ?? null;
    },
    productionOrderByProductName: async () => {
      const [r] = await queryGeserverhub(
        `SELECT o.id FROM ge_erp_production_order o
         JOIN ge_erp_product p ON p.id = o.product_id
         WHERE p.name = ? ORDER BY o.id DESC LIMIT 1`,
        [v]
      );
      return r?.id ?? null;
    },
  };

  const fn = resolvers[resolve];
  return fn ? fn() : null;
}

function normalizeFieldBinding(binding) {
  if (typeof binding === 'string') return { column: binding, resolve: null };
  if (binding?.column) return binding;
  return null;
}

export async function insertErpRow(pageId, payload, createdBy) {
  await ensureGeErpSchema();
  const cfg = getErpPageData(pageId);
  if (!cfg?.table || !cfg.fields) {
    throw new Error(`Page "${pageId}" is not writable`);
  }

  const cols = ['created_by'];
  const vals = [createdBy || null];
  const placeholders = ['?'];

  const usedColumns = new Set();

  for (const [uiKey, binding] of Object.entries(cfg.fields)) {
    if (payload[uiKey] === undefined || payload[uiKey] === '') continue;
    const norm = normalizeFieldBinding(binding);
    if (!norm) continue;

    if (binding.altOnly) {
      const primaryFilled = Object.entries(cfg.fields).some(
        ([k, b]) =>
          k !== uiKey &&
          normalizeFieldBinding(b)?.column === norm.column &&
          !b.altOnly &&
          payload[k] !== undefined &&
          payload[k] !== ''
      );
      if (primaryFilled) continue;
    }

    if (usedColumns.has(norm.column)) continue;

    let value = payload[uiKey];
    if (norm.resolve) {
      value = await resolveFk(norm.resolve, value);
      if (value == null) continue;
    }
    cols.push(norm.column);
    vals.push(value);
    placeholders.push('?');
    usedColumns.add(norm.column);
  }

  if (cols.length === 1) {
    throw new Error('No data to save');
  }

  const sql = `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
  const result = await queryGeserverhub(sql, vals);
  return { id: result[0]?.insertId };
}

export async function listErpRows(pageId) {
  await ensureGeErpSchema();
  const cfg = getErpPageData(pageId);

  if (ERP_REPORT_PAGES.has(pageId) && cfg?.reportSql) {
    const [row] = await queryGeserverhub(cfg.reportSql);
    return { type: 'report', metrics: row || {} };
  }

  if (ERP_CARD_PAGES.has(pageId) && cfg?.cardsTable) {
    const rows = await queryGeserverhub(
      `SELECT id, doc_key, asset_key, title, name FROM ${cfg.cardsTable} ORDER BY id DESC LIMIT 50`
    );
    return { type: 'cards', rows };
  }

  if (cfg?.listSql) {
    const rows = await queryGeserverhub(cfg.listSql);
    return { type: 'list', rows };
  }

  if (cfg?.table) {
    const rows = await queryGeserverhub(`SELECT * FROM ${cfg.table} ORDER BY id DESC LIMIT 200`);
    return { type: 'list', rows };
  }

  return { type: 'empty', rows: [] };
}
