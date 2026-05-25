'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import type { Device } from './MapWrapper';

export default function LeafletMap({ devices }: { devices: Device[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchMarkerRef = useRef<any>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      LRef.current = L;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const validDevices = devices.filter(d => d.lat && d.lng);
      const defaultZoom = validDevices.length > 0 ? 10 : 2;
      const defaultCenter: [number, number] = [20, 0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(containerRef.current!).setView(defaultCenter, defaultZoom);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      validDevices.forEach((device) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marker = (L as any).marker([device.lat, device.lng]).addTo(map);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bounds = (L as any).latLngBounds(validDevices.map(d => [d.lat, d.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (validDevices.length === 1) {
        map.setView([validDevices[0].lat, validDevices[0].lng], 12);
      }
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapRef.current as any).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !mapRef.current || !LRef.current) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('Location not found');
        return;
      }
      const { lat, lon, display_name } = data[0];
      const L = LRef.current;
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      const searchMarker = L.marker([parseFloat(lat), parseFloat(lon)], { icon }).addTo(mapRef.current);
      searchMarker.bindPopup(
        `<div style="min-width:180px"><p style="font-weight:700;margin:0 0 4px">📍 ${display_name}</p></div>`
      ).openPopup();
      searchMarkerRef.current = searchMarker;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any).flyTo([parseFloat(lat), parseFloat(lon)], 13, { animate: true, duration: 1.5 });
    } catch {
      setSearchError('Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />

        {/* Geocoding search overlay */}
        <form
          onSubmit={handleSearch}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchError(''); }}
              placeholder="Search location..."
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 13,
                outline: 'none',
                width: 220,
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                background: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}
            >
              <Search size={14} />
            </button>
          </div>
          {searchError && (
            <span style={{ fontSize: 11, color: '#ef4444', background: '#fff', padding: '2px 8px', borderRadius: 6 }}>
              {searchError}
            </span>
          )}
        </form>
      </div>
    </>
  );
}
