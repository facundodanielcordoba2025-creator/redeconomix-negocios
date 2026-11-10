'use client';

import React, { useState, useMemo } from 'react';

import { ArrowLeft, Search, User, History, CheckCircle, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function FiadosPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    // Traer operaciones que involucren fiado
    const opsQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'retailer_daily_operations'),
            where('retailerId', '==', user.uid),
            where('paymentMethod', 'in', ['credit', 'mixed']),
            limit(100)
        );
    }, [user, firestore]);

    const { data: operations, isLoading: loading } = useCollection(opsQuery);

    // Procesar e identificar deudas vigentes
    const debtGroups = useMemo(() => {
        if (!operations) return [];

        const groups: Record<string, { customerName: string, phone: string, totalDebt: number, items: any[] }> = {};

        operations.forEach(op => {
            // Ignorar operaciones ya liquidadas
            if (op.debtPaid) return;

            // Calcular deuda de esta operación
            let amountOwed = 0;
            if (op.paymentMethod === 'credit' && op.status === 'pending') {
                amountOwed = op.total || 0;
            } else if (op.paymentMethod === 'mixed' && op.splitDetails?.credit > 0) {
                amountOwed = op.splitDetails.credit;
            }

            if (amountOwed <= 0) return;

            const name = op.customerName?.trim() || 'Cliente Sin Nombre';
            const phone = op.customerPhone?.trim() || '';
            const key = phone ? phone : name.toLowerCase(); // agrupar por teléfono o por nombre

            if (!groups[key]) {
                groups[key] = { customerName: name, phone, totalDebt: 0, items: [] };
            }
            
            groups[key].totalDebt += amountOwed;
            groups[key].items.push({ ...op, amountOwed });
        });

        return Object.values(groups).sort((a, b) => b.totalDebt - a.totalDebt);
    }, [operations]);

    const filteredGroups = debtGroups.filter(g => 
        g.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.phone.includes(searchQuery)
    );

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const handleSettleDebt = async (item: any) => {
        if(!firestore) return;
        try {
            // 1. Marcar la operación original como pagada
            const opRef = doc(firestore, 'retailer_daily_operations', item.id);
            await updateDoc(opRef, {
                debtPaid: true,
                status: 'completed',
                debtPaidAt: new Date().toISOString()
            });

            // 2. Registrar el ingreso a caja para que impacte en el Arqueo Diario
            await addDoc(collection(firestore, 'retailer_daily_operations'), {
                retailerId: user?.uid,
                type: 'sale',
                paymentMethod: 'cash', // asume que se saldó en efectivo temporalmente
                total: item.amountOwed,
                concept: `Pago de Deuda - Ticket ${item.id.slice(-4)}`,
                status: 'completed',
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                customerName: item.customerName,
                customerPhone: item.customerPhone
            });

            toast({ title: "Deuda Liquidada ✅", description: "El pago fue ingresado a la caja del día." });
            
            // Actualizar vista local si el cliente ya no tiene deudas en este grupo
            if(selectedCustomer) {
                const remaining = selectedCustomer.items.filter((i:any) => i.id !== item.id);
                if(remaining.length === 0) setSelectedCustomer(null);
                else setSelectedCustomer({ ...selectedCustomer, items: remaining, totalDebt: selectedCustomer.totalDebt - item.amountOwed });
            }
        } catch (error: any) {
            toast({ title: "Error al liquidar", description: error.message, variant: 'destructive' });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-32">
            {/* Header Corporativo */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
                <div className="max-w-[500px] mx-auto px-4 h-16 max-sm:h-12 flex items-center justify-between">
                    <Link href="/redeconomix/dashboard-negocio" className="text-white hover:opacity-80 transition-opacity">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex flex-col items-center">
                        <h1 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                            <History className="w-4 h-4 text-emerald-400" /> Libreta de Fiados
                        </h1>
                    </div>
                    <div className="w-6" />
                </div>
            </header>

            <main className="max-w-[500px] mx-auto p-4 space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input 
                        placeholder="Buscar cliente deudor..." 
                        className="pl-10 h-12 rounded-xl border border-slate-200 shadow-sm font-bold bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {!selectedCustomer ? (
                    <div className="space-y-3">
                        {filteredGroups.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Sin deudores</h3>
                                <p className="text-xs text-slate-400 mt-1">Cuentas corrientes impecables por ahora.</p>
                            </div>
                        ) : (
                            filteredGroups.map((group, idx) => (
                                <button 
                                    key={group.phone || group.customerName}
                                    onClick={() => setSelectedCustomer(group)}
                                    className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                                            <User className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-slate-800 uppercase text-[11px] tracking-wide">{group.customerName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{group.phone || 'Sin número'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest leading-none mb-1">Deuda Total</p>
                                        <p className="text-lg font-black text-rose-600 tabular-nums leading-none">${group.totalDebt.toLocaleString()}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <button onClick={() => setSelectedCustomer(null)} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                    <ArrowLeft className="w-3 h-3" /> Volver al listado
                                </button>
                            </div>
                            
                            <div className="text-center pb-6 border-b border-slate-100 mb-6">
                                <div className="w-16 h-16 max-sm:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <User className="h-8 w-8 text-slate-400" />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{selectedCustomer.customerName}</h2>
                                <p className="text-sm font-bold text-rose-600 tabular-nums">Deuda Restante: ${selectedCustomer.totalDebt.toLocaleString()}</p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tickets Impagos</h3>
                                {selectedCustomer.items.map((item: any) => (
                                    <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
                                            </p>
                                            <p className="text-sm font-black text-slate-800 tabular-nums mt-1">${item.amountOwed.toLocaleString()}</p>
                                        </div>
                                        <Button onClick={() => handleSettleDebt(item)} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg shadow-md h-9">
                                            <Check className="w-3 h-3 mr-1" /> Saldar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
