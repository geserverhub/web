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

interface ParsedDeviceData {
  location?: string
  ok?: boolean
  current?: NumericValue
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
        const res = await fetch('/api/kenergy/power-records?limit=100')
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
    const [parsed, setParsed] = useState<ParsedDeviceData | null>(null)

    useEffect(() => {
      let mounted = true
      async function fetchParsed() {
        try {
          const res = await fetch(`/api/kenergy/influx/device?id=${encodeURIComponent(device)}`)
          const body = await res.json().catch(() => ({}))
          if (!mounted) return
          if (res.ok && body && body.parsed) setParsed(body.parsed as ParsedDeviceData)
        } catch {
          // ignore
        }
      }
      fetchParsed()
      return () => { mounted = false }
    }, [device])

    const sorted = items.slice().sort((a, b) => (new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()))
    const latest = sorted[0]

    // prefer parsed values from /api/influx/device when available
    const location = parsed?.location ?? latest?.location ?? '—'

    // K-Save ID should be the ksaveID from database
    const ksaveId = latest?.ksave || device || '—'

    // Get series_no directly from database (from API response)
    const displaySeriesNo = latest?.series_no || '—'

    // Get additional device information from database
    const ipAddress = latest?.ipAddress || '—'
    const phone = latest?.phone || '—'
    const beforeMeterNo = latest?.beforeMeterNo || '—'
    const metricsMeterNo = latest?.metricsMeterNo || '—'

    const statusOn = parsed?.ok ?? latest?.ok ?? false

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
    const metrics_I = Number(parsed?.current ?? latest?.current ?? metrics?.current ?? latest?._value ?? 0) || 0
    const metrics_P = Number(parsed?.P ?? parsed?.p ?? metrics.P ?? metrics.p ?? latest?.P ?? 0) || 0
    const metrics_Q = Number(parsed?.Q ?? parsed?.q ?? metrics.Q ?? metrics.q ?? latest?.Q ?? 0) || 0
    const metrics_S = Number(parsed?.S ?? parsed?.s ?? metrics.S ?? metrics.s ?? latest?.S ?? 0) || 0
    const metrics_PF = Number(parsed?.PF ?? parsed?.pf ?? metrics.PF ?? metrics.pf ?? latest?.PF ?? 0) || 0
    const metrics_THD = Number(parsed?.THD ?? parsed?.thd ?? metrics.THD ?? metrics.thd ?? latest?.THD ?? 0) || 0
    const metrics_F = Number(parsed?.F ?? parsed?.f ?? metrics.F ?? metrics.f ?? latest?.F ?? 0) || 0

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

    return (
      <div key={device} className="card machine-card" style={{ minWidth: 600, maxWidth: 800 }}>
        <div className="machine-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="machine-name">{displayName || device}</div>
            <div className="machine-sub">📍 Site: {location}</div>
            <div className="machine-sub" style={{ marginTop: 4 }}>🕐 {lastSeenStr}</div>
            <div className="machine-sub" style={{ marginTop: 4 }}>🌐 IP: {ipAddress}</div>
            <div className="machine-sub" style={{ marginTop: 4 }}>📊 Before Meter: {beforeMeterNo}</div>
            <div className="machine-sub" style={{ marginTop: 4 }}>📈 Metrics Meter: {metricsMeterNo}</div>
            <div className="machine-sub" style={{ marginTop: 4 }}>📞 Phone: {phone}</div>
          </div>
          <div className={"status-pill " + (statusOn ? 'ok' : 'warn')}>
            {statusOn ? '🟢 ON' : '🔴 OFF'}
          </div>
        </div>

        <div className="machine-info-row" style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="machine-info">
            <div className="label">K-Save ID:</div>
            <div className="value">{ksaveId}</div>
          </div>
          <div className="machine-info">
            <div className="label">Series no:</div>
            <div className="value">{displaySeriesNo}</div>
          </div>
        </div>

        {/* Power Savings Summary */}
        <div style={{
          marginTop: 16,
          padding: 12,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: 8,
          color: '#fff'
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>⚡ Power Savings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {Number.isFinite(savingsPercent_P) ? savingsPercent_P.toFixed(1) : '0'}%
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Power Reduction</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {Number.isFinite(savings_P) ? savings_P.toFixed(2) : '0'} W
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Energy Saved</div>
            </div>
          </div>
        </div>

        {/* Grafana Chart */}
        <div style={{ marginTop: 16, height: 140, marginBottom: 12 }}>
          <PanelFrame uid={process.env.NEXT_PUBLIC_GRAFANA_DASH_UID || 'all-power'} panelId={Number(process.env.NEXT_PUBLIC_GRAFANA_PANEL_ID || 2)} vars={{ ksave: device }} height={140} />
        </div>

        {/* Comparison Table */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 8, fontSize: 14 }}>
            {/* Header Row */}
            <div style={{ fontWeight: 700, color: '#374151' }}>Parameter</div>
            <div style={{ fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>Before</div>
            <div style={{ fontWeight: 700, textAlign: 'right', color: '#059669' }}>Current</div>
            <div style={{ fontWeight: 700, textAlign: 'right', color: '#2563eb' }}>Savings</div>

            {/* Current (A) */}
            <div style={{ color: '#374151' }}>Current (A)</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_I) ? before_I.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_I) ? metrics_I.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_I > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_I) ? `${savings_I > 0 ? '↓' : '↑'} ${Math.abs(savings_I).toFixed(3)}` : '-'}
            </div>

