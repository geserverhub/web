import { NextResponse } from 'next/server';
import { queryGeserverhub as query } from '@/lib/geserverhub-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureProductListSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`product_list\` (
      \`productID\`         INT(11)        NOT NULL AUTO_INCREMENT,
      \`sku\`               VARCHAR(100)   DEFAULT NULL,
      \`name\`              VARCHAR(255)   NOT NULL,
      \`description\`       TEXT           DEFAULT NULL,
      \`Capacity (kVA)\`    VARCHAR(100)   DEFAULT NULL,
      \`MCB\`               VARCHAR(100)   DEFAULT NULL,
      \`Size (WxLxH) cm.\`  VARCHAR(150)   DEFAULT NULL,
      \`Weight\`            VARCHAR(100)   DEFAULT NULL,
      \`price\`             DECIMAL(12,2)  DEFAULT 0.00,
      \`Pin_VAT\`           DECIMAL(12,2)  DEFAULT 0.00,
      \`unit\`              VARCHAR(50)    DEFAULT 'unit',
      \`category\`          VARCHAR(100)   DEFAULT 'General',
      \`Pro_Image\`         VARCHAR(500)   DEFAULT NULL,
      \`stock_qty\`         INT(11)        DEFAULT 0,
      \`is_active\`         TINYINT(1)     NOT NULL DEFAULT 1,
      \`created_at\`        DATETIME       DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`        DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`productID\`),
      KEY \`idx_product_list_active\` (\`is_active\`),
      KEY \`idx_product_list_category\` (\`category\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seedProductsIfEmpty() {
  const countRows = (await query(
    `SELECT COUNT(*) AS total FROM product_list WHERE is_active = 1`
  )) as Array<{ total?: number }>;
  const total = Number(countRows[0]?.total || 0);
  if (total > 0) return;

  const seedRows = [
    ['ES-15KVA', 'GE-IoT Energy Saver 15 kVA', 'เครื่องประหยัดพลังงานสำหรับโหลดเริ่มต้น', '15', '63A', '38x28x17', '8kg', 39000, 42900, 'unit', 'Energy Saver', '/placeholder-product.jpg', 15],
    ['ES-30KVA', 'GE-IoT Energy Saver 30 kVA', 'เครื่องประหยัดพลังงานสำหรับร้านค้า/อาคารกลาง', '30', '100A', '42x30x18', '10kg', 49000, 53900, 'unit', 'Energy Saver', '/placeholder-product.jpg', 12],
    ['ES-50KVA', 'GE-IoT Energy Saver 50 kVA', 'เครื่องประหยัดพลังงานสำหรับโรงงานขนาดกลาง', '50', '125A', '48x34x20', '14kg', 62000, 68200, 'unit', 'Energy Saver', '/placeholder-product.jpg', 9],
    ['ES-100KVA', 'GE-IoT Energy Saver 100 kVA', 'เครื่องประหยัดพลังงานสำหรับโหลดสูง', '100', '250A', '58x40x24', '20kg', 89000, 97900, 'unit', 'Energy Saver', '/placeholder-product.jpg', 6],
    ['IOT-CT-3P', 'GE 3-Phase CT Sensor Kit', 'ชุดเซ็นเซอร์ CT สำหรับการติดตามพลังงาน', '', '', '', '', 6900, 7590, 'set', 'IoT Device', '/placeholder-product.jpg', 40],
    ['IOT-GW-LTE', 'GE IoT Gateway LTE', 'เกตเวย์ IoT สำหรับส่งข้อมูลขึ้นคลาวด์', '', '', '', '', 9900, 10890, 'unit', 'IoT Device', '/placeholder-product.jpg', 25],
    ['IOT-MTR-PM', 'GE Smart Power Meter', 'มิเตอร์ไฟอัจฉริยะเชื่อมต่อแดชบอร์ดเรียลไทม์', '', '', '', '', 12900, 14190, 'unit', 'IoT Device', '/placeholder-product.jpg', 30],
  ];

  for (const row of seedRows) {
    await query(
      `INSERT INTO product_list
      (sku, name, description, \`Capacity (kVA)\`, MCB, \`Size (WxLxH) cm.\`, Weight, price, Pin_VAT, unit, category, Pro_Image, stock_qty, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      row as unknown[]
    );
  }
}

function norm(v: unknown) {
  return String(v || '').trim().toLowerCase();
}

export async function GET() {
  try {
    await ensureProductListSchema();
    await seedProductsIfEmpty();

    const rows = (await query(
      `SELECT productID, sku, name, description,
              \`Capacity (kVA)\` AS capacity, MCB, \`Size (WxLxH) cm.\` AS size, Weight AS weight,
              price, Pin_VAT AS priceWithVat, unit, category, Pro_Image AS image, stock_qty
       FROM product_list
       WHERE is_active = 1
       ORDER BY productID ASC`
    )) as Array<Record<string, unknown>>;

    const mapped = rows.map((r) => ({
      id: Number(r.productID),
      sku: String(r.sku || ''),
      name: String(r.name || ''),
      description: String(r.description || ''),
      capacity: String(r.capacity || ''),
      mcb: String(r.MCB || ''),
      size: String(r.size || ''),
      weight: String(r.weight || ''),
      price: Number(r.price || 0),
      priceWithVat: Number(r.priceWithVat || 0),
      unit: String(r.unit || 'unit'),
      category: String(r.category || 'General'),
      image: String(r.image || '/placeholder-product.jpg'),
      stockQty: Number(r.stock_qty || 0),
    }));

    let energySavers = mapped.filter((p) => {
      const c = norm(p.category);
      const name = norm(p.name);
      return c.includes('energy') || c.includes('saver') || name.includes('energy saver');
    });
    let iotProducts = mapped.filter((p) => {
      const c = norm(p.category);
      const name = norm(p.name);
      const sku = norm(p.sku);
      return c.includes('iot') || name.includes('iot') || sku.startsWith('iot-');
    });

    // Fallback for legacy catalog data with non-standard category naming.
    if (energySavers.length === 0) {
      energySavers = mapped.filter((p) => {
        const c = norm(p.category);
        const name = norm(p.name);
        return (
          c.includes('เครื่องประหยัด') ||
          c.includes('ประหยัดพลังงาน') ||
          name.includes('เครื่องประหยัด') ||
          name.includes('energy') ||
          name.includes('saver') ||
          Boolean(String(p.capacity || '').trim())
        );
      });
    }

    if (iotProducts.length === 0) {
      iotProducts = mapped.filter((p) => {
        const c = norm(p.category);
        const name = norm(p.name);
        const sku = norm(p.sku);
        return (
          c.includes('อุปกรณ์') ||
          c.includes('iot') ||
          name.includes('sensor') ||
          name.includes('gateway') ||
          name.includes('meter') ||
          sku.includes('iot')
        );
      });
    }

    return NextResponse.json({
      success: true,
      energySavers,
      iotProducts,
      all: mapped,
    });
  } catch (err) {
    console.error('customer-product-catalog error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to load product catalog' },
      { status: 500 }
    );
  }
}
