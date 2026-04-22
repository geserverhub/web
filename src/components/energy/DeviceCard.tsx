'use client';

import { Zap, Wifi, WifiOff, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useLocale } from '@/lib/LocaleContext';

interface VoltageReading {
  ll1: number | null;
  ll2: number | null;
  ll3: number | null;
}

interface DeviceCardProps {
  deviceName: string;
  isOnline: boolean;
  voltageReadings: VoltageReading;
  lastConnected?: string;
  onlineTime?: string;
  onEdit?: () => void;
}

export default function DeviceCard({
  deviceName,
  isOnline,
  voltageReadings,
  lastConnected,
  onlineTime,
  onEdit
}: DeviceCardProps) {
  const { t } = useLocale();

  const formatVoltage = (value: any) => {
    if (value === null || value === undefined) return '--.--';

    // Handle arrays - take first element
    if (Array.isArray(value)) {
      return formatVoltage(value[0]);
    }

    // Handle objects
    if (typeof value === 'object') {
      return '--.--';
    }

    // Convert to number
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) return '--.--';
    return numValue.toFixed(1);
  };

  return (
    <div className={`
      rounded-lg p-6 shadow-md border-2 transition-all hover:shadow-lg
      ${isOnline 
        ? 'bg-white border-green-200' 
        : 'bg-gray-50 border-red-200'}
    `}>
      {/* Header with device name and status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 text-lg">
            {deviceName}
          </h3>
          {isOnline ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        {isOnline ? (
          <Wifi className="w-5 h-5 text-green-600" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-500" />
        )}
      </div>

      {/* Voltage Readings */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('voltage')} LL1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${isOnline ? 'text-gray-800' : 'text-gray-400'}`}>
              {formatVoltage(voltageReadings.ll1)}
            </span>
            <span className="text-sm text-gray-500">VOLT</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('voltage')} LL2
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${isOnline ? 'text-gray-800' : 'text-gray-400'}`}>
              {formatVoltage(voltageReadings.ll2)}
            </span>
            <span className="text-sm text-gray-500">VOLT</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('voltage')} LL3
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${isOnline ? 'text-gray-800' : 'text-gray-400'}`}>
              {formatVoltage(voltageReadings.ll3)}
            </span>
            <span className="text-sm text-gray-500">VOLT</span>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div>
          {isOnline ? (
            <span className="text-sm text-green-600 font-medium">
              {onlineTime || '00:00:00'} {t('ago')}
            </span>
          ) : (
            <div className="text-sm">
              <span className="text-red-500 font-medium">
                {t('lastConnected')}:{' '}
              </span>
              <span className="text-gray-600">
                {lastConnected || '-'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Edit device"
        >
          <Edit2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
