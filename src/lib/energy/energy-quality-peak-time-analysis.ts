import type { DbChartPoint } from './energy-quality-current-analysis';

export type HourlyLoadBucket = {
  hour: number;
  avgA: number;
  maxA: number;
  count: number;
};

export type PeakTimeAnalysis = {
  /** One-hour window containing absolute peak */
  peakPeriod: string | null;
  /** Merged high-load windows (avg > 115% of overall avg) */
  dominantWindows: string | null;
  onPeakAvgA: number | null;
  offPeakAvgA: number | null;
  hourlyProfile: HourlyLoadBucket[];
};

function pointDate(p: DbChartPoint): Date | null {
  if (p.timestamp != null && Number.isFinite(p.timestamp)) return new Date(p.timestamp);
  if (!p.time) return null;
  const parsed = Date.parse(p.time);
  if (Number.isFinite(parsed)) return new Date(parsed);
  const m = p.time.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

/** PEA/MEA style on-peak: Mon–Fri 09:00–22:00 */
export function isThaiOnPeak(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= 9 * 60 && mins < 22 * 60;
}

function fmtHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function fmtWindow(startHour: number, endHourExclusive: number): string {
  const end = endHourExclusive >= 24 ? '24:00' : fmtHour(endHourExclusive);
  return `${fmtHour(startHour)}–${end}`;
}

function mergeHighHours(hours: number[]): string | null {
  if (!hours.length) return null;
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    ranges.push(fmtWindow(start, prev + 1));
    start = sorted[i];
    prev = sorted[i];
  }
  ranges.push(fmtWindow(start, prev + 1));
  return ranges.join(', ');
}

export function computePeakTimeAnalysis(points: DbChartPoint[]): PeakTimeAnalysis {
  const hourly = new Map<number, { sum: number; max: number; count: number }>();
  const onPeak: number[] = [];
  const offPeak: number[] = [];
  let peakVal: number | null = null;
  let peakHour: number | null = null;

  for (const p of points) {
    const val = p.beforeAvg;
    if (val == null || !Number.isFinite(val)) continue;
    const d = pointDate(p);
    if (!d) continue;
    const h = d.getHours();
    const bucket = hourly.get(h) ?? { sum: 0, max: 0, count: 0 };
    bucket.sum += val;
    bucket.max = Math.max(bucket.max, val);
    bucket.count += 1;
    hourly.set(h, bucket);

    if (peakVal == null || val > peakVal) {
      peakVal = val;
      peakHour = h;
    }
    if (isThaiOnPeak(d)) onPeak.push(val);
    else offPeak.push(val);
  }

  const hourlyProfile: HourlyLoadBucket[] = [...hourly.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, b]) => ({
      hour,
      avgA: b.sum / b.count,
      maxA: b.max,
      count: b.count,
    }));

  const overallAvg =
    hourlyProfile.length > 0
      ? hourlyProfile.reduce((s, b) => s + b.avgA, 0) / hourlyProfile.length
      : null;

  const highHours =
    overallAvg != null
      ? hourlyProfile.filter((b) => b.avgA >= overallAvg * 1.1).map((b) => b.hour)
      : [];

  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  return {
    peakPeriod: peakHour != null ? fmtWindow(peakHour, peakHour + 1) : null,
    dominantWindows: mergeHighHours(highHours),
    onPeakAvgA: avg(onPeak),
    offPeakAvgA: avg(offPeak),
    hourlyProfile,
  };
}

export function hourlyProfileChartData(
  profile: HourlyLoadBucket[],
): { label: string; value: number }[] {
  return profile.map((b) => ({
    label: fmtHour(b.hour),
    value: Math.round(b.avgA * 100) / 100,
  }));
}
