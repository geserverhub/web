import { readFileSync } from 'fs';
import { join } from 'path';
import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ensureGeErpSchema } from '@/lib/erp-db';

const DEPT_CODES = ['production', 'marketing', 'accounting', 'hr', 'rnd'];

let execSchemaReady = false;

function currentPeriodKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function ensureExecutiveSchema() {
  if (execSchemaReady) return;
  await ensureGeErpSchema();
  const sqlPath = join(process.cwd(), 'prisma', 'migrate-ge-energy-erp-executive.sql');
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
      if (/already exists|Duplicate|errno: 121|errno: 1061/i.test(msg)) continue;
      throw err;
    }
  }
  execSchemaReady = true;
}

async function deptIdByCode(code) {
  const [row] = await queryGeserverhub(
    `SELECT id FROM ge_erp_department WHERE code = ? LIMIT 1`,
    [code]
  );
  return row?.id ?? null;
}

async function getDeptReportSummary(periodKey) {
  const [year, month] = String(periodKey || currentPeriodKey())
    .split('-')
    .map((v) => Number(v));
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEndDate = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(monthEndDate).padStart(2, '0')}`;

  const summary = await queryGeserverhub(
    `SELECT d.id AS department_id, d.code AS dept_code,
            COUNT(r.id) AS daily_count,
            COUNT(DISTINCT r.report_date) AS active_days,
            COALESCE(SUM(r.hours_worked), 0) AS total_hours,
            MAX(r.report_date) AS latest_report_date
     FROM ge_erp_department d
     LEFT JOIN ge_erp_daily_work_report r
       ON r.department_id = d.id
      AND r.report_date BETWEEN ? AND ?
     WHERE d.code IN (${DEPT_CODES.map(() => '?').join(',')})
     GROUP BY d.id, d.code`,
    [monthStart, monthEnd, ...DEPT_CODES]
  );

  const latestRows = await queryGeserverhub(
    `SELECT d.id AS department_id, r.report_date, r.work_summary, r.reporter_name, r.hours_worked
     FROM ge_erp_department d
     LEFT JOIN ge_erp_daily_work_report r
       ON r.department_id = d.id
      AND r.report_date BETWEEN ? AND ?
     WHERE d.code IN (${DEPT_CODES.map(() => '?').join(',')})
       AND r.id = (
         SELECT rr.id
         FROM ge_erp_daily_work_report rr
         WHERE rr.department_id = d.id
           AND rr.report_date BETWEEN ? AND ?
         ORDER BY rr.report_date DESC, rr.id DESC
         LIMIT 1
       )`,
    [monthStart, monthEnd, ...DEPT_CODES, monthStart, monthEnd]
  );

  const map = new Map();
  for (const row of summary) {
    map.set(row.department_id, {
      dailyCount: Number(row.daily_count || 0),
      monthlyCount: Number(row.active_days || 0),
      totalHours: Number(row.total_hours || 0),
      latestReportDate: row.latest_report_date ? String(row.latest_report_date).slice(0, 10) : null,
      latestWorkSummary: '',
      latestReporter: '',
      latestHours: null,
    });
  }
  for (const row of latestRows) {
    const current = map.get(row.department_id) || {};
    map.set(row.department_id, {
      ...current,
      latestWorkSummary: row.work_summary || '',
      latestReporter: row.reporter_name || '',
      latestHours: row.hours_worked != null ? Number(row.hours_worked) : null,
    });
  }
  return map;
}

export async function syncApprovalQueue() {
  const hrId = await deptIdByCode('hr');
  const accountingId = await deptIdByCode('accounting');
  const rndId = await deptIdByCode('rnd');

  const sources = [];

  if (hrId) {
    const leaves = await queryGeserverhub(
      `SELECT l.id, l.leave_type, e.full_name, l.created_at
       FROM ge_erp_leave_request l
       JOIN ge_erp_employee e ON e.id = l.employee_id
       WHERE l.status = 'pending'`
    );
    for (const r of leaves) {
      sources.push({
        department_id: hrId,
        source_type: 'leave',
        source_id: r.id,
        request_no: `LV-${r.id}`,
        title: `Leave: ${r.full_name} (${r.leave_type})`,
        amount: null,
      });
    }

    const docs = await queryGeserverhub(
      `SELECT d.id, d.document_type, e.full_name
       FROM ge_erp_document_request d
       JOIN ge_erp_employee e ON e.id = d.employee_id
       WHERE d.status = 'pending'`
    );
    for (const r of docs) {
      sources.push({
        department_id: hrId,
        source_type: 'document',
        source_id: r.id,
        request_no: `DOC-${r.id}`,
        title: `Document: ${r.document_type} — ${r.full_name}`,
        amount: null,
      });
    }

    const hrPr = await queryGeserverhub(
      `SELECT p.id, p.item_desc, p.amount, e.full_name
       FROM ge_erp_hr_purchase_request p
       JOIN ge_erp_employee e ON e.id = p.employee_id
       WHERE p.status = 'pending'`
    );
    for (const r of hrPr) {
      sources.push({
        department_id: hrId,
        source_type: 'hr_purchase',
        source_id: r.id,
        request_no: `HPR-${r.id}`,
        title: `HR purchase: ${r.item_desc} — ${r.full_name}`,
        amount: r.amount,
      });
    }

    const reimb = await queryGeserverhub(
      `SELECT r.id, r.amount, e.full_name
       FROM ge_erp_expense_reimbursement r
       JOIN ge_erp_employee e ON e.id = r.employee_id
       WHERE r.status = 'pending'`
    );
    for (const r of reimb) {
      sources.push({
        department_id: hrId,
        source_type: 'reimbursement',
        source_id: r.id,
        request_no: `REIM-${r.id}`,
        title: `Reimbursement — ${r.full_name}`,
        amount: r.amount,
      });
    }
  }

  if (accountingId) {
    const pos = await queryGeserverhub(
      `SELECT id, po_no, amount FROM ge_erp_purchase_order WHERE status = 'open'`
    );
    for (const r of pos) {
      sources.push({
        department_id: accountingId,
        source_type: 'purchase_order',
        source_id: r.id,
        request_no: `PO-${r.id}`,
        title: `Purchase order ${r.po_no}`,
        amount: r.amount,
      });
    }
  }

  if (rndId) {
    const rb = await queryGeserverhub(
      `SELECT r.id, r.requested_amount, p.project_name
       FROM ge_erp_research_budget_request r
       JOIN ge_erp_project p ON p.id = r.project_id
       WHERE r.status = 'pending'`
    );
    for (const r of rb) {
      sources.push({
        department_id: rndId,
        source_type: 'research_budget',
        source_id: r.id,
        request_no: `RB-${r.id}`,
        title: `R&D budget: ${r.project_name}`,
        amount: r.requested_amount,
      });
    }
  }

  for (const s of sources) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_approval_request
        (request_no, department_id, source_type, source_id, title, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         amount = VALUES(amount),
         department_id = VALUES(department_id),
         updated_at = NOW()`,
      [s.request_no, s.department_id, s.source_type, s.source_id, s.title, s.amount]
    );
  }

  const cleanups = [
    [`leave`, `ge_erp_leave_request`, `pending`],
    [`document`, `ge_erp_document_request`, `pending`],
    [`hr_purchase`, `ge_erp_hr_purchase_request`, `pending`],
    [`reimbursement`, `ge_erp_expense_reimbursement`, `pending`],
    [`purchase_order`, `ge_erp_purchase_order`, `open`],
    [`research_budget`, `ge_erp_research_budget_request`, `pending`],
  ];
  for (const [sourceType, table, st] of cleanups) {
    await queryGeserverhub(
      `UPDATE ge_erp_approval_request a
       SET status = 'cancelled', updated_at = NOW()
       WHERE a.status = 'pending' AND a.source_type = ?
         AND NOT EXISTS (
           SELECT 1 FROM ${table} s WHERE s.id = a.source_id AND s.status = ?
         )`,
      [sourceType, st]
    ).catch(() => {});
  }

  return sources.length;
}

