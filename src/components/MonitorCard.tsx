'use client';

import { Activity, Zap, Wind, Gauge, Leaf, Wifi } from 'lucide-react';

interface MonitorCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  lastUpdate?: string;
  color?: 'yellow' | 'blue' | 'orange' | 'green' | 'purple' | 'gray';
  icon?: 'voltage' | 'current' | 'power' | 'total' | 'frequency' | 'pf' | 'energy' | 'co2';
  highlight?: boolean;
}

const iconMap = {
  voltage: Zap,
  current: Activity,
  power: Wind,
  total: Zap,
  frequency: Wifi,
  pf: Gauge,
  energy: Zap,
  co2: Leaf,
};

const colorMap = {
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', value: 'text-yellow-700' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   value: 'text-blue-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', value: 'text-orange-700' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100',  value: 'text-green-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', value: 'text-purple-700' },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-100',   value: 'text-gray-700' },
};

export default function MonitorCard({
  title,
  value,
  unit,
  lastUpdate,
  color = 'gray',
  icon = 'power',
  highlight = false,
}: MonitorCardProps) {
  const colors = colorMap[color];
  const Icon = iconMap[icon] ?? Activity;
  const displayValue = value != null ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${highlight ? `${colors.bg} ${colors.border}` : 'bg-white border-gray-100'} shadow-sm`}>
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>
        <span className="text-xs font-medium text-gray-500">{title}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-2xl font-bold tracking-tight ${colors.value}`}>{displayValue}</span>
        <span className="text-xs text-gray-400 mb-1">{unit}</span>
      </div>
      {lastUpdate && (
        <p className="text-xs text-gray-400 truncate">{lastUpdate}</p>
      )}
    </div>
  );
}
