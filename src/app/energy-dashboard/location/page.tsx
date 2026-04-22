"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Maximize2, MapPin, Navigation } from 'lucide-react';
import { useSite } from "@/lib/SiteContext";
import { useLocale } from "@/lib/LocaleContext";
import MapWrapper, { Device } from "@/components/MapWrapper";

export default function LocationPage() {
  const { selectedSite } = useSite();
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [allDevicesCount, setAllDevicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices from API
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/kenergy/device-locations?site=${selectedSite}`);
      const data = await response.json();

      if (data.success) {
        setDevices(data.devices || []);
        setAllDevicesCount(data.totalDevices || 0);
      } else {
        setError(data.error || 'Failed to fetch devices');
      }
    } catch (err: unknown) {
      console.error('Fetch devices error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Filter devices by search query
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const devicesWithLocation = devices.length;
  const devicesWithoutLocation = allDevicesCount - devicesWithLocation;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDevices}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-5 gap-4 bg-gray-50">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 shadow-xl shrink-0">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Navigation className="w-3.5 h-3.5" /> Location
            </div>
            <h1 className="text-2xl font-black text-white mb-0.5">{t('devicesLocation') || 'Devices Location'}</h1>
            <p className="text-rose-100 text-xs">Live map of all registered devices</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-5 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <div className="text-center">
                <p className="text-xl font-black text-white leading-none">{devicesWithLocation}</p>
                <p className="text-rose-100 text-xs mt-0.5">Located</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-xl font-black text-white leading-none">{devicesWithoutLocation}</p>
                <p className="text-rose-100 text-xs mt-0.5">No location</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input type="text" placeholder={t('searchLocation') || 'Search...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl text-xs text-white placeholder-white/60 focus:outline-none focus:bg-white/30 w-44" />
                <Search className="w-3.5 h-3.5 text-white/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-white text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-50 transition-all shadow-md">
                <MapPin className="w-3.5 h-3.5" /> {t('setLocation') || 'Set Location'}
              </button>
              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 transition-all">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <MapWrapper devices={filteredDevices} />
      </div>
    </div>
  );
}