export async function rebuildKpiSnapshots(periodKey = currentPeriodKey()) {
  const metrics = [];

  const [sales] = await queryGeserverhub(
    `SELECT COALESCE(SUM(o.quantity * COALESCE(p.price, 0)), 0) AS v,
            COUNT(DISTINCT o.id) AS cnt
     FROM ge_erp_sales_order o
     LEFT JOIN ge_erp_product p ON p.id = o.product_id`
  );
  const [invoices] = await queryGeserverhub(
    `SELECT COALESCE(SUM(amount), 0) AS v, COUNT(*) AS cnt FROM ge_erp_invoice`
  );
  const [expenses] = await queryGeserverhub(
    `SELECT COALESCE(SUM(amount), 0) AS v FROM ge_erp_expense`
  );
  const [production] = await queryGeserverhub(
    `SELECT COUNT(*) AS cnt FROM ge_erp_production_order WHERE status IN ('planned','active','completed')`
  );
  const [quality] = await queryGeserverhub(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN result_status = 'pass' THEN 1 ELSE 0 END) AS passed
     FROM ge_erp_quality_check`
  );
  const [hr] = await queryGeserverhub(`SELECT COUNT(*) AS cnt FROM ge_erp_employee`);
  const [projects] = await queryGeserverhub(
    `SELECT COUNT(*) AS cnt FROM ge_erp_project WHERE status = 'active'`
  );
  const [pending] = await queryGeserverhub(
    `SELECT COUNT(*) AS cnt FROM ge_erp_approval_request WHERE status = 'pending'`
  );

  const passRate =
    quality?.total > 0 ? Math.round((Number(quality.passed) / Number(quality.total)) * 100) : 0;

  const deptMetrics = {
    production: [
      { key: 'output_orders', label: 'Production orders', value: production?.cnt || 0, unit: 'orders' },
      { key: 'quality_pass_rate', label: 'QC pass rate', value: passRate, unit: '%' },
    ],
    marketing: [
      { key: 'sales_value', label: 'Sales value', value: sales?.v || 0, unit: 'KRW' },
      { key: 'sales_orders', label: 'Sales orders', value: sales?.cnt || 0, unit: 'orders' },
    ],
    accounting: [
      { key: 'invoiced', label: 'Invoiced', value: invoices?.v || 0, unit: 'KRW' },
      { key: 'expenses', label: 'Expenses', value: expenses?.v || 0, unit: 'KRW' },
    ],
    hr: [
      { key: 'headcount', label: 'Headcount', value: hr?.cnt || 0, unit: 'people' },
      { key: 'pending_hr_items', label: 'Pending HR items', value: pending?.cnt || 0, unit: 'items' },
    ],
    rnd: [
      { key: 'active_projects', label: 'Active projects', value: projects?.cnt || 0, unit: 'projects' },
    ],
  };

  for (const code of DEPT_CODES) {
    const deptId = await deptIdByCode(code);
    if (!deptId) continue;
    for (const m of deptMetrics[code] || []) {
      await queryGeserverhub(
        `INSERT INTO ge_erp_kpi_snapshot
          (department_id, period_key, metric_key, metric_label, metric_value, unit)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           metric_label = VALUES(metric_label),
           metric_value = VALUES(metric_value),
           unit = VALUES(unit),
           updated_at = NOW()`,
        [deptId, periodKey, m.key, m.label, m.value, m.unit]
      );
    }
  }

  const revenue = Number(invoices?.v || 0);
  const exp = Number(expenses?.v || 0);
  const companyMetrics = [
    { key: 'total_revenue', label: 'Total revenue (invoiced)', value: revenue, unit: 'KRW' },
    { key: 'total_expenses', label: 'Total expenses', value: exp, unit: 'KRW' },
    { key: 'net_indicator', label: 'Net (revenue − expenses)', value: revenue - exp, unit: 'KRW' },
    { key: 'sales_pipeline', label: 'Sales pipeline value', value: sales?.v || 0, unit: 'KRW' },
    { key: 'pending_approvals', label: 'Pending approvals', value: pending?.cnt || 0, unit: 'items' },
    { key: 'company_headcount', label: 'Headcount', value: hr?.cnt || 0, unit: 'people' },
  ];

  // MySQL UNIQUE KEY doesn't deduplicate NULL department_id rows, so delete before re-insert
  await queryGeserverhub(
    `DELETE FROM ge_erp_kpi_snapshot WHERE department_id IS NULL AND period_key = ?`,
    [periodKey]
  );
  for (const m of companyMetrics) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_kpi_snapshot
        (department_id, period_key, metric_key, metric_label, metric_value, unit)
       VALUES (NULL, ?, ?, ?, ?, ?)`,
      [periodKey, m.key, m.label, m.value, m.unit]
    );
  }

  return { periodKey, departments: DEPT_CODES.length, company: companyMetrics.length };
}

