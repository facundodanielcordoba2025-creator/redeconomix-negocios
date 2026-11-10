"use client";

import React, { useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { updatePrizeStatus } from '@/lib/redsorpresas-actions';
import { RedEconomiXHeader } from '@/components/redeconomix-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Trophy, QrCode, Clock, Truck, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function PrizeDeliveryPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Fetch all claimed prizes for the business "Doña Lili"
    // For now, showing all claimed prizes as this works as the "Mi Negocio" dashboard
    const prizesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'redsorpresas_spins'),
            where('status', '==', 'claimed'),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: prizes, isLoading } = useCollection(prizesQuery);

    const handleStatusUpdate = async (spinId: string, status: 'delivered' | 'expired') => {
        try {
            await updatePrizeStatus(spinId, status);
            toast({
                title: status === 'delivered' ? "Entrega Confirmada" : "Plazo Vencido",
                description: `El estado del premio ha sido actualizado correctamente.`,
                variant: "default"
            });
        } catch (e) {
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-32 pt-[90px] md:pt-0">
            <div className="container max-w-5xl mx-auto pt-8 px-4 flex-1">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div className="space-y-1">
                        <Link href="/redeconomix/dashboard-negocio" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-2">
                           <ChevronLeft className="h-3 w-3" /> Volver al Tablero
                        </Link>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">
                            Entrega de <span className="text-amber-500">Premios</span>
                        </h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestión de códigos y retiro en local (Doña Lili)</p>
                    </div>

                    <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pendientes</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{prizes?.length || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 p-8">
                            <div className="flex items-center gap-3">
                                <QrCode className="h-6 w-6 text-slate-400" />
                                <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">Validación de Códigos</CardTitle>
                            </div>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
                                Verificá el código que muestra el cliente antes de entregar el producto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!isLoading && (!prizes || prizes.length === 0) ? (
                                <div className="flex flex-col items-center justify-center p-20 text-center">
                                    <div className="w-20 h-20 max-sm:h-14 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                                        <Truck className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-300">No hay retiros pendientes</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Los premios reclamados aparecerán aquí automáticamente.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow className="border-b border-slate-100">
                                                <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest px-8">Código</TableHead>
                                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Premio / Usuario</TableHead>
                                                <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-widest">Fecha Reclamo</TableHead>
                                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest px-8">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {prizes?.map((prize) => (
                                                <TableRow key={prize.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <TableCell className="px-8">
                                                        <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl font-mono font-black text-sm tracking-widest">
                                                            {prize.claimCode}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-black text-slate-900 uppercase tracking-tighter italic">{prize.prizeName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retira: {prize.userId.substring(0,6)}...</p>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-tighter">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(prize.claimedAt).toLocaleDateString()} {new Date(prize.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-8">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <Button 
                                                                onClick={() => handleStatusUpdate(prize.id, 'delivered')}
                                                                className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 border-none p-0"
                                                            >
                                                                <Check className="h-6 w-6" />
                                                            </Button>
                                                            <Button 
                                                                onClick={() => handleStatusUpdate(prize.id, 'expired')}
                                                                variant="ghost"
                                                                className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 active:scale-95 p-0"
                                                            >
                                                                <X className="h-6 w-6" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
