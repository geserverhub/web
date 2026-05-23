import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

function canManage(session) {
  return ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role);
}

// Column name aliases (Thai / English)
const COL_MAP = {
  sku:            ["sku", "รหัสสินค้า", "รหัส"],
  category:       ["category", "หมวด", "หมวดสินค้า", "หมวดหมู่"],
  name:           ["name", "ชื่อสินค้า", "ชื่อ"],
  nameEn:         ["nameen", "name_en", "ชื่ออังกฤษ", "name en"],
  nameZh:         ["namezh", "name_zh", "ชื่อจีน", "name zh"],
  price:          ["price", "ราคา", "ราคาปลีก"],
  priceWholesale: ["pricewholesale", "price_wholesale", "ราคาส่ง"],
  unit:           ["unit", "หน่วย"],
  minOrder:       ["minorder", "min_order", "ขั้นต่ำปลีก", "ขั้นต่ำ"],
  minWholesale:   ["minwholesale", "min_wholesale", "ขั้นต่ำส่ง"],
  stock:          ["stock", "สต็อก", "จำนวน"],
  desc:           ["desc", "description", "รายละเอียด", "คำอธิบาย"],
  img:            ["img", "image", "รูป", "รูปสินค้า"],
  active:         ["active", "เปิดขาย", "แสดงสินค้า"],
  promotion:      ["promotion", "โปรโมชัน", "โปร"],
  promotionPrice: ["promotionprice", "promotion_price", "ราคาโปรโมชัน"],
};

function findCol(headers, fieldAliases) {
  for (const alias of fieldAliases) {
    const idx = headers.findIndex(h => String(h || "").trim().toLowerCase() === alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

async function genSku() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `SKU${yy}${mm}${dd}`;
  const last = await prisma.martProduct.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });
  const seq = last?.sku ? (parseInt(last.sku.slice(-4), 10) || 0) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function POST(req) {
  const session = await auth();
  if (!canManage(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const wb = XLSX.read(bytes, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    if (rows.length < 2) {
      return NextResponse.json({ error: "ไฟล์ว่างเปล่าหรือไม่มีข้อมูล" }, { status: 400 });
    }

    const headers = rows[0].map(h => String(h || "").trim().toLowerCase());
    const colIdx = {};
    for (const [field, aliases] of Object.entries(COL_MAP)) {
      colIdx[field] = findCol(headers, aliases);
    }

    const dataRows = rows.slice(1).filter(r => r.some(c => String(c || "").trim() !== ""));

    let imported = 0, skipped = 0, errors = [];

    for (const row of dataRows) {
      const get = (field) => {
        const idx = colIdx[field];
        return idx !== -1 ? String(row[idx] ?? "").trim() : "";
      };

      const name = get("name");
      const category = get("category");
      const rawPrice = get("price");

      if (!name || !rawPrice) {
        errors.push(`ข้ามแถว: ชื่อหรือราคาว่าง (${name || "?"} / ${rawPrice || "?"})`);
        skipped++;
        continue;
      }

      let sku = get("sku");
      if (!sku) {
        sku = await genSku();
      } else {
        const exists = await prisma.martProduct.findUnique({ where: { sku }, select: { id: true } });
        if (exists) {
          errors.push(`ข้าม SKU ${sku}: มีในระบบแล้ว`);
          skipped++;
          continue;
        }
      }

      const activeRaw = get("active").toLowerCase();
      const active = activeRaw === "" || activeRaw === "true" || activeRaw === "1" || activeRaw === "yes" || activeRaw === "จริง" || activeRaw === "ใช่";

      try {
        await prisma.martProduct.create({
          data: {
            sku,
            category: category || "misc",
            name,
            nameEn: get("nameEn") || null,
            nameZh: get("nameZh") || null,
            price: parseFloat(rawPrice) || 0,
            priceWholesale: get("priceWholesale") ? parseFloat(get("priceWholesale")) : null,
            unit: get("unit") || "ชิ้น",
            minOrder: parseInt(get("minOrder") || "1", 10),
            minWholesale: parseInt(get("minWholesale") || "10", 10),
            stock: parseInt(get("stock") || "0", 10),
            desc: get("desc") || null,
            img: get("img") || null,
            active,
            promotion: get("promotion") || null,
            promotionPrice: get("promotionPrice") ? parseFloat(get("promotionPrice")) : null,
          },
        });
        imported++;
      } catch (err) {
        errors.push(`SKU ${sku}: ${err.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      ok: true,
      imported,
      skipped,
      errors: errors.slice(0, 20),
      message: `นำเข้า ${imported} รายการ${skipped > 0 ? ` (ข้าม ${skipped})` : ""}`,
    });
  } catch (err) {
    console.error("[POST /api/mart/products/import]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
