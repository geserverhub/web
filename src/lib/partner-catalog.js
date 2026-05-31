/** Default global category names (PartnerProductCategory seed). */
export const PARTNER_CATEGORY = {
  IOT: 'อุปกรณ์ IoT',
  ENERGY: 'เครื่องประหยัดพลังงาน',
  SERVICE: 'บริการ / ติดตั้ง',
  OTHER: 'อื่นๆ',
};

function norm(v) {
  return String(v || '').trim().toLowerCase();
}

export function isPartnerEnergyCategory(categoryName) {
  const n = norm(categoryName);
  return (
    n.includes('เครื่องประหยัด') ||
    n.includes('ประหยัดพลังงาน') ||
    n.includes('energy saver') ||
    n === norm(PARTNER_CATEGORY.ENERGY)
  );
}

export function isPartnerIotCategory(categoryName) {
  const n = norm(categoryName);
  if (!n) return false;
  return (
    n.includes('iot') ||
    n.includes('อุปกรณ์') ||
    n === norm(PARTNER_CATEGORY.IOT)
  );
}

export function parseCapacityKva(name, model) {
  const text = `${name || ''} ${model || ''}`;
  const m = text.match(/(\d+(?:\.\d+)?)\s*kva/i);
  return m ? m[1] : '';
}

export function parseMcb(model, name) {
  const text = `${model || ''} ${name || ''}`;
  const m = text.match(/(?:mcb[:\s]*)?(\d+)\s*a\b/i);
  return m ? `${m[1]}A` : '';
}

export function mapPartnerProductToCatalog(p) {
  let images = [];
  try {
    images = JSON.parse(p.imageUrls || '[]');
    if (!Array.isArray(images)) images = [];
  } catch {
    images = [];
  }

  const sell = p.sellPrice != null ? Number(p.sellPrice) : 0;
  const catName = p.category?.name || '';
  const isEnergy = isPartnerEnergyCategory(catName);
  const brand = p.brand?.trim() || '';
  const model = p.model?.trim() || '';
  const meta = [brand, model].filter(Boolean);

  let description = meta.length ? meta.join(' · ') : '';
  if (isEnergy && !description) {
    description = 'เครื่องประหยัดพลังงานจาก Partner Dashboard';
  }
  if (!isEnergy && !description) {
    description = 'อุปกรณ์ IoT จาก Partner Dashboard';
  }

  return {
    id: `partner-${p.id}`,
    sku: model || `P-${p.id.slice(-6)}`,
    name: p.name,
    description,
    capacity: isEnergy ? parseCapacityKva(p.name, model) : '',
    mcb: isEnergy ? parseMcb(model, p.name) : '',
    size: '',
    weight: '',
    price: sell,
    priceWithVat: sell,
    unit: 'unit',
    category: catName || (isEnergy ? PARTNER_CATEGORY.ENERGY : PARTNER_CATEGORY.IOT),
    categoryId: p.category?.id ?? null,
    image: images[0] || '/placeholder-product.jpg',
    images,
    stockQty: 99,
    source: 'partner',
    currency: p.currency || 'KRW',
    brand: p.brand,
    model: p.model,
    catalogKind: isEnergy ? 'energy' : 'iot',
  };
}

export function splitPartnerCatalog(products) {
  const energySavers = [];
  const iotProducts = [];

  for (const p of products) {
    if (!p.name?.trim()) continue;
    const row = mapPartnerProductToCatalog(p);
    const catName = p.category?.name || '';

    if (isPartnerEnergyCategory(catName)) {
      energySavers.push(row);
    } else if (isPartnerIotCategory(catName) || !catName) {
      iotProducts.push(row);
    }
  }

  return { energySavers, iotProducts };
}
