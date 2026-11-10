'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { 
  ChevronLeft, Trophy, Bell, User, MapPin, 
  Gift, Star, Clock, CheckCircle, Info, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ANUNCIOS_MOCK = [
    { 
        id: 1, 
        user: "Carlos M.",
        socioId: "COHETE-8492", 
        prize: "Jugo Cepita 1L", 
        distance: "200m", 
        time: "Hace 5 min", 
        status: "Cerca de tu negocio", 
        type: "welcome_prize" 
    },
    { 
        id: 2, 
        user: "Sofía R.",
        socioId: "COHETE-1104",
        prize: "Descuento 20% RedEconomiX", 
        distance: "500m", 
        time: "Hace 15 min", 
        status: "En zona de cobertura", 
        type: "loyalty" 
    }
];

export default function PremiosAnunciosPage() {
    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <header className="sticky top-0 z-[100] w-full bg-white border-b border-slate-100 h-[70px] shadow-sm flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href="/redeconomix/dashboard-negocio" className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 italic transition-all">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Radar Premios</h1>
                        <p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-widest mt-1">Anti-Fraude Activado</p>
                    </div>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <Trophy className="h-6 w-6" />
                </div>
            </header>

            <main className="max-w-[500px] mx-auto p-6 space-y-6">
                <div className="space-y-4">
                    <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter mb-1 text-amber-400">Verificación Estricta</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pide al usuario que abra su app y te dicte su código SOCIO (COHETE-####) antes de entregar cualquier premio.</p>
                    </div>

                    <div className="space-y-4">
                        {ANUNCIOS_MOCK.map(anuncio => (
                            <div 
                                key={anuncio.id}
                                className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-6">
                                    <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[9px] uppercase italic tracking-widest">Esperando Retiro</Badge>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 max-sm:h-12 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform border border-slate-100">
                                        {anuncio.type === 'welcome_prize' ? <Gift className="w-8 h-8 text-[#FF0000]" /> : <Star className="w-8 h-8 text-amber-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                                                <User className="h-3 w-3" /> SOCIO: <span className="text-slate-900">{anuncio.socioId}</span>
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">{anuncio.prize}</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{anuncio.user} • {anuncio.time}</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#FF0000]" />
                                        <span className="text-[10px] font-bold text-[#FF0000] uppercase tracking-widest">{anuncio.distance}</span>
                                    </div>
                                    <Button className="h-12 px-6 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-slate-800">
                                        Verificar Socio
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center py-10 opacity-30">
                    <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-[9px] font-black uppercase tracking-widest italic">Fin del radar de proximidad</p>
                </div>
            </main>
        </div>
    );
}
