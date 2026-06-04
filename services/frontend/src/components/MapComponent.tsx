"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { apiFetch } from '@/lib/api';

const LIBRARIES: any[] = [];

const MAP_STYLES = [
  { featureType: "all", elementType: "all", stylers: [{ invert_lightness: true }, { saturation: -30 }, { lightness: -10 }, { gamma: 0.5 }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#071007" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#0f1f0f" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#00FF88" }, { weight: 0.5 }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0a150a" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#2d5a2d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#1a3d1a" }] },
];

function makeHexMarker(color: string, size: number = 24) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="1"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function makeCrossMarker() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#FF4444" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>
    <path d="M14 7V21M7 14H21" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

interface MapComponentProps { height?: string; }

export default function MapComponent({ height = '100%' }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries: LIBRARIES });

  // Center on India
  const center = useMemo(() => ({ lat: 20.5937, lng: 78.9629 }), []);

  useEffect(() => {
    apiFetch('/api/volunteers').then(r => r.ok ? r.json() : []).then(data => {
      // Parse lat/lng from location string
      const parsed = data.map((v: any) => {
        const match = v.location?.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/);
        return { ...v, lat: match ? parseFloat(match[1]) : 0, lng: match ? parseFloat(match[2]) : 0 };
      }).filter((v: any) => v.lat !== 0);
      setVolunteers(parsed);
    }).catch(() => {});
  }, []);



  if (!apiKey) {
    return (
      <div className="w-full bg-[#0a150a]/60 rounded-2xl flex items-center justify-center border border-white/5" style={{ height }}>
        <div className="text-center p-8"><h3 className="text-white font-bold text-lg mb-2">Map Not Configured</h3>
          <p className="text-gray-400 text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p></div>
      </div>
    );
  }

  if (loadError) return <div className="w-full bg-red-900/20 rounded-2xl flex items-center justify-center border border-red-500/20" style={{ height }}><p className="text-red-400 text-sm">Map load error</p></div>;
  if (!isLoaded) return <div className="w-full bg-[#0a150a]/60 rounded-2xl flex items-center justify-center border border-white/5" style={{ height }}><div className="flex items-center gap-3 text-gray-400"><div className="w-5 h-5 border-2 border-white/10 border-t-[#00FF88] rounded-full animate-spin" /><span className="text-sm">Loading map...</span></div></div>;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[rgba(0,255,136,0.1)] shadow-[0_0_60px_rgba(0,255,136,0.05)]" style={{ height }}>
      <GoogleMap zoom={5} center={center} mapContainerClassName="w-full h-full"
        options={{ styles: MAP_STYLES, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy' }}>



        {volunteers.map(v => (
          <Marker key={v.id} position={{ lat: v.lat, lng: v.lng }}
            onClick={() => setSelectedMarker(v)}
            icon={{ url: makeHexMarker(v.status === 'Active' ? '#00FF88' : v.status === 'En-route' ? '#FFB800' : '#6b7280', 20), scaledSize: { width: 20, height: 20 } as any }} />
        ))}

        {selectedMarker && (
          <InfoWindow position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }} onCloseClick={() => setSelectedMarker(null)}>
            <div style={{ color: '#000', padding: 4, minWidth: 150 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>{selectedMarker.name}</p>
              <p style={{ fontSize: 12, color: '#555' }}>{selectedMarker.role}</p>
              <p style={{ fontSize: 11, marginTop: 4, color: selectedMarker.status === 'Active' ? '#16a34a' : '#ca8a04', fontWeight: 600 }}>{selectedMarker.status}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>



      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 z-10 text-xs space-y-1.5">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#00FF88] inline-block" /> Active</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#FFB800] inline-block" /> En-Route</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-500 inline-block" /> Standby</div>
      </div>
    </div>
  );
}
