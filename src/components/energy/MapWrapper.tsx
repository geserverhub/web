"use client";

import dynamic from "next/dynamic";

export interface Device {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: "online" | "offline";
}

const DynamicMap = dynamic(
  () => import("./MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function MapWrapper({ devices }: { devices: Device[] }) {
  return <DynamicMap devices={devices} />;
}
