'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

export interface Device {
  id?: string;
  deviceID?: string;
  name: string;
  lat: number;
  lng: number;
  isOnline?: boolean;
  location?: string;
}

interface MapWrapperProps {
  devices: Device[];
}

// Lazy-load the actual map to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3" />
        <p className="text-sm text-gray-400">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapWrapper({ devices }: MapWrapperProps) {
  if (devices.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 text-gray-400">
        <MapPin className="w-10 h-10 text-gray-300" />
        <p className="text-sm">No device locations available</p>
      </div>
    );
  }

  return <LeafletMap devices={devices} />;
}
