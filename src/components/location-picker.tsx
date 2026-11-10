'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg z-20 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div class="absolute w-8 h-8 bg-red-600/30 rounded-full animate-ping"></div>
        </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (lat: number, lng: number) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
        const t1 = setTimeout(() => map.invalidateSize(), 50);
        const t2 = setTimeout(() => map.invalidateSize(), 300);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [center, map]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        
        if (container) {
            resizeObserver.observe(container);
        }

        // Refuerzo por timeouts por si hay animaciones CSS que tarden más
        const timer1 = setTimeout(() => map.invalidateSize(), 100);
        const timer2 = setTimeout(() => map.invalidateSize(), 500);
        const timer3 = setTimeout(() => map.invalidateSize(), 1200);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [map]);
    return null;
}

function MapEvents({ onLocationChange, setPosition }: { onLocationChange: (lat: number, lng: number) => void, setPosition: (pos: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
            onLocationChange(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

export function LocationPicker({ initialLat, initialLng, onLocationChange }: LocationPickerProps) {
    const [position, setPosition] = useState<[number, number]>([initialLat || -34.6037, initialLng || -58.3816]);
    const [isLocating, setIsLocating] = useState(false);
    const markerRef = useRef<L.Marker>(null);

    const requestGPS = (silent = false) => {
        if ('geolocation' in navigator) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setPosition(newPos);
                    onLocationChange(newPos[0], newPos[1]);
                    setIsLocating(false);
                },
                (err) => {
                    console.warn("GPS Error:", err);
                    setIsLocating(false);
                    if (!silent) {
                        alert("No pudimos obtener tu ubicación actual. Verificá que los permisos de GPS estén activados en tu navegador.");
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition([initialLat, initialLng]);
        } else {
            requestGPS(true);
        }
    }, [initialLat, initialLng]);

    const handleGetLocation = (e: React.MouseEvent) => {
        e.preventDefault();
        requestGPS(false);
    };

    return (
        <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100">
            <MapContainer center={position} zoom={15} style={{ width: '100%', height: '100%', minHeight: '450px' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker 
                    position={position} 
                    icon={customIcon} 
                    draggable={true}
                    eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            const pos = marker.getLatLng();
                            setPosition([pos.lat, pos.lng]);
                            onLocationChange(pos.lat, pos.lng);
                        }
                    }}
                    ref={markerRef}
                />
                <MapEvents onLocationChange={onLocationChange} setPosition={setPosition} />
                <ChangeView center={position} />
                <MapResizer />
            </MapContainer>
            
            <Button 
                type="button"
                onClick={handleGetLocation} 
                disabled={isLocating}
                className="absolute bottom-4 right-4 z-[400] bg-white text-slate-800 hover:bg-slate-50 shadow-xl border border-slate-200 font-bold rounded-xl text-xs"
                size="sm"
            >
                {isLocating ? (
                    <>
                        <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Detectando GPS...
                    </>
                ) : (
                    <>
                        <LocateFixed className="w-4 h-4 mr-2 text-primary" />
                        Usar mi ubicación GPS actual
                    </>
                )}
            </Button>
        </div>
    );
}
