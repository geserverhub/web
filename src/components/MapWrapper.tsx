'use client';

import dynamic from 'next/dynamic';

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

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-3" />
        <p className="text-sm text-gray-400">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapWrapper({ devices }: MapWrapperProps) {
  return <LeafletMap devices={devices} />;
}
