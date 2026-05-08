'use client';

import { useEffect, useRef } from 'react';
import type { Device } from './MapWrapper';

interface LeafletMapProps {
  devices: Device[];
}

export default function LeafletMap({ devices }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR
    import('leaflet').then((L) => {
      // Fix default icon path for webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const validDevices = devices.filter(d => d.lat && d.lng);
      const center = validDevices.length > 0
        ? [validDevices[0].lat, validDevices[0].lng] as [number, number]
        : [13.7563, 100.5018] as [number, number]; // Bangkok default

      const map = L.map(containerRef.current!).setView(center, 10);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      validDevices.forEach((device) => {
        const marker = L.marker([device.lat, device.lng]).addTo(map);
        const status = device.isOnline ? '🟢 Online' : '🔴 Offline';
        marker.bindPopup(`
          <div style="min-width:160px">
            <p style="font-weight:700;margin:0 0 4px">${device.name}</p>
            <p style="margin:0;font-size:12px;color:#666">${device.location || ''}</p>
            <p style="margin:4px 0 0;font-size:12px">${status}</p>
          </div>
        `);
      });

      if (validDevices.length > 1) {
        const bounds = L.latLngBounds(validDevices.map(d => [d.lat, d.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  }, []); // run once on mount

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
    </>
  );
}
