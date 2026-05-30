import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensurePartnerProductCategorySchema } from '@/lib/partner-product-category-db';
import { splitPartnerCatalog } from '@/lib/partner-catalog';
import { requireCustomerDashboardAuth } from '@/lib/customer-dashboard-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type CatalogProduct = {
  id: string | number;
  sku: string;
  name: string;
  description: string;
  capacity: string;
  mcb: string;
  size: string;
  weight: string;
  price: number;
  priceWithVat: number;
  unit: string;
  category: string;
  image: string;
  images?: string[];
  stockQty: number;
  source?: 'partner';
  currency?: string;
  brand?: string | null;
  model?: string | null;
  categoryId?: string | null;
  catalogKind?: 'energy' | 'iot';
};

async function loadPartnerCatalog() {
  const prisma = getPrisma();
  if (!prisma?.partnerProduct) {
    console.warn('[customer-product-catalog] Prisma PartnerProduct unavailable');
    return { energySavers: [], iotProducts: [] };
  }

  try {
    if (prisma.partnerProductCategory) {
      await ensurePartnerProductCategorySchema(prisma);
    }

    const rows = await prisma.partnerProduct.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });

    return splitPartnerCatalog(rows);
  } catch (err) {
    console.warn('[customer-product-catalog] PartnerProduct:', err);
    return { energySavers: [], iotProducts: [] };
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireCustomerDashboardAuth(request);
    if (auth.ok === false) return auth.response;

    const { energySavers, iotProducts } = await loadPartnerCatalog();

    return NextResponse.json({
      success: true,
      energySavers,
      iotProducts,
      partnerProducts: [...energySavers, ...iotProducts],
      all: [...energySavers, ...iotProducts],
    });
  } catch (err) {
    console.error('customer-product-catalog error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load product catalog',
      },
      { status: 500 }
    );
  }
}
