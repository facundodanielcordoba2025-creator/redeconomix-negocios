'use client';

import { useState, useEffect, useMemo } from 'react';

import { collection, query, where, getDocs, getDoc, updateDoc, doc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { Wallet, TrendingUp, TrendingDown, BookOpen, Clock, AlertCircle, ShieldAlert, ArrowLeft, Trash2, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRole } from '@/hooks/use-role';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { FileDown, Download, Fingerprint, Lock, ShieldCheck as ShieldIcon } from 'lucide-react';
import { authenticateWithBiometry, checkBiometryAvailability } from '@/lib/biometrics';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ArqueoDeCajaPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { role, effectiveRetailerId } = useRole();
    const targetRetailerId = effectiveRetailerId || user?.uid;

    const [operations, setOperations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasBiometry, setHasBiometry] = useState(false);
    const { toast } = useToast();

    useEffect(() => { 
        setIsClient(true); 
        checkBiometryAvailability().then(setHasBiometry);
    }, []);

    const handleBiometricAuth = async () => {
        try {
            const success = await authenticateWithBiometry();
            if (success) {
                setIsAuthenticated(true);
                toast({ title: "Identidad Verificada 🛡️", description: "Accediendo a la bóveda financiera." });
            } else {
                toast({ title: "Fallo de Autenticación", description: "No se pudo verificar tu identidad.", variant: 'destructive' });
            }
        } catch (e: any) {
            console.error(e);
            if (!hasBiometry) {
                setIsAuthenticated(true);
            } else {
                toast({ title: "Verificación Cancelada 🔒", description: "Debes completar la verificación biométrica para continuar.", variant: 'destructive' });
            }
        }
    };

    useEffect(() => {
        if (isClient && role === 'admin' && !isAuthenticated) {
            handleBiometricAuth();
        }
    }, [isClient, role]);

    useEffect(() => {
        if (!user || !firestore || !targetRetailerId) return;

        const fetchTodayOps = async () => {
            try {
                const q = query(
                    collection(firestore, 'retailer_daily_operations'),
                    where('retailerId', '==', targetRetailerId)
                );
                
                const snapshot = await getDocs(q);
                
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                const ops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(op => {
                        if (!op.date) return false;
                        const opDate = new Date(op.date);
                        return opDate >= todayMidnight;
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setOperations(ops);
            } catch (error) {
                console.error("Error obteniendo operaciones:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTodayOps();
    }, [user, firestore, targetRetailerId]);

    const { totalCaja, totalIngresos, totalGastos, totalFiados } = useMemo(() => {
        let ingresos = 0;
        let gastos = 0;
        let fiados = 0;

        operations.forEach(op => {
            if (op.status === 'voided') return; // Ignorar anuladas
            const amount = parseFloat(op.total || 0);
            if (op.type === 'expense') gastos += amount;
            else if (op.type === 'credit_sale') fiados += amount;
            else ingresos += amount;
        });

        return { totalIngresos: ingresos, totalGastos: gastos, totalFiados: fiados, totalCaja: ingresos - gastos };
    }, [operations]);

    const handleVoidOperation = async (op: any) => {
        if (!firestore || !targetRetailerId) return;
        if (!confirm(`¿Estás seguro de ANULAR esta ${op.type === 'expense' ? 'gestión de gasto' : 'venta'}?\nEsto devolverá el stock a su sucursal y restará el ingreso.`)) return;

        try {
            // 1. Marcar como anulada
            await updateDoc(doc(firestore, 'retailer_daily_operations', op.id), {
                status: 'voided',
                voidedAt: new Date().toISOString()
            });

            // 2. Restaurar Stock exacto por ID y por sucursal si era una venta o fiado
            if ((op.type === 'sale' || op.type === 'credit_sale') && Array.isArray(op.items) && op.items.length > 0) {
                const branchIdToRestore = op.branchId;
                for (const item of op.items) {
                    const restoreSingleDoc = async (docId: string, qtyToAdd: number) => {
                        const prodRef = doc(firestore, 'retailer_inventory', docId);
                        const snap = await getDoc(prodRef);
                        if (!snap.exists()) return;
                        const updatePayload: any = {
                            stock: increment(qtyToAdd),
                            updatedAt: serverTimestamp()
                        };
                        if (branchIdToRestore) {
                            updatePayload[`stockByBranch.${branchIdToRestore}`] = increment(qtyToAdd);
                        }
                        await updateDoc(prodRef, updatePayload);
                    };

                    if (item.isBundle && Array.isArray(item.bundleItems)) {
                        for (const comp of item.bundleItems) {
                            if (comp.id) {
                                const compQty = (Number(comp.qty) || 1) * (Number(item.qty) || 1);
                                await restoreSingleDoc(comp.id, compQty);
                            }
                        }
                    } else if (item.productId && !String(item.productId).startsWith('manual-')) {
                        await restoreSingleDoc(item.productId, Number(item.qty) || 1);
                    } else if (item.name) {
                        const invRef = query(
                            collection(firestore, 'retailer_inventory'),
                            where('retailerId', '==', targetRetailerId),
                            where('name', '==', item.name)
                        );
                        const invSnap = await getDocs(invRef);
                        if (!invSnap.empty) {
                            await restoreSingleDoc(invSnap.docs[0].id, Number(item.qty) || 1);
                        }
                    }
                }
            }

            // 3. Actualizar estado local inmediatamente
            setOperations(prev => prev.map(o => o.id === op.id ? { ...o, status: 'voided' } : o));

        } catch (error: any) {
            alert("Error al anular: " + error.message);
        }
    };

    const handleExportDailyDiary = () => {
        if (!operations || operations.length === 0) return;

        const dataToExport = operations.map(op => ({
            'Fecha': format(new Date(op.date), "dd/MM/yyyy HH:mm"),
            'Tipo': op.type === 'expense' ? 'GASTO' : (op.type === 'credit_sale' ? 'FIADO' : 'VENTA'),
            'Concepto': op.concept || '-',
            'Cliente/Proveedor': op.customerName || op.providerName || 'Final',
            'Método Pago': (op.paymentMethod || '-').toUpperCase(),
            'Total ($)': parseFloat(op.total || 0),
            'Estado': (op.status || 'completed').toUpperCase()
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Diario de Caja");

        // Add summary totals
        XLSX.utils.sheet_add_aoa(worksheet, [
            [],
            ["RESUMEN TOTAL", "", "", "", "TOTAL CAJA:", totalCaja]
        ], { origin: -1 });

        XLSX.writeFile(workbook, `diario_caja_rex_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    if (!isClient) return null;

    if (role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <ShieldAlert className="w-20 h-20 max-sm:h-14 text-[#FF0000] mb-6 animate-bounce" />
                <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 mb-2">Acceso Restringido</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-[280px] leading-relaxed mb-8">
                    La visualización del arqueo de caja y rentabilidad está bloqueada para cuentas de Empleado/Cajero.
                </p>
                <Link href="/redeconomix/dashboard-negocio">
                    <button 
                        onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); }}
                        className="bg-slate-900 active:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all active:scale-[0.98] touch-manipulation select-none"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al Tablero
                    </button>
                </Link>
            </div>
        );
    }

    if (role === 'admin' && !isAuthenticated && hasBiometry) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="space-y-6">
                    <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-700 shadow-2xl">
                        <Lock className="w-10 h-10 text-[#FF0000] animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-black uppercase tracking-widest italic">Bóveda Protegida</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto">
                            Se requiere verificación biométrica para visualizar el cierre de caja y rentabilidad.
                        </p>
                    </div>
                    <button 
                        onClick={() => {
                            if ('vibrate' in navigator) navigator.vibrate(8);
                            handleBiometricAuth();
                        }}
                        className="bg-white text-slate-900 active:bg-slate-100 rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 mx-auto shadow-xl transition-all active:scale-[0.98] touch-manipulation select-none border-none shrink-0"
                    >
                        <Fingerprint className="w-5 h-5 shrink-0" /> Verificar con Huella / FaceID
                    </button>
                    <Link href="/redeconomix/dashboard-negocio">
                        <p 
                            onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); }}
                            className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4 underline underline-offset-4 pointer-events-auto active:text-slate-400"
                        >
                            Cancelar y Salir
                        </p>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-40 pt-[90px] md:pt-0">
            <main className="max-w-[500px] mx-auto p-6 space-y-8">
                
                <div className="flex items-start justify-between mb-8 mt-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">
                            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <h2 className="text-3xl font-black text-slate-950 tracking-tighter leading-none pt-2 italic underline decoration-[#FF0000]/20 decoration-4 underline-offset-8">
                            Cierre Diario
                        </h2>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(6);
                                handleExportDailyDiary();
                            }}
                            className="h-10 border border-slate-200 text-slate-900 bg-white rounded-2xl flex items-center justify-center gap-2 px-3 transition-all active:scale-95 touch-manipulation select-none shrink-0"
                        >
                            <FileDown className="w-4 h-4 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Excel Diario</span>
                        </button>
                        <Link href="/redeconomix/dashboard-negocio/reportes">
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); }}
                                className="h-10 bg-slate-900 active:bg-black text-white rounded-2xl flex items-center justify-center gap-2 px-3 transition-all active:scale-95 touch-manipulation select-none border-none shadow-lg shadow-slate-900/10 shrink-0"
                            >
                                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Reportes PRO</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="animate-pulse h-28 w-full bg-slate-100 rounded-3xl"></div>
                ) : (
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                            <Wallet className="w-32 h-32" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Caja Neta Calculada</p>
                        <h2 className={`text-6xl font-black tracking-tighter italic relative z-10 ${totalCaja >= 0 ? 'text-slate-900' : 'text-[#FF0000]'}`}>
                            ${totalCaja.toLocaleString()}
                        </h2>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-[1rem] bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100">
                            <TrendingUp className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos</p>
                        <p className="text-2xl font-black text-emerald-600 italic tracking-tight">${totalIngresos.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-[1rem] bg-rose-50 flex items-center justify-center text-[#FF0000] mb-4 border border-rose-100">
                            <TrendingDown className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Egresos / Gastos</p>
                        <p className="text-2xl font-black text-[#FF0000] italic tracking-tight">${totalGastos.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] shadow-lg shadow-amber-500/10 border border-amber-100 col-span-2 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Cuentas por Cobrar (Fiados)</p>
                            <p className="text-3xl font-black text-amber-500 italic tracking-tight">${totalFiados.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-[1rem] bg-amber-50 flex items-center justify-center border border-amber-100">
                            <BookOpen className="w-6 h-6 text-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <h3 className="text-lg font-black uppercase italic tracking-widest text-slate-900 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#FF0000]" /> Registro Operativo
                    </h3>

                    <div className="space-y-4">
                        {isLoading ? (
                            <p className="text-center text-slate-400 font-bold py-8 uppercase text-xs">Cargando registros...</p>
                        ) : operations.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed">
                                <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Caja Limpia</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Aún no hay movimientos hoy</p>
                            </div>
                        ) : (
                            operations.map((op: any) => (
                                <div key={op.id} className="flex items-center justify-between p-4 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-[1rem] border flex items-center justify-center font-black text-[10px] tracking-widest shrink-0
                                            ${op.type === 'expense' ? 'bg-rose-50 text-[#FF0000] border-rose-100' : 
                                              op.type === 'credit_sale' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                              'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {op.type === 'expense' ? 'GST' : op.type === 'credit_sale' ? 'FIA' : 'VNT'}
                                        </div>
                                        <div>
                                            <p className={cn("font-black text-sm uppercase tracking-tight italic", op.status === 'voided' ? 'text-slate-300 line-through' : 'text-slate-900')}>
                                                {op.concept || (op.type === 'expense' ? 'Gasto Manual' : 'Operación')}
                                                {op.status === 'voided' && <span className="ml-2 bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[8px] italic tracking-widest no-underline">ANULADA</span>}
                                            </p>
                                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
                                                {new Date(op.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {op.paymentMethod === 'cash' ? 'EFECTIVO' : op.paymentMethod === 'transfer' ? 'TRANSF.' : 'FIADO'} {op.customerName ? `• ${op.customerName}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className={`font-black tracking-tight text-lg italic ${op.status === 'voided' ? 'text-slate-200 line-through' : op.type === 'expense' ? 'text-[#FF0000]' : op.type === 'credit_sale' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {op.type === 'expense' ? '-' : '+'}${parseFloat(op.total || 0).toLocaleString()}
                                        </p>
                                        {role === 'admin' && op.status !== 'voided' && (
                                            <button onClick={() => handleVoidOperation(op)} className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors border-b border-rose-200">
                                                <Undo2 className="w-3 h-3" /> Anular
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
