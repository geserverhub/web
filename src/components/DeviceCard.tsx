'use client';

import { Zap, Wifi, WifiOff, Edit2, Clock } from 'lucide-react';

interface VoltageReadings {
  ll1: number | null;
  ll2: number | null;
  ll3: number | null;
}

interface DeviceCardProps {
  deviceName: string;
  isOnline: boolean;
  voltageReadings?: VoltageReadings;
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
  onEdit,
}: DeviceCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isOnline ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Zap className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <span className="text-sm font-semibold text-gray-800 truncate">{deviceName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Voltage readings */}
      {voltageReadings && (
        <div className="grid grid-cols-3 gap-2">
          {(['ll1', 'll2', 'll3'] as const).map((key, i) => (
            <div key={key} className="bg-gray-50 rounded-xl p-2 text-center">
              <p className="text-xs text-gray-400 mb-0.5">L{i + 1}</p>
              <p className="text-sm font-bold text-gray-700">
                {voltageReadings[key] != null ? `${voltageReadings[key]?.toFixed(1)}V` : '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Last connected */}
      {(lastConnected || onlineTime) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{onlineTime ? `Online ${onlineTime}` : lastConnected}</span>
        </div>
      )}
    </div>
  );
}
