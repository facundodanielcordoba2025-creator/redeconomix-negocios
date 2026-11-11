'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { 
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, 
  doc, serverTimestamp, orderBy, increment, deleteDoc, writeBatch 
} from 'firebase/firestore';
import { useRole } from '@/hooks/use-role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, 
  DrawerDescription 
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Search, History, Users, ArrowRight, Scan, 
  MessageCircle, Phone, Trash2, CheckCircle2, Lock, Unlock, 
  User, Plus, UserCheck, CreditCard, ChevronRight, AlertCircle, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { sendSecurityPinEmail } from '../../actions';
import { RoleGuard } from '@/components/role-guard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { searchProductOffline, initOfflineDB, matchesBarcodeSmart } from '@/lib/offline-db';

const BarcodeScanner = dynamic(() => import('@/components/scanner/hybrid-scanner').then(m => m.default), { ssr: false });

export default function FiadoPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { effectiveRetailerId, employee } = useRole();
    const targetRetailerId = effectiveRetailerId || user?.uid;
    const router = useRouter();
    const { toast } = useToast();

    // VISTA MAESTRA (LISTA)
    const [creditLines, setCreditLines] = useState<any[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // VISTA DETALLE
    const [selectedLine, setSelectedLine] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
    const [ventaItems, setVentaItems] = useState<{detail: string, amount: number, qty: number, productId?: string}[]>([]);
    const [currentItemDetail, setCurrentItemDetail] = useState('');
    const [currentItemAmount, setCurrentItemAmount] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // MANUAL CONTACT MODAL
    const [isManualContactOpen, setIsManualContactOpen] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [manualDNI, setManualDNI] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [manualCreditLimit, setManualCreditLimit] = useState('10000');
    const [manualAuthPersons, setManualAuthPersons] = useState<string[]>([]);
    const [newAuthPerson, setNewAuthPerson] = useState('');

    // FETCH RETAILER INVENTORY PRODUCTS FOR SCANNER
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !targetRetailerId) return null;
        return query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', targetRetailerId));
    }, [firestore, targetRetailerId]);
    const { data: allProducts } = useCollection(productsQuery);
    const [localProducts, setLocalProducts] = useState<any[]>([]);

    useEffect(() => {
        const loadOfflineCatalog = async () => {
            try {
                const db = await initOfflineDB();
                const tx = db.transaction('products', 'readonly');
                const store = tx.objectStore('products');
                const req = store.getAll();
                req.onsuccess = () => {
                    if (req.result && req.result.length > 0) {
                        setLocalProducts(req.result);
                    }
                };
            } catch (e) {
                console.warn("No se pudo pre-cargar catálogo local IndexedDB en Fiado", e);
            }
        };
        loadOfflineCatalog();
    }, []);

    useEffect(() => {
        if (allProducts && allProducts.length > 0) {
            setLocalProducts(allProducts);
        }
    }, [allProducts]);

    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [pagoAmount, setPagoAmount] = useState('');

    // SECURITY PIN STATES
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [securityPinInput, setSecurityPinInput] = useState('');
    const [isSendingPin, setIsSendingPin] = useState(false);
    const [pendingAction, setPendingAction] = useState<any>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isScannerOpen) {
            timer = setTimeout(() => {
                setIsScannerOpen(false);
                toast({ title: "Escáner en pausa", description: "La cámara se cerró por inactividad para ahorrar batería." });
            }, 60000);
        }
        return () => clearTimeout(timer);
    }, [isScannerOpen, toast]);

    // Fetch master list
    const fetchCreditLines = useCallback(async () => {
        if (!firestore || !user || !targetRetailerId) return;
        try {
            const q = query(collection(firestore, 'retailer_credit_lines'), where('retailerId', '==', targetRetailerId));
            const snap = await getDocs(q);
            const lines = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCreditLines(lines);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingList(false);
        }
    }, [firestore, user, targetRetailerId]);

    useEffect(() => {
        fetchCreditLines();
    }, [fetchCreditLines]);

    // Fetch details for a specific line
    const fetchTransactions = async (lineId: string) => {
        if (!firestore) return;
        try {
            const q = query(
                collection(firestore, 'retailer_credit_transactions'),
                where('creditLineId', '==', lineId),
                orderBy('date', 'desc')
            );
            const snap = await getDocs(q);
            const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(txs);
        } catch (e: any) {
            if (e?.code === 'failed-precondition' || e?.message?.includes('index')) {
                try {
                    const qFallback = query(
                        collection(firestore, 'retailer_credit_transactions'),
                        where('creditLineId', '==', lineId)
                    );
                    const snapFallback = await getDocs(qFallback);
                    const txs = snapFallback.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .sort((a: any, b: any) => {
                            const da = a.date ? new Date(a.date).getTime() : 0;
                            const db = b.date ? new Date(b.date).getTime() : 0;
                            return db - da;
                        });
                    setTransactions(txs);
                } catch (fallbackErr) {
                    console.error('Error en fallback:', fallbackErr);
                    toast({ title: "Error", description: "No se pudo cargar el historial.", variant: 'destructive' });
                }
            } else {
                console.error(e);
                toast({ title: "Error", description: "No se pudo cargar el historial.", variant: 'destructive' });
            }
        }
    };

    const handleSelectLine = async (line: any) => {
        setSelectedLine(line);
        await fetchTransactions(line.id);
    };

    const handleBackToList = () => {
        setSelectedLine(null);
        setTransactions([]);
    };

    const handleConfirmVenta = async () => {
        if (!firestore || !user || !targetRetailerId || !selectedLine || ventaItems.length === 0) return;
        const totalVenta = ventaItems.reduce((acc, item) => acc + (item.amount * item.qty), 0);
        
        const limit = Number(selectedLine.creditLimit) || 10000;
        if (limit < 1000000 && (selectedLine.currentDebt + totalVenta > limit)) {
            toast({ title: "Límite Superado", description: "La venta supera el límite disponible.", variant: 'destructive' });
            return;
        }

        try {
            const combinedDetail = ventaItems.map(item => `${item.detail} x${item.qty}`).join(', ');
            const nowIso = new Date().toISOString();
            const batch = writeBatch(firestore);

            const txRef = doc(collection(firestore, 'retailer_credit_transactions'));
            batch.set(txRef, {
                id: txRef.id,
                retailerId: targetRetailerId,
                creditLineId: selectedLine.id,
                type: 'venta',
                amount: totalVenta,
                description: combinedDetail,
                date: nowIso
            });

            const lineRef = doc(firestore, 'retailer_credit_lines', selectedLine.id);
            batch.update(lineRef, {
                currentDebt: increment(totalVenta),
                updatedAt: serverTimestamp()
            });

            const activeBranch = (typeof window !== 'undefined' ? localStorage.getItem('redeconomix_active_branch') : null) || employee?.branchId || '';
            for (const item of ventaItems) {
                if (item.productId) {
                    const prodRef = doc(firestore, 'retailer_inventory', item.productId);
                    const updateData: any = {
                        stock: increment(-item.qty),
                        updatedAt: serverTimestamp()
                    };
                    if (activeBranch && activeBranch !== 'central') {
                        updateData[`stockByBranch.${activeBranch}`] = increment(-item.qty);
                    }
                    batch.update(prodRef, updateData);
                }
            }

            const dateId = format(new Date(), 'yyyy-MM-dd');
            const summaryRef = doc(firestore, 'retailer_daily_summaries', `${targetRetailerId}_${dateId}`);
            batch.set(summaryRef, {
                date: dateId,
                retailerId: targetRetailerId,
                ventasFiado: increment(totalVenta),
                updatedAt: serverTimestamp()
            }, { merge: true });

            await batch.commit();

            setSelectedLine({ ...selectedLine, currentDebt: (selectedLine.currentDebt || 0) + totalVenta });
            setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: (l.currentDebt || 0) + totalVenta } : l));
            await fetchTransactions(selectedLine.id);

            toast({ title: "Venta Cargada", description: "El saldo deudor y el stock han sido actualizados." });
            setIsVentaModalOpen(false);
            setVentaItems([]);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Ocurrió un error al cargar la venta.", variant: 'destructive' });
        }
    };

    const handleConfirmPago = async () => {
        if (!firestore || !user || !targetRetailerId || !selectedLine || !pagoAmount) return;
        const amount = parseFloat(pagoAmount);
        if (amount <= 0) return;

        try {
            await addDoc(collection(firestore, 'retailer_credit_transactions'), {
                retailerId: targetRetailerId,
                creditLineId: selectedLine.id,
                type: 'pago',
                amount: amount,
                description: 'Pago recibido',
                date: new Date().toISOString()
            });

            const lineRef = doc(firestore, 'retailer_credit_lines', selectedLine.id);
            await updateDoc(lineRef, {
                currentDebt: increment(-amount),
                updatedAt: serverTimestamp()
            });

            setSelectedLine({ ...selectedLine, currentDebt: (selectedLine.currentDebt || 0) - amount });
            setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: (l.currentDebt || 0) - amount } : l));
            await fetchTransactions(selectedLine.id);

            toast({ title: "Pago Registrado", description: "La deuda ha disminuido con éxito." });
            setIsPagoModalOpen(false);
            setPagoAmount('');
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No se pudo registrar el pago.", variant: 'destructive' });
        }
    };

    const requestSecurityPin = async (action: any) => {
        if (!firestore || !user || !targetRetailerId) return;
        setPendingAction(action);
        setIsSecurityModalOpen(true);
        setSecurityPinInput('');
        setIsSendingPin(true);
        try {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            await updateDoc(doc(firestore, 'users', targetRetailerId), {
                securityPin: newPin,
                pinCreatedAt: serverTimestamp()
            });
            await sendSecurityPinEmail(user.email || '', newPin);
            toast({ title: "PIN Enviado", description: `Revisá tu correo ${user.email}.` });
        } catch (e: any) {
            toast({ title: "Error", description: "No se pudo enviar el PIN.", variant: 'destructive' });
            setIsSecurityModalOpen(false);
        } finally {
            setIsSendingPin(false);
        }
    };

    const verifyPinAndExecute = async () => {
        if (!firestore || !user || !targetRetailerId || !pendingAction) return;
        try {
            const userSnap = await getDoc(doc(firestore, 'users', targetRetailerId));
            const storedPin = userSnap.data()?.securityPin;
            if (!storedPin || securityPinInput !== String(storedPin)) {
                toast({ title: "PIN Incorrecto", description: "El código no coincide con el enviado a tu correo.", variant: 'destructive' });
                return;
            }
            
            if (pendingAction.type === 'delete_tx') {
                const tx = pendingAction.data;
                await deleteDoc(doc(firestore, 'retailer_credit_transactions', tx.id));
                const diff = tx.type === 'venta' ? -tx.amount : tx.amount; 
                await updateDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id), {
                    currentDebt: increment(diff),
                    updatedAt: serverTimestamp()
                });
                setSelectedLine({ ...selectedLine, currentDebt: (selectedLine.currentDebt || 0) + diff });
                setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: (l.currentDebt || 0) + diff } : l));
                await fetchTransactions(selectedLine.id);
                toast({ title: "Movimiento eliminado" });
                
            } else if (pendingAction.type === 'delete_account') {
                await deleteDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id));
                setSelectedLine(null);
                setCreditLines(prev => prev.filter(l => l.id !== selectedLine.id));
                toast({ title: "Cuenta eliminada con éxito" });
                
            } else if (pendingAction.type === 'saldar_todo') {
                const amount = selectedLine.currentDebt || 0;
                if(amount > 0) {
                    await addDoc(collection(firestore, 'retailer_credit_transactions'), {
                        retailerId: targetRetailerId,
                        creditLineId: selectedLine.id,
                        type: 'pago',
                        amount: amount,
                        description: 'Cancelación total de deuda',
                        date: new Date().toISOString()
                    });
                    await updateDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id), {
                        currentDebt: 0,
                        updatedAt: serverTimestamp()
                    });
                    setSelectedLine({ ...selectedLine, currentDebt: 0 });
                    setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: 0 } : l));
                    await fetchTransactions(selectedLine.id);
                    toast({ title: "Deuda saldada por completo ($0)" });
                }
            }
            
            setIsSecurityModalOpen(false);
            setPendingAction(null);
        } catch(e) {
            toast({ title: "Error", description: "No se pudo ejecutar la acción.", variant: 'destructive' });
        }
    };

    const handleScanFiadoItem = async (code: string) => {
        let product = localProducts.find((p: any) => matchesBarcodeSmart(p, code));
        if (!product) {
            product = await searchProductOffline(code);
        }

        if (product) {
            setVentaItems([...ventaItems, { detail: product.name, amount: Number(product.salePrice || product.price || 0), qty: 1, productId: product.id }]);
            toast({ title: "Producto Añadido", description: product.name });
        } else {
            setVentaItems([...ventaItems, { detail: `Producto Escaneado: ${code}`, amount: 0, qty: 1 }]);
            toast({ title: "Producto Desconocido", description: "Ingrese el precio manualmente." });
        }
        setIsScannerOpen(false);
    };

    const normalizePhone = (raw: string): string => {
        let phone = raw.replace(/[^0-9]/g, '');
        if (phone.startsWith('549')) phone = phone.substring(3);
        else if (phone.startsWith('54')) phone = phone.substring(2);
        if (phone.startsWith('0')) phone = phone.substring(1);
        return phone;
    };

    const sendWhatsAppReceipt = (phone: string, name: string, debt: number, limit: number) => {
        const hasLimit = limit > 0 && limit < 1000000;
        const limitText = hasLimit ? `\n🔒 *Límite disponible:* $${Math.max(0, limit - debt).toLocaleString('es-AR')} de $${limit.toLocaleString('es-AR')}` : '';
        const message = encodeURIComponent(
            `Hola ${name}! 👋\n\n` +
            `Te enviamos tu resumen de cuenta corriente de RedEconomiX:\n\n` +
            `💳 *Deuda actual:* $${debt.toLocaleString('es-AR')}` +
            limitText + `\n\n` +
            `Ante cualquier consulta, estamos a tu disposición. ¡Muchas gracias!`
        );
        const waPhone = `549${phone}`;
        window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
    };

    const createOrOpenCreditLine = async (name: string, phone: string, dni: string = '', email: string = '', authPersons: string[] = [], customLimit: number = 10000) => {
        if (!firestore || !user || !targetRetailerId) return;
        try {
            let snap = null;
            if (phone.trim()) {
                const q = query(
                    collection(firestore, 'retailer_credit_lines'),
                    where('retailerId', '==', targetRetailerId),
                    where('customerPhone', '==', phone.trim())
                );
                snap = await getDocs(q);
            }

            let line: any;
            if (snap && !snap.empty) {
                line = { id: snap.docs[0].id, ...snap.docs[0].data() };
                toast({ title: `Cuenta encontrada`, description: `${name} ya tiene una cuenta activa.` });
            } else {
                const parsedLimit = Number(customLimit) > 0 ? Number(customLimit) : 10000;
                const newRef = await addDoc(collection(firestore, 'retailer_credit_lines'), {
                    retailerId: targetRetailerId,
                    customerName: name.trim(),
                    customerPhone: phone.trim(),
                    customerDNI: dni.trim(),
                    customerEmail: email.trim(),
                    authorizedPersons: authPersons,
                    creditLimit: parsedLimit,
                    currentDebt: 0,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                line = { 
                    id: newRef.id, 
                    customerName: name.trim(), 
                    customerPhone: phone.trim(), 
                    customerDNI: dni.trim(), 
                    customerEmail: email.trim(), 
                    authorizedPersons: authPersons, 
                    creditLimit: parsedLimit, 
                    currentDebt: 0, 
                    status: 'active'
                };
                setCreditLines(prev => [...prev, line]);
                toast({ title: `Cuenta creada`, description: `Se creó la cuenta de ${name}.` });
            }

            await handleSelectLine(line);
        } catch (ex) {
            console.error(ex);
            toast({ title: 'Error', description: 'No se pudo crear la cuenta.', variant: 'destructive' });
        }
    };

    const handleToggleBlockAccount = async () => {
        if (!firestore || !selectedLine) return;
        const newStatus = selectedLine.status === 'blocked' ? 'active' : 'blocked';
        try {
            await updateDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            const updated = { ...selectedLine, status: newStatus };
            setSelectedLine(updated);
            setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? updated : l));
            toast({
                title: newStatus === 'blocked' ? "Cuenta Suspendida" : "Cuenta Habilitada",
                description: newStatus === 'blocked'
                    ? `${selectedLine.customerName} ya no podrá retirar mercadería fiada.`
                    : `${selectedLine.customerName} ahora puede comprar fiado.`
            });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    // Métricas calculadas
    const totalDebt = useMemo(() => {
        return creditLines.reduce((acc, l) => acc + (Number(l.currentDebt) || 0), 0);
    }, [creditLines]);

    const activeWithDebtCount = useMemo(() => {
        return creditLines.filter(l => (Number(l.currentDebt) || 0) > 0).length;
    }, [creditLines]);

    const filteredCreditLines = useMemo(() => {
        if (!searchQuery.trim()) return creditLines;
        const q = searchQuery.toLowerCase().trim();
        return creditLines.filter(l => 
            (l.customerName && l.customerName.toLowerCase().includes(q)) ||
            (l.customerPhone && l.customerPhone.includes(q)) ||
            (l.customerDNI && l.customerDNI.includes(q))
        );
    }, [creditLines, searchQuery]);

    if (isLoadingList) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando cuentas...</p>
            </div>
        );
    }

    return (
        <RoleGuard moduleName="Fiados y Cuentas Corrientes" allowedRoles={['admin', 'accountant']}>
            <div className="max-w-2xl mx-auto space-y-4 pt-[76px] md:pt-2">
                
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ─── PÁGINA 1: VISTA LISTADO DE CUENTAS CORRIENTES ─────── */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {!selectedLine && (
                    <div className="space-y-3">
                        {/* Cabecera y Acción Principal */}
                        <div className="flex items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div>
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                                    Cuentas Corrientes
                                </h1>
                                <p className="text-[11px] font-medium text-slate-500">
                                    Gestión de clientes y saldo fiado
                                </p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setManualName('');
                                    setManualPhone('');
                                    setManualDNI('');
                                    setManualEmail('');
                                    setManualCreditLimit('10000');
                                    setManualAuthPersons([]);
                                    setNewAuthPerson('');
                                    setIsManualContactOpen(true);
                                }}
                                className="h-9 sm:h-10 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider px-3.5 shadow-xs flex items-center gap-1.5 shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nuevo Cliente</span>
                            </Button>
                        </div>

                        {/* Tarjeta Resumen: Total en la Calle */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                    Total en la Calle
                                </span>
                                <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight mt-0.5 tabular-nums">
                                    ${totalDebt.toLocaleString('es-AR')}
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                                    {creditLines.length} cuentas en total
                                </span>
                                <div className="text-[11px] font-semibold text-slate-500">
                                    {activeWithDebtCount} con saldo deudor
                                </div>
                            </div>
                        </div>

                        {/* Buscador de Clientes */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input 
                                type="text"
                                placeholder="Buscar cliente por nombre, teléfono o DNI..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-10 pl-10 pr-9 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Lista de Clientes */}
                        {creditLines.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
                                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">No hay cuentas corrientes registradas</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    Creá tu primer cliente fiado para llevar el control de deudas y registrar pagos de forma ordenada.
                                </p>
                                <Button 
                                    onClick={() => setIsManualContactOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 px-4 font-bold text-xs uppercase"
                                >
                                    <Plus className="w-4 h-4 mr-1.5" /> Crear Primer Cliente
                                </Button>
                            </div>
                        ) : filteredCreditLines.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200/80 p-4 text-xs font-medium text-slate-500">
                                No se encontraron clientes para &quot;{searchQuery}&quot;.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCreditLines.map((line) => {
                                    const isBlocked = line.status === 'blocked';
                                    const debt = Number(line.currentDebt) || 0;
                                    const initial = (line.customerName?.trim() || 'C')[0].toUpperCase();

                                    return (
                                        <div 
                                            key={line.id} 
                                            onClick={() => handleSelectLine(line)}
                                            className={cn(
                                                "w-full text-left bg-white p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer active:scale-[0.99]",
                                                isBlocked ? "border-red-200 bg-red-50/20" : "border-slate-200/80 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border",
                                                    isBlocked ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200/60"
                                                )}>
                                                    {initial}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-sm truncate">{line.customerName}</h4>
                                                        {isBlocked ? (
                                                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5 shrink-0">
                                                                <Lock className="w-2.5 h-2.5" /> Bloqueada
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5 shrink-0">
                                                                <CheckCircle2 className="w-2.5 h-2.5" /> Activa
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                                        {line.customerPhone ? `Tel: ${line.customerPhone}` : (line.customerDNI ? `DNI: ${line.customerDNI}` : 'Sin datos de contacto')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex items-center gap-2.5 shrink-0">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                                        Deuda
                                                    </span>
                                                    <span className={cn("text-sm font-black tabular-nums", debt > 0 ? "text-red-600" : "text-slate-700")}>
                                                        ${debt.toLocaleString('es-AR')}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* ─── PÁGINA 2: VISTA DETALLE DEL CLIENTE ────────────────── */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {selectedLine && (
                    <div className="space-y-3">
                        {/* Barra Superior con Botón Volver y Acciones */}
                        <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                            <button 
                                onClick={handleBackToList}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 py-1.5 px-3 rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Cuentas</span>
                            </button>

                            <div className="flex items-center gap-2">
                                {selectedLine.status === 'blocked' ? (
                                    <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Bloqueada
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Habilitada
                                    </Badge>
                                )}
                                <button 
                                    onClick={() => requestSecurityPin({ type: 'delete_account' })}
                                    title="Eliminar cuenta corriente"
                                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Datos del Cliente y Tarjeta de Deuda */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
                            {/* Titular y Contacto */}
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                                    {selectedLine.customerName}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                    {selectedLine.customerPhone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-slate-400" /> {selectedLine.customerPhone}
                                        </span>
                                    )}
                                    {selectedLine.customerDNI && (
                                        <span>DNI: {selectedLine.customerDNI}</span>
                                    )}
                                </div>
                            </div>

                            {/* Panel Deuda */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                        Deuda Acumulada
                                    </span>
                                    <div className="text-3xl font-black text-red-600 tracking-tight mt-0.5 tabular-nums">
                                        ${(selectedLine.currentDebt || 0).toLocaleString('es-AR')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {Number(selectedLine.creditLimit) > 0 && Number(selectedLine.creditLimit) < 1000000 ? (
                                        <>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Límite: ${Number(selectedLine.creditLimit).toLocaleString('es-AR')}
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mt-1">
                                                Disponible: ${Math.max(0, selectedLine.creditLimit - (selectedLine.currentDebt || 0)).toLocaleString('es-AR')}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-md inline-block">
                                            Sin tope de límite
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Personas Autorizadas (si existen) */}
                            {selectedLine.authorizedPersons && selectedLine.authorizedPersons.length > 0 && (
                                <div className="pt-1">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                        Personas Autorizadas a Retirar
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedLine.authorizedPersons.map((p: string, idx: number) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200/60 flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400" /> {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botonera de Acciones Principales */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button 
                                    onClick={() => setIsVentaModalOpen(true)}
                                    className="h-11 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> Cargar Fiado
                                </Button>
                                <Button 
                                    onClick={() => setIsPagoModalOpen(true)}
                                    className="h-11 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    <CreditCard className="w-4 h-4" /> Cobrar Pago
                                </Button>
                            </div>

                            {/* Fila Secundaria de Herramientas */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                                {selectedLine.customerPhone ? (
                                    <Button 
                                        variant="outline"
                                        onClick={() => sendWhatsAppReceipt(selectedLine.customerPhone, selectedLine.customerName, selectedLine.currentDebt || 0, selectedLine.creditLimit || 10000)}
                                        className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                                    >
                                        <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp Resumen
                                    </Button>
                                ) : (
                                    <div className="hidden sm:block" />
                                )}

                                <Button 
                                    variant="outline"
                                    disabled={(selectedLine.currentDebt || 0) <= 0}
                                    onClick={() => requestSecurityPin({ type: 'saldar_todo' })}
                                    className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" /> Saldar Total
                                </Button>

                                <Button 
                                    variant="outline"
                                    onClick={handleToggleBlockAccount}
                                    className={cn(
                                        "h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border",
                                        selectedLine.status === 'blocked'
                                            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                            : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                    )}
                                >
                                    {selectedLine.status === 'blocked' ? (
                                        <>
                                            <Unlock className="w-4 h-4 text-emerald-600" /> Habilitar Fiado
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4 text-amber-600" /> Suspender Fiado
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Historial de Movimientos */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-slate-400" /> Historial de Movimientos ({transactions.length})
                                </h3>
                            </div>

                            <div className="space-y-2">
                                {transactions.map((tx) => {
                                    const isVenta = tx.type === 'venta';
                                    const dateFormatted = tx.date ? format(new Date(tx.date), 'dd/MM/yyyy HH:mm', { locale: es }) : '';

                                    return (
                                        <div 
                                            key={tx.id} 
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors gap-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                    {tx.description || (isVenta ? 'Compra fiada' : 'Pago a cuenta')}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {dateFormatted}
                                                    </span>
                                                    {tx.takenBy && (
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 rounded">
                                                            Retiró: {tx.takenBy}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <span className={cn("text-xs font-black tabular-nums", isVenta ? "text-red-600" : "text-emerald-600")}>
                                                    {isVenta ? '+' : '-'}${Number(tx.amount || 0).toLocaleString('es-AR')}
                                                </span>
                                                <button 
                                                    onClick={() => requestSecurityPin({ type: 'delete_tx', data: tx })}
                                                    title="Eliminar movimiento"
                                                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {transactions.length === 0 && (
                                    <div className="text-center py-8 text-xs text-slate-400 font-medium">
                                        Aún no hay movimientos registrados en esta cuenta.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── MODAL CARGAR VENTA FIADA ───────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <Drawer open={isVentaModalOpen} onOpenChange={setIsVentaModalOpen}>
                <DrawerContent className="bg-white rounded-t-2xl pb-safe font-sans max-h-[92vh] flex flex-col">
                    <DrawerHeader className="px-5 pt-5 pb-2 shrink-0 border-b border-slate-100">
                        <DrawerTitle className="text-base font-black uppercase tracking-tight text-slate-900">
                            Cargar Fiado a {selectedLine?.customerName}
                        </DrawerTitle>
                        <DrawerDescription className="text-xs text-slate-500">
                            Agregá los productos que retira el cliente a su cuenta
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-5 space-y-4 overflow-y-auto flex-1">
                        {isScannerOpen ? (
                            <div className="relative w-full h-[220px] rounded-2xl border-2 border-red-500 overflow-hidden bg-black">
                                <button 
                                    onClick={() => setIsScannerOpen(false)}
                                    className="absolute top-2 right-2 rounded-full w-8 h-8 bg-red-600 text-white flex items-center justify-center z-50 text-xs font-bold"
                                >
                                    ✕
                                </button>
                                <BarcodeScanner 
                                    continuous={true}
                                    onClose={() => setIsScannerOpen(false)} 
                                    onScanSuccess={(code: string) => handleScanFiadoItem(code)} 
                                />
                            </div>
                        ) : (
                            <Button 
                                variant="outline"
                                onClick={() => setIsScannerOpen(true)} 
                                className="w-full h-11 rounded-xl border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Scan className="w-4 h-4 text-red-600" /> Escanear Código de Barras
                            </Button>
                        )}

                        {!isScannerOpen && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input 
                                        type="text" 
                                        placeholder="Descripción del producto..." 
                                        value={currentItemDetail} 
                                        onChange={e => setCurrentItemDetail(e.target.value)} 
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium flex-1 text-slate-900" 
                                    />
                                    <Input 
                                        type="number" 
                                        placeholder="$ Precio" 
                                        value={currentItemAmount} 
                                        onChange={e => setCurrentItemAmount(e.target.value)} 
                                        className="h-11 w-28 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold text-slate-900" 
                                    />
                                </div>
                                <Button 
                                    type="button"
                                    onClick={() => {
                                        if (currentItemDetail && currentItemAmount) {
                                            setVentaItems([...ventaItems, { detail: currentItemDetail, amount: parseFloat(currentItemAmount), qty: 1 }]);
                                            setCurrentItemDetail(''); 
                                            setCurrentItemAmount('');
                                        }
                                    }} 
                                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase"
                                >
                                    Agregar al Detalle
                                </Button>
                            </div>
                        )}

                        {ventaItems.length > 0 && (
                            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Productos a fiar:
                                </span>
                                {ventaItems.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-slate-700 truncate max-w-[200px]">
                                            {item.detail} x{item.qty}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                                ${(item.amount * item.qty).toLocaleString('es-AR')}
                                            </span>
                                            <button 
                                                onClick={() => setVentaItems(prev => prev.filter((_, idx) => idx !== i))}
                                                className="text-slate-400 hover:text-red-500"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                                    <span>Total:</span>
                                    <span className="text-red-600">
                                        ${ventaItems.reduce((acc, item) => acc + (item.amount * item.qty), 0).toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button 
                            disabled={ventaItems.length === 0}
                            onClick={handleConfirmVenta} 
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-xs disabled:opacity-50"
                        >
                            Confirmar Fiado
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── MODAL COBRAR PAGO ──────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <Drawer open={isPagoModalOpen} onOpenChange={setIsPagoModalOpen}>
                <DrawerContent className="bg-white rounded-t-2xl pb-safe font-sans">
                    <DrawerHeader className="px-5 pt-5 pb-2 shrink-0 border-b border-slate-100">
                        <DrawerTitle className="text-base font-black uppercase tracking-tight text-slate-900">
                            Registrar Cobro de Deuda
                        </DrawerTitle>
                        <DrawerDescription className="text-xs text-slate-500">
                            Ingresá el importe entregado por {selectedLine?.customerName}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-5 space-y-4">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deuda Actual</span>
                            <span className="text-2xl font-black text-red-600 mt-0.5 block tabular-nums">
                                ${(selectedLine?.currentDebt || 0).toLocaleString('es-AR')}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                                Monto a cobrar ($)
                            </label>
                            <Input 
                                type="number" 
                                value={pagoAmount} 
                                onChange={e => setPagoAmount(e.target.value)} 
                                className="h-12 rounded-xl bg-slate-50 border border-slate-200 text-xl font-black text-slate-900 tabular-nums px-4" 
                                placeholder="0"
                            />
                        </div>

                        <Button 
                            disabled={!pagoAmount || parseFloat(pagoAmount) <= 0}
                            onClick={handleConfirmPago} 
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-xs disabled:opacity-50"
                        >
                            Guardar Pago
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── MODAL NUEVO CLIENTE (FICHA TÉCNICA) ────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <Drawer open={isManualContactOpen} onOpenChange={setIsManualContactOpen}>
                <DrawerContent className="bg-white rounded-t-2xl pb-safe font-sans max-h-[90vh]">
                    <DrawerHeader className="px-5 pt-5 pb-2 shrink-0 border-b border-slate-100">
                        <DrawerTitle className="text-base font-black uppercase tracking-tight text-slate-900">
                            Nuevo Cliente de Cuenta Corriente
                        </DrawerTitle>
                        <DrawerDescription className="text-xs text-slate-500">
                            Completá los datos del cliente para habilitar compras fiadas
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-5 space-y-3.5 overflow-y-auto max-h-[70vh]">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">Nombre del Titular *</label>
                            <Input
                                placeholder="Ej: Juan Pérez"
                                value={manualName}
                                onChange={e => setManualName(e.target.value)}
                                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium text-slate-900"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">Teléfono / WhatsApp</label>
                                <Input
                                    placeholder="Ej: 3875123456"
                                    value={manualPhone}
                                    onChange={e => setManualPhone(e.target.value)}
                                    type="tel"
                                    className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium text-slate-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">DNI (Opcional)</label>
                                <Input
                                    placeholder="Número de DNI"
                                    value={manualDNI}
                                    onChange={e => setManualDNI(e.target.value)}
                                    className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold uppercase text-slate-700 tracking-wider">Límite de Fiado ($)</label>
                            <Input
                                placeholder="Ej: 20000 (o 0 para sin límite)"
                                value={manualCreditLimit}
                                onChange={e => setManualCreditLimit(e.target.value)}
                                type="number"
                                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium text-slate-900"
                            />
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                            <label className="text-[11px] font-bold uppercase text-slate-700 tracking-wider block">Personas Autorizadas a Retirar</label>
                            <div className="flex gap-1.5">
                                <Input
                                    placeholder="Nombre de familiar o empleado..."
                                    value={newAuthPerson}
                                    onChange={e => setNewAuthPerson(e.target.value)}
                                    className="h-9 rounded-lg bg-white border-slate-200 text-xs font-medium text-slate-900 flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newAuthPerson.trim()) {
                                            e.preventDefault();
                                            setManualAuthPersons(prev => [...prev, newAuthPerson.trim()]);
                                            setNewAuthPerson('');
                                        }
                                    }}
                                />
                                <Button 
                                    type="button"
                                    onClick={() => {
                                        if (newAuthPerson.trim()) {
                                            setManualAuthPersons(prev => [...prev, newAuthPerson.trim()]);
                                            setNewAuthPerson('');
                                        }
                                    }}
                                    variant="secondary" 
                                    className="h-9 rounded-lg px-3 text-xs font-bold"
                                >
                                    Añadir
                                </Button>
                            </div>

                            {manualAuthPersons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {manualAuthPersons.map((p, idx) => (
                                        <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                            {p}
                                            <button 
                                                onClick={() => setManualAuthPersons(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            disabled={!manualName.trim()}
                            onClick={async () => {
                                if (!manualName.trim()) return;
                                const phone = normalizePhone(manualPhone);
                                const limitNum = Number(manualCreditLimit) > 0 ? Number(manualCreditLimit) : 10000;
                                setIsManualContactOpen(false);
                                await createOrOpenCreditLine(manualName, phone, manualDNI, manualEmail, manualAuthPersons, limitNum);
                            }}
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-xs disabled:opacity-50 mt-2"
                        >
                            Guardar Cliente
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── MODAL AUTORIZACIÓN POR PIN ─────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
                <DialogContent className="max-w-[360px] rounded-2xl p-5 bg-white shadow-xl border border-slate-200 flex flex-col text-center">
                    <DialogTitle className="font-bold text-slate-900 text-base mb-1">
                        Autorización Requerida
                    </DialogTitle>
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto my-2">
                        <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        Ingresá el código PIN de 4 dígitos enviado a tu correo para autorizar esta operación.
                    </p>
                    
                    <div className="space-y-3">
                        <Input 
                            type="text" 
                            maxLength={4}
                            value={securityPinInput} 
                            onChange={e => setSecurityPinInput(e.target.value)} 
                            placeholder="----" 
                            className="h-12 text-center text-2xl tracking-[0.6em] font-black rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                        />
                        <Button 
                            disabled={securityPinInput.length < 4}
                            onClick={verifyPinAndExecute}
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-xs"
                        >
                            Verificar y Confirmar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </RoleGuard>
    );
}
