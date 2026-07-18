'use client';

import {
  Activity,
  Barcode,
  Building2,
  Clock,
  Edit2,
  Fingerprint,
  Leaf,
  MapPin,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '@/lib/LocaleContext';

interface PhaseReadings {
  l1: number | null;
  l2: number | null;
  l3: number | null;
}

interface TrendPoint {
  time: string;
  ch1: number;
  ch2: number;
}

interface DeviceCardProps {
  deviceName: string;
  customerName?: string | null;
  geId?: string | null;
  seriesNo?: string | null;
  location?: string | null;
  isOnline: boolean;
  ch1Readings?: PhaseReadings;
  ch2Readings?: PhaseReadings;
  co2Kg?: number | null;
  carbonCreditsTonnes?: number | null;
  trend?: TrendPoint[];
  lastConnected?: string;
  onlineTime?: string;
  onEdit?: () => void;
}

const PHASE_STYLES = [
  {
    key: 'l1' as const,
    label: 'L1',
    dot: 'bg-orange-400',
    box: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-orange-800',
  },
  {
    key: 'l2' as const,
    label: 'L2',
    dot: 'bg-blue-400',
    box: 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 text-blue-800',
  },
  {
    key: 'l3' as const,
    label: 'L3',
    dot: 'bg-violet-400',
    box: 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 text-violet-800',
  },
];

export default function DeviceCard({
  deviceName,
  customerName,
  geId,
  seriesNo,
  location,
  isOnline,
  ch1Readings,
  ch2Readings,
  co2Kg,
  carbonCreditsTonnes,
  trend,
  lastConnected,
  onlineTime,
  onEdit,
}: DeviceCardProps) {
  const { t } = useLocale();
  const na = t('notAvailable');

  const hasCh1 = ch1Readings && PHASE_STYLES.some(({ key }) => ch1Readings[key] != null);
  const hasCh2 = ch2Readings && PHASE_STYLES.some(({ key }) => ch2Readings[key] != null);
  const hasCurrent = hasCh1 || hasCh2;
  const cardAccent = isOnline
    ? 'border-emerald-200 ring-1 ring-emerald-100'
    : hasCurrent
      ? 'border-amber-200 ring-1 ring-amber-50'
      : 'border-slate-200';

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3.5 hover:shadow-lg transition-all ${cardAccent}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isOnline
                ? 'bg-gradient-to-br from-emerald-400 to-green-500'
                : hasCurrent
                  ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                  : 'bg-gradient-to-br from-slate-300 to-slate-400'
            }`}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{deviceName}</p>
            {customerName ? (
              <p className="flex items-center gap-1 mt-1 text-xs font-semibold text-indigo-700 truncate">
                <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{customerName}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400 italic">{t('noCustomerAssigned')}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-slate-400" />
            )}
            {isOnline ? t('online') : t('offline')}
          </span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
              aria-label={t('editDevice')}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customer / meter identifiers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-2.5 py-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80">
              {t('geIdLabel')}
            </p>
            <p className="text-xs font-bold text-emerald-800 truncate">{geId || na}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-sky-50/80 border border-sky-100 px-2.5 py-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
            <Barcode className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-600/80">
              {t('seriesNoLabel')}
            </p>
            <p className="text-xs font-bold text-sky-900 truncate">{seriesNo || na}</p>
          </div>
        </div>
      </div>

      {location ? (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50/60 border border-rose-100 px-2.5 py-2">
          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-500/80">
              {t('location')}
            </p>
            <p className="text-xs text-rose-900 leading-snug">{location}</p>
          </div>
        </div>
      ) : null}

      {/* Phase current (A) — CH1 and CH2 measured simultaneously at two points */}
      {hasCh1 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              CH1 {t('current')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PHASE_STYLES.map(({ key, label, dot, box }) => (
              <div key={key} className={`rounded-xl border px-2 py-2 text-center ${box}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <p className="text-[10px] font-bold opacity-80">{label}</p>
                </div>
                <p className="text-sm font-extrabold leading-none">
                  {ch1Readings![key] != null ? `${ch1Readings![key]!.toFixed(1)}` : na}
                </p>
                {ch1Readings![key] != null && (
                  <p className="text-[9px] font-semibold opacity-70 mt-0.5">{t('ampere')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCh2 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              CH2 {t('current')}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PHASE_STYLES.map(({ key, label, dot, box }) => (
              <div key={key} className={`rounded-xl border px-2 py-2 text-center ${box}`}>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <p className="text-[10px] font-bold opacity-80">{label}</p>
                </div>
                <p className="text-sm font-extrabold leading-none">
                  {ch2Readings![key] != null ? `${ch2Readings![key]!.toFixed(1)}` : na}
                </p>
                {ch2Readings![key] != null && (
                  <p className="text-[9px] font-semibold opacity-70 mt-0.5">{t('ampere')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CH1 vs CH2 mini trend chart */}
      {trend && trend.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('ch1Ch2TrendTitle')}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-1.5">
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={trend} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id={`dc-ch1-${deviceName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id={`dc-ch2-${deviceName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} width={28} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)} A`, name]}
                />
                <Area type="monotone" dataKey="ch1" name="CH1" stroke="#ea580c" strokeWidth={1.5} fill={`url(#dc-ch1-${deviceName})`} />
                <Area type="monotone" dataKey="ch2" name="CH2" stroke="#2563eb" strokeWidth={1.5} fill={`url(#dc-ch2-${deviceName})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CO2 avoided / Carbon credits */}
      {(co2Kg != null || carbonCreditsTonnes != null) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-teal-50/80 border border-teal-100 px-2.5 py-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600/80">
                CO₂
              </p>
              <p className="text-xs font-bold text-teal-800 truncate">
                {co2Kg != null ? `${co2Kg.toFixed(1)} kg` : na}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 border border-emerald-100 px-2.5 py-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600/80">
                Carbon Credit
              </p>
              <p className="text-xs font-bold text-emerald-800 truncate">
                {carbonCreditsTonnes != null ? `${carbonCreditsTonnes.toFixed(4)} tCO₂e` : na}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last update */}
      {(lastConnected || onlineTime) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span>
            {onlineTime
              ? `${t('onlineFor')} ${onlineTime}`
              : `${t('lastConnected')}: ${lastConnected}`}
          </span>
        </div>
      )}
    </div>
  );
}
