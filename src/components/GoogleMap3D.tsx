'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

export interface MapDevice {
  id: string;
  name: string;
  lat: number;
  lng: number;
  location?: string;
  isOnline: boolean;
}

interface GoogleMap3DProps {
  devices: MapDevice[];
  selectedDeviceId?: string;
  onDeviceSelect?: (deviceId: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
  borderRadius: '1rem',
};

const defaultCenter = {
  lat: 13.7563,
  lng: 100.5018, // Bangkok
};

const mapOptions = {
  tilt: 45,
  zoom: 10,
  mapTypeId: 'satellite' as const,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  zoomControl: true,
};

export default function GoogleMap3D({
  devices,
  selectedDeviceId,
  onDeviceSelect,
}: GoogleMap3DProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(selectedDeviceId || null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Determine map center based on devices
  const getMapCenter = (): google.maps.LatLng => {
    if (devices.length === 0) return new google.maps.LatLng(defaultCenter.lat, defaultCenter.lng);

    let totalLat = 0;
    let totalLng = 0;
    devices.forEach((device) => {
      totalLat += device.lat;
      totalLng += device.lng;
    });

    return new google.maps.LatLng(totalLat / devices.length, totalLng / devices.length);
  };

  // Auto-fit bounds to show all devices
  useEffect(() => {
    if (!mapRef.current || devices.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    devices.forEach((device) => {
      bounds.extend(new google.maps.LatLng(device.lat, device.lng));
    });

    mapRef.current.fitBounds(bounds, 50);
  }, [devices]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  const getMarkerIcon = (isOnline: boolean): google.maps.Icon => {
    const color = isOnline ? '#22c55e' : '#ef4444'; // green or red
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="16" fill="${color}" opacity="0.8" stroke="white" stroke-width="2.5"/>
      </svg>
    `;
    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

    return {
      url: dataUrl,
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    };
  };

  const handleMarkerClick = (deviceId: string) => {
    setSelectedMarker(deviceId);
    onDeviceSelect?.(deviceId);
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[500px] bg-red-50 rounded-2xl">
        <div className="text-center">
          <p className="text-red-700 font-semibold">⚠️ Google Maps API Key is missing</p>
          <p className="text-red-600 text-sm">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={getMapCenter()}
        zoom={mapOptions.zoom}
        onLoad={onMapLoad}
        options={mapOptions}
      >
        {devices.map((device) => (
          <Marker
            key={device.id}
            position={{ lat: device.lat, lng: device.lng }}
            icon={getMarkerIcon(device.isOnline)}
            onClick={() => handleMarkerClick(device.id)}
            title={device.name}
          >
            {selectedMarker === device.id && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm font-semibold max-w-xs">
                  <p className="font-bold text-base mb-2">{device.name}</p>
                  {device.location && <p className="text-gray-600 mb-1">{device.location}</p>}
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{device.isOnline ? '🟢 Online' : '🔴 Offline'}</span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