export async function regenerateAiInsights(periodKey = currentPeriodKey()) {
  await queryGeserverhub(`DELETE FROM ge_erp_ai_insight WHERE DATE(generated_at) = CURDATE()`);
  await queryGeserverhub(
    `DELETE FROM ge_erp_ai_insight WHERE generated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
  );

  const [fin] = await queryGeserverhub(
    `SELECT
      (SELECT COALESCE(SUM(amount),0) FROM ge_erp_invoice) AS revenue,
      (SELECT COALESCE(SUM(amount),0) FROM ge_erp_expense) AS expenses,
      (SELECT COUNT(*) FROM ge_erp_approval_request WHERE status='pending') AS pending`
  );

  const revenue = Number(fin?.revenue || 0);
  const expenses = Number(fin?.expenses || 0);
  const pending = Number(fin?.pending || 0);
  const margin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

  const insights = [];

  insights.push({
    insight_type: 'performance',
    department_id: null,
    period_key: periodKey,
    title: 'Company financial snapshot',
    summary: `Revenue (invoiced) ₩${revenue.toLocaleString()}, expenses ₩${expenses.toLocaleString()}. Estimated margin ${margin.toFixed(1)}%.`,
    problem_detail: null,
    fix_recommendation:
      margin < 15
        ? 'Review high-cost expense categories and accelerate collections on open invoices.'
        : 'Maintain current cost controls; consider reinvesting surplus into R&D or production capacity.',
    trend_direction: margin >= 20 ? 'up' : margin >= 0 ? 'stable' : 'down',
    trend_pct: margin,
    severity: margin < 10 ? 'warning' : 'info',
  });

  if (pending > 0) {
    insights.push({
      insight_type: 'issue',
      department_id: null,
      period_key: periodKey,
      title: `${pending} item(s) awaiting executive approval`,
      summary: 'Pending requests are synced from HR, accounting, and R&D modules.',
      problem_detail: 'Delayed approvals may block payroll, purchasing, and project budgets.',
      fix_recommendation:
        'Open Pending approvals, review by priority, and approve or reject with notes within 48 hours.',
      trend_direction: 'up',
      trend_pct: pending,
      severity: pending >= 5 ? 'high' : 'warning',
    });
  }

  const [salesTrend] = await queryGeserverhub(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(quantity),0) AS units FROM ge_erp_sales_order`
  );
  const growthPct = Math.min(100, Number(salesTrend?.orders || 0) * 3.5);

  insights.push({
    insight_type: 'growth',
    department_id: await deptIdByCode('marketing'),
    period_key: periodKey,
    title: 'Sales & market activity trend',
    summary: `${salesTrend?.orders || 0} sales orders on record; pipeline units ${salesTrend?.units || 0}.`,
    problem_detail: null,
    fix_recommendation:
      'Align marketing campaigns with top-selling products; expand follow-ups on customer contact reports.',
    trend_direction: growthPct >= 50 ? 'up' : 'stable',
    trend_pct: growthPct,
    severity: 'info',
  });

  if (expenses > revenue && revenue > 0) {
    insights.push({
      insight_type: 'issue',
      department_id: await deptIdByCode('accounting'),
      period_key: periodKey,
      title: 'Expenses exceed invoiced revenue',
      summary: `Expenses ₩${expenses.toLocaleString()} vs revenue ₩${revenue.toLocaleString()}.`,
      problem_detail: 'Cash outflow may exceed recognized income for the current period.',
      fix_recommendation:
        'Freeze non-essential POs, reconcile expense categories, and update sales forecast with marketing.',
      trend_direction: 'down',
      trend_pct: -Math.abs(margin),
      severity: 'high',
    });
  }

  for (const ins of insights) {
    await queryGeserverhub(
      `INSERT INTO ge_erp_ai_insight
        (insight_type, department_id, period_key, title, summary, problem_detail,
         fix_recommendation, trend_direction, trend_pct, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ins.insight_type,
        ins.department_id,
        ins.period_key,
        ins.title,
        ins.summary,
        ins.problem_detail,
        ins.fix_recommendation,
        ins.trend_direction,
        ins.trend_pct,
        ins.severity,
      ]
    );
  }

  return insights.length;
}

export async function refreshExecutiveData() {
  await ensureExecutiveSchema();
  await syncApprovalQueue();
  const kpi = await rebuildKpiSnapshots();
  const aiCount = await regenerateAiInsights(kpi.periodKey);
  return { kpi, aiCount };
}

export async function getDeptKpiDashboard(periodKey = currentPeriodKey()) {
  const depts = await queryGeserverhub(
    `SELECT d.id, d.code, d.name_th, d.name_en
     FROM ge_erp_department d
     WHERE d.code IN (${DEPT_CODES.map(() => '?').join(',')})
     ORDER BY d.sort_order`,
    DEPT_CODES
  );

  const reportSummaryByDept = await getDeptReportSummary(periodKey);
  const byDept = [];
  for (const d of depts) {
    const metrics = await queryGeserverhub(
      `SELECT metric_key, metric_label, metric_value, unit
       FROM ge_erp_kpi_snapshot
       WHERE department_id = ? AND period_key = ?
       ORDER BY metric_key`,
      [d.id, periodKey]
    );
    byDept.push({
      ...d,
      metrics,
      reportSummary: reportSummaryByDept.get(d.id) || {
        dailyCount: 0,
        monthlyCount: 0,
        totalHours: 0,
        latestReportDate: null,
        latestWorkSummary: '',
        latestReporter: '',
        latestHours: null,
      },
    });
  }

  const company = await queryGeserverhub(
    `SELECT metric_key, metric_label, metric_value, unit
     FROM ge_erp_kpi_snapshot
     WHERE department_id IS NULL AND period_key = ?
     ORDER BY metric_key`,
    [periodKey]
  );

  const chart = byDept.map((d) => {
    const vals = (d.metrics || []).map((m) => Number(m.metric_value || 0));
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    return {
      dept_code: d.code,
      dept_name_th: d.name_th,
      dept_name_en: d.name_en,
      kpi_score: Number(avg.toFixed(2)),
      metric_count: vals.length,
    };
  });

  return { periodKey, departments: byDept, company, chart };
}

export async function getPendingApprovals() {
  return queryGeserverhub(
    `SELECT a.id, a.request_no, a.title, a.amount, a.status, a.priority, a.source_type,
            a.created_at, d.code AS dept_code, d.name_th, d.name_en
     FROM ge_erp_approval_request a
     JOIN ge_erp_department d ON d.id = a.department_id
     WHERE a.status = 'pending'
     ORDER BY
       FIELD(a.priority, 'urgent', 'high', 'normal', 'low'),
       a.created_at ASC`
  );
}

export async function reviewApproval(approvalId, action, userId, note = '') {
  const status = action === 'approve' ? 'approved' : 'rejected';
  await queryGeserverhub(
    `UPDATE ge_erp_approval_request
     SET status = ?, reviewed_by_user_id = ?, reviewed_at = NOW(), review_note = ?, updated_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [status, userId, note, approvalId]
  );

  const [row] = await queryGeserverhub(
    `SELECT source_type, source_id FROM ge_erp_approval_request WHERE id = ?`,
    [approvalId]
  );
  if (!row) return;

  const map = {
    leave: ['ge_erp_leave_request', 'approved'],
    document: ['ge_erp_document_request', 'completed'],
    hr_purchase: ['ge_erp_hr_purchase_request', 'approved'],
    reimbursement: ['ge_erp_expense_reimbursement', 'approved'],
    purchase_order: ['ge_erp_purchase_order', 'closed'],
    research_budget: ['ge_erp_research_budget_request', 'approved'],
  };
  const cfg = map[row.source_type];
  if (cfg && action === 'approve') {
    const [table, newStatus] = cfg;
    await queryGeserverhub(`UPDATE ${table} SET status = ? WHERE id = ?`, [
      newStatus,
      row.source_id,
    ]);
  }
  if (cfg && action === 'reject') {
    const [table] = cfg;
    await queryGeserverhub(`UPDATE ${table} SET status = ? WHERE id = ?`, [
      'rejected',
      row.source_id,
    ]);
  }
}

export async function getAiInsights(type) {
  return queryGeserverhub(
    `SELECT i.*, d.code AS dept_code, d.name_th, d.name_en
     FROM ge_erp_ai_insight i
     LEFT JOIN ge_erp_department d ON d.id = i.department_id
     WHERE i.insight_type = ?
     ORDER BY i.generated_at DESC
     LIMIT 30`,
    [type]
  );
}

export async function getExecutivePageData(pageId) {
  try {
    await refreshExecutiveData();
  } catch (err) {
    console.warn('[executive] refreshExecutiveData failed (continuing with existing data):', err?.message);
  }

  switch (pageId) {
    case 'exec-dept-kpi':
      return { type: 'kpi', ...(await getDeptKpiDashboard()) };
    case 'exec-pending-approvals':
      return { type: 'approvals', rows: await getPendingApprovals() };
    case 'exec-ai-performance':
      return { type: 'ai', variant: 'performance', rows: await getAiInsights('performance') };
    case 'exec-ai-issues':
      return { type: 'ai', variant: 'issue', rows: await getAiInsights('issue') };
    case 'exec-ai-growth':
      return { type: 'ai', variant: 'growth', rows: await getAiInsights('growth') };
    default:
      throw new Error(`Unknown executive page: ${pageId}`);
  }
}
