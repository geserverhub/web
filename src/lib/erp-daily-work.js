import { queryGeserverhub } from '@/lib/geserverhub-db';
import { ensureExecutiveSchema } from '@/lib/erp-executive';

export async function ensureDailyWorkSchema() {
  await ensureExecutiveSchema();
}

function padMonth(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export async function getCalendarMonth(year, month) {
  await ensureDailyWorkSchema();
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const rows = await queryGeserverhub(
    `SELECT r.id, r.report_date, r.work_summary, r.hours_worked, r.status, r.reporter_name,
            d.code AS dept_code, d.name_th, d.name_en,
            e.full_name AS employee_name
     FROM ge_erp_daily_work_report r
     JOIN ge_erp_department d ON d.id = r.department_id
     LEFT JOIN ge_erp_employee e ON e.id = r.employee_id
     WHERE r.report_date BETWEEN ? AND ?
     ORDER BY r.report_date ASC, d.sort_order ASC, r.id ASC`,
    [periodStart, periodEnd]
  );

  const byDate = {};
  for (const r of rows) {
    const key = String(r.report_date).slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(r);
  }

  const counts = Object.fromEntries(
    Object.entries(byDate).map(([d, list]) => [d, list.length])
  );

  return { year, month, periodStart, periodEnd, byDate, counts, total: rows.length };
}

export async function getDepartmentsForForm() {
  return queryGeserverhub(
    `SELECT id, code, name_th, name_en FROM ge_erp_department
     WHERE code NOT IN ('executive')
     ORDER BY sort_order`
  );
}

export async function insertDailyWorkReport(payload, createdBy) {
  await ensureDailyWorkSchema();
  const {
    reportDate,
    departmentId,
    employeeId,
    reporterName,
    workSummary,
    hoursWorked,
  } = payload;

  if (!reportDate || !departmentId || !workSummary?.trim()) {
    throw new Error('reportDate, departmentId and workSummary are required');
  }

  const result = await queryGeserverhub(
    `INSERT INTO ge_erp_daily_work_report
      (report_date, department_id, employee_id, reporter_name, work_summary, hours_worked, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      reportDate,
      departmentId,
      employeeId || null,
      reporterName?.trim() || null,
      workSummary.trim(),
      hoursWorked != null && hoursWorked !== '' ? Number(hoursWorked) : null,
      createdBy || null,
    ]
  );

  return { id: result[0]?.insertId };
}

export async function deleteDailyWorkReport(id) {
  await queryGeserverhub(`DELETE FROM ge_erp_daily_work_report WHERE id = ?`, [id]);
}
