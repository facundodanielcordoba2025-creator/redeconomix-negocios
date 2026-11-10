'use client';

import React, { useState, useMemo } from 'react';

import { 
  Calendar as CalendarIcon, Clock, User, Plus, Search, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  DollarSign, ArrowLeft, MoreVertical, Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, addHours, startOfDay, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

export default function RedServiciosPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isNewTurnoOpen, setIsNewTurnoOpen] = useState(false);

    // Turnos Query
    const turnosQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const start = startOfDay(selectedDate).toISOString();
        const end = addDays(startOfDay(selectedDate), 1).toISOString();
        return query(
            collection(firestore, 'retailer_appointments'),
            where('retailerId', '==', user.uid),
            where('date', '>=', start),
            where('date', '<', end),
            orderBy('date', 'asc')
        );
    }, [firestore, user, selectedDate]);
    const { data: turnos, isLoading } = useCollection(turnosQuery);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 8; i <= 20; i++) {
            slots.push(`${i}:00`);
            slots.push(`${i}:30`);
        }
        return slots;
    }, []);

    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
    const handlePrevDay = () => setSelectedDate(prev => addDays(prev, -1));

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-[90px] md:pt-0">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 z-50">
                <div className="max-w-[500px] mx-auto px-6 h-20 max-sm:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/redeconomix/dashboard-negocio" className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest italic">RedServicios</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agenda de Turnos</p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => setIsNewTurnoOpen(true)}
                        className="bg-slate-900 text-white rounded-xl h-10 px-4 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo
                    </Button>
                </div>
            </header>

            <main className="max-w-[500px] mx-auto p-4 space-y-4">
                {/* Date Picker Horizontal */}
                <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <button onClick={handlePrevDay} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest">{format(selectedDate, "EEEE", { locale: es })}</p>
                        <p className="text-lg font-black italic tracking-tighter uppercase">{format(selectedDate, "d 'de' MMMM", { locale: es })}</p>
                    </div>
                    <button onClick={handleNextDay} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>

                {/* Turnos List */}
                <div className="space-y-3">
                    {isLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />)
                    ) : (turnos && turnos.length > 0) ? turnos.map((turno: any) => (
                        <div 
                            key={turno.id}
                            className={cn(
                                "p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden",
                                turno.status === 'completed' && "opacity-60 grayscale"
                            )}
                        >
                            <div className="w-16 flex flex-col items-center justify-center border-r border-slate-50 pr-4">
                                <p className="text-sm font-black text-slate-900">{format(new Date(turno.date), "HH:mm")}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Hs</p>
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">{turno.customerName}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{turno.serviceName}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <Badge variant="outline" className="text-[9px] font-black italic py-0 border-emerald-100 text-emerald-600 bg-emerald-50">
                                        ${turno.price.toLocaleString()}
                                    </Badge>
                                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                        <Smartphone className="w-3 h-3" /> {turno.customerPhone}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {turno.status === 'pending' ? (
                                    <Button size="sm" className="bg-[#FF0000] text-white rounded-xl text-[9px] font-black uppercase h-8 px-3">
                                        Cobrar
                                    </Button>
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 max-sm:h-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CalendarIcon className="w-8 h-8 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Sin Turnos Agendados</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Agrega uno pulsando el botón +</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
