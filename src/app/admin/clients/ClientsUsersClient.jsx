"use client";
import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const STATUS_OPTS = ["ONLINE", "MAINTENANCE", "COMING_SOON", "OFFLINE"];
const ROLE_OPTS = ["CLIENT", "ADMIN", "SUPER_ADMIN"];
const EXPENSE_CATEGORIES = ["ค่าแรง/เงินเดือน", "ค่าอุปกรณ์/ซอฟต์แวร์", "ค่าโฆษณา", "ค่าเช่าเซิร์ฟเวอร์/โดเมน", "ค่าสาธารณูปโภค", "ค่าบริการภายนอก", "อื่นๆ"];

const STATUS_BADGE = {
  ONLINE:       { bg: "#14532d", color: "#4ade80", label: "Online" },
  MAINTENANCE:  { bg: "#422006", color: "#fb923c", label: "Maintenance" },
  COMING_SOON:  { bg: "#1e1b4b", color: "#a78bfa", label: "Coming Soon" },
  OFFLINE:      { bg: "#3b0000", color: "#f87171", label: "Offline" },
};
const ROLE_BADGE = {
  SUPER_ADMIN:  { bg: "#4c0519", color: "#fb7185", label: "Super Admin" },
  ADMIN:        { bg: "#172554", color: "#60a5fa", label: "Admin" },
  CLIENT:       { bg: "#14532d", color: "#4ade80", label: "Client" },
};
const INVOICE_BADGE = {
  PAID:      { bg: "#14532d", color: "#4ade80", label: "ชำระแล้ว ✓" },
  PENDING:   { bg: "#3b2800", color: "#fbbf24", label: "รอชำระ" },
  OVERDUE:   { bg: "#3b0000", color: "#f87171", label: "เกินกำหนด ⚠️" },
  CANCELLED: { bg: "#1e2130", color: "#8b8fa8", label: "ยกเลิก" },
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function ClientsUsersClient({ session }) {
  const [tab, setTab] = useState("clients"); // "clients" | "users" | "invoices"
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // services (for client form)
  const [services, setServices] = useState([]);

  // client modal
  const [clientModal, setClientModal] = useState(false);
  const [editClientId, setEditClientId] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: "", slug: "", description: "", status: "COMING_SOON",
    contactEmail: "", contactPhone: "", systemUrl: "", serviceIds: [],
  });
  const [savingClient, setSavingClient] = useState(false);

  // user modal
  const [userModal, setUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "", email: "", password: "", role: "CLIENT", clientId: "",
  });
  const [savingUser, setSavingUser] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // invoice modal
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [isReceiptMode, setIsReceiptMode] = useState(false);
  const [selectedInvId, setSelectedInvId] = useState("");
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "", amount: "", currency: "THB", status: "PENDING", dueDate: "", notes: "", receiptNumber: "",
  });
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [filterInvoiceClientId, setFilterInvoiceClientId] = useState("");
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState("");

  // filters
  const [clientSearch, setClientSearch] = useState("");
  const [filterClientStatus, setFilterClientStatus] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("");
  const [filterClientId, setFilterClientId] = useState("");

  // expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseModal, setExpenseModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ category: "", amount: "", currency: "THB", status: "รอชำระ", notes: "", date: "", receiptNumber: "", receiptFile: "" });
  const [expenseFileInputs, setExpenseFileInputs] = useState([]); // File objects array
  const [savingExpense, setSavingExpense] = useState(false);

  // ledger modal
  const [ledgerModal, setLedgerModal] = useState(false);
  const [ledgerCurrency, setLedgerCurrency] = useState("THB");

  // report/print modal
  const [reportModal, setReportModal] = useState(false);
  const [reportDataType, setReportDataType] = useState("invoice"); // "invoice" | "expense"
  const [reportMode, setReportMode] = useState("number"); // "number" | "date" | "range"
  const [reportInvNum, setReportInvNum] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadClients = useCallback(async () => {
    const r = await fetch("/api/admin/clients");
    const d = await r.json();
    setClients(d.clients || []);
  }, []);

  const loadServices = useCallback(async () => {
    const r = await fetch("/api/admin/services");
    const d = await r.json();
    setServices(d.services || []);
  }, []);

  const loadUsers = useCallback(async () => {
    const url = filterClientId ? `/api/admin/users?clientId=${filterClientId}` : "/api/admin/users";
    const r = await fetch(url);
    const d = await r.json();
    setUsers(d.users || []);
  }, [filterClientId]);

  const loadInvoices = useCallback(async () => {
    const url = filterInvoiceClientId ? `/api/admin/invoices?clientId=${filterInvoiceClientId}` : "/api/admin/invoices";
    const r = await fetch(url);
    const d = await r.json();
    setInvoices(d.invoices || []);
  }, [filterInvoiceClientId]);

  const loadExpenses = useCallback(async () => {
    const r = await fetch("/api/admin/expenses");
    const d = await r.json();
    setExpenses(d.expenses || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadClients(), loadUsers(), loadInvoices(), loadServices(), loadExpenses()]).finally(() => setLoading(false));
  }, [loadClients, loadUsers, loadInvoices, loadServices, loadExpenses]);

  // ── Client Modal ──
  const openAddClient = () => {
    setEditClientId(null);
    setClientForm({ name: "", slug: "", description: "", status: "COMING_SOON", contactEmail: "", contactPhone: "", systemUrl: "", serviceIds: [] });
    setClientModal(true);
  };
  const openEditClient = (c) => {
    setEditClientId(c.id);
    setClientForm({
      name: c.name, slug: c.slug, description: c.description || "", status: c.status,
      contactEmail: c.contactEmail || "", contactPhone: c.contactPhone || "", systemUrl: c.systemUrl || "",
      serviceIds: (c.services || []).map(cs => cs.serviceId || cs.service?.id).filter(Boolean),
    });
    setClientModal(true);
  };
  const saveClient = async () => {
    setSavingClient(true);
    try {
      const url = editClientId ? `/api/admin/clients/${editClientId}` : "/api/admin/clients";
      const method = editClientId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(clientForm) });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editClientId ? "อัพเดตลูกค้าสำเร็จ" : "เพิ่มลูกค้าสำเร็จ");
      setClientModal(false);
      loadClients();
    } finally { setSavingClient(false); }
  };
  const deleteClient = async (id, name) => {
    if (!confirm(`ลบลูกค้า "${name}" ? ผู้ใช้ที่ผูกไว้จะถูก unlink`)) return;
    const r = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) { showToast(d.error || "ลบไม่สำเร็จ", false); return; }
    showToast("ลบลูกค้าสำเร็จ");
    loadClients(); loadUsers();
  };

  // ── User Modal ──
  const openAddUser = () => {
    setEditUserId(null);
    setUserForm({ name: "", email: "", password: "", role: "CLIENT", clientId: "" });
    setShowUserPassword(false);
    setUserModal(true);
  };
  const openEditUser = (u) => {
    setEditUserId(u.id);
    setUserForm({ name: u.name || "", email: u.email, password: "", role: u.role, clientId: u.clientId || "" });
    setShowUserPassword(false);
    setUserModal(true);
  };
  const saveUser = async () => {
    setSavingUser(true);
    try {
      const url = editUserId ? `/api/admin/users/${editUserId}` : "/api/admin/users";
      const method = editUserId ? "PUT" : "POST";
      const body = { ...userForm };
      if (!body.password) delete body.password;
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editUserId ? "อัพเดต User สำเร็จ" : "เพิ่ม User สำเร็จ");
      setUserModal(false);
      loadUsers();
    } finally { setSavingUser(false); }
  };
  const deleteUser = async (id, email) => {
    if (!confirm(`ลบ User "${email}" ?`)) return;
    const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) { showToast(d.error || "ลบไม่สำเร็จ", false); return; }
    showToast("ลบ User สำเร็จ");
    loadUsers();
  };

  // ── Invoice CRUD ──
  const openAddInvoice = () => {
    setEditInvoiceId(null);
    setIsReceiptMode(false);
    setInvoiceForm({ clientId: "", amount: "", currency: "THB", status: "PENDING", dueDate: "", notes: "", receiptNumber: "" });
    setInvoiceModal(true);
  };
  const openAddReceipt = () => {
    setEditInvoiceId(null);
    setIsReceiptMode(true);
    setSelectedInvId("");
    setInvoiceForm({ clientId: "", amount: "", currency: "THB", status: "PAID", dueDate: "", notes: "", receiptNumber: "" });
    setInvoiceModal(true);
  };
  const openEditInvoice = (inv) => {
    setEditInvoiceId(inv.id);
    setIsReceiptMode(false);
    const due = inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "";
    setInvoiceForm({ clientId: inv.clientId, amount: String(inv.amount), currency: inv.currency, status: inv.status, dueDate: due, notes: inv.notes || "", receiptNumber: inv.receiptNumber || "" });
    setInvoiceModal(true);
  };
  const saveInvoice = async () => {
    setSavingInvoice(true);
    try {
      let url, method, payload;
      if (isReceiptMode) {
        // PUT existing invoice → assign receiptNumber
        if (!selectedInvId) { showToast("กรุณาเลือก Invoice", false); return; }
        const selInv = invoices.find(i => i.id === selectedInvId);
        const finalReceiptNumber = invoiceForm.receiptNumber || (selInv ? `RCP-${selInv.number}` : "");
        url = `/api/admin/invoices/${selectedInvId}`;
        method = "PUT";
        payload = { status: "PAID", receiptNumber: finalReceiptNumber, notes: invoiceForm.notes || undefined };
      } else {
        url = editInvoiceId ? `/api/admin/invoices/${editInvoiceId}` : "/api/admin/invoices";
        method = editInvoiceId ? "PUT" : "POST";
        payload = { ...invoiceForm };
      }
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const text = await r.text();
      const d = text ? JSON.parse(text) : {};
      if (!r.ok) { showToast(d.error || `เกิดข้อผิดพลาด (${r.status})`, false); return; }
      showToast(isReceiptMode ? "ออกใบเสร็จสำเร็จ" : editInvoiceId ? "อัพเดต Invoice สำเร็จ" : "สร้าง Invoice สำเร็จ");
      setInvoiceModal(false);
      loadInvoices(); loadClients();
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, false);
    } finally { setSavingInvoice(false); }
  };
  const deleteInvoice = async (id, number) => {
    if (!confirm(`ลบ Invoice "${number}" ?`)) return;
    const r = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
    const text = await r.text();
    const d = text ? JSON.parse(text) : {};
    if (!r.ok) { showToast(d.error || "ลบไม่สำเร็จ", false); return; }
    showToast("ลบ Invoice สำเร็จ");
    loadInvoices(); loadClients();
  };

  // ── Expense CRUD ──
  const openAddExpense = () => {
    setEditExpenseId(null);
    const today = new Date().toISOString().slice(0, 10);
    setExpenseForm({ category: "", amount: "", currency: "THB", status: "รอชำระ", notes: "", date: today, receiptNumber: "", receiptFile: "" });
    setExpenseFileInputs([]);
    setExpenseModal(true);
  };
  const openEditExpense = (exp) => {
    setEditExpenseId(exp.id);
    const d = exp.date ? new Date(exp.date).toISOString().slice(0, 10) : "";
    setExpenseForm({ category: exp.category, amount: String(exp.amount), currency: exp.currency, status: exp.status || "รอชำระ", notes: exp.notes || "", date: d, receiptNumber: exp.receiptNumber || "", receiptFile: exp.receiptFile || "" });
    setExpenseFileInputs([]);
    setExpenseModal(true);
  };
  const saveExpense = async () => {
    setSavingExpense(true);
    try {
      // Parse existing saved files (backward compat: may be JSON array or single path string)
      let existingPaths = [];
      if (expenseForm.receiptFile) {
        try { const p = JSON.parse(expenseForm.receiptFile); existingPaths = Array.isArray(p) ? p : [p]; }
        catch { existingPaths = [expenseForm.receiptFile]; }
      }
      // Upload each new file
      const newPaths = [];
      for (const file of expenseFileInputs) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const upData = await up.json();
        if (!up.ok) { showToast(upData.error || `อัปโหลด "${file.name}" ไม่สำเร็จ`, false); return; }
        newPaths.push(upData.path);
      }
      const allPaths = [...existingPaths, ...newPaths];
      const receiptFileSaved = allPaths.length === 0 ? "" : JSON.stringify(allPaths);
      const url = editExpenseId ? `/api/admin/expenses/${editExpenseId}` : "/api/admin/expenses";
      const method = editExpenseId ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...expenseForm, receiptFile: receiptFileSaved }) });
      const text = await r.text();
      const d = text ? JSON.parse(text) : {};
      if (!r.ok) { showToast(d.error || `เกิดข้อผิดพลาด (${r.status})`, false); return; }
      showToast(editExpenseId ? "อัพเดตค่าใช้จ่ายสำเร็จ" : "บันทึกค่าใช้จ่ายสำเร็จ");
      setExpenseModal(false);
      loadExpenses();
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, false);
    } finally { setSavingExpense(false); }
  };
  const deleteExpense = async (id, number) => {
    if (!confirm(`ลบบันทึกค่าใช้จ่าย "${number}" ?`)) return;
    const r = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    const text = await r.text();
    const d = text ? JSON.parse(text) : {};
    if (!r.ok) { showToast(d.error || "ลบไม่สำเร็จ", false); return; }
    showToast("ลบบันทึกสำเร็จ");
    loadExpenses();
  };

  const getReportItems = () => {
    const source = reportDataType === "invoice" ? invoices : expenses;
    const getDate = item => reportDataType === "invoice" ? item.createdAt : item.date;
    const getNum = item => item.number || "";
    if (reportMode === "number") {
      return source.filter(i => getNum(i).toLowerCase().includes(reportInvNum.toLowerCase()));
    }
    if (reportMode === "date" && reportDate) {
      return source.filter(i => new Date(getDate(i)).toISOString().slice(0, 10) === reportDate);
    }
    if (reportMode === "range" && (reportFrom || reportTo)) {
      return source.filter(i => {
        const d = new Date(getDate(i));
        const from = reportFrom ? new Date(reportFrom) : null;
        const to = reportTo ? new Date(reportTo + "T23:59:59") : null;
        return (!from || d >= from) && (!to || d <= to);
      });
    }
    return source;
  };

  const doPrint = () => {
    const items = getReportItems();
    const isInv = reportDataType === "invoice";
    const modeLabel = reportMode === "number" ? `เลขที่ "${reportInvNum}"` :
      reportMode === "date" ? `วันที่ ${new Date(reportDate + "T00:00:00").toLocaleDateString("th-TH")}` :
      `ช่วง ${reportFrom ? new Date(reportFrom + "T00:00:00").toLocaleDateString("th-TH") : "—"} ถึง ${reportTo ? new Date(reportTo + "T00:00:00").toLocaleDateString("th-TH") : "—"}`;
    const totalAmt = items.reduce((s, i) => s + Number(i.amount), 0);
    const rows = items.map(item => {
      if (isInv) {
        const clientName = clients.find(c => c.id === item.clientId)?.name || item.client?.name || "—";
        return `<tr>
          <td>${item.number}</td>
          <td>${clientName}</td>
          <td style="text-align:right">${Number(item.amount).toLocaleString("th-TH")} ${item.currency}</td>
          <td>${{ PAID: "ชำระแล้ว", PENDING: "รอชำระ", OVERDUE: "เกินกำหนด", CANCELLED: "ยกเลิก" }[item.status] || item.status}</td>
          <td>${item.dueDate ? new Date(item.dueDate).toLocaleDateString("th-TH") : "—"}</td>
          <td>${item.notes || "—"}</td>
          <td>${new Date(item.createdAt).toLocaleDateString("th-TH")}</td>
        </tr>`;
      } else {
        return `<tr>
          <td>${item.number}</td>
          <td>${item.category}</td>
          <td style="text-align:right">${Number(item.amount).toLocaleString("th-TH")} ${item.currency}</td>
          <td>${item.notes || "—"}</td>
          <td>${new Date(item.date).toLocaleDateString("th-TH")}</td>
        </tr>`;
      }
    }).join("");
    const headers = isInv
      ? "<th>เลข Invoice</th><th>บริษัท</th><th>ยอด</th><th>สถานะ</th><th>วันครบกำหนด</th><th>หมายเหตุ</th><th>สร้างเมื่อ</th>"
      : "<th>เลขที่</th><th>หมวดหมู่</th><th>ยอด</th><th>หมายเหตุ</th><th>วันที่</th>";
    const colspan = isInv ? 7 : 5;
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>รายงาน${isInv ? "Invoice" : "ค่าใช้จ่าย"}</title>
      <style>
        body { font-family: 'Sarabun', Arial, sans-serif; padding: 24px; color: #111; font-size: 13px; }
        h2 { margin-bottom: 4px; }
        .sub { color: #555; margin-bottom: 16px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) td { background: #f5f5f5; }
        .total { margin-top: 14px; font-size: 14px; font-weight: 700; text-align: right; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>รายงาน${isInv ? "Invoice" : "ค่าใช้จ่าย"} — ${modeLabel}</h2>
      <div class="sub">พิมพ์เมื่อ: ${new Date().toLocaleString("th-TH")} · รายการทั้งหมด ${items.length} รายการ</div>
      <table><thead><tr>${headers}</tr></thead><tbody>${rows || `<tr><td colspan="${colspan}" style="text-align:center;padding:24px;color:#888">ไม่พบรายการ</td></tr>`}</tbody></table>
      <div class="total">รวมทั้งสิ้น: ${totalAmt.toLocaleString("th-TH")} ${items[0]?.currency || "THB"}</div>
      <br/><button onclick="window.print()" style="padding:8px 20px;font-size:14px;cursor:pointer">🖨️ พิมพ์</button>
    </body></html>`);
    win.document.close();
  };

  const doPrintLedger = (currency) => {
    const symMap = { THB: "฿", KRW: "₩", USD: "$" };
    const sym = symMap[currency] || "";
    const fmt = n => Math.abs(n).toLocaleString("th-TH");
    const curInvoices = invoices.filter(i => (i.currency || "THB") === currency);
    const curExpenses = expenses.filter(e => (e.currency || "THB") === currency);
    const rows = [
      ...curInvoices.map(i => ({ date: new Date(i.createdAt), type: "income", ref: i.number, desc: i.client?.name || clients.find(c => c.id === i.clientId)?.name || "—", detail: { PENDING: "รอชำระ", PAID: "ชำระแล้ว", OVERDUE: "เกินกำหนด", CANCELLED: "ยกเลิก" }[i.status] || i.status, income: Number(i.amount), expense: 0 })),
      ...curExpenses.map(e => ({ date: new Date(e.date), type: "expense", ref: e.number, desc: e.category, detail: e.status || "รอชำระ", income: 0, expense: Number(e.amount) })),
    ].sort((a, b) => a.date - b.date);
    let running = 0;
    const totalIncome = curInvoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = curExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalIncome - totalExpense;
    const isProfit = netProfit >= 0;
    const profitBg = isProfit ? "#e8f5e9" : "#fdecea";
    const profitColor = isProfit ? "#1b5e20" : "#b71c1c";
    const profitBorder = isProfit ? "#a5d6a7" : "#ef9a9a";
    const profitLabel = isProfit ? "📈 กำไรสุทธิ" : "📉 ขาดทุนสุทธิ";
    const profitValColor = isProfit ? "green" : "#c0392b";
    const profitSign = isProfit ? "+" : "-";
    const profitBannerLabel = isProfit ? "📈 กำไร" : "📉 ขาดทุน";
    const netProfitFmt = fmt(netProfit);
    const tableRows = rows.map((r, idx) => {
      running += r.income - r.expense;
      const runColor = running >= 0 ? "green" : "#c0392b";
      const runSign = running >= 0 ? "+" : "-";
      const refColor = r.type === "income" ? "#1a4a9e" : "#8b1a1a";
      const typeLabel = r.type === "income" ? "💰 รายรับ" : "💸 รายจ่าย";
      const incCell = r.income > 0 ? "+" + sym + fmt(r.income) : "—";
      const expCell = r.expense > 0 ? "-" + sym + fmt(r.expense) : "—";
      return "<tr>" +
        "<td style='text-align:center;color:#888'>" + (idx + 1) + "</td>" +
        "<td style='white-space:nowrap'>" + r.date.toLocaleDateString("th-TH") + "</td>" +
        "<td><code style='font-size:11px;color:" + refColor + "'>" + r.ref + "</code></td>" +
        "<td>" + r.desc + "<br/><span style='font-size:11px;color:#666'>" + typeLabel + " · " + r.detail + "</span></td>" +
        "<td style='text-align:right;color:green;font-weight:700'>" + incCell + "</td>" +
        "<td style='text-align:right;color:#c0392b;font-weight:700'>" + expCell + "</td>" +
        "<td style='text-align:right;font-weight:800;color:" + runColor + "'>" + runSign + sym + fmt(running) + "</td>" +
        "</tr>";
    }).join("");
    const win = window.open("", "_blank");
    const html =
      "<\!DOCTYPE html><html><head><meta charset='UTF-8'>" +
      "<title>บัญชีรายรับ-รายจ่าย " + currency + "</title>" +
      "<style>" +
      "body{font-family:'Sarabun',Arial,sans-serif;padding:24px;color:#111;font-size:13px}" +
      "h2{margin-bottom:4px}.sub{color:#555;margin-bottom:12px;font-size:12px}" +
      ".summary{display:flex;gap:24px;margin-bottom:20px}" +
      ".card{border:1px solid #ccc;border-radius:6px;padding:12px 20px;text-align:center;min-width:140px}" +
      ".card .label{font-size:11px;color:#888}.card .val{font-size:18px;font-weight:800}" +
      ".profit-banner{padding:10px 16px;border-radius:6px;font-weight:700;font-size:14px;margin-bottom:16px;" +
      "background:" + profitBg + ";color:" + profitColor + ";border:1px solid " + profitBorder + "}" +
      "table{width:100%;border-collapse:collapse}" +
      "th{background:#1a1a2e;color:#fff;padding:8px 10px;text-align:left;font-size:12px}" +
      "td{padding:7px 10px;border-bottom:1px solid #e0e0e0;vertical-align:top}" +
      "tr:nth-child(even) td{background:#fafafa}" +
      "tfoot td{font-weight:800;background:#f0f0f0;border-top:2px solid #333}" +
      "@media print{button{display:none}}" +
      "</style></head><body>" +
      "<h2>📒 บัญชีรายรับ-รายจ่าย (" + currency + ")</h2>" +
      "<div class='sub'>พิมพ์เมื่อ: " + new Date().toLocaleString("th-TH") + "</div>" +
      "<div class='summary'>" +
        "<div class='card'><div class='label'>💰 รายรับรวม</div><div class='val' style='color:green'>" + sym + fmt(totalIncome) + "</div><div class='label'>" + currency + "</div></div>" +
        "<div class='card'><div class='label'>💸 รายจ่ายรวม</div><div class='val' style='color:#c0392b'>" + sym + fmt(totalExpense) + "</div><div class='label'>" + currency + "</div></div>" +
        "<div class='card'><div class='label'>" + profitLabel + "</div><div class='val' style='color:" + profitValColor + "'>" + profitSign + sym + netProfitFmt + "</div><div class='label'>" + currency + "</div></div>" +
      "</div>" +
      "<div class='profit-banner'>" + profitBannerLabel + ": " + profitSign + sym + netProfitFmt + " " + currency + " &nbsp;|  รายรับ " + sym + fmt(totalIncome) + " − รายจ่าย " + sym + fmt(totalExpense) + "</div>" +
      "<table><thead><tr><th>#</th><th>วันที่</th><th>เลขที่อ้างอิง</th><th>รายการ/รายละเอียด</th>" +
      "<th style='text-align:right'>รายรับ</th><th style='text-align:right'>รายจ่าย</th><th style='text-align:right'>คงเหลือสะสม</th></tr></thead>" +
      "<tbody>" + (tableRows || "<tr><td colspan='7' style='text-align:center;padding:24px;color:#888'>ไม่มีรายการ</td></tr>") + "</tbody>" +
      "<tfoot><tr><td colspan='4'>รวมทั้งหมด (" + rows.length + " รายการ)</td>" +
      "<td style='text-align:right;color:green'>+" + sym + fmt(totalIncome) + "</td>" +
      "<td style='text-align:right;color:#c0392b'>-" + sym + fmt(totalExpense) + "</td>" +
      "<td style='text-align:right;color:" + profitValColor + "'>" + profitSign + sym + netProfitFmt + "</td></tr></tfoot></table>" +
      "<br/><button onclick='window.print()' style='padding:8px 20px;font-size:14px;cursor:pointer'>🖨️ พิมพ์</button>" +
      "</body></html>";
    win.document.write(html);
    win.document.close();
  };

  const filteredClients = clients.filter(c =>
    (c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
     c.slug.toLowerCase().includes(clientSearch.toLowerCase())) &&
    (!filterClientStatus || c.status === filterClientStatus)
  );
  const filteredUsers = users.filter(u =>
    ((u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(userSearch.toLowerCase())) &&
    (!filterUserRole || u.role === filterUserRole)
  );
  const filteredInvoices = invoices.filter(i =>
    (!filterInvoiceClientId || i.clientId === filterInvoiceClientId) &&
    (!filterInvoiceStatus || i.status === filterInvoiceStatus)
  );

  const S = {
    bg: { background: "#0f1117", minHeight: "100vh", color: "#e8eaf0" },
    nav: { background: "#16181f", borderBottom: "1px solid #2a2d3a", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    card: { background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 10, padding: 20 },
    input: { background: "#1e2130", border: "1px solid #2a2d3a", color: "#e8eaf0", borderRadius: 6, padding: "8px 12px", width: "100%", fontSize: 14, outline: "none" },
    label: { fontSize: 12, color: "#8b8fa8", marginBottom: 4, display: "block" },
    btn: (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 6, padding: "7px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
    th: { padding: "10px 14px", fontSize: 12, color: "#8b8fa8", fontWeight: 600, textAlign: "left", borderBottom: "1px solid #2a2d3a", whiteSpace: "nowrap" },
    td: { padding: "10px 14px", fontSize: 13, borderBottom: "1px solid #1e2130", verticalAlign: "middle" },
  };

  return (
    <div style={S.bg}>
      {/* Navbar */}
      <nav style={S.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#7eb8f7" }}>⚙️ Admin Panel</span>
          <Link href="/admin/products" style={{ color: "#8b8fa8", fontSize: 13, textDecoration: "none" }}>สินค้า</Link>
          <span style={{ color: "#7eb8f7", fontSize: 13, fontWeight: 600 }}>ลูกค้า &amp; Users</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "#8b8fa8", fontSize: 13 }}>{session.user.name || session.user.email}</span>
          <Link href="/admin/payments" style={{ ...S.btn("#1a2e1a", "#4ade80"), textDecoration: "none", padding: "6px 14px" }}>
            💰 บันทึกการชำระเงิน
          </Link>
          <Link href="/mct-product" style={{ ...S.btn("#1e2336", "#7eb8f7"), textDecoration: "none", padding: "6px 14px" }}>
            📦 จัดการสินค้า
          </Link>
          <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => signOut({ callbackUrl: "/login" })}>ออกจากระบบ</button>
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.ok ? "#14532d" : "#7f1d1d", color: "#fff", borderRadius: 8, padding: "12px 20px", fontWeight: 600, fontSize: 14 }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "ลูกค้าทั้งหมด", value: clients.length, color: "#7eb8f7",
              onClick: () => { setTab("clients"); setFilterClientStatus(""); setClientSearch(""); } },
            { label: "ONLINE", value: clients.filter(c => c.status === "ONLINE").length, color: "#4ade80",
              onClick: () => { setTab("clients"); setFilterClientStatus("ONLINE"); setClientSearch(""); } },
            { label: "Users ทั้งหมด", value: users.length, color: "#a78bfa",
              onClick: () => { setTab("users"); setFilterUserRole(""); setUserSearch(""); } },
            { label: "Users (CLIENT)", value: users.filter(u => u.role === "CLIENT").length, color: "#fb923c",
              onClick: () => { setTab("users"); setFilterUserRole("CLIENT"); setUserSearch(""); } },
            { label: "รอชำระ", value: invoices.filter(i => i.status === "PENDING").length, color: "#fbbf24",
              onClick: () => { setTab("invoices"); setFilterInvoiceStatus("PENDING"); } },
            { label: "เกินกำหนด", value: invoices.filter(i => i.status === "OVERDUE").length, color: "#f87171",
              onClick: () => { setTab("invoices"); setFilterInvoiceStatus("OVERDUE"); } },
          ].map(s => (
            <div key={s.label} onClick={s.onClick} style={{ ...S.card, textAlign: "center", cursor: "pointer", transition: "border-color .15s",
              borderColor: "#2a2d3a", ":hover": { borderColor: s.color } }}
              onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2d3a"}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8b8fa8", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          {[["clients", "🏢 ลูกค้า"], ["users", "👤 Users"], ["invoices", "💳 การชำระเงิน"], ["expenses", "📝 ค่าใช้จ่าย"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              ...S.btn(tab === key ? "#1e3a5f" : "#1e2130", tab === key ? "#7eb8f7" : "#8b8fa8"),
              border: tab === key ? "1px solid #3b82f6" : "1px solid #2a2d3a",
              padding: "9px 20px", fontSize: 14,
            }}>{label}</button>
          ))}
          <button style={{ ...S.btn("#2d2040", "#c084fc"), border: "1px solid #7c3aed", padding: "9px 20px", fontSize: 14 }}
            onClick={() => { setReportDataType(tab === "expenses" ? "expense" : "invoice"); setReportMode("number"); setReportInvNum(""); setReportDate(""); setReportFrom(""); setReportTo(""); setReportModal(true); }}>
            📊 รายงาน
          </button>
          <button style={{ ...S.btn("#0f2318", "#4ade80"), border: "1px solid #166534", padding: "9px 20px", fontSize: 14 }}
            onClick={() => { setLedgerCurrency("THB"); setLedgerModal(true); }}>
            📒 บัญชี ไทย-เกาหลี
          </button>
        </div>

        {/* ── CLIENTS TAB ── */}
        {tab === "clients" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  style={{ ...S.input, maxWidth: 280 }}
                  placeholder="🔍 ค้นหาชื่อ / slug..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                />
                <select style={{ ...S.input, maxWidth: 160 }} value={filterClientStatus} onChange={e => setFilterClientStatus(e.target.value)}>
                  <option value="">ทุกสถานะ</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
                {(filterClientStatus) && (
                  <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => { setFilterClientStatus(""); setClientSearch(""); }}>× ล้าง filter</button>
                )}
              </div>
              <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={openAddClient}>+ เพิ่มลูกค้าใหม่</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["ชื่อบริษัท", "Slug", "สถานะ", "อีเมลติดต่อ", "เบอร์โทร", "URL ระบบ", "Users", "ค่าบริการรายเดือน", "ค่าเช่าโดเมนรายปี", "สร้างเมื่อ", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>กำลังโหลด...</td></tr>
                  ) : filteredClients.length === 0 ? (
                    <tr><td colSpan={11} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>ยังไม่มีลูกค้า</td></tr>
                  ) : filteredClients.map(c => {
                    const sb = STATUS_BADGE[c.status] || STATUS_BADGE.OFFLINE;
                    const pendingInvoices = (c.invoices || []).filter(i => i.status === "PENDING");
                    const monthlyInv = pendingInvoices.filter(i => !/โดเมน/i.test(i.notes || ""));
                    const domainInv = pendingInvoices.filter(i => /โดเมน/i.test(i.notes || ""));
                    const renderPending = (list) => list.length === 0 ? <span style={{ color: "#4a5070", fontSize: 12 }}>✔ ไม่มีค้างชำระ</span> : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {list.map(inv => (
                          <div key={inv.id} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ background: "#3d2e0a", color: "#fbbf24", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>รอชำระ</span>
                            <span style={{ color: "#8b8fa8", fontSize: 11 }}>
                              {Number(inv.amount).toLocaleString("th-TH")} THB
                              {inv.dueDate && ` · ครบ ${new Date(inv.dueDate).toLocaleDateString("th-TH")}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                    return (
                      <tr key={c.id}>
                        <td style={S.td}><span style={{ fontWeight: 600 }}>{c.name}</span></td>
                        <td style={S.td}><code style={{ color: "#8b8fa8", fontSize: 12 }}>{c.slug}</code></td>
                        <td style={S.td}>
                          <span style={{ background: sb.bg, color: sb.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{sb.label}</span>
                        </td>
                        <td style={S.td}>{c.contactEmail || <span style={{ color: "#4a5070" }}>—</span>}</td>
                        <td style={S.td}>{c.contactPhone || <span style={{ color: "#4a5070" }}>—</span>}</td>
                        <td style={S.td}>
                          {c.systemUrl ? (
                            <a href={c.systemUrl} target="_blank" rel="noopener noreferrer"
                              style={{ color: "#7eb8f7", fontSize: 12, textDecoration: "none", wordBreak: "break-all" }}
                              title={c.systemUrl}>
                              🔗 {c.systemUrl.replace(/^https?:\/\//, "").split("/")[0]}
                            </a>
                          ) : <span style={{ color: "#4a5070" }}>—</span>}
                        </td>
                        <td style={S.td}>
                          <span style={{ background: "#1a2744", color: "#7eb8f7", borderRadius: 4, padding: "2px 10px", fontWeight: 700 }}>{c._count.users}</span>
                        </td>
                        <td style={S.td}>{renderPending(monthlyInv)}</td>
                        <td style={S.td}>{renderPending(domainInv)}</td>
                        <td style={{ ...S.td, color: "#8b8fa8", fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString("th-TH")}</td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.btn("#1e2d3d", "#60a5fa")} onClick={() => openEditClient(c)}>✏️</button>
                            <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => deleteClient(c.id, c.name)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  style={{ ...S.input, maxWidth: 240 }}
                  placeholder="🔍 ค้นหาชื่อ / email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
                <select
                  style={{ ...S.input, maxWidth: 220 }}
                  value={filterClientId}
                  onChange={e => setFilterClientId(e.target.value)}
                >
                  <option value="">ทุกบริษัท</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={{ ...S.input, maxWidth: 160 }} value={filterUserRole} onChange={e => setFilterUserRole(e.target.value)}>
                  <option value="">ทุก Role</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CLIENT">CLIENT</option>
                </select>
              </div>
              <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={openAddUser}>+ เพิ่ม User ใหม่</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["ชื่อ", "Username", "Password", "Email", "Role", "บริษัท", "สร้างเมื่อ", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>กำลังโหลด...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>ยังไม่มี User</td></tr>
                  ) : filteredUsers.map(u => {
                    const rb = ROLE_BADGE[u.role] || ROLE_BADGE.CLIENT;
                    return (
                      <tr key={u.id}>
                        <td style={S.td}><span style={{ fontWeight: 600 }}>{u.name || <span style={{ color: "#4a5070" }}>—</span>}</span></td>
                        <td style={S.td}>
                          {u.username
                            ? <code style={{ background: "#1e2130", color: "#a78bfa", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>{u.username}</code>
                            : <span style={{ color: "#4a5070" }}>—</span>}
                        </td>
                        <td style={S.td}>
                          <span style={{ color: "#4a5070", letterSpacing: 2, fontSize: 13 }}>••••••••</span>
                        </td>
                        <td style={S.td}>{u.email}</td>
                        <td style={S.td}>
                          <span style={{ background: rb.bg, color: rb.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{rb.label}</span>
                        </td>
                        <td style={S.td}>{u.client ? <span style={{ color: "#7eb8f7" }}>{u.client.name}</span> : <span style={{ color: "#4a5070" }}>— ยังไม่ผูก —</span>}</td>
                        <td style={{ ...S.td, color: "#8b8fa8", fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.btn("#1e2d3d", "#60a5fa")} onClick={() => openEditUser(u)}>✏️</button>
                            <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => deleteUser(u.id, u.email)}
                              disabled={u.id === session.user.id}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── INVOICES TAB ── */}
        {tab === "invoices" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  style={{ ...S.input, maxWidth: 220 }}
                  value={filterInvoiceClientId}
                  onChange={e => setFilterInvoiceClientId(e.target.value)}
                >
                  <option value="">ทุกบริษัท</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={{ ...S.input, maxWidth: 160 }} value={filterInvoiceStatus} onChange={e => setFilterInvoiceStatus(e.target.value)}>
                  <option value="">ทุกสถานะ</option>
                  <option value="PENDING">รอชำระ</option>
                  <option value="PAID">ชำระแล้ว</option>
                  <option value="OVERDUE">เกินกำหนด</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
                {(filterInvoiceStatus || filterInvoiceClientId) && (
                  <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => { setFilterInvoiceStatus(""); setFilterInvoiceClientId(""); }}>× ล้าง filter</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={openAddInvoice}>+ สร้าง Invoice ใหม่</button>
                <button style={S.btn("#1e3d2f", "#5ecb8a")} onClick={openAddReceipt}>🧾 สร้างใบเสร็จรับเงิน</button>
                <button style={S.btn("#2d2040", "#c084fc")} onClick={() => { setReportDataType("invoice"); setReportMode("number"); setReportInvNum(""); setReportDate(""); setReportFrom(""); setReportTo(""); setReportModal(true); }}>📊 รายงาน</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["เลข Invoice", "บริษัท", "ยอด", "สถานะ", "วันครบกำหนด", "ชำระเมื่อ", "หมายเหตุ", "สร้างเมื่อ", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>กำลังโหลด...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan={9} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>ไม่พบข้อมูล</td></tr>
                  ) : filteredInvoices.map(inv => {
                    const ib = INVOICE_BADGE[inv.status] || INVOICE_BADGE.PENDING;
                    return (
                      <tr key={inv.id}>
                        <td style={S.td}><code style={{ color: "#7eb8f7", fontSize: 12 }}>{inv.number}</code></td>
                        <td style={S.td}><span style={{ fontWeight: 600 }}>{inv.client?.name || "—"}</span></td>
                        <td style={S.td}>
                          <span style={{ fontWeight: 700, color: "#4ade80" }}>{Number(inv.amount).toLocaleString("th-TH")}</span>
                          {inv.currency !== "THB" && <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: "#a78bfa", background: "#1e1b4b", borderRadius: 4, padding: "1px 6px" }}>{inv.currency}</span>}
                        </td>
                        <td style={S.td}>
                          <span style={{ background: ib.bg, color: ib.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{ib.label}</span>
                        </td>
                        <td style={{ ...S.td, fontSize: 12 }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH") : <span style={{ color: "#4a5070" }}>—</span>}</td>
                        <td style={{ ...S.td, fontSize: 12 }}>{inv.paidAt ? <span style={{ color: "#4ade80" }}>{new Date(inv.paidAt).toLocaleDateString("th-TH")}</span> : <span style={{ color: "#4a5070" }}>—</span>}</td>
                        <td style={{ ...S.td, fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.notes || <span style={{ color: "#4a5070" }}>—</span>}</td>
                        <td style={{ ...S.td, color: "#8b8fa8", fontSize: 12 }}>{new Date(inv.createdAt).toLocaleDateString("th-TH")}</td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={S.btn("#1e2d3d", "#60a5fa")} onClick={() => openEditInvoice(inv)}>✏️</button>
                            <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => deleteInvoice(inv.id, inv.number)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EXPENSES TAB ── */}
        {tab === "expenses" && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#8b8fa8" }}>บันทึกค่าใช้จ่ายทั้งหมด {expenses.length} รายการ
                {expenses.length > 0 && (
                  <span style={{ marginLeft: 12, color: "#f87171", fontWeight: 700 }}>
                    รวม: {Object.entries(expenses.reduce((acc, e) => { const cur = e.currency || "THB"; acc[cur] = (acc[cur] || 0) + Number(e.amount); return acc; }, {})).map(([cur, total]) => `${total.toLocaleString("th-TH")} ${cur}`).join(" | ")}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btn("#3d1f1f", "#f87171")} onClick={openAddExpense}>📝 สร้างบันทึกค่าใช้จ่าย</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["เลขที่", "หมวดหมู่", "ยอด", "สถานะ", "เลขที่ใบเสร็จ", "หมายเหตุ", "วันที่", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>กำลังโหลด...</td></tr>
                  ) : expenses.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#8b8fa8", padding: 40 }}>ยังไม่มีบันทึกค่าใช้จ่าย</td></tr>
                  ) : expenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={S.td}><code style={{ color: "#f87171", fontSize: 12 }}>{exp.number}</code></td>
                      <td style={S.td}><span style={{ background: "#2a1515", color: "#fb923c", borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{exp.category}</span></td>
                      <td style={S.td}><span style={{ fontWeight: 700, color: "#f87171" }}>{Number(exp.amount).toLocaleString("th-TH")}</span>{exp.currency && exp.currency !== "THB" && <span style={{ marginLeft: 6, fontSize: 11, background: exp.currency === "KRW" ? "#1a1a2e" : "#1a2e1a", color: exp.currency === "KRW" ? "#818cf8" : "#4ade80", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>{exp.currency === "KRW" ? "₩" : "$"} {exp.currency}</span>}</td>
                      <td style={S.td}>
                        {exp.status === "แนบใบเสร็จแล้ว"
                          ? <span style={{ fontSize: 11, background: "#14532d", color: "#4ade80", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>✅ แนบใบเสร็จแล้ว</span>
                          : <span style={{ fontSize: 11, background: "#2d1b4e", color: "#c084fc", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>⏳ รอชำระ</span>}
                      </td>
                      <td style={{ ...S.td, fontSize: 12 }}>{exp.receiptNumber ? <code style={{ color: "#a78bfa", fontSize: 11 }}>{exp.receiptNumber}</code> : <span style={{ color: "#4a5070" }}>—</span>}{(() => { if (!exp.receiptFile) return null; let paths = []; try { const p = JSON.parse(exp.receiptFile); paths = Array.isArray(p) ? p : [p]; } catch { paths = [exp.receiptFile]; } return paths.map((path, i) => <a key={i} href={path} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4, fontSize: 11, color: "#60a5fa" }}>📄{paths.length > 1 ? i+1 : ""}</a>); })()}</td>
                      <td style={{ ...S.td, fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.notes || <span style={{ color: "#4a5070" }}>—</span>}</td>
                      <td style={{ ...S.td, color: "#8b8fa8", fontSize: 12 }}>{new Date(exp.date).toLocaleDateString("th-TH")}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={S.btn("#1e2d3d", "#60a5fa")} onClick={() => openEditExpense(exp)}>✏️</button>
                          <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => deleteExpense(exp.id, exp.number)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── LEDGER MODAL ── */}
      {ledgerModal && (() => {
        const CURRENCIES = ["THB", "KRW", "USD"];
        const symMap = { THB: "฿", KRW: "₩", USD: "$" };
        const sym = symMap[ledgerCurrency] || "";
        const fmt = n => Math.abs(n).toLocaleString("th-TH");

        const curInvoices = invoices.filter(i => (i.currency || "THB") === ledgerCurrency);
        const curExpenses = expenses.filter(e => (e.currency || "THB") === ledgerCurrency);

        // Build combined ledger rows sorted by date
        const rows = [
          ...curInvoices.map(i => ({
            id: i.id, date: new Date(i.createdAt), type: "income",
            ref: i.number, desc: i.client?.name || "—",
            detail: { PENDING: "รอชำระ", PAID: "ชำระแล้ว", OVERDUE: "เกินกำหนด", CANCELLED: "ยกเลิก" }[i.status] || i.status,
            income: Number(i.amount), expense: 0,
          })),
          ...curExpenses.map(e => ({
            id: e.id, date: new Date(e.date), type: "expense",
            ref: e.number, desc: e.category,
            detail: e.status || "รอชำระ",
            income: 0, expense: Number(e.amount),
          })),
        ].sort((a, b) => a.date - b.date);

        // Compute running balance
        let running = 0;
        const ledgerRows = rows.map(r => {
          running += r.income - r.expense;
          return { ...r, running };
        });

        const totalIncome = curInvoices.reduce((s, i) => s + Number(i.amount), 0);
        const totalExpense = curExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const netProfit = totalIncome - totalExpense;
        const isProfit = netProfit >= 0;

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 24, overflowY: "auto" }}>
            <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 960, border: "1px solid #2a2d3a", marginTop: 16 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h5 style={{ margin: 0, color: "#4ade80", fontSize: 17 }}>📒 บัญชีรายรับ-รายจ่าย</h5>
                <button style={{ background: "none", border: "none", color: "#8b8fa8", fontSize: 22, cursor: "pointer" }} onClick={() => setLedgerModal(false)}>✕</button>
              </div>

              {/* Currency toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {CURRENCIES.map(cur => (
                  <button key={cur} style={{ padding: "7px 20px", borderRadius: 6, border: ledgerCurrency === cur ? "1px solid #4ade80" : "1px solid #2a2d3a", background: ledgerCurrency === cur ? "#0f2318" : "#1e2130", color: ledgerCurrency === cur ? "#4ade80" : "#8b8fa8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    onClick={() => setLedgerCurrency(cur)}>{symMap[cur]} {cur}</button>
                ))}
              </div>

              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "💰 รายรับรวม", value: totalIncome, color: "#4ade80", bg: "#0f2318", border: "#166534" },
                  { label: "💸 รายจ่ายรวม", value: totalExpense, color: "#f87171", bg: "#1f0f0f", border: "#7f1d1d" },
                  { label: isProfit ? "📈 กำไรสุทธิ" : "📉 ขาดทุนสุทธิ", value: netProfit, color: isProfit ? "#4ade80" : "#f87171", bg: isProfit ? "#0f2318" : "#1f0f0f", border: isProfit ? "#166534" : "#7f1d1d" },
                  { label: "📋 รายการทั้งหมด", value: rows.length, color: "#7eb8f7", bg: "#0f1830", border: "#1e3a5f", isCount: true },
                ].map(({ label, value, color, bg, border, isCount }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#8b8fa8", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>
                      {isCount ? value : `${sym}${fmt(value)}`}
                    </div>
                    {!isCount && <div style={{ fontSize: 11, color: "#4a5070", marginTop: 2 }}>{ledgerCurrency}</div>}
                  </div>
                ))}
              </div>

              {/* Profit/Loss banner */}
              <div style={{ background: isProfit ? "#052e16" : "#450a0a", border: `1px solid ${isProfit ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: isProfit ? "#4ade80" : "#f87171", fontWeight: 700, fontSize: 15 }}>
                  {isProfit ? "📈 กำไร" : "📉 ขาดทุน"}: {sym}{fmt(netProfit)} {ledgerCurrency}
                </span>
                <span style={{ color: "#8b8fa8", fontSize: 12 }}>
                  รายรับ {sym}{fmt(totalIncome)} − รายจ่าย {sym}{fmt(totalExpense)}
                </span>
              </div>

              {/* Combined ledger table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["#", "วันที่", "เลขที่อ้างอิง", "รายการ / รายละเอียด", `รายรับ (${ledgerCurrency})`, `รายจ่าย (${ledgerCurrency})`, `คงเหลือสะสม`].map(h => (
                        <th key={h} style={{ ...S.th, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.length === 0 ? (
                      <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#4a5070", padding: 32 }}>ไม่มีรายการในสกุลเงินนี้</td></tr>
                    ) : ledgerRows.map((r, idx) => (
                      <tr key={r.id} style={{ background: idx % 2 === 0 ? "transparent" : "#0f111633" }}>
                        <td style={{ ...S.td, color: "#4a5070", fontSize: 11, textAlign: "center" }}>{idx + 1}</td>
                        <td style={{ ...S.td, fontSize: 11, color: "#8b8fa8", whiteSpace: "nowrap" }}>{r.date.toLocaleDateString("th-TH")}</td>
                        <td style={S.td}>
                          <code style={{ fontSize: 11, color: r.type === "income" ? "#7eb8f7" : "#f87171" }}>{r.ref}</code>
                        </td>
                        <td style={S.td}>
                          <div style={{ fontSize: 13 }}>{r.desc}</div>
                          <div style={{ fontSize: 11, color: r.type === "income" ? "#facc15" : "#c084fc", marginTop: 2 }}>
                            {r.type === "income" ? "💰 รายรับ" : "💸 รายจ่าย"} · {r.detail}
                          </div>
                        </td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#4ade80" }}>
                          {r.income > 0 ? `+${sym}${fmt(r.income)}` : <span style={{ color: "#2a2d3a" }}>—</span>}
                        </td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#f87171" }}>
                          {r.expense > 0 ? `-${sym}${fmt(r.expense)}` : <span style={{ color: "#2a2d3a" }}>—</span>}
                        </td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: r.running >= 0 ? "#4ade80" : "#f87171", whiteSpace: "nowrap" }}>
                          {r.running >= 0 ? "+" : "-"}{sym}{fmt(r.running)}
                        </td>
                      </tr>
                    ))}
                    {/* Footer totals */}
                    {ledgerRows.length > 0 && (
                      <tr style={{ borderTop: "2px solid #2a2d3a", background: "#1e2130" }}>
                        <td colSpan={4} style={{ ...S.td, fontWeight: 700, color: "#8b8fa8" }}>รวมทั้งหมด</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#4ade80" }}>+{sym}{fmt(totalIncome)}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#f87171" }}>-{sym}{fmt(totalExpense)}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: isProfit ? "#4ade80" : "#f87171" }}>
                          {isProfit ? "+" : "-"}{sym}{fmt(netProfit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setLedgerModal(false)}>ปิด</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── REPORT MODAL ── */}
      {reportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 520, border: "1px solid #2a2d3a" }}>
            <h5 style={{ margin: "0 0 20px", color: "#c084fc" }}>📊 รายงาน / พิมพ์บิล</h5>
            <div style={{ display: "grid", gap: 16 }}>
              {/* ประเภทข้อมูล */}
              <div>
                <label style={S.label}>ประเภทรายงาน</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["invoice", "💳 Invoice"], ["expense", "📝 ค่าใช้จ่าย"], ["ledger", "📒 บัญชี"]].map(([v, l]) => (
                    <button key={v} style={{ ...S.btn(reportDataType === v ? "#2d2040" : "#1e2130", reportDataType === v ? "#c084fc" : "#8b8fa8"), border: reportDataType === v ? "1px solid #7c3aed" : "1px solid #2a2d3a", flex: 1 }} onClick={() => setReportDataType(v)}>{l}</button>
                  ))}
                </div>
              </div>
              {/* โหมด - ซ่อนเมื่อเป็น ledger */}
              {reportDataType !== "ledger" && (
              <div>
                <label style={S.label}>เงื่อนไขการค้นหา</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["number", "🔢 เลขที่บิล"], ["date", "📅 วันที่"], ["range", "📆 ช่วงวันที่"]].map(([v, l]) => (
                    <button key={v} style={{ ...S.btn(reportMode === v ? "#1a2040" : "#1e2130", reportMode === v ? "#7eb8f7" : "#8b8fa8"), border: reportMode === v ? "1px solid #3b82f6" : "1px solid #2a2d3a", flex: 1, fontSize: 12 }} onClick={() => setReportMode(v)}>{l}</button>
                  ))}
                </div>
              </div>
              )}
              {/* Ledger currency selector */}
              {reportDataType === "ledger" && (
              <div>
                <label style={S.label}>เลือกสกุลเงินที่ต้องการพิมพ์</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["THB", "฿ THB"], ["KRW", "₩ KRW"], ["USD", "$ USD"]].map(([cur, label]) => (
                    <button key={cur} style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: ledgerCurrency === cur ? "1px solid #4ade80" : "1px solid #2a2d3a", background: ledgerCurrency === cur ? "#0f2318" : "#1e2130", color: ledgerCurrency === cur ? "#4ade80" : "#8b8fa8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      onClick={() => setLedgerCurrency(cur)}>{label}</button>
                  ))}
                </div>
                <div style={{ marginTop: 10, background: "#1a1d27", borderRadius: 8, padding: "10px 14px", border: "1px solid #2a2d3a", fontSize: 13, color: "#8b8fa8" }}>
                  {(() => { const ci = invoices.filter(i => (i.currency||"THB") === ledgerCurrency).length; const ce = expenses.filter(e => (e.currency||"THB") === ledgerCurrency).length; const ti = invoices.filter(i=>(i.currency||"THB")===ledgerCurrency).reduce((s,i)=>s+Number(i.amount),0); const te = expenses.filter(e=>(e.currency||"THB")===ledgerCurrency).reduce((s,e)=>s+Number(e.amount),0); const sym={THB:"฿",KRW:"₩",USD:"$"}[ledgerCurrency]||""; return <>รายรับ <span style={{color:"#4ade80",fontWeight:700}}>{ci} รายการ</span> · รายจ่าย <span style={{color:"#f87171",fontWeight:700}}>{ce} รายการ</span> · {ti-te >= 0 ? <span style={{color:"#4ade80"}}>📈 กำไร {sym}{(ti-te).toLocaleString("th-TH")}</span> : <span style={{color:"#f87171"}}>📉 ขาดทุน {sym}{Math.abs(ti-te).toLocaleString("th-TH")}</span>}</>; })()}
                </div>
              </div>
              )}
              {/* Input ตามโหมด */}
              {reportDataType !== "ledger" && reportMode === "number" && (
                <div>
                  <label style={S.label}>เลขที่บิล (พิมพ์บางส่วนก็ได้)</label>
                  <input style={S.input} placeholder="เช่น INV260420 หรือ EXP260420" value={reportInvNum} onChange={e => setReportInvNum(e.target.value)} />
                </div>
              )}
              {reportDataType !== "ledger" && reportMode === "date" && (
                <div>
                  <label style={S.label}>วันที่</label>
                  <input style={S.input} type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                </div>
              )}
              {reportDataType !== "ledger" && reportMode === "range" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={S.label}>จากวันที่</label>
                    <input style={S.input} type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} />
                  </div>
                  <div>
                    <label style={S.label}>ถึงวันที่</label>
                    <input style={S.input} type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} />
                  </div>
                </div>
              )}
              {/* Preview count - ซ่อนเมื่อเป็น ledger */}
              {reportDataType !== "ledger" && (
              <div style={{ background: "#1a1d27", borderRadius: 8, padding: "10px 14px", border: "1px solid #2a2d3a", fontSize: 13, color: "#8b8fa8" }}>
                พบ <span style={{ color: "#c084fc", fontWeight: 700 }}>{getReportItems().length}</span> รายการ
                {getReportItems().length > 0 && (
                  <span style={{ marginLeft: 10 }}>· รวม <span style={{ color: "#4ade80", fontWeight: 700 }}>{getReportItems().reduce((s, i) => s + Number(i.amount), 0).toLocaleString("th-TH")}</span> {getReportItems()[0]?.currency || "THB"}</span>
                )}
              </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setReportModal(false)}>ยกเลิก</button>
              {reportDataType === "ledger" ? (
                <button style={S.btn("#0f2318", "#4ade80")} onClick={() => doPrintLedger(ledgerCurrency)}>
                  🖨️ พิมพ์บัญชี {ledgerCurrency}
                </button>
              ) : (
                <button style={S.btn("#2d2040", "#c084fc")} onClick={doPrint} disabled={getReportItems().length === 0}>
                  🖨️ เปิด / พิมพ์ ({getReportItems().length} รายการ)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EXPENSE MODAL ── */}
      {expenseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 460, border: "1px solid #2a2d3a" }}>
            <h5 style={{ margin: "0 0 20px", color: "#f87171" }}>{editExpenseId ? "✏️ แก้ไขค่าใช้จ่าย" : "📝 สร้างบันทึกค่าใช้จ่าย"}</h5>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={S.label}>หมวดหมู่ *</label>
                <select style={S.input} value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">— เลือกหมวดหมู่ —</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>ยอดเงิน *</label>
                  <input style={S.input} type="number" min="0" step="0.01" placeholder="0.00"
                    value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>สกุลเงิน</label>
                  <select style={S.input} value={expenseForm.currency} onChange={e => setExpenseForm(p => ({ ...p, currency: e.target.value }))}>
                    <option value="THB">THB — บาทไทย</option>
                    <option value="KRW">KRW — วอนเกาหลี ₩</option>
                    <option value="USD">USD — ดอลลาร์สหรัฐ $</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={S.label}>วันที่</label>
                <input style={S.input} type="date" value={expenseForm.date}
                  onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>สถานะ</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["รอชำระ", "#7c3aed", "#c084fc"], ["แนบใบเสร็จแล้ว", "#166534", "#4ade80"]].map(([v, bg, color]) => (
                    <button key={v} type="button"
                      style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: expenseForm.status === v ? `1px solid ${color}` : "1px solid #2a2d3a", background: expenseForm.status === v ? bg + "33" : "#1e2130", color: expenseForm.status === v ? color : "#8b8fa8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      onClick={() => setExpenseForm(p => ({ ...p, status: v }))}>
                      {v === "รอชำระ" ? "⏳ รอชำระ" : "✅ แนบใบเสร็จแล้ว"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>หมายเหตุ</label>
                <textarea style={{ ...S.input, height: 72, resize: "vertical" }} placeholder="รายละเอียดเพิ่มเติม..."
                  value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>เลขที่ใบเสร็จ</label>
                <input style={S.input} type="text" placeholder="เช่น REC-2570-001"
                  value={expenseForm.receiptNumber} onChange={e => setExpenseForm(p => ({ ...p, receiptNumber: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>ไฟล์ใบเสร็จ (PDF / รูปภาพ) — เพิ่มได้หลายไฟล์</label>
                {/* Existing saved files */}
                {(() => {
                  let saved = [];
                  if (expenseForm.receiptFile) {
                    try { const p = JSON.parse(expenseForm.receiptFile); saved = Array.isArray(p) ? p : [p]; }
                    catch { saved = [expenseForm.receiptFile]; }
                  }
                  return saved.length > 0 ? (
                    <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                      {saved.map((path, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "#111827", borderRadius: 6, padding: "5px 10px", border: "1px solid #2a3a55" }}>
                          <a href={path} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4ade80", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {path.split("/").pop()}</a>
                          <button type="button" style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                            onClick={() => {
                              const newSaved = saved.filter((_, i) => i !== idx);
                              setExpenseForm(p => ({ ...p, receiptFile: newSaved.length === 0 ? "" : JSON.stringify(newSaved) }));
                            }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
                {/* New files queued */}
                {expenseFileInputs.length > 0 && (
                  <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {expenseFileInputs.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f1e30", borderRadius: 6, padding: "5px 10px", border: "1px solid #1e3a55" }}>
                        <span style={{ fontSize: 12, color: "#60a5fa", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {file.name}</span>
                        <button type="button" style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 2px" }}
                          onClick={() => setExpenseFileInputs(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ ...S.btn("#1e2d3d", "#60a5fa"), cursor: "pointer", padding: "6px 14px", fontSize: 13, borderRadius: 6, border: "1px solid #2a3a55", userSelect: "none", display: "inline-block" }}>
                  📎 เพิ่มไฟล์
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple style={{ display: "none" }}
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setExpenseFileInputs(prev => [...prev, ...files]);
                      e.target.value = "";
                    }} />
                </label>
                {expenseFileInputs.length === 0 && !expenseForm.receiptFile && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: "#4a5070" }}>ยังไม่มีไฟล์</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setExpenseModal(false)}>ยกเลิก</button>
              <button style={S.btn("#3d1f1f", "#f87171")} onClick={saveExpense} disabled={savingExpense}>
                {savingExpense ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENT MODAL ── */}
      {clientModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 520, border: "1px solid #2a2d3a", maxHeight: "90vh", overflowY: "auto" }}>
            <h5 style={{ margin: "0 0 20px", color: "#7eb8f7" }}>{editClientId ? "✏️ แก้ไขลูกค้า" : "🏢 เพิ่มลูกค้าใหม่"}</h5>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={S.label}>ชื่อบริษัท *</label>
                <input style={S.input} value={clientForm.name}
                  onChange={e => setClientForm(p => ({ ...p, name: e.target.value, slug: editClientId ? p.slug : slugify(e.target.value) }))} />
              </div>
              <div>
                <label style={S.label}>Slug (URL) *</label>
                <input style={S.input} value={clientForm.slug}
                  onChange={e => setClientForm(p => ({ ...p, slug: slugify(e.target.value) }))} />
              </div>
              <div>
                <label style={S.label}>คำอธิบาย</label>
                <textarea style={{ ...S.input, height: 72, resize: "vertical" }} value={clientForm.description}
                  onChange={e => setClientForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>สถานะ</label>
                <select style={S.input} value={clientForm.status} onChange={e => setClientForm(p => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>อีเมลติดต่อ</label>
                  <input style={S.input} type="email" value={clientForm.contactEmail}
                    onChange={e => setClientForm(p => ({ ...p, contactEmail: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>เบอร์โทร</label>
                  <input style={S.input} value={clientForm.contactPhone}
                    onChange={e => setClientForm(p => ({ ...p, contactPhone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={S.label}>URL ระบบลูกค้า</label>
                <input style={S.input} placeholder="https://..." value={clientForm.systemUrl}
                  onChange={e => setClientForm(p => ({ ...p, systemUrl: e.target.value }))} />
              </div>
              {/* Services */}
              <div>
                <label style={S.label}>ประเภทบริการ</label>
                {services.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#4a5070", margin: 0 }}>ยังไม่มีบริการในระบบ</p>
                ) : (
                  <div style={{ display: "grid", gap: 8, maxHeight: 180, overflowY: "auto", background: "#1e2130", borderRadius: 6, padding: "10px 12px", border: "1px solid #2a2d3a" }}>
                    {services.map(sv => {
                      const checked = clientForm.serviceIds.includes(sv.id);
                      return (
                        <label key={sv.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setClientForm(p => ({
                              ...p,
                              serviceIds: checked
                                ? p.serviceIds.filter(id => id !== sv.id)
                                : [...p.serviceIds, sv.id],
                            }))}
                            style={{ accentColor: "#7eb8f7", width: 15, height: 15 }}
                          />
                          <span style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 600 }}>{sv.title}</span>
                          <span style={{ fontSize: 12, color: "#8b8fa8" }}>— {sv.highlight}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setClientModal(false)}>ยกเลิก</button>
              <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={saveClient} disabled={savingClient}>
                {savingClient ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER MODAL ── */}
      {userModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 460, border: "1px solid #2a2d3a" }}>
            <h5 style={{ margin: "0 0 20px", color: "#7eb8f7" }}>{editUserId ? "✏️ แก้ไข User" : "👤 เพิ่ม User ใหม่"}</h5>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={S.label}>ชื่อ</label>
                <input style={S.input} value={userForm.name}
                  onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Email *</label>
                <input style={S.input} type="email" value={userForm.email}
                  onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>{editUserId ? "รหัสผ่านใหม่ (ว่าง = ไม่เปลี่ยน)" : "รหัสผ่าน *"}</label>
                <div style={{ display: "flex", gap: 0 }}>
                  <input
                    style={{ ...S.input, borderRadius: "6px 0 0 6px", borderRight: "none" }}
                    type={showUserPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(v => !v)}
                    style={{ background: "#2a2d3a", border: "1px solid #2a2d3a", borderLeft: "none", borderRadius: "0 6px 6px 0", padding: "0 14px", cursor: "pointer", color: "#8b8fa8", fontSize: 16, flexShrink: 0 }}
                  >
                    {showUserPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              <div>
                <label style={S.label}>Role</label>
                <select style={S.input} value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>ผูกกับบริษัท</label>
                <select style={S.input} value={userForm.clientId} onChange={e => setUserForm(p => ({ ...p, clientId: e.target.value }))}>
                  <option value="">— ไม่ผูกกับบริษัทใด —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setUserModal(false)}>ยกเลิก</button>
              <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={saveUser} disabled={savingUser}>
                {savingUser ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE MODAL ── */}
      {invoiceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#16181f", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480, border: "1px solid #2a2d3a", maxHeight: "90vh", overflowY: "auto" }}>
            <h5 style={{ margin: "0 0 20px", color: isReceiptMode ? "#5ecb8a" : "#7eb8f7" }}>
              {editInvoiceId ? "✏️ แก้ไข Invoice" : isReceiptMode ? "🧾 สร้างใบเสร็จรับเงิน" : "💳 สร้าง Invoice ใหม่"}
            </h5>
            <div style={{ display: "grid", gap: 14 }}>
              {isReceiptMode ? (
                // ── RECEIPT MODE: pick existing invoice ──
                <>
                  <div>
                    <label style={S.label}>เลือก Invoice *</label>
                    <select style={S.input} value={selectedInvId} onChange={e => {
                      const id = e.target.value;
                      setSelectedInvId(id);
                      const inv = invoices.find(i => i.id === id);
                      if (inv) {
                        const due = inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "";
                        setInvoiceForm(p => ({
                          ...p,
                          clientId: inv.clientId,
                          amount: String(inv.amount),
                          currency: inv.currency,
                          dueDate: due,
                          notes: inv.notes || "",
                          receiptNumber: inv.receiptNumber || "",
                        }));
                      } else {
                        setInvoiceForm({ clientId: "", amount: "", currency: "THB", status: "PAID", dueDate: "", notes: "", receiptNumber: "" });
                      }
                    }}>
                      <option value="">— เลือก Invoice —</option>
                      {invoices.filter(i => !i.receiptNumber && i.status !== "PAID").map(i => (
                        <option key={i.id} value={i.id}>{i.number} — {i.client?.name || i.clientId} ({Number(i.amount).toLocaleString()} บ.)</option>
                      ))}
                    </select>
                    {invoices.filter(i => !i.receiptNumber && i.status !== "PAID").length === 0 && (
                      <div style={{ fontSize: 12, color: "#8b8fa8", marginTop: 4 }}>ไม่มี Invoice ที่ยังไม่ได้ออกใบเสร็จ</div>
                    )}
                  </div>
                  {selectedInvId && (() => {
                    const inv = invoices.find(i => i.id === selectedInvId);
                    const previewRcp = invoiceForm.receiptNumber || (inv ? `RCP-${inv.number}` : "");
                    return (
                      <>
                        <div style={{ background: "#1a1d27", borderRadius: 8, padding: "12px 14px", border: "1px solid #2a2d3a", display: "grid", gap: 6 }}>
                          <div style={{ fontSize: 12, color: "#8b8fa8" }}>รายละเอียด Invoice</div>
                          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <span style={{ color: "#c8cce0", fontWeight: 600 }}>{inv?.number}</span>
                            <span style={{ color: "#c8cce0" }}>{clients.find(c => c.id === inv?.clientId)?.name}</span>
                            <span style={{ color: "#5ecb8a", fontWeight: 600 }}>{Number(inv?.amount).toLocaleString()} {inv?.currency}</span>
                          </div>
                        </div>
                        <div>
                          <label style={S.label}>รหัสใบเสร็จ (Receipt No.)</label>
                          <input style={{ ...S.input, color: invoiceForm.receiptNumber ? "#c8cce0" : "#5ecb8a" }}
                            placeholder={`สร้างอัตโนมัติ: ${previewRcp}`}
                            value={invoiceForm.receiptNumber}
                            onChange={e => setInvoiceForm(p => ({ ...p, receiptNumber: e.target.value }))} />
                          {!invoiceForm.receiptNumber && (
                            <div style={{ fontSize: 11, color: "#5ecb8a", marginTop: 4 }}>✨ จะใช้ {previewRcp} อัตโนมัติ</div>
                          )}
                        </div>
                        <div>
                          <label style={S.label}>หมายเหตุ (เพิ่มเติม)</label>
                          <textarea style={{ ...S.input, height: 64, resize: "vertical" }} value={invoiceForm.notes}
                            onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                // ── NORMAL INVOICE / EDIT MODE ──
                <>
                  {!editInvoiceId && (
                    <div>
                      <label style={S.label}>บริษัท *</label>
                      <select style={S.input} value={invoiceForm.clientId} onChange={e => setInvoiceForm(p => ({ ...p, clientId: e.target.value }))}>
                        <option value="">— เลือกบริษัท —</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  {editInvoiceId && (
                    <div>
                      <label style={S.label}>บริษัท</label>
                      <input style={{ ...S.input, color: "#8b8fa8" }} value={clients.find(c => c.id === invoiceForm.clientId)?.name || invoiceForm.clientId} readOnly />
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>ยอดเงิน *</label>
                  <input style={S.input} type="number" min="0" step="0.01" value={invoiceForm.amount}
                    onChange={e => setInvoiceForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>สกุลเงิน</label>
                  <select style={S.input} value={invoiceForm.currency} onChange={e => setInvoiceForm(p => ({ ...p, currency: e.target.value }))}>
                    <option value="THB">THB — บาทไทย</option>
                    <option value="KRW">KRW — วอนเกาหลี ₩</option>
                    <option value="USD">USD — ดอลลาร์สหรัฐ $</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={S.label}>สถานะ</label>
                <select style={S.input} value={invoiceForm.status} onChange={e => setInvoiceForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="PENDING">รอชำระ</option>
                  <option value="PAID">ชำระแล้ว</option>
                  <option value="OVERDUE">เกินกำหนด</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
              <div>
                <label style={S.label}>วันครบกำหนดชำระ</label>
                <input style={S.input} type="date" value={invoiceForm.dueDate}
                  onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              {(isReceiptMode || invoiceForm.receiptNumber) && !isReceiptMode && (
                <div>
                  <label style={S.label}>รหัสใบเสร็จ (Receipt No.)</label>
                  <input style={S.input} placeholder="เช่น RCP-260420-001" value={invoiceForm.receiptNumber}
                    onChange={e => setInvoiceForm(p => ({ ...p, receiptNumber: e.target.value }))} />
                </div>
              )}
              <div>
                <label style={S.label}>หมายเหตุ</label>
                <textarea style={{ ...S.input, height: 72, resize: "vertical" }} value={invoiceForm.notes}
                  onChange={e => setInvoiceForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setInvoiceModal(false)}>ยกเลิก</button>
              <button style={S.btn(isReceiptMode ? "#1e3d2f" : "#1e3a5f", isReceiptMode ? "#5ecb8a" : "#7eb8f7")} onClick={saveInvoice} disabled={savingInvoice}>
                {savingInvoice ? "กำลังบันทึก..." : isReceiptMode ? "ออกใบเสร็จ" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
