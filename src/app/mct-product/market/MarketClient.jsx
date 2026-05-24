"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

const EMPTY_FORM = {
  sku: "",
  category: "",
  name: "",
  nameEn: "",
  nameZh: "",
  price: "",
  priceWholesale: "",
  unit: "ชิ้น",
  minOrder: "1",
  minWholesale: "10",
  stock: "0",
  desc: "",
  img: "",
  active: true,
  promotion: "",
  promotionPrice: "",
};

const S = {
  bg: { minHeight: "100vh", background: "#0f1117", color: "#e8eaf0", fontFamily: "sans-serif" },
  nav: { background: "#16181f", borderBottom: "1px solid #2a2d3a", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  card: { background: "#16181f", border: "1px solid #2a2d3a", borderRadius: 12, padding: 20 },
  input: { background: "#1e2130", border: "1px solid #2a2d3a", borderRadius: 8, padding: "8px 12px", color: "#e8eaf0", fontSize: 13, width: "100%", outline: "none" },
  label: { fontSize: 11, color: "#8b8fa8", marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 },
  btn: (bg, color = "#fff") => ({ background: bg, color, border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
  th: { background: "#1a1d27", color: "#8b8fa8", fontSize: 11, fontWeight: 700, padding: "10px 12px", textAlign: "left", textTransform: "uppercase", letterSpacing: 1 },
  td: { padding: "10px 12px", borderBottom: "1px solid #1a1d27", fontSize: 13, verticalAlign: "middle" },
};

export default function MarketClient({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [newCategory, setNewCategory] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imgUploading, setImgUploading] = useState(false);
  const fileRef = useRef(null);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { error: text || `Response ${res.status}` };
    }
  };

  const apiFetch = useCallback(async (url, opts = {}) => {
    const res = await fetch(url, opts);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
    return data;
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        apiFetch("/api/mct/market-products"),
        apiFetch("/api/mct/market-categories"),
      ]);
      setProducts(Array.isArray(p.products) ? p.products : []);
      const cat = Array.isArray(c.categories) ? c.categories : [];
      setCategories(cat);
      setForm((prev) => ({ ...prev, category: prev.category || cat[0] || "misc" }));
    } catch (err) {
      showToast(err.message || "โหลดข้อมูลไม่สำเร็จ", false);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.sku || "").toLowerCase().includes(q) ||
        String(p.category || "").toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, debouncedSearch]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const lowStock = products.filter((p) => Number(p.stock || 0) <= Number(p.minOrder || 1)).length;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0), 0);
    return { total, active, lowStock, totalValue };
  }, [products]);

  function openAddProduct() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, category: categories[0] || "misc" });
    setModalOpen(true);
  }

  function openEditProduct(p) {
    setEditId(p.id);
    setForm({
      sku: p.sku || "",
      category: p.category || categories[0] || "misc",
      name: p.name || "",
      nameEn: p.nameEn || "",
      nameZh: p.nameZh || "",
      price: String(p.price ?? ""),
      priceWholesale: String(p.priceWholesale ?? ""),
      unit: p.unit || "ชิ้น",
      minOrder: String(p.minOrder ?? 1),
      minWholesale: String(p.minWholesale ?? 10),
      stock: String(p.stock ?? 0),
      desc: p.desc || "",
      img: p.img || "",
      active: !!p.active,
      promotion: p.promotion || "",
      promotionPrice: p.promotionPrice != null ? String(p.promotionPrice) : "",
    });
    setModalOpen(true);
  }

  async function saveProduct() {
    if (!form.sku || !form.name || !form.category || !form.price) {
      showToast("กรุณากรอก SKU / ชื่อสินค้า / หมวด / ราคา", false);
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        priceWholesale: Number(form.priceWholesale || form.price),
        minOrder: parseInt(form.minOrder || "1", 10),
        minWholesale: parseInt(form.minWholesale || "10", 10),
        stock: parseInt(form.stock || "0", 10),
        promotionPrice: form.promotionPrice ? Number(form.promotionPrice) : null,
      };

      if (editId) {
        await apiFetch(`/api/mct/market-products/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/mct/market-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      showToast(editId ? "แก้ไขสินค้าสำเร็จ" : "เพิ่มสินค้าสำเร็จ");
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      showToast(err.message || "บันทึกสินค้าไม่สำเร็จ", false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(p) {
    if (!confirm(`ลบสินค้า ${p.name} ?`)) return;
    try {
      await apiFetch(`/api/mct/market-products/${p.id}`, { method: "DELETE" });
      showToast("ลบสินค้าแล้ว");
      await loadAll();
    } catch (err) {
      showToast(err.message || "ลบสินค้าไม่สำเร็จ", false);
    }
  }

  async function toggleActive(p) {
    try {
      await apiFetch(`/api/mct/market-products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      await loadAll();
    } catch (err) {
      showToast(err.message || "เปลี่ยนสถานะไม่สำเร็จ", false);
    }
  }

  async function addCategory() {
    const name = newCategory.trim().toLowerCase();
    if (!name) {
      showToast("กรุณากรอกชื่อหมวดสินค้า", false);
      return;
    }

    setCategorySaving(true);
    try {
      const d = await apiFetch("/api/mct/market-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const next = Array.isArray(d.categories) ? d.categories : [];
      setCategories(next);
      setForm((f) => ({ ...f, category: name }));
      setSelectedCategory(name);
      setNewCategory("");
      showToast(`เพิ่มหมวดสินค้า ${name} แล้ว`);
    } catch (err) {
      showToast(err.message || "เพิ่มหมวดสินค้าไม่สำเร็จ", false);
    } finally {
      setCategorySaving(false);
    }
  }

  async function removeCategory(name) {
    if (!confirm(`ลบหมวดสินค้า ${name} ?`)) return;
    try {
      const d = await apiFetch(`/api/mct/market-categories?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      const next = Array.isArray(d.categories) ? d.categories : [];
      setCategories(next);
      if (selectedCategory === name) setSelectedCategory("all");
      if (form.category === name) setForm((f) => ({ ...f, category: next[0] || "misc" }));
      showToast("ลบหมวดสินค้าแล้ว");
    } catch (err) {
      showToast(err.message || "ลบหมวดสินค้าไม่สำเร็จ", false);
    }
  }

  async function uploadImage(file) {
    if (!file) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await apiFetch("/api/upload", { method: "POST", body: fd });
      if (!d.url) throw new Error("ไม่พบ URL รูปจากเซิร์ฟเวอร์");
      setForm((f) => ({ ...f, img: d.url }));
      showToast("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      showToast(err.message || "อัปโหลดรูปไม่สำเร็จ", false);
    } finally {
      setImgUploading(false);
    }
  }

  return (
    <div style={S.bg}>
      <nav style={S.nav}>
        <div>
          <div style={{ fontSize: 11, color: "#8b8fa8", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>GOEUN SERVER HUB</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f472b6" }}>🛍️ สินค้า มาร์ท</div>
          <div style={{ fontSize: 12, color: "#8b8fa8" }}>{String(session?.user?.role || "")}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btn("#2d0f3a", "#f472b6")} onClick={openAddProduct}>➕ เพิ่มสินค้า</button>
          <Link href="/admin/clients" style={{ ...S.btn("#1a1d27", "#8b8fa8"), textDecoration: "none" }}>⚙️ Admin Panel</Link>
        </div>
      </nav>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.ok ? "#14532d" : "#7f1d1d", color: "#fff", borderRadius: 8, padding: "12px 20px", fontWeight: 600, fontSize: 14 }}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          <div style={S.card}><div style={{ fontSize: 12, color: "#8b8fa8" }}>เพิ่มสินค้า</div><div style={{ fontSize: 26, fontWeight: 800 }}>{stats.total}</div></div>
          <div style={S.card}><div style={{ fontSize: 12, color: "#8b8fa8" }}>เปิดขายอยู่</div><div style={{ fontSize: 26, fontWeight: 800 }}>{stats.active}</div></div>
          <div style={S.card}><div style={{ fontSize: 12, color: "#8b8fa8" }}>สินค้าใกล้หมด</div><div style={{ fontSize: 26, fontWeight: 800 }}>{stats.lowStock}</div></div>
          <div style={S.card}><div style={{ fontSize: 12, color: "#8b8fa8" }}>มูลค่าสต็อก</div><div style={{ fontSize: 26, fontWeight: 800 }}>฿{stats.totalValue.toLocaleString()}</div></div>
        </div>

        <div style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#8b8fa8", fontWeight: 700, marginBottom: 10 }}>ตัวกรองสินค้า</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 8 }}>
              <input style={S.input} placeholder="🔍 ค้นหา SKU / ชื่อสินค้า / หมวด" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select style={S.input} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">ทุกหมวดสินค้า</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#8b8fa8", fontWeight: 700, marginBottom: 10 }}>จัดการหมวดสินค้า</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={S.input} placeholder="เช่น snack / electronics" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
              <button style={S.btn("#0f2b3d", "#67e8f9")} disabled={categorySaving} onClick={addCategory}>
                {categorySaving ? "..." : "เพิ่ม"}
              </button>
            </div>
            <div style={{ maxHeight: 90, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {categories.map((c) => (
                <button key={c} style={{ ...S.btn("#1e2130", "#8b8fa8"), padding: "4px 8px", fontSize: 11 }} onClick={() => removeCategory(c)}>
                  {c} ✕
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>📋 รายการทั้งหมด ({filteredProducts.length})</div>
          {loading ? (
            <div style={{ textAlign: "center", color: "#8b8fa8", padding: 36 }}>กำลังโหลด...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8b8fa8", padding: 36 }}>ยังไม่มีสินค้าในระบบ</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "รูป",
                      "SKU / ชื่อ",
                      "หมวด",
                      "ราคา",
                      "ราคาส่ง",
                      "โปรโมชัน",
                      "สต็อก",
                      "สถานะ",
                      "จัดการ",
                    ].map((h) => <th key={h} style={S.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => (
                    <tr key={p.id} style={{ background: idx % 2 === 0 ? "transparent" : "#0f111633", opacity: p.active ? 1 : 0.65 }}>
                      <td style={S.td}>
                        {p.img ? (
                          <img src={p.img} alt={p.name} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 6, background: "#1e2130", display: "grid", placeItems: "center", color: "#6b7280" }}>📷</div>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#8b8fa8" }}>{p.sku}</div>
                      </td>
                      <td style={S.td}>{p.category}</td>
                      <td style={{ ...S.td, color: "#4ade80", fontWeight: 700 }}>฿{Number(p.price).toLocaleString()}</td>
                      <td style={{ ...S.td, color: "#67e8f9", fontWeight: 700 }}>฿{Number(p.priceWholesale).toLocaleString()}</td>
                      <td style={S.td}>
                        {p.promotion ? (
                          <span style={{ background: "#78350f", color: "#fbbf24", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                            {p.promotion}{p.promotionPrice ? ` (฿${Number(p.promotionPrice).toLocaleString()})` : ""}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={S.td}>{p.stock}</td>
                      <td style={S.td}>
                        <button style={{ ...S.btn(p.active ? "#14532d" : "#3b1515", p.active ? "#4ade80" : "#f87171"), padding: "4px 8px", fontSize: 11 }} onClick={() => toggleActive(p)}>
                          {p.active ? "แสดง" : "ซ่อน"}
                        </button>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={S.btn("#1e3a5f", "#7eb8f7")} onClick={() => openEditProduct(p)}>แก้ไข</button>
                          <button style={S.btn("#2a1f1f", "#f87171")} onClick={() => deleteProduct(p)}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...S.card, width: "100%", maxWidth: 920, maxHeight: "90vh", overflowY: "auto" }}>
            <h4 style={{ marginTop: 0, marginBottom: 14, color: "#f472b6" }}>{editId ? "✏️ แก้ไขสินค้า" : "➕ เพิ่มสินค้าใหม่"}</h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
              <div>
                <label style={S.label}>SKU *</label>
                <input style={S.input} value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>หมวดสินค้า *</label>
                <select style={S.input} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>หน่วย</label>
                <input style={S.input} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>ชื่อสินค้า *</label>
                <input style={S.input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={S.label}>ชื่อ EN</label>
                <input style={S.input} value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>ชื่อ ZH</label>
                <input style={S.input} value={form.nameZh} onChange={(e) => setForm((f) => ({ ...f, nameZh: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>สต็อก</label>
                <input type="number" style={S.input} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>

              <div>
                <label style={S.label}>ราคาปลีก *</label>
                <input type="number" style={S.input} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>ราคาส่ง</label>
                <input type="number" style={S.input} value={form.priceWholesale} onChange={(e) => setForm((f) => ({ ...f, priceWholesale: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>ขั้นต่ำปลีก / ส่ง</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" style={S.input} value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} />
                  <input type="number" style={S.input} value={form.minWholesale} onChange={(e) => setForm((f) => ({ ...f, minWholesale: e.target.value }))} />
                </div>
              </div>

              <div>
                <label style={S.label}>โปรโมชัน</label>
                <input style={S.input} placeholder="เช่น ลด 20%" value={form.promotion} onChange={(e) => setForm((f) => ({ ...f, promotion: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>ราคาโปรโมชัน</label>
                <input type="number" style={S.input} value={form.promotionPrice} onChange={(e) => setForm((f) => ({ ...f, promotionPrice: e.target.value }))} />
              </div>
              <div style={{ display: "flex", alignItems: "end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                  แสดงสินค้านี้
                </label>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>รูปสินค้า</label>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
                  <div onClick={() => fileRef.current?.click()} style={{ width: 110, height: 110, borderRadius: 10, border: "1px dashed #2a2d3a", display: "grid", placeItems: "center", background: "#1e2130", cursor: "pointer", overflow: "hidden" }}>
                    {form.img ? <img src={form.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📷"}
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <button type="button" style={S.btn("#1e2130", "#8b8fa8")} disabled={imgUploading} onClick={() => fileRef.current?.click()}>
                      {imgUploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปสินค้า"}
                    </button>
                    <input style={S.input} placeholder="หรือวาง URL รูปภาพ" value={form.img} onChange={(e) => setForm((f) => ({ ...f, img: e.target.value }))} />
                    <input ref={fileRef} type="file" className="d-none" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} />
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={S.label}>รายละเอียดสินค้า</label>
                <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button type="button" style={S.btn("#1e2130", "#8b8fa8")} onClick={() => setModalOpen(false)}>ยกเลิก</button>
              <button type="button" style={S.btn("#2d0f3a", "#f472b6")} onClick={saveProduct} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
