'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

export type GeocodeMapPickerLabels = {
  title: string;
  searchPlaceholder: string;
  searchBtn: string;
  apply: string;
  cancel: string;
  clickHint: string;
  lat: string;
  lng: string;
  searching: string;
  notFound: string;
};

type GeocodeMapPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (lat: string, lng: string) => void;
  initialAddress?: string;
  initialLat?: string;
  initialLng?: string;
  site: 'thailand' | 'korea';
  labels: GeocodeMapPickerLabels;
};

const DEFAULT_CENTER: Record<'thailand' | 'korea', [number, number]> = {
  thailand: [13.7563, 100.5018],
  korea: [37.5665, 126.978],
};

function parseCoord(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function GeocodeMapPickerModal({
  open,
  onClose,
  onApply,
  initialAddress = '',
  initialLat,
  initialLng,
  site,
  labels,
}: GeocodeMapPickerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState<string>(initialLat ?? '');
  const [lng, setLng] = useState<string>(initialLng ?? '');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const placeMarker = useCallback((latitude: number, longitude: number, fly = true) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    setLat(latitude.toFixed(6));
    setLng(longitude.toFixed(6));

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLat(pos.lat.toFixed(6));
        setLng(pos.lng.toFixed(6));
      });
      markerRef.current = marker;
    }

    if (fly) {
      map.flyTo([latitude, longitude], 15, { animate: true, duration: 0.8 });
    }
  }, []);

  const searchAddress = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSearchError(labels.notFound);
        return;
      }
      const country = site === 'korea' ? 'South Korea' : 'Thailand';
      const fullQuery = [trimmed, country].filter(Boolean).join(', ');
      setSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/ge-energy/geocode?q=${encodeURIComponent(fullQuery)}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.lat || !body.lon) {
          throw new Error(body.error || labels.notFound);
        }
        placeMarker(Number(body.lat), Number(body.lon));
      } catch (err: unknown) {
        setSearchError(err instanceof Error ? err.message : labels.notFound);
      } finally {
        setSearching(false);
      }
    },
    [labels.notFound, placeMarker, site],
  );

  useEffect(() => {
    if (!open) return;
    setAddress(initialAddress);
    setLat(initialLat ?? '');
    setLng(initialLng ?? '');
    setSearchError(null);
  }, [open, initialAddress, initialLat, initialLng]);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const startLat = parseCoord(initialLat) ?? DEFAULT_CENTER[site][0];
      const startLng = parseCoord(initialLng) ?? DEFAULT_CENTER[site][1];

      const map = L.map(containerRef.current).setView([startLat, startLng], 12);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        placeMarker(e.latlng.lat, e.latlng.lng, false);
      });

      if (parseCoord(initialLat) != null && parseCoord(initialLng) != null) {
        placeMarker(startLat, startLng, false);
      } else if (initialAddress.trim()) {
        searchAddress(initialAddress);
      }
    });

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      leafletRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, site]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold text-lg">{labels.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchAddress(address);
            }}
            className="flex gap-2"
          >
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSearchError(null);
              }}
              placeholder={labels.searchPlaceholder}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              {searching ? labels.searching : labels.searchBtn}
            </button>
          </form>
          {searchError && <p className="text-xs text-red-500">{searchError}</p>}
          <p className="text-xs text-gray-500">{labels.clickHint}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels.lat}</label>
              <input
                value={lat}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{labels.lng}</label>
              <input
                value={lng}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 min-h-[320px] w-full border-t border-gray-100" />

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 shrink-0">
          <button
            type="button"
            disabled={!lat || !lng}
            onClick={() => {
              if (lat && lng) {
                onApply(lat, lng);
                onClose();
              }
            }}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold"
          >
            {labels.apply}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {labels.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
