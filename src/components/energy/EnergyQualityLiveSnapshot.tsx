'use client';

import type { ReportChannel } from '@/lib/energy/energy-quality-report-model';
import { fmtA, fmtNum } from '@/lib/energy/energy-quality-i18n';

type SnapshotUi = {
  lastUpdate: string;
  l1: string;
  l2: string;
  l3: string;
  avg: string;
  thd: string;
  powerFactor: string;
  frequency: string;
  title?: string;
};

function avgCurrent(phases: (number | null)[]): number | null {
  const n = phases.filter((v): v is number => v != null && Number.isFinite(v));
  if (!n.length) return null;
  return n.reduce((a, b) => a + b, 0) / n.length;
}

function displayVal(v: number | null | undefined, unit: string): string {
  if (v == null || !Number.isFinite(v)) return '—';
  if (unit === 'A') return fmtA(v);
  if (unit === 'Hz') return fmtNum(v, 2);
  if (unit === '%') return fmtNum(v, 1);
  return fmtNum(v, 3);
}

export default function EnergyQualityLiveSnapshot({
  ch1,
  lastUpdate,
  ui,
  pending,
}: {
  ch1: ReportChannel;
  lastUpdate: string;
  ui: SnapshotUi;
  pending?: boolean;
}) {
  const avg = avgCurrent(ch1.current);

  return (
    <section
      className={`eq-live-snapshot${pending ? ' eq-live-snapshot--pending' : ''}`}
      aria-label={ui.title ?? 'Live meter snapshot'}
    >
      <p className="eq-live-snapshot-updated">
        {ui.lastUpdate}: <strong>{lastUpdate || '—'}</strong>
      </p>
      <div className="eq-live-snapshot-grid">
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.l1}</span>
          <strong>{displayVal(ch1.current[0], 'A')}</strong>
          <span className="eq-live-snapshot-unit">A</span>
        </div>
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.l2}</span>
          <strong>{displayVal(ch1.current[1], 'A')}</strong>
          <span className="eq-live-snapshot-unit">A</span>
        </div>
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.l3}</span>
          <strong>{displayVal(ch1.current[2], 'A')}</strong>
          <span className="eq-live-snapshot-unit">A</span>
        </div>
        <div className="eq-live-snapshot-card eq-live-snapshot-card--avg">
          <span className="eq-live-snapshot-label">{ui.avg}</span>
          <strong>{displayVal(avg, 'A')}</strong>
          <span className="eq-live-snapshot-unit">A</span>
        </div>
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.thd}</span>
          <strong>{displayVal(ch1.thd, '%')}</strong>
          <span className="eq-live-snapshot-unit">%</span>
        </div>
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.powerFactor}</span>
          <strong>{displayVal(ch1.powerFactor, '')}</strong>
        </div>
        <div className="eq-live-snapshot-card">
          <span className="eq-live-snapshot-label">{ui.frequency}</span>
          <strong>{displayVal(ch1.frequency, 'Hz')}</strong>
          <span className="eq-live-snapshot-unit">Hz</span>
        </div>
      </div>
    </section>
  );
}