            {/* P (W) */}
            <div style={{ color: '#374151' }}>P (W)</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_P) ? before_P.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_P) ? metrics_P.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_P > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_P) ? `${savings_P > 0 ? '↓' : '↑'} ${Math.abs(savings_P).toFixed(3)}` : '-'}
            </div>

            {/* Q (var) */}
            <div style={{ color: '#374151' }}>Q (var)</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_Q) ? before_Q.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_Q) ? metrics_Q.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_Q > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_Q) ? `${savings_Q > 0 ? '↓' : '↑'} ${Math.abs(savings_Q).toFixed(3)}` : '-'}
            </div>

            {/* S (VA) */}
            <div style={{ color: '#374151' }}>S (VA)</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_S) ? before_S.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_S) ? metrics_S.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_S > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_S) ? `${savings_S > 0 ? '↓' : '↑'} ${Math.abs(savings_S).toFixed(3)}` : '-'}
            </div>

            {/* PF */}
            <div style={{ color: '#374151' }}>PF</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_PF) ? before_PF.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_PF) ? metrics_PF.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_PF > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_PF) ? `${savings_PF > 0 ? '↑' : '↓'} ${Math.abs(savings_PF).toFixed(3)}` : '-'}
            </div>

            {/* THD */}
            <div style={{ color: '#374151' }}>THD</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_THD) ? before_THD.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_THD) ? metrics_THD.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: savings_THD > 0 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_THD) ? `${savings_THD > 0 ? '↓' : '↑'} ${Math.abs(savings_THD).toFixed(3)}` : '-'}
            </div>

            {/* F (Hz) */}
            <div style={{ color: '#374151' }}>F (Hz)</div>
            <div style={{ textAlign: 'right', color: '#dc2626' }}>
              {Number.isFinite(before_F) ? before_F.toFixed(3) : '-'}
            </div>
            <div style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>
              {Number.isFinite(metrics_F) ? metrics_F.toFixed(3) : '-'}
            </div>
            <div style={{
              textAlign: 'right',
              color: Math.abs(savings_F) < 1 ? '#2563eb' : '#6b7280',
              fontWeight: 600
            }}>
              {Number.isFinite(savings_F) ? `${savings_F > 0 ? '↑' : '↓'} ${Math.abs(savings_F).toFixed(3)}` : '-'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="k-btn machine-action-btn small" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Compare Monitoring - Power Savings Analysis</h2>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Compare Power Before vs Current Metrics to analyze energy savings</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="k-btn" onClick={() => router.push('/sites')} style={{ padding: '8px 12px', borderRadius: 6 }}>Back</button>
          <button className="k-btn k-btn-primary" onClick={() => window.location.reload()} style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: '#fff' }}>Refresh</button>
        </div>
      </header>

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
                  // display names: KSave01, KSave02, ...
                  const displayName = `KSave${String(idx + 1).padStart(2, '0')}`
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
