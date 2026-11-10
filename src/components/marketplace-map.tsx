'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Helper to re-center map if needed
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center[0], center[1], zoom, map]);
  return null;
}

const getStoreIcon = (isActive: boolean) => L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${isActive ? 'bg-green-600' : 'bg-slate-400'} border-2 border-white shadow-lg z-20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
            </div>
            ${isActive ? '<div class="absolute w-10 h-10 bg-green-600/30 rounded-full animate-ping"></div>' : ''}
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

export interface MapBusiness {
    id: string;
    businessName: string;
    latitude: number;
    longitude: number;
    businessHours?: string;
    accountType: string;
    distance?: number;
}

interface MarketplaceMapProps {
    businesses: MapBusiness[];
    userLocation: [number, number] | null;
    onClose: () => void;
}

export default function MarketplaceMap({ 
    userLocation, 
    businesses = [],
    onClose
}: { 
    userLocation: [number, number] | null,
    businesses: any[],
    onClose: () => void
}) {
    const center: [number, number] = userLocation || [-34.6037, -58.3816];
    const [hoursFilter, setHoursFilter] = useState<'all' | '24hs' | 'extendido' | 'comercial'>('all');
    const router = useRouter();

    const filteredBusinesses = businesses.filter(b => {
        if (hoursFilter === 'all') return true;
        if (hoursFilter === '24hs' && b.businessHours === '24hs') return true;
        if (hoursFilter === 'extendido' && (b.businessHours === 'extendido' || b.businessHours === '24hs')) return true;
        if (hoursFilter === 'comercial' && b.businessHours === 'comercial') return true;
        return false;
    });

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="h-16 border-b flex items-center justify-between px-4 bg-white z-10 shadow-sm relative">
                <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <MapPin className="text-primary w-5 h-5" /> Comercios Cercanos
                </h1>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">Cerrar</Button>
            </div>
            
            <div className="bg-slate-50 p-2 border-b flex gap-2 overflow-x-auto relative z-10 shadow-sm hide-scrollbar">
                <Button 
                    size="sm" 
                    variant={hoursFilter === 'all' ? 'default' : 'outline'} 
                    onClick={() => setHoursFilter('all')}
                    className="rounded-full flex-shrink-0"
                >Todos</Button>
                <Button 
                    size="sm" 
                    variant={hoursFilter === 'comercial' ? 'default' : 'outline'} 
                    onClick={() => setHoursFilter('comercial')}
                    className="rounded-full flex-shrink-0"
                >Comercial</Button>
                <Button 
                    size="sm" 
                    variant={hoursFilter === 'extendido' ? 'default' : 'outline'} 
                    onClick={() => setHoursFilter('extendido')}
                    className="rounded-full flex-shrink-0"
                >Hasta 00:00</Button>
                <Button 
                    size="sm" 
                    variant={hoursFilter === '24hs' ? 'default' : 'outline'} 
                    onClick={() => setHoursFilter('24hs')}
                    className="rounded-full flex-shrink-0"
                >24 Horas</Button>
            </div>

            <div className="flex-1 relative">
                <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ChangeView center={center} zoom={13} />
                    
                    {userLocation && (
                        <Marker position={userLocation} icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>',
                            iconSize: [16,16]
                        })} />
                    )}

                    {filteredBusinesses.map(b => (
                        <Marker 
                            key={b.id} 
                            position={[b.latitude, b.longitude]} 
                            icon={getStoreIcon(b.businessHours === '24hs')}
                        >
                            <Popup className="rounded-2xl overflow-hidden min-w-[200px]">
                                <div className="p-1">
                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{b.businessName || 'Kiosco Local'}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-2">
                                        <Clock className="w-3 h-3" />
                                        <span>{b.businessHours === '24hs' ? 'Abierto 24 Horas' : b.businessHours === 'extendido' ? 'Horario Extendido' : 'Horario Comercial'}</span>
                                    </div>
                                    {b.distance !== undefined && (
                                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                            A {b.distance < 1000 ? `${Math.round(b.distance)}m` : `${(b.distance / 1000).toFixed(1)}km`}
                                        </Badge>
                                    )}
                                    <Button 
                                        size="sm" 
                                        className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/redeconomix?storeId=${b.id}`);
                                        }}
                                    >
                                        Ver Catálogo
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
