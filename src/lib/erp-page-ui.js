/** UI layout per ERP menu page */

export const ERP_PAGE_UI = {
  'equipment-stock': {
    type: 'table',
    columnKeys: ['code', 'name', 'qty', 'unit', 'location', 'status'],
  },
  'add-product': {
    type: 'form',
    fieldKeys: [
      { key: 'code', input: 'text' },
      { key: 'name', input: 'text' },
      { key: 'category', input: 'text' },
      { key: 'unit', input: 'text' },
      { key: 'price', input: 'number' },
      { key: 'stock', input: 'number' },
    ],
  },
  'production-run': {
    type: 'table',
    columnKeys: ['orderNo', 'product', 'qty', 'line', 'startDate', 'status'],
  },
  'quality-check': {
    type: 'table',
    columnKeys: ['batchNo', 'product', 'inspector', 'result', 'checkedAt'],
  },
  shipping: {
    type: 'table',
    columnKeys: ['shipmentNo', 'customer', 'items', 'carrier', 'status', 'shipDate'],
  },
  'add-customer': {
    type: 'form',
    fieldKeys: [
      { key: 'company', input: 'text' },
      { key: 'contact', input: 'text' },
      { key: 'phone', input: 'tel' },
      { key: 'email', input: 'email' },
      { key: 'address', input: 'textarea' },
    ],
  },
  'customer-contact-report': {
    type: 'table',
    columnKeys: ['date', 'customer', 'channel', 'topic', 'owner', 'nextStep'],
  },
  'marketing-plan': {
    type: 'table',
    columnKeys: ['campaign', 'period', 'channel', 'budget', 'owner', 'status'],
  },
  'after-sales-chat-live': {
    type: 'after-sales-chat-live',
  },
  'create-sales-order': {
    type: 'form',
    fieldKeys: [
      { key: 'orderNo', input: 'text' },
      { key: 'customer', input: 'text' },
      { key: 'product', input: 'text' },
      { key: 'qty', input: 'number' },
      { key: 'dueDate', input: 'date' },
    ],
  },
  'sales-report': {
    type: 'report',
    metricKeys: ['totalSales', 'orders', 'topProduct', 'growth'],
  },
  'create-purchase-order': {
    type: 'form',
    fieldKeys: [
      { key: 'poNo', input: 'text' },
      { key: 'vendor', input: 'text' },
      { key: 'item', input: 'text' },
      { key: 'amount', input: 'number' },
      { key: 'dueDate', input: 'date' },
    ],
  },
  'create-invoice': {
    type: 'form',
    fieldKeys: [
      { key: 'invoiceNo', input: 'text' },
      { key: 'customer', input: 'text' },
      { key: 'amount', input: 'number' },
      { key: 'dueDate', input: 'date' },
    ],
  },
  'create-tax-invoice': {
    type: 'form',
    fieldKeys: [
      { key: 'taxInvoiceNo', input: 'text' },
      { key: 'customer', input: 'text' },
      { key: 'taxId', input: 'text' },
      { key: 'vatAmount', input: 'number' },
    ],
  },
  'create-credit-note': {
    type: 'form',
    fieldKeys: [
      { key: 'creditNoteNo', input: 'text' },
      { key: 'refInvoice', input: 'text' },
      { key: 'reason', input: 'textarea' },
      { key: 'amount', input: 'number' },
    ],
  },
  'expense-record': {
    type: 'form',
    fieldKeys: [
      { key: 'expenseDate', input: 'date' },
      { key: 'category', input: 'text' },
      { key: 'payee', input: 'text' },
      { key: 'amount', input: 'number' },
      { key: 'note', input: 'textarea' },
    ],
  },
  'balance-sheet-report': {
    type: 'report',
    metricKeys: ['assets', 'liabilities', 'equity', 'period'],
  },
  'profit-loss-report': {
    type: 'report',
    metricKeys: ['revenue', 'cogs', 'expenses', 'netProfit'],
  },
  'vat-report': {
    type: 'report',
    metricKeys: ['outputVat', 'inputVat', 'payable', 'period'],
  },
  'corporate-tax-report': {
    type: 'report',
    metricKeys: ['taxableIncome', 'taxRate', 'estimatedTax', 'fiscalYear'],
  },
  'create-leave': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeId', input: 'text' },
      { key: 'employeeName', input: 'text' },
      { key: 'leaveType', input: 'text' },
      { key: 'leaveFrom', input: 'date' },
      { key: 'leaveTo', input: 'date' },
      { key: 'reason', input: 'textarea' },
    ],
  },
  'attendance-log': {
    type: 'table',
    columnKeys: ['date', 'employeeId', 'employeeName', 'checkIn', 'checkOut', 'status'],
  },
  'payroll-record': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeId', input: 'text' },
      { key: 'employeeName', input: 'text' },
      { key: 'salaryMonth', input: 'text' },
      { key: 'baseSalary', input: 'number' },
      { key: 'note', input: 'textarea' },
    ],
  },
  'employee-profile': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeId', input: 'text' },
      { key: 'employeeName', input: 'text' },
      { key: 'department', input: 'text' },
      { key: 'position', input: 'text' },
      { key: 'hireDate', input: 'date' },
      { key: 'phone', input: 'tel' },
      { key: 'email', input: 'email' },
    ],
  },
  'document-request': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeName', input: 'text' },
      { key: 'documentType', input: 'text' },
      { key: 'purpose', input: 'textarea' },
      { key: 'dueDate', input: 'date' },
    ],
  },
  'offsite-work-request': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeName', input: 'text' },
      { key: 'workDate', input: 'date' },
      { key: 'workLocation', input: 'text' },
      { key: 'purpose', input: 'textarea' },
    ],
  },
  'hr-purchase-request': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeName', input: 'text' },
      { key: 'item', input: 'text' },
      { key: 'amount', input: 'number' },
      { key: 'purpose', input: 'textarea' },
    ],
  },
  'suggestion-idea': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeName', input: 'text' },
      { key: 'ideaTitle', input: 'text' },
      { key: 'ideaDetail', input: 'textarea' },
    ],
  },
  'expense-reimbursement': {
    type: 'form',
    fieldKeys: [
      { key: 'employeeName', input: 'text' },
      { key: 'expenseDate', input: 'date' },
      { key: 'reimbursementAmount', input: 'number' },
      { key: 'purpose', input: 'textarea' },
    ],
  },
  'hr-department-report': {
    type: 'report',
    metricKeys: ['headcount', 'onLeave', 'attendanceRate', 'openRequests'],
  },
  'create-project': {
    type: 'form',
    fieldKeys: [
      { key: 'projectCode', input: 'text' },
      { key: 'projectName', input: 'text' },
      { key: 'lead', input: 'text' },
      { key: 'budget', input: 'number' },
      { key: 'startDate', input: 'date' },
    ],
  },
  'update-research': {
    type: 'form',
    fieldKeys: [
      { key: 'project', input: 'text' },
      { key: 'milestone', input: 'text' },
      { key: 'progress', input: 'number' },
      { key: 'summary', input: 'textarea' },
    ],
  },
  'budget-expense': {
    type: 'table',
    columnKeys: ['project', 'category', 'amount', 'date', 'approver'],
  },
  'research-budget-request': {
    type: 'form',
    fieldKeys: [
      { key: 'project', input: 'text' },
      { key: 'requestedAmount', input: 'number' },
      { key: 'purpose', input: 'textarea' },
    ],
  },
  'grant-income': {
    type: 'table',
    columnKeys: ['grantNo', 'sponsor', 'amount', 'receivedDate', 'project'],
  },
  manuals: {
    type: 'cards',
    cardKeys: ['sop', 'safety', 'equipment', 'training'],
  },
  software: {
    type: 'cards',
    cardKeys: ['cad', 'simulation', 'data', 'license'],
  },
  'ip-patents': {
    type: 'table',
    columnKeys: ['ipNo', 'title', 'type', 'filedDate', 'status'],
  },
  'issue-report': {
    type: 'table',
    columnKeys: ['ticketNo', 'module', 'severity', 'reporter', 'status'],
  },
  developers: { type: 'developers-hub' },
  'erp-page-access': { type: 'erp-page-access' },
  'erp-user-create': { type: 'erp-user-create' },
  'exec-dept-kpi': { type: 'executive-kpi' },
  'exec-daily-work-calendar': { type: 'work-calendar' },
  'exec-pending-approvals': { type: 'executive-approvals' },
  'exec-ai-performance': { type: 'executive-ai', variant: 'performance' },
  'exec-ai-issues': { type: 'executive-ai', variant: 'issue' },
  'exec-ai-growth': { type: 'executive-ai', variant: 'growth' },
};
