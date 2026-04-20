import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const ALLOWED_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// Expected columns (flexible — match by header name, case-insensitive)
const COL_MAP = {
  sku:            ["sku", "รหัสสินค้า"],
  category:       ["category", "หมวด", "หมวดหมู่"],
  name:           ["name", "ชื่อสินค้า", "ชื่อ"],
  nameEn:         ["nameen", "name_en", "ชื่อภาษาอังกฤษ", "name en"],
  nameZh:         ["namezh", "name_zh", "ชื่อภาษาจีน", "name zh"],
  price:          ["price", "ราคา", "ราคาขาย"],
  priceWholesale: ["pricewholesale", "price_wholesale", "ราคาส่ง"],
  unit:           ["unit", "หน่วย"],
  minOrder:       ["minorder", "min_order", "ขั้นต่ำ", "ขั้นต่ำปลีก"],
  minWholesale:   ["minwholesale", "min_wholesale", "ขั้นต่ำส่ง"],
  stock:          ["stock", "สต็อก", "จำนวน"],
  desc:           ["desc", "description", "รายละเอียด"],
  img:            ["img", "image", "รูป", "รูปสินค้า"],
};

function resolveHeader(headers) {
  const map = {};
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    const match = headers.find((h) => aliases.includes(h.toLowerCase().trim()));
    if (match) map[field] = match;
  }
  return map;
}

function parseRow(row, headerMap) {
  const get = (field) => {
    const col = headerMap[field];
    if (!col) return undefined;
    const v = row[col];
    return v === undefined || v === null || v === "" ? undefined : String(v).trim();
  };

  const sku = get("sku");
  const name = get("name");
  const price = parseFloat(get("price") || "0");

  if (!sku || !name || isNaN(price)) return null;

  return {
    sku,
    category:       get("category") || "misc",
    name,
    nameEn:         get("nameEn") || "",
    nameZh:         get("nameZh") || "",
    price,
    priceWholesale: parseFloat(get("priceWholesale") || String(price)),
    unit:           get("unit") || "ชิ้น",
    minOrder:       parseInt(get("minOrder") || "1"),
    minWholesale:   parseInt(get("minWholesale") || "10"),
    stock:          parseInt(get("stock") || "0"),
    desc:           get("desc") || null,
    img:            get("img") || null,
  };
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let rows = [];
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบ CSV/Excel" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "ไฟล์ไม่มีข้อมูล" }, { status: 400 });
  }

  const headers = Object.keys(rows[0]);
  const headerMap = resolveHeader(headers);

  if (!headerMap.sku || !headerMap.name || !headerMap.price) {
    return NextResponse.json({
      error: `ไม่พบคอลัมน์ที่จำเป็น (sku, name/ชื่อสินค้า, price/ราคา). พบคอลัมน์: ${headers.join(", ")}`,
    }, { status: 400 });
  }

  const parsed = rows.map((r, i) => ({ row: i + 2, data: parseRow(r, headerMap) }));
  const valid = parsed.filter((r) => r.data !== null);
  const skipped = parsed.filter((r) => r.data === null).map((r) => r.row);

  if (valid.length === 0) {
    return NextResponse.json({ error: "ไม่มีแถวที่ถูกต้อง (ต้องมี sku, ชื่อสินค้า และราคา)" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const errors = [];

  for (const { row, data } of valid) {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existing) {
        await prisma.product.update({ where: { sku: data.sku }, data });
        updated++;
      } else {
        await prisma.product.create({ data });
        created++;
      }
    } catch (e) {
      errors.push({ row, sku: data.sku, error: e.message });
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    skipped: skipped.length,
    errors,
    total: valid.length,
  });
}
