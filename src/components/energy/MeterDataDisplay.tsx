'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Wind, AlertCircle, TrendingUp, Clock } from 'lucide-react'

interface MeterReading {
  id: number
  meter_id: string
  voltage: number
  current: number
  power: number
  timestamp: string
}

interface MeterStat {
  meter_id: string
  record_count: number
  avg_voltage: number
  avg_current: number
  avg_power: number
  last_update: string
}

interface MeterDataDisplayProps {
  meterReadings: MeterReading[]
  meterStats: MeterStat[]
  loading: boolean
  error?: string | null
}

export default function MeterDataDisplay({
  meterReadings,
  meterStats,
  loading,
  error
}: MeterDataDisplayProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-red-800 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Meter Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meterStats.map((stat) => (
          <div key={stat.meter_id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{stat.meter_id}</h3>
                <p className="text-sm text-gray-500">Meter ID</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Voltage</p>
                <p className="text-lg font-semibold text-gray-900">{stat.avg_voltage.toFixed(2)} V</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Current</p>
                <p className="text-lg font-semibold text-gray-900">{stat.avg_current.toFixed(2)} A</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Power</p>
                <p className="text-lg font-semibold text-gray-900">{stat.avg_power.toFixed(2)} W</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Records</p>
                <p className="text-lg font-semibold text-gray-900">{stat.record_count}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Last: {isClient ? new Date(stat.last_update).toLocaleTimeString() : '--:--:--'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Readings Table */}
      {meterReadings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Latest Readings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Meter ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Voltage (V)</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Current (A)</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Power (W)</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {meterReadings.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900 font-medium">{reading.meter_id}</td>
                    <td className="px-6 py-3 text-gray-600">{reading.voltage.toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-600">{reading.current.toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-600">{reading.power.toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {isClient ? new Date(reading.timestamp).toLocaleString() : reading.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meterReadings.length === 0 && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-800 text-sm">ยังไม่มีข้อมูลจากมิเตอร์ รอการอัดข้อมูล...</p>
        </div>
      )}
    </div>
  )
}
