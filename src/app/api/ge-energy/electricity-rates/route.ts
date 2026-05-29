import { NextRequest, NextResponse } from 'next/server'
import { queryGe } from '@/lib/mysql-ge'
import {
  ensureElectricityRatesTable,
  listElectricityRateRules,
} from '@/lib/ge-energy/electricity-rates'
import { normalizeSiteKey } from '@/lib/ge-energy/customer-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const toNullableDateTime = (value: unknown) => {
  if (!value) return null
  const d = new Date(String(value))
  if (!Number.isFinite(d.getTime())) return null
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

export async function GET(request: NextRequest) {
  try {
    await ensureElectricityRatesTable()
    const site = request.nextUrl.searchParams.get('site')
    const rules = await listElectricityRateRules(site || undefined)
    return NextResponse.json({ success: true, data: { rules } })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load electricity rates',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureElectricityRatesTable()
    const body = await request.json()
    const id = Number(body?.id || 0)
    const site = normalizeSiteKey(String(body?.site || 'thailand'))
    const ratePerKwh = Number(body?.ratePerKwh)
    const effectiveFrom = toNullableDateTime(body?.effectiveFrom)
    const effectiveTo = toNullableDateTime(body?.effectiveTo)
    const label = body?.label ? String(body.label).trim().slice(0, 255) : null
    const isActive = body?.isActive === false ? 0 : 1

    if (!Number.isFinite(ratePerKwh) || ratePerKwh <= 0) {
      return NextResponse.json({ success: false, error: 'ratePerKwh must be > 0' }, { status: 400 })
    }
    if (effectiveFrom && effectiveTo && new Date(effectiveFrom) > new Date(effectiveTo)) {
      return NextResponse.json({ success: false, error: 'effectiveFrom must be before effectiveTo' }, { status: 400 })
    }

    if (id > 0) {
      await queryGe(
        `UPDATE ge_electricity_rates
         SET site = ?, rate_per_kwh = ?, effective_from = ?, effective_to = ?, label = ?, is_active = ?
         WHERE id = ?`,
        [site, ratePerKwh, effectiveFrom, effectiveTo, label, isActive, id],
      )
    } else {
      await queryGe(
        `INSERT INTO ge_electricity_rates
         (site, rate_per_kwh, effective_from, effective_to, label, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [site, ratePerKwh, effectiveFrom, effectiveTo, label, isActive],
      )
    }

    const rules = await listElectricityRateRules(site)
    return NextResponse.json({ success: true, data: { rules } })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save electricity rate',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureElectricityRatesTable()
    const id = Number(request.nextUrl.searchParams.get('id') || 0)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }
    await queryGe('DELETE FROM ge_electricity_rates WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete electricity rate',
      },
      { status: 500 },
    )
  }
}
