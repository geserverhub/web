/**
 * Maps each ERP menu page to MySQL table + column bindings (UI key → DB column).
 */

export const ERP_REPORT_PAGES = new Set([
  'sales-report',
  'balance-sheet-report',
  'profit-loss-report',
  'vat-report',
  'corporate-tax-report',
  'hr-department-report',
]);

export const ERP_CARD_PAGES = new Set(['manuals', 'software']);

/** @type {Record<string, { table: string, fields?: Record<string,string>, listSql?: string, reportSql?: string, cardsTable?: string }>} */
export const ERP_PAGE_DATA = {
  'equipment-stock': {
    table: 'ge_erp_equipment_stock',
    listSql: `
      SELECT s.id, p.sku AS code, p.name, s.quantity AS qty, s.unit,
             s.warehouse_location AS location, s.status
      FROM ge_erp_equipment_stock s
      JOIN ge_erp_product p ON p.id = s.product_id
      ORDER BY s.id DESC LIMIT 200`,
    fields: {
      code: { column: 'product_id', resolve: 'productBySku' },
      qty: 'quantity',
      unit: 'unit',
      location: 'warehouse_location',
      status: 'status',
    },
  },
  'add-product': {
    table: 'ge_erp_product',
    listSql: `SELECT id, sku AS code, name, category, unit, price, stock_qty AS stock, status FROM ge_erp_product ORDER BY id DESC LIMIT 200`,
    fields: {
      code: 'sku',
      name: 'name',
      category: 'category',
      unit: 'unit',
      price: 'price',
      stock: 'stock_qty',
    },
  },
  'production-run': {
    table: 'ge_erp_production_order',
    listSql: `
      SELECT o.id, o.order_no AS orderNo, p.name AS product, o.quantity AS qty,
             o.line_name AS line, o.start_date AS startDate, o.status
      FROM ge_erp_production_order o
      JOIN ge_erp_product p ON p.id = o.product_id
      ORDER BY o.id DESC LIMIT 200`,
    fields: {
      orderNo: 'order_no',
      product: { column: 'product_id', resolve: 'productByName' },
      qty: 'quantity',
      line: 'line_name',
      startDate: 'start_date',
    },
  },
  'quality-check': {
    table: 'ge_erp_quality_check',
    listSql: `
      SELECT q.id, q.batch_no AS batchNo, p.name AS product, q.inspector_name AS inspector,
             q.result_status AS result, q.checked_at AS checkedAt
      FROM ge_erp_quality_check q
      JOIN ge_erp_production_order o ON o.id = q.production_order_id
      JOIN ge_erp_product p ON p.id = o.product_id
      ORDER BY q.id DESC LIMIT 200`,
    fields: {
      batchNo: 'batch_no',
      product: { column: 'production_order_id', resolve: 'productionOrderByProductName' },
      inspector: 'inspector_name',
      result: 'result_status',
    },
  },
  shipping: {
    table: 'ge_erp_shipment',
    listSql: `
      SELECT s.id, s.shipment_no AS shipmentNo, c.company AS customer,
             '' AS items, s.carrier, s.status, s.ship_date AS shipDate
      FROM ge_erp_shipment s
      LEFT JOIN ge_erp_customer c ON c.id = s.customer_id
      ORDER BY s.id DESC LIMIT 200`,
    fields: {
      shipmentNo: 'shipment_no',
      customer: { column: 'customer_id', resolve: 'customerByCompany' },
      carrier: 'carrier',
      shipDate: 'ship_date',
    },
  },
  'add-customer': {
    table: 'ge_erp_customer',
    listSql: `SELECT id, company, contact, phone, email, address FROM ge_erp_customer ORDER BY id DESC LIMIT 200`,
    fields: {
      company: 'company',
      contact: 'contact',
      phone: 'phone',
      email: 'email',
      address: 'address',
    },
  },
  'customer-contact-report': {
    table: 'ge_erp_customer_contact',
    listSql: `
      SELECT cc.id, cc.contact_date AS date, c.company AS customer, cc.channel,
             cc.topic, cc.owner_name AS owner, cc.next_step AS nextStep
      FROM ge_erp_customer_contact cc
      JOIN ge_erp_customer c ON c.id = cc.customer_id
      ORDER BY cc.id DESC LIMIT 200`,
    fields: {
      date: 'contact_date',
      customer: { column: 'customer_id', resolve: 'customerByCompany' },
      channel: 'channel',
      topic: 'topic',
      owner: 'owner_name',
      nextStep: 'next_step',
    },
  },
  'marketing-plan': {
    table: 'ge_erp_marketing_campaign',
    listSql: `
      SELECT id, campaign, period_label AS period, channel, budget, owner_name AS owner, status
      FROM ge_erp_marketing_campaign ORDER BY id DESC LIMIT 200`,
    fields: {
      campaign: 'campaign',
      period: 'period_label',
      channel: 'channel',
      budget: 'budget',
      owner: 'owner_name',
    },
  },
  'create-sales-order': {
    table: 'ge_erp_sales_order',
    listSql: `
      SELECT o.id, o.order_no AS orderNo, c.company AS customer, p.name AS product,
             o.quantity AS qty, o.due_date AS dueDate, o.status
      FROM ge_erp_sales_order o
      JOIN ge_erp_customer c ON c.id = o.customer_id
      LEFT JOIN ge_erp_product p ON p.id = o.product_id
      ORDER BY o.id DESC LIMIT 200`,
    fields: {
      orderNo: 'order_no',
      customer: { column: 'customer_id', resolve: 'customerByCompany' },
      product: { column: 'product_id', resolve: 'productByName' },
      qty: 'quantity',
      dueDate: 'due_date',
    },
  },
  'sales-report': {
    reportSql: `
      SELECT
        COALESCE(SUM(o.quantity * COALESCE(p.price, 0)), 0) AS totalSales,
        COUNT(DISTINCT o.id) AS orders,
        (SELECT p2.name FROM ge_erp_sales_order o2
         JOIN ge_erp_product p2 ON p2.id = o2.product_id
         GROUP BY p2.id ORDER BY SUM(o2.quantity) DESC LIMIT 1) AS topProduct,
        0 AS growth
      FROM ge_erp_sales_order o
      LEFT JOIN ge_erp_product p ON p.id = o.product_id`,
  },
  'create-purchase-order': {
    table: 'ge_erp_purchase_order',
    listSql: `
      SELECT po.id, po.po_no AS poNo, v.name AS vendor, po.item_desc AS item,
             po.amount, po.due_date AS dueDate, po.status
      FROM ge_erp_purchase_order po
      JOIN ge_erp_vendor v ON v.id = po.vendor_id
      ORDER BY po.id DESC LIMIT 200`,
    fields: {
      poNo: 'po_no',
      vendor: { column: 'vendor_id', resolve: 'vendorByName' },
      item: 'item_desc',
      amount: 'amount',
      dueDate: 'due_date',
    },
  },
  'create-invoice': {
    table: 'ge_erp_invoice',
    fields: {
      invoiceNo: 'invoice_no',
      customer: { column: 'customer_id', resolve: 'customerByCompany' },
      amount: 'amount',
      dueDate: 'due_date',
    },
  },
  'create-tax-invoice': {
    table: 'ge_erp_tax_invoice',
    fields: {
      taxInvoiceNo: 'tax_invoice_no',
      customer: { column: 'customer_id', resolve: 'customerByCompany' },
      taxId: 'tax_id',
      vatAmount: 'vat_amount',
    },
  },
  'create-credit-note': {
    table: 'ge_erp_credit_note',
    fields: {
      creditNoteNo: 'credit_note_no',
      refInvoice: { column: 'invoice_id', resolve: 'invoiceByNo' },
      reason: 'reason',
      amount: 'amount',
    },
  },
  'expense-record': {
    table: 'ge_erp_expense',
    listSql: `SELECT id, expense_date AS expenseDate, category, payee, amount, note FROM ge_erp_expense ORDER BY id DESC LIMIT 200`,
    fields: {
      expenseDate: 'expense_date',
      category: 'category',
      payee: 'payee',
      amount: 'amount',
      note: 'note',
    },
  },
  'balance-sheet-report': {
    reportSql: `
      SELECT
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0) AS assets,
        COALESCE((SELECT SUM(amount) FROM ge_erp_expense), 0) AS liabilities,
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0)
          - COALESCE((SELECT SUM(amount) FROM ge_erp_expense), 0) AS equity,
        DATE_FORMAT(CURDATE(), '%Y-%m') AS period`,
  },
  'profit-loss-report': {
    reportSql: `
      SELECT
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0) AS revenue,
        0 AS cogs,
        COALESCE((SELECT SUM(amount) FROM ge_erp_expense), 0) AS expenses,
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0)
          - COALESCE((SELECT SUM(amount) FROM ge_erp_expense), 0) AS netProfit`,
  },
  'vat-report': {
    reportSql: `
      SELECT
        COALESCE((SELECT SUM(vat_amount) FROM ge_erp_tax_invoice), 0) AS outputVat,
        0 AS inputVat,
        COALESCE((SELECT SUM(vat_amount) FROM ge_erp_tax_invoice), 0) AS payable,
        DATE_FORMAT(CURDATE(), '%Y-%m') AS period`,
  },
  'corporate-tax-report': {
    reportSql: `
      SELECT
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0) AS taxableIncome,
        20 AS taxRate,
        COALESCE((SELECT SUM(amount) FROM ge_erp_invoice), 0) * 0.2 AS estimatedTax,
        YEAR(CURDATE()) AS fiscalYear`,
  },
  'create-leave': {
    table: 'ge_erp_leave_request',
    fields: {
      employeeId: { column: 'employee_id', resolve: 'employeeByCode' },
      employeeName: { column: 'employee_id', resolve: 'employeeByName', altOnly: true },
      leaveType: 'leave_type',
      leaveFrom: 'leave_from',
      leaveTo: 'leave_to',
      reason: 'reason',
    },
  },
  'attendance-log': {
    table: 'ge_erp_attendance_log',
    listSql: `
      SELECT a.id, a.log_date AS date, e.employee_code AS employeeId, e.full_name AS employeeName,
             a.check_in AS checkIn, a.check_out AS checkOut, a.status
      FROM ge_erp_attendance_log a
      JOIN ge_erp_employee e ON e.id = a.employee_id
      ORDER BY a.id DESC LIMIT 200`,
    fields: {
      date: 'log_date',
      employeeId: { column: 'employee_id', resolve: 'employeeByCode' },
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      checkIn: 'check_in',
      checkOut: 'check_out',
      status: 'status',
    },
  },
  'payroll-record': {
    table: 'ge_erp_payroll_record',
    fields: {
      employeeId: { column: 'employee_id', resolve: 'employeeByCode' },
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      salaryMonth: 'salary_month',
      baseSalary: 'base_salary',
      note: 'note',
    },
  },
  'employee-profile': {
    table: 'ge_erp_employee',
    listSql: `
      SELECT id, employee_code AS employeeId, full_name AS employeeName,
             department_id AS department, position, hire_date AS hireDate, phone, email
      FROM ge_erp_employee ORDER BY id DESC LIMIT 200`,
    fields: {
      employeeId: 'employee_code',
      employeeName: 'full_name',
      department: 'department_id',
      position: 'position',
      hireDate: 'hire_date',
      phone: 'phone',
      email: 'email',
    },
  },
  'document-request': {
    table: 'ge_erp_document_request',
    fields: {
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      documentType: 'document_type',
      purpose: 'purpose',
      dueDate: 'due_date',
    },
  },
  'offsite-work-request': {
    table: 'ge_erp_offsite_work_request',
    fields: {
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      workDate: 'work_date',
      workLocation: 'work_location',
      purpose: 'purpose',
    },
  },
  'hr-purchase-request': {
    table: 'ge_erp_hr_purchase_request',
    fields: {
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      item: 'item_desc',
      amount: 'amount',
      purpose: 'purpose',
    },
  },
  'suggestion-idea': {
    table: 'ge_erp_suggestion',
    fields: {
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      ideaTitle: 'idea_title',
      ideaDetail: 'idea_detail',
    },
  },
  'expense-reimbursement': {
    table: 'ge_erp_expense_reimbursement',
    fields: {
      employeeName: { column: 'employee_id', resolve: 'employeeByName' },
      expenseDate: 'expense_date',
      reimbursementAmount: 'amount',
      purpose: 'purpose',
    },
  },
  'hr-department-report': {
    reportSql: `
      SELECT
        (SELECT COUNT(*) FROM ge_erp_employee) AS headcount,
        (SELECT COUNT(*) FROM ge_erp_leave_request WHERE status = 'pending') AS onLeave,
        95 AS attendanceRate,
        (SELECT COUNT(*) FROM ge_erp_document_request WHERE status = 'pending') AS openRequests`,
  },
  'create-project': {
    table: 'ge_erp_project',
    listSql: `
      SELECT id, project_code AS projectCode, project_name AS projectName,
             lead_name AS lead, budget, start_date AS startDate, status
      FROM ge_erp_project ORDER BY id DESC LIMIT 200`,
    fields: {
      projectCode: 'project_code',
      projectName: 'project_name',
      lead: 'lead_name',
      budget: 'budget',
      startDate: 'start_date',
    },
  },
  'update-research': {
    table: 'ge_erp_research_update',
    fields: {
      project: { column: 'project_id', resolve: 'projectByName' },
      milestone: 'milestone',
      progress: 'progress_pct',
      summary: 'summary',
    },
  },
  'budget-expense': {
    table: 'ge_erp_budget_expense',
    listSql: `
      SELECT b.id, p.project_name AS project, b.category, b.amount, b.expense_date AS date, b.approver
      FROM ge_erp_budget_expense b
      JOIN ge_erp_project p ON p.id = b.project_id
      ORDER BY b.id DESC LIMIT 200`,
    fields: {
      project: { column: 'project_id', resolve: 'projectByName' },
      category: 'category',
      amount: 'amount',
      date: 'expense_date',
      approver: 'approver',
    },
  },
  'research-budget-request': {
    table: 'ge_erp_research_budget_request',
    fields: {
      project: { column: 'project_id', resolve: 'projectByName' },
      requestedAmount: 'requested_amount',
      purpose: 'purpose',
    },
  },
  'grant-income': {
    table: 'ge_erp_grant_income',
    listSql: `
      SELECT g.id, g.grant_no AS grantNo, g.sponsor, g.amount, g.received_date AS receivedDate,
             p.project_name AS project
      FROM ge_erp_grant_income g
      JOIN ge_erp_project p ON p.id = g.project_id
      ORDER BY g.id DESC LIMIT 200`,
    fields: {
      grantNo: 'grant_no',
      sponsor: 'sponsor',
      amount: 'amount',
      receivedDate: 'received_date',
      project: { column: 'project_id', resolve: 'projectByName' },
    },
  },
  manuals: {
    cardsTable: 'ge_erp_manual_doc',
    fields: { title: 'title', doc_key: 'doc_key' },
  },
  software: {
    cardsTable: 'ge_erp_software_asset',
    fields: { name: 'name', asset_key: 'asset_key' },
  },
  'ip-patents': {
    table: 'ge_erp_ip_patent',
    listSql: `
      SELECT id, ip_no AS ipNo, title, ip_type AS type, filed_date AS filedDate, status
      FROM ge_erp_ip_patent ORDER BY id DESC LIMIT 200`,
    fields: {
      ipNo: 'ip_no',
      title: 'title',
      type: 'ip_type',
      filedDate: 'filed_date',
    },
  },
  'issue-report': {
    table: 'ge_erp_issue_report',
    listSql: `
      SELECT i.id, i.ticket_no AS ticketNo, i.module_name AS module, i.severity,
             e.full_name AS reporter, i.status
      FROM ge_erp_issue_report i
      LEFT JOIN ge_erp_employee e ON e.id = i.reporter_id
      ORDER BY i.id DESC LIMIT 200`,
    fields: {
      ticketNo: 'ticket_no',
      module: 'module_name',
      severity: 'severity',
      reporter: { column: 'reporter_id', resolve: 'employeeByName' },
    },
  },
};

export function getErpPageData(pageId) {
  return ERP_PAGE_DATA[pageId] || null;
}
