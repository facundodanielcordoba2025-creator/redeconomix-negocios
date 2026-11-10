'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div class="relative">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#DC2626" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.3));">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" stroke-width="3" stroke="#991B1B" />
            </svg>
            <div class="absolute bottom-[2px] left-[4px] w-3 h-3 bg-red-600/40 rounded-full animate-ping"></div>
            <div class="absolute bottom-[4px] left-[6px] w-1 h-1 bg-red-900 rounded-full shadow-sm"></div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [6, 29] // The stick ends near x=5.3, y=29.3 in a 32x32 scaled 24x24 viewBox
});

function MapFixer() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

export default function MiniMap({ lat, lng }: { lat: number, lng: number }) {
    if (typeof window === 'undefined') return <div className="w-full h-full bg-slate-100 animate-pulse" />;
    
    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ width: '100%', height: '100%', zIndex: 10 }}>
            <MapFixer />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} icon={customIcon} />
        </MapContainer>
    );
}
