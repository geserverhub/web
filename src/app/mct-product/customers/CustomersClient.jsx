"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const EMPTY = {
  clientId: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  idCard: "",
  notes: "",
};

export default function CustomersClient({ session }) {
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const [clients, setClients] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const safeJson = async (res) => {
    const t = await res.text();
    try {
      return t ? JSON.parse(t) : {};
    } catch {
      return { error: t || "Invalid response" };
    }
  };

  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientData, customerData] = await Promise.all([
        apiFetch("/api/mct/clients"),
        apiFetch(`/api/mct/customers${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ""}`),
      ]);
      setClients(Array.isArray(clientData.clients) ? clientData.clients : []);
      setCustomers(Array.isArray(customerData.customers) ? customerData.customers : []);
    } catch (err) {
      showToast(err.message || "โหลดข้อมูลไม่สำเร็จ", "danger");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, debouncedQ, showToast]);

  useEffect(() => {
    if (!isAdmin && clients.length === 1 && clients[0]?.id && !form.clientId) {
      setForm((prev) => ({ ...prev, clientId: clients[0].id }));
    }
  }, [isAdmin, clients, form.clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const clientNameMap = useMemo(() => {
    const m = new Map();
    clients.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch(editId ? `/api/mct/customers/${editId}` : "/api/mct/customers", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      setEditId(null);
      showToast(editId ? "อัปเดตบัญชีลูกค้าแล้ว" : "เพิ่มบัญชีลูกค้าแล้ว");
      await load();
    } catch (err) {
      showToast(err.message || "บันทึกไม่สำเร็จ", "danger");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditId(c.id);
    setForm({
      clientId: c.clientId || "",
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      idCard: c.idCard || "",
      notes: c.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeCustomer(id) {
    if (!confirm("ยืนยันลบบัญชีลูกค้านี้?")) return;
    try {
      await apiFetch(`/api/mct/customers/${id}`, { method: "DELETE" });
      showToast("ลบบัญชีลูกค้าแล้ว", "warning");
      await load();
    } catch (err) {
      showToast(err.message || "ลบไม่สำเร็จ", "danger");
    }
  }

  return (
    <div className="min-vh-100" style={{ background: "#0f1117", color: "#e8eaf0" }}>
      <nav className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom" style={{ background: "#16181f", borderColor: "#2a2d3a" }}>
        <div>
          <h5 className="mb-0">👥 ระบบบัญชีลูกค้า</h5>
          <div className="small" style={{ color: "#8b8fa8" }}>{session?.user?.name || session?.user?.email}</div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/mct-product/market" className="btn btn-sm btn-outline-secondary">
            <span className="btn-path-stack center">
              <span className="btn-path-label">ไปมาร์ทซื้อ-ขาย</span>
              <span className="btn-path-caption">/mct-product/market</span>
            </span>
          </Link>
          <Link href="/mct-product" className="btn btn-sm btn-primary">
            <span className="btn-path-stack center">
              <span className="btn-path-label">กลับหน้าจัดการสินค้า</span>
              <span className="btn-path-caption">/mct-product</span>
            </span>
          </Link>
        </div>
      </nav>

      {toast && <div className={`position-fixed top-0 end-0 m-3 alert alert-${toast.type}`} style={{ zIndex: 9999 }}>{toast.msg}</div>}

      <div className="container-fluid py-4 px-4">
        <form onSubmit={onSubmit} className="rounded-3 p-3 mb-4" style={{ background: "#16181f", border: "1px solid #2a2d3a" }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">{editId ? "แก้ไขบัญชีลูกค้า" : "เพิ่มบัญชีลูกค้าใหม่"}</h6>
            {editId && (
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => { setEditId(null); setForm(EMPTY); }}>
                ยกเลิกแก้ไข
              </button>
            )}
          </div>
          <div className="row g-2">
            <div className="col-md-4">
              {isAdmin ? (
                <select className="form-select form-select-sm" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} required>
                  <option value="">เลือกบริษัท</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input className="form-control form-control-sm" value={clients[0]?.name || "บริษัทของคุณ"} disabled />
              )}
            </div>
            <div className="col-md-4"><input className="form-control form-control-sm" placeholder="ชื่อลูกค้า" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
            <div className="col-md-4"><input className="form-control form-control-sm" placeholder="เบอร์โทร" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="col-md-4"><input className="form-control form-control-sm" placeholder="อีเมล" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-md-4"><input className="form-control form-control-sm" placeholder="เลขบัตร/พาสปอร์ต" value={form.idCard} onChange={(e) => setForm((f) => ({ ...f, idCard: e.target.value }))} /></div>
            <div className="col-md-4"><input className="form-control form-control-sm" placeholder="ที่อยู่" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="col-12"><textarea className="form-control form-control-sm" rows={2} placeholder="หมายเหตุ" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
            <div className="col-12"><button className="btn btn-sm btn-primary" disabled={saving}>{saving ? "กำลังบันทึก..." : editId ? "บันทึกการแก้ไข" : "เพิ่มบัญชีลูกค้า"}</button></div>
          </div>
        </form>

        <div className="d-flex align-items-center gap-2 mb-3">
          <input className="form-control form-control-sm" style={{ maxWidth: 280 }} placeholder="ค้นหาลูกค้า" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn btn-sm btn-outline-light" onClick={load}>ค้นหา/รีเฟรช</button>
        </div>

        <div className="rounded-3 overflow-hidden" style={{ border: "1px solid #2a2d3a" }}>
          <div className="table-responsive">
            <table className="table table-sm mb-0 table-dark">
              <thead>
                <tr><th>ชื่อ</th><th>บริษัท</th><th>ติดต่อ</th><th>ที่อยู่</th><th style={{ width: 150 }}>จัดการ</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">กำลังโหลด...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-secondary">ยังไม่มีข้อมูลลูกค้า</td></tr>
                ) : customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-semibold">{c.name}</div>
                      <div className="small text-secondary">{c.idCard || "-"}</div>
                    </td>
                    <td>{c.client?.name || clientNameMap.get(c.clientId) || "-"}</td>
                    <td>
                      <div>{c.phone || "-"}</div>
                      <div className="small text-secondary">{c.email || "-"}</div>
                    </td>
                    <td>{c.address || "-"}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-info" onClick={() => startEdit(c)}>แก้ไข</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeCustomer(c.id)}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
