"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PanelFrame from '@/components/grafana/PanelFrame'

type NumericValue = number | string | null | undefined

interface PowerSnapshot {
  current?: NumericValue
  I?: NumericValue
  P?: NumericValue
  p?: NumericValue
  Q?: NumericValue
  q?: NumericValue
  S?: NumericValue
  s?: NumericValue
  PF?: NumericValue
  pf?: NumericValue
  THD?: NumericValue
  thd?: NumericValue
  F?: NumericValue
  f?: NumericValue
}

interface PowerRecordRow {
  device?: string
  ksave?: string
  time?: string
  location?: string
  series_no?: string
  seriesNo?: string
  ipAddress?: string
  phone?: string
  beforeMeterNo?: string
  metricsMeterNo?: string
  ok?: boolean
  current?: NumericValue
  _value?: NumericValue
  P?: NumericValue
  Q?: NumericValue
  S?: NumericValue
  PF?: NumericValue
  THD?: NumericValue
  F?: NumericValue
  power_before?: PowerSnapshot
  before?: PowerSnapshot
  power_metrics?: PowerSnapshot
  metrics?: PowerSnapshot
}

export default function CompareMonitoringPage() {
  const router = useRouter()
  const [rows, setRows] = useState<PowerRecordRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siteFilter, setSiteFilter] = useState<string>('All')
  const [seriesNoFilter, setSeriesNoFilter] = useState<string>('All')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Fetch from MySQL power_records API instead of InfluxDB
        const res = await fetch('/api/ge-energy/power-records?limit=100')
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (mounted) setError(body?.error || 'Failed to load')
          return
        }
        if (mounted) setRows(body.rows || [])
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()

    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // group rows by device/ksave for card rendering
  const groups = useMemo(() => {
    const map = new Map<string, PowerRecordRow[]>()
    for (const r of rows) {
      const key = (r.device || r.ksave || 'Unknown') as string
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    // compute latest timestamp per group and sort by latest desc
    const entries = Array.from(map.entries()).map(([k, items]) => {
      const latestTime = items.reduce((t, it) => {
        const tm = it?.time ? new Date(it.time).getTime() : 0
        return Math.max(t, tm)
      }, 0)
      return { k, items, latestTime }
    })
    entries.sort((a, b) => b.latestTime - a.latestTime)
    return entries.map(e => [e.k, e.items] as [string, PowerRecordRow[]])
  }, [rows])

  // Extract unique sites and series numbers for filters
  const uniqueSites = useMemo(() => {
    const sites = new Set<string>()
    for (const [, items] of groups) {
      const latest = items[0]
      const site = latest?.location || 'Unknown'
      sites.add(site)
    }
    return Array.from(sites).sort()
  }, [groups])

  const uniqueSeriesNos = useMemo(() => {
    const seriesNos = new Set<string>()
    for (const [device, items] of groups) {
      const latest = items[0]
      const seriesNo = latest?.series_no || latest?.seriesNo || device
      seriesNos.add(seriesNo)
    }
    return Array.from(seriesNos).sort()
  }, [groups])

  // Filter groups based on selected filters
  const filteredGroups = useMemo(() => {
    return groups.filter(([device, items]) => {
      const latest = items[0]
      const site = latest?.location || 'Unknown'
      const seriesNo = latest?.series_no || latest?.seriesNo || device

      const siteMatch = siteFilter === 'All' || site === siteFilter
      const seriesNoMatch = seriesNoFilter === 'All' || seriesNo === seriesNoFilter

      return siteMatch && seriesNoMatch
    })
  }, [groups, siteFilter, seriesNoFilter])

  // ComparisonCard: render a single device card comparing Power Before and Power Metrics
  function ComparisonCard({ device, displayName, items }: { device: string; displayName?: string; items: PowerRecordRow[] }) {
    const sorted = items.slice().sort((a, b) => (new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()))
    const latest = sorted[0]

    const location = latest?.location ?? '—'

    // K-Save ID should be the ksaveID from database
    const ksaveId = latest?.ksave || device || '—'

    // Get series_no directly from database (from API response)
    const displaySeriesNo = latest?.series_no || '—'

    // Get additional device information from database
    const ipAddress = latest?.ipAddress || '—'
    const phone = latest?.phone || '—'
    const beforeMeterNo = latest?.beforeMeterNo || '—'
    const metricsMeterNo = latest?.metricsMeterNo || '—'

    const statusOn = latest?.ok ?? false

    // Extract both Power Before and Power Metrics
    const before = latest?.power_before ?? latest?.before ?? {}
    const metrics = latest?.power_metrics ?? latest?.metrics ?? {}

    // Power Before values
    const before_I = Number(before?.current ?? before?.I ?? 0) || 0
    const before_P = Number(before?.P ?? before?.p ?? 0) || 0
    const before_Q = Number(before?.Q ?? before?.q ?? 0) || 0
    const before_S = Number(before?.S ?? before?.s ?? 0) || 0
    const before_PF = Number(before?.PF ?? before?.pf ?? 0) || 0
    const before_THD = Number(before?.THD ?? before?.thd ?? 0) || 0
    const before_F = Number(before?.F ?? before?.f ?? 0) || 0

    // Power Metrics values (current state)
    const metrics_I = Number(latest?.current ?? metrics?.current ?? latest?._value ?? 0) || 0
    const metrics_P = Number(metrics.P ?? metrics.p ?? latest?.P ?? 0) || 0
    const metrics_Q = Number(metrics.Q ?? metrics.q ?? latest?.Q ?? 0) || 0
    const metrics_S = Number(metrics.S ?? metrics.s ?? latest?.S ?? 0) || 0
    const metrics_PF = Number(metrics.PF ?? metrics.pf ?? latest?.PF ?? 0) || 0
    const metrics_THD = Number(metrics.THD ?? metrics.thd ?? latest?.THD ?? 0) || 0
    const metrics_F = Number(metrics.F ?? metrics.f ?? latest?.F ?? 0) || 0

    // Calculate savings/differences
    const savings_I = before_I - metrics_I
    const savings_P = before_P - metrics_P
    const savings_Q = before_Q - metrics_Q
    const savings_S = before_S - metrics_S
    const savings_PF = metrics_PF - before_PF // Higher PF is better
    const savings_THD = before_THD - metrics_THD // Lower THD is better
    const savings_F = metrics_F - before_F

    // Calculate percentage savings for power
    const savingsPercent_P = before_P > 0 ? ((savings_P / before_P) * 100) : 0
    const lastSeenDate = latest?.time ? new Date(latest.time) : null
    const lastSeenStr = lastSeenDate ? lastSeenDate.toLocaleString() : '—'

    const rows = [
      { label: 'Current (A)', before: before_I, after: metrics_I, savings: savings_I, higherBetter: false },
      { label: 'P (W)',       before: before_P, after: metrics_P, savings: savings_P, higherBetter: false },
      { label: 'Q (var)',     before: before_Q, after: metrics_Q, savings: savings_Q, higherBetter: false },
      { label: 'S (VA)',      before: before_S, after: metrics_S, savings: savings_S, higherBetter: false },
      { label: 'PF',          before: before_PF, after: metrics_PF, savings: savings_PF, higherBetter: true },
      { label: 'THD',         before: before_THD, after: metrics_THD, savings: savings_THD, higherBetter: false },
      { label: 'F (Hz)',      before: before_F, after: metrics_F, savings: savings_F, higherBetter: null },
    ]

    return (
      <div key={device} style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        overflow: 'hidden',
        minWidth: 560,
        maxWidth: 780,
        boxShadow: '0 2px 12px rgba(0,0,0,.07)',
      }}>

        {/* ── Card Header ── */}
        <div style={{
          background: 'linear-gradient(135deg,#047857 0%,#059669 50%,#10b981 100%)',
          padding: '16px 20px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.3px', marginBottom: 10 }}>
              {displayName || device}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>📍</span><span>{location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>🌐</span><span>{ipAddress}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>🕐</span><span>{lastSeenStr}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>📞</span><span>{phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>📊</span><span>Before Meter: {beforeMeterNo}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: .9 }}>
                <span>📈</span><span>Metrics Meter: {metricsMeterNo}</span>
              </div>
            </div>
          </div>
          <div style={{
            background: statusOn ? 'rgba(255,255,255,.2)' : 'rgba(239,68,68,.3)',
            border: '1.5px solid rgba(255,255,255,.4)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusOn ? '#86efac' : '#fca5a5', display: 'inline-block' }} />
            {statusOn ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Device IDs ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'GE ID', value: ksaveId, mono: true },
              { label: 'Series No.', value: displaySeriesNo, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '8px 12px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ── Power Savings Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)',
            border: '1.5px solid #a7f3d0',
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>
              ⚡ Power Savings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                  {Number.isFinite(savingsPercent_P) ? savingsPercent_P.toFixed(1) : '0'}%
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Power Reduction</div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #bbf7d0', paddingLeft: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#047857', lineHeight: 1 }}>
                  {Number.isFinite(savings_P) ? savings_P.toFixed(0) : '0'}
                  <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 3 }}>W</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Energy Saved</div>
              </div>
            </div>
          </div>

          {/* ── Grafana Chart ── */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <PanelFrame uid={process.env.NEXT_PUBLIC_GRAFANA_DASH_UID || 'all-power'} panelId={Number(process.env.NEXT_PUBLIC_GRAFANA_PANEL_ID || 2)} vars={{ ksave: device }} height={140} />
          </div>

          {/* ── Comparison Table ── */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>Parameter</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>Before</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>Current</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.4px' }}>Savings</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const improved = r.higherBetter === null
                    ? Math.abs(r.savings) < 0.01
                    : r.higherBetter ? r.savings > 0 : r.savings > 0
                  const savingsColor = improved ? '#2563eb' : r.savings === 0 ? '#9ca3af' : '#f59e0b'
                  const arrow = r.higherBetter === null
                    ? '→'
                    : r.higherBetter
                      ? (r.savings > 0 ? '↑' : '↓')
                      : (r.savings > 0 ? '↓' : '↑')
                  return (
                    <tr key={r.label} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{r.label}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace' }}>
                        {Number.isFinite(r.before) ? r.before.toFixed(3) : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                        {Number.isFinite(r.after) ? r.after.toFixed(3) : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: savingsColor, fontFamily: 'monospace' }}>
                        {Number.isFinite(r.savings) ? `${arrow} ${Math.abs(r.savings).toFixed(3)}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Refresh ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, border: '1.5px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Refresh
            </button>
          </div>

        </div>
      </div>
    )
  }

  return (
    <div className="energy-page">
      <div className="energy-hero mb-5">
        <div className="energy-hero-inner px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Compare Monitoring - Power Savings Analysis</h2>
          <p className="text-sm text-emerald-100 mt-1 mb-0">Compare Power Before vs Current Metrics to analyze energy savings</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="k-btn px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 hover:bg-white/30" onClick={() => router.push('/energy-dashboard/dashboard')}>Back</button>
          <button type="button" className="k-btn px-3 py-2 rounded-lg bg-white text-emerald-800 font-semibold hover:bg-emerald-50" onClick={() => window.location.reload()}>Refresh</button>
        </div>
        </div>
      </div>

      {/* Filters Section */}
      <section style={{ marginTop: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Site:</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 15,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Sites</option>
              {uniqueSites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Series No:</label>
            <select
              value={seriesNoFilter}
              onChange={(e) => setSeriesNoFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 15,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Series</option>
              {uniqueSeriesNos.map(seriesNo => (
                <option key={seriesNo} value={seriesNo}>{seriesNo}</option>
              ))}
            </select>
          </div>

          <div style={{
            fontSize: 14,
            color: '#6b7280',
            marginLeft: 'auto'
          }}>
            Showing {filteredGroups.length} of {groups.length} devices
          </div>
        </div>
      </section>

      <main style={{ marginTop: 0 }}>
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>Error: {error}</div>
        ) : (
          <div>
            {rows.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center' }}>No recent readings</div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#6b7280' }}>
                No devices match the selected filters
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                {filteredGroups.map(([device, items], idx) => {
                  const displayName = device
                  return <ComparisonCard key={device} device={device} displayName={displayName} items={items} />
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
