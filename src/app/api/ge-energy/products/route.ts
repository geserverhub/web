import { NextRequest, NextResponse } from 'next/server'
import { queryGeserverhub as query } from '@/lib/geserverhub-db'

export const runtime = 'nodejs'
export const maxDuration = 10
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sortBy = searchParams.get('sortBy') || 'default'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build ORDER BY clause based on sortBy parameter
    let orderClause = 'ORDER BY productID ASC'
    
    if (sortBy === 'price-asc') {
      orderClause = 'ORDER BY price ASC'
    } else if (sortBy === 'price-desc') {
      orderClause = 'ORDER BY price DESC'
    } else if (sortBy === 'name') {
      orderClause = 'ORDER BY name ASC'
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM product_list WHERE is_active = 1`,
      []
    ) as any[]
    
    const total = countResult[0]?.total || 0

    // Fetch products from database
    const products = await query(
      `SELECT 
        productID,
        sku,
        name,
        description,
        \`Capacity (kVA)\` as capacity,
        MCB,
        \`Size (WxLxH) cm.\` as size,
        Weight as weight,
        price,
        Pin_VAT as priceWithVat,
        unit,
        category,
        Pro_Image as image,
        stock_qty,
        is_active,
        created_at,
        updated_at
       FROM product_list 
       WHERE is_active = 1
       ${orderClause}
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[]

    // Transform data for frontend
    const transformedProducts = products.map((p: any) => ({
      id: p.productID,
      sku: p.sku,
      name: p.name,
      description: p.description,
      capacity: p.capacity,
      mcb: p.MCB,
      size: p.size,
      weight: p.weight,
      price: parseFloat(p.price) || 0,
      priceWithVat: parseFloat(p.priceWithVat) || 0,
      unit: p.unit,
      category: p.category || 'Uncategorized',
      image: p.image || '/placeholder-product.jpg',
      stockQty: p.stock_qty || 0,
      outOfStock: (p.stock_qty || 0) === 0,
      isActive: p.is_active === 1,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }))

    return NextResponse.json({
      products: transformedProducts,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })

  } catch (err: any) {
    console.error('Products API error:', err)
    return NextResponse.json({ 
      error: 'Failed to fetch products: ' + (err?.message || 'Unknown error') 
    }, { status: 500 })
  }
}
