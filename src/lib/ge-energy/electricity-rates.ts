import { queryGe } from '@/lib/mysql-ge'
import { normalizeSiteKey, resolveRate } from '@/lib/ge-energy/customer-scope'

export type ElectricityRateRule = {
  id: number
  site: string
  ratePerKwh: number
  effectiveFrom: string | null
  effectiveTo: string | null
  label: string | null
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

let tableEnsured = false

export async function ensureElectricityRatesTable() {
  if (tableEnsured) return
  await queryGe(
    `CREATE TABLE IF NOT EXISTS ge_electricity_rates (
      id INT NOT NULL AUTO_INCREMENT,
      site VARCHAR(32) NOT NULL,
      rate_per_kwh DECIMAL(12,4) NOT NULL,
      effective_from DATETIME NULL,
      effective_to DATETIME NULL,
      label VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      KEY idx_ge_rates_site (site),
      KEY idx_ge_rates_range (site, effective_from, effective_to),
      KEY idx_ge_rates_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  )
  tableEnsured = true
}

export async function listElectricityRateRules(site?: string) {
  await ensureElectricityRatesTable()
  const normalizedSite = site ? normalizeSiteKey(site) : null
  const rows = await queryGe(
    `SELECT
      id,
      site,
      rate_per_kwh,
      effective_from,
      effective_to,
      label,
      is_active,
      created_at,
      updated_at
     FROM ge_electricity_rates
     ${normalizedSite ? 'WHERE site = ?' : ''}
     ORDER BY site ASC, COALESCE(effective_from, '1900-01-01') DESC, id DESC`,
    normalizedSite ? [normalizedSite] : [],
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id || 0),
    site: normalizeSiteKey(String(r.site || 'thailand')),
    ratePerKwh: Number(r.rate_per_kwh || 0),
    effectiveFrom: r.effective_from ? String(r.effective_from) : null,
    effectiveTo: r.effective_to ? String(r.effective_to) : null,
    label: r.label ? String(r.label) : null,
    isActive: Number(r.is_active || 0) === 1,
    createdAt: r.created_at ? String(r.created_at) : null,
    updatedAt: r.updated_at ? String(r.updated_at) : null,
  })) as ElectricityRateRule[]
}

const toMillis = (value: string | Date | null | undefined) => {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export type ResolvedElectricityRate = {
  rate: number
  source: 'database' | 'env' | 'query'
  ruleLabel: string | null
}

function pickRateRule(
  site: string,
  atDate: string | Date | null | undefined,
  rules: ElectricityRateRule[],
) {
  const normalizedSite = normalizeSiteKey(site)
  const targetMillis = toMillis(atDate) ?? Date.now()

  return rules
    .filter((rule) => rule.isActive && normalizeSiteKey(rule.site) === normalizedSite)
    .filter((rule) => {
      const start = toMillis(rule.effectiveFrom)
      const end = toMillis(rule.effectiveTo)
      const afterStart = start === null ? true : targetMillis >= start
      const beforeEnd = end === null ? true : targetMillis <= end
      return afterStart && beforeEnd
    })
    .sort((a, b) => {
      const aStart = toMillis(a.effectiveFrom) ?? -Infinity
      const bStart = toMillis(b.effectiveFrom) ?? -Infinity
      if (aStart !== bStart) return bStart - aStart
      return b.id - a.id
    })[0]
}

export function resolveRateForDateWithMeta(
  site: string,
  atDate: string | Date | null | undefined,
  rules: ElectricityRateRule[],
  override?: string | null,
): ResolvedElectricityRate {
  const fromQuery = override ? Number(override) : NaN
  if (Number.isFinite(fromQuery) && fromQuery > 0) {
    return { rate: fromQuery, source: 'query', ruleLabel: null }
  }

  const matched = pickRateRule(site, atDate, rules)
  if (matched && Number.isFinite(matched.ratePerKwh) && matched.ratePerKwh > 0) {
    return {
      rate: matched.ratePerKwh,
      source: 'database',
      ruleLabel: matched.label,
    }
  }

  const normalizedSite = normalizeSiteKey(site)
  return {
    rate: resolveRate(normalizedSite, null),
    source: 'env',
    ruleLabel: null,
  }
}

export function resolveRateForDate(
  site: string,
  atDate: string | Date | null | undefined,
  rules: ElectricityRateRule[],
  override?: string | null,
) {
  return resolveRateForDateWithMeta(site, atDate, rules, override).rate
}
