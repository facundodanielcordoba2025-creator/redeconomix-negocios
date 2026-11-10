'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp, orderBy, increment, deleteDoc, writeBatch } from 'firebase/firestore';
import { useRole } from '@/hooks/use-role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, 
  DrawerDescription, DrawerFooter, DrawerClose 
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, ShieldCheck, History, Users, Contact, ArrowRight, Scan, MessageCircle, UserPlus, Phone, Loader2, Trash2, CheckCircle, Lock, User, Plus, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { sendSecurityPinEmail } from '../../actions';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleGuard } from '@/components/role-guard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/pull-to-refresh';
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

    // VISTA DETALLE
    const [selectedLine, setSelectedLine] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);

    const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
    const [ventaItems, setVentaItems] = useState<{detail: string, amount: number, qty: number, productId?: string}[]>([]);
    const [currentItemDetail, setCurrentItemDetail] = useState('');
    const [currentItemAmount, setCurrentItemAmount] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // MANUAL CONTACT FALLBACK
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
                toast({ title: "Escáner en pausa", description: "La cámara se cerró por inactividad para ahorrar recursos." });
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
            // Query con índice compuesto (creditLineId + date)
            const q = query(
                collection(firestore, 'retailer_credit_transactions'),
                where('creditLineId', '==', lineId),
                orderBy('date', 'desc')
            );
            const snap = await getDocs(q);
            const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(txs);
        } catch (e: any) {
            // Fallback: si el índice todavía está construyéndose, ordenar en el cliente
            if (e?.code === 'failed-precondition' || e?.message?.includes('index')) {
                console.warn('Índice no disponible aún, ordenando en cliente...');
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
        
        if (selectedLine.currentDebt + totalVenta > selectedLine.creditLimit) {
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

            // Descontar stock si los ítems provienen del inventario escaneado
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

            // Registrar en resumen diario
            const dateId = format(new Date(), 'yyyy-MM-dd');
            const summaryRef = doc(firestore, 'retailer_daily_summaries', `${targetRetailerId}_${dateId}`);
            batch.set(summaryRef, {
                date: dateId,
                retailerId: targetRetailerId,
                ventasFiado: increment(totalVenta),
                updatedAt: serverTimestamp()
            }, { merge: true });

            await batch.commit();

            setSelectedLine({ ...selectedLine, currentDebt: selectedLine.currentDebt + totalVenta });
            setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: l.currentDebt + totalVenta } : l));
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

            setSelectedLine({ ...selectedLine, currentDebt: selectedLine.currentDebt - amount });
            setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: l.currentDebt - amount } : l));
            await fetchTransactions(selectedLine.id);

            toast({ title: "Pago Registrado", description: "La deuda ha disminuido." });
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
            toast({ title: "📧 PIN Enviado", description: `Revisá tu correo ${user.email}.` });
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
                toast({ title: "PIN Incorrecto 🚫", variant: 'destructive' });
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
                setSelectedLine({ ...selectedLine, currentDebt: selectedLine.currentDebt + diff });
                setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: l.currentDebt + diff } : l));
                await fetchTransactions(selectedLine.id);
                toast({ title: "Transacción eliminada" });
                
            } else if (pendingAction.type === 'delete_account') {
                await deleteDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id));
                setSelectedLine(null);
                setCreditLines(prev => prev.filter(l => l.id !== selectedLine.id));
                toast({ title: "Cuenta eliminada" });
                
            } else if (pendingAction.type === 'saldar_todo') {
                const amount = selectedLine.currentDebt;
                if(amount > 0) {
                    await addDoc(collection(firestore, 'retailer_credit_transactions'), {
                        retailerId: targetRetailerId,
                        creditLineId: selectedLine.id,
                        type: 'pago',
                        amount: amount,
                        description: 'Saldado total (Manual)',
                        date: new Date().toISOString()
                    });
                    await updateDoc(doc(firestore, 'retailer_credit_lines', selectedLine.id), {
                        currentDebt: 0,
                        updatedAt: serverTimestamp()
                    });
                    setSelectedLine({ ...selectedLine, currentDebt: 0 });
                    setCreditLines(prev => prev.map(l => l.id === selectedLine.id ? { ...l, currentDebt: 0 } : l));
                    await fetchTransactions(selectedLine.id);
                    toast({ title: "Deuda saldada a $0" });
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

    // Normaliza un número de teléfono argentino para WhatsApp
    const normalizePhone = (raw: string): string => {
        let phone = raw.replace(/[^0-9]/g, '');
        if (phone.startsWith('549')) phone = phone.substring(3);
        else if (phone.startsWith('54')) phone = phone.substring(2);
        if (phone.startsWith('0')) phone = phone.substring(1);
        return phone;
    };

    // Envía el resumen de cuenta por WhatsApp
    const sendWhatsAppReceipt = (phone: string, name: string, debt: number, limit: number) => {
        const message = encodeURIComponent(
            `Hola ${name}! 👋\n\n` +
            `Te enviamos tu resumen de cuenta corriente:\n\n` +
            `💳 *Deuda actual:* $${debt.toLocaleString('es-AR')}\n` +
            `🔒 *Límite disponible:* $${(limit - debt).toLocaleString('es-AR')} de $${limit.toLocaleString('es-AR')}\n\n` +
            `Ante cualquier duda, estamos a tu disposición. ¡Gracias por tu confianza! 🙌`
        );
        const waPhone = `549${phone}`;
        window.open(`https://wa.me/${waPhone}?text=${message}`, '_blank');
    };

    // Crea o recupera la línea de crédito y navega al detalle
    const createOrOpenCreditLine = async (name: string, phone: string, dni: string = '', email: string = '', authPersons: string[] = [], customLimit: number = 10000) => {
        if (!firestore || !user || !targetRetailerId) return;
        try {
            // Verificar si ya existe
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
                toast({ title: `Cuenta encontrada ✅`, description: `${name} ya tiene una cuenta activa.` });
            } else {
                // Crear nueva línea con límite configurado por el dueño
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
                toast({ title: `Cuenta creada 🎉`, description: `Se creó la cuenta corriente de ${name}.` });
            }

            // Navegar al detalle directamente
            await handleSelectLine(line);

            // Ofrecer enviar WhatsApp si tiene teléfono
            if (phone) {
                setTimeout(() => {
                    const confirmed = window.confirm(`¿Querés enviar el resumen de cuenta a ${name} por WhatsApp?`);
                    if (confirmed) sendWhatsAppReceipt(phone, name, line.currentDebt || 0, line.creditLimit || customLimit);
                }, 500);
            }
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
                title: newStatus === 'blocked' ? "Cuenta Bloqueada 🔒" : "Cuenta Habilitada ✅",
                description: newStatus === 'blocked'
                    ? `${selectedLine.customerName} ya NO podrá comprar fiado.`
                    : `${selectedLine.customerName} ahora puede comprar fiado.`
            });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleContactPicker = async () => {
        // Intentar API de contactos nativa (Android Chrome)
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
                if (contacts && contacts.length > 0) {
                    const name = contacts[0].name?.[0] || 'Cliente';
                    const rawPhone = contacts[0].tel?.[0] || '';
                    const phone = normalizePhone(rawPhone);
                    if (phone) {
                        await createOrOpenCreditLine(name, phone);
                    } else {
                        toast({ title: 'Sin teléfono', description: 'El contacto no tiene número. Ingresalo manualmente.', variant: 'destructive' });
                    }
                }
                return;
            } catch (ex) {
                console.error(ex);
            }
        }
        // Fallback: formulario manual
        setIsManualContactOpen(true);
    };

    if (isLoadingList) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" /></div>;
    }

    return (
        <RoleGuard moduleName="Fiados y Cuentas Corrientes" allowedRoles={['admin', 'accountant']}>
            <div className="min-h-screen bg-slate-50 font-sans pb-36 px-4 pt-4 select-none touch-manipulation">
                {/* ENCABEZADO PRINCIPAL (Estilo Premium) */}
                <div className="bg-white text-slate-900 rounded-b-[3.5rem] px-6 pt-[110px] max-sm:pt-[125px] pb-10 relative overflow-hidden shadow-sm border-b border-slate-100">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-slate-50 rounded-full blur-[100px] pointer-events-none" />
                
                {!selectedLine && (
                    <div className="relative z-10 animate-in fade-in duration-300 space-y-8">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); router.back(); }} 
                                className="h-12 w-12 rounded-full active:bg-slate-100 bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center active:scale-95 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="text-center">
                                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Panel de Fiados</h1>
                                <p className="text-lg font-black tracking-tight text-slate-900 leading-none mt-1">Cuentas Corrientes</p>
                            </div>
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); handleContactPicker(); }} 
                                className="bg-red-600 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-all"
                            >
                                <Contact className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Total en la calle</p>
                            <div className="text-5xl font-black tracking-tighter mt-1 flex justify-center items-center gap-1 text-red-600">
                                <span className="text-2xl text-red-300">$</span>
                                {creditLines.reduce((acc, l) => acc + (l.currentDebt || 0), 0).toLocaleString('es-AR')}
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 mt-2 bg-red-50 text-red-600 inline-block px-4 py-1.5 rounded-full border border-red-100">
                                En {creditLines.length} cuentas activas
                            </p>
                        </div>
                    </div>
                )}

                {selectedLine && (
                    <div className="relative z-10 animate-in fade-in duration-300 space-y-6">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); handleBackToList(); }} 
                                className="h-12 w-12 rounded-full active:bg-slate-100 bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center active:scale-95 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div className="text-center">
                                <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Límite: ${(selectedLine.creditLimit || 0).toLocaleString()}</h1>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <p className="text-lg font-black tracking-tight text-red-600 leading-none">{selectedLine.customerName}</p>
                                    <Badge className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5", selectedLine.status === 'blocked' ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}>
                                        {selectedLine.status === 'blocked' ? '🔒 Bloqueada' : '✅ Habilitada'}
                                    </Badge>
                                </div>
                            </div>
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); requestSecurityPin({ type: 'delete_account' }); }} 
                                className="h-12 w-12 rounded-full active:bg-red-100 bg-red-50 border border-red-100 shadow-sm flex items-center justify-center active:scale-95 transition-all text-red-600"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-[2.5rem] shadow-xl shadow-red-600/20 relative overflow-hidden mx-4">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-200 relative z-10">Deuda Acumulada</p>
                            <h2 className="text-5xl font-black tracking-tighter mt-1 relative z-10">${(selectedLine.currentDebt || 0).toLocaleString('es-AR')}</h2>
                            <p className="text-[9px] font-bold text-white/80 mt-2 relative z-10">
                                Disponible: ${(selectedLine.creditLimit - selectedLine.currentDebt).toLocaleString('es-AR')}
                            </p>
                        </div>

                        {selectedLine.authorizedPersons && selectedLine.authorizedPersons.length > 0 && (
                            <div className="px-4">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Personas Autorizadas</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLine.authorizedPersons.map((person: string, idx: number) => (
                                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400" />
                                                {person}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 px-4">
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setIsVentaModalOpen(true); }} 
                                className="h-14 bg-white text-red-600 active:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all active:scale-[0.98]"
                            >
                                Cargar Venta
                            </button>
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setIsPagoModalOpen(true); }} 
                                className="h-14 bg-slate-900 active:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-slate-900/20 transition-all active:scale-[0.98]"
                            >
                                Cobrar Pago
                            </button>
                            <button 
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); requestSecurityPin({ type: 'saldar_todo' }); }} 
                                className="col-span-2 h-12 bg-emerald-50 active:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Saldar Toda la Deuda
                            </button>
                            <button 
                                onClick={handleToggleBlockAccount}
                                className={cn(
                                    "col-span-2 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border font-sans",
                                    selectedLine.status === 'blocked' 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                        : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                )}
                            >
                                {selectedLine.status === 'blocked' ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Habilitar Consumo de Fiado
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 text-amber-600" /> Bloquear Cuenta (Suspender Fiado)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <main className="max-w-[500px] mx-auto px-4 mt-8 space-y-6">
                
                {/* VISTA MAESTRA (LISTADO) */}
                {!selectedLine && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between gap-2 px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Listado de Clientes ({creditLines.length})
                            </h3>
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
                                className="h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 px-3"
                            >
                                <Plus className="w-4 h-4" /> Nuevo Cliente
                            </Button>
                        </div>
                        
                        {creditLines.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm px-6">
                                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-sm font-bold text-slate-500">No tienes cuentas corrientes activas.</p>
                                <p className="text-xs text-slate-400 mt-2 px-8 mb-6">Crea clientes autorizados para que tus cajeros puedan vender fiado con tope y control.</p>
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
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-red-600/30 active:scale-[0.98] transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Crear Primer Cliente
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {creditLines.map((line) => (
                                    <button 
                                        key={line.id} 
                                        onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); handleSelectLine(line); }}
                                        className={cn(
                                            "w-full text-left bg-white p-4 rounded-3xl border shadow-sm transition-all flex items-center justify-between group active:scale-[0.98]",
                                            line.status === 'blocked' ? "border-red-200 bg-red-50/20" : "border-slate-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl border flex items-center justify-center font-black",
                                                line.status === 'blocked' ? "bg-red-100 border-red-200 text-red-600" : "bg-red-50 border-red-100 text-red-600"
                                            )}>
                                                {line.customerName?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm">{line.customerName}</h4>
                                                    {line.status === 'blocked' ? (
                                                        <Badge variant="destructive" className="text-[9px] font-black px-1.5 py-0">🔒 Bloqueada</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[9px] font-bold text-emerald-600 border-emerald-200 bg-emerald-50 px-1.5 py-0">✅ Activa</Badge>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{line.customerPhone || line.customerDNI || 'Sin teléfono'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deuda</p>
                                                <p className={cn("text-base font-black tabular-nums", line.currentDebt > 0 ? "text-red-600" : "text-slate-900")}>
                                                    ${line.currentDebt?.toLocaleString('es-AR')}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-active:text-slate-900 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* VISTA DETALLE */}
                {selectedLine && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                                <History className="w-4 h-4" /> Historial de Movimientos
                            </h3>
                            <div className="space-y-3">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                                            {tx.takenBy && (
                                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">
                                                    Retiró: {tx.takenBy}
                                                </p>
                                            )}
                                            <p className="text-[9px] font-black uppercase text-slate-400 mt-0.5">{tx.date ? format(new Date(tx.date), 'dd/MM/yyyy HH:mm', { locale: es }) : ''}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={cn("font-black text-sm", tx.type === 'venta' ? 'text-red-600' : 'text-emerald-600')}>
                                                {tx.type === 'venta' ? '+' : '-'}${tx.amount.toLocaleString('es-AR')}
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if ('vibrate' in navigator) navigator.vibrate(6); requestSecurityPin({ type: 'delete_tx', data: tx }); }} 
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 active:bg-red-100 text-slate-400 active:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {transactions.length === 0 && (
                                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-10">Aún no hay movimientos.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* DRAWER CARGAR VENTA */}
            <Drawer open={isVentaModalOpen} onOpenChange={setIsVentaModalOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[92vh] flex flex-col overflow-hidden">
                    <DrawerHeader className="px-6 pt-6 pb-2 shrink-0">
                        <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                        <DrawerTitle className="text-xl font-black uppercase tracking-tight text-center text-red-600">Cargar Fiado</DrawerTitle>
                        <DrawerDescription className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrar nueva compra a cuenta</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-6 pb-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                        <div className="space-y-6">
                            {/* Scanner */}
                            {isScannerOpen ? (
                                <div className="relative w-full h-[200px] rounded-3xl border-4 border-red-500 flex items-center justify-center overflow-hidden">
                                    <button 
                                        onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setIsScannerOpen(false); }}
                                        className="absolute top-3 right-3 rounded-full w-10 h-10 bg-red-600 text-white p-0 flex items-center justify-center border-2 border-white shadow-xl z-50 font-bold active:scale-95 transition-all"
                                    >
                                        X
                                    </button>
                                    <BarcodeScanner 
                                        continuous={true}
                                        onClose={() => setIsScannerOpen(false)} 
                                        onScanSuccess={(code: string) => handleScanFiadoItem(code)} 
                                    />
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setIsScannerOpen(true); }} 
                                    className="w-full h-14 rounded-2xl bg-white border-2 border-red-600 text-red-600 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                    <Scan className="w-5 h-5" /> Escanear Código
                                </button>
                            )}

                            {!isScannerOpen && (
                                <>
                                    <div className="flex gap-2">
                                        <Input type="text" placeholder="Producto" value={currentItemDetail} onChange={e => setCurrentItemDetail(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold flex-1 px-4 text-slate-900" />
                                        <Input type="number" placeholder="$ Precio" value={currentItemAmount} onChange={e => setCurrentItemAmount(e.target.value)} className="h-14 w-28 rounded-2xl bg-slate-50 border-none font-bold px-4 text-slate-900" />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if ('vibrate' in navigator) navigator.vibrate(6);
                                            if(currentItemDetail && currentItemAmount) {
                                                setVentaItems([...ventaItems, { detail: currentItemDetail, amount: parseFloat(currentItemAmount), qty: 1 }]);
                                                setCurrentItemDetail(''); setCurrentItemAmount('');
                                            }
                                        }} 
                                        className="w-full h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                                    >
                                        Agregar al detalle
                                    </button>
                                </>
                            )}

                            {!isScannerOpen && ventaItems.length > 0 && (
                                <div className="bg-slate-50 rounded-3xl p-5 space-y-3 border border-slate-100 max-h-[180px] overflow-y-auto no-scrollbar">
                                    {ventaItems.map((item, i) => (
                                        <div key={i} className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">{item.detail} x{item.qty}</span>
                                            <span className="text-slate-900">${(item.amount * item.qty).toLocaleString('es-AR')}</span>
                                        </div>
                                    ))}
                                    <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between font-black text-red-600 text-base">
                                        <span>Total:</span>
                                        <span>${ventaItems.reduce((acc, item) => acc + (item.amount * item.qty), 0).toLocaleString('es-AR')}</span>
                                    </div>
                                </div>
                            )}

                            {!isScannerOpen && (
                                <button 
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate([10, 40, 10]); handleConfirmVenta(); }} 
                                    className="w-full h-16 max-sm:h-12 bg-red-600 active:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-red-200 transition-all active:scale-[0.98]"
                                >
                                    Confirmar Deuda
                                </button>
                            )}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* DRAWER COBRAR PAGO */}
            <Drawer open={isPagoModalOpen} onOpenChange={setIsPagoModalOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans">
                    <DrawerHeader className="px-6 pt-6 pb-2 shrink-0">
                        <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                        <DrawerTitle className="text-xl font-black uppercase tracking-tight text-center text-emerald-600">Recibir Pago</DrawerTitle>
                        <DrawerDescription className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrar entrega de dinero</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-6 pb-8 space-y-6">
                        <div className="bg-emerald-50 rounded-3xl p-6 text-center border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-2">Deuda Actual</p>
                            <p className="text-4xl font-black text-emerald-700 tabular-nums">${(selectedLine?.currentDebt || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Monto entregado</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">$</span>
                                <Input 
                                    type="number" 
                                    value={pagoAmount} 
                                    onChange={e => setPagoAmount(e.target.value)} 
                                    className="h-20 max-sm:h-14 pl-12 rounded-[2rem] bg-slate-50 border-none text-3xl font-black tabular-nums text-slate-900" 
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => { if ('vibrate' in navigator) navigator.vibrate([10, 40, 10]); handleConfirmPago(); }} 
                            className="w-full h-16 max-sm:h-12 bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                        >
                            Registrar Pago
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* DRAWER CONTACTO MANUAL */}
            <Drawer open={isManualContactOpen} onOpenChange={(o) => { setIsManualContactOpen(o); if (!o) { setManualName(''); setManualPhone(''); setManualDNI(''); setManualEmail(''); setManualAuthPersons([]); setNewAuthPerson(''); } }}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[90vh]">
                    <DrawerHeader className="px-6 pt-6 pb-2 shrink-0">
                        <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                        <DrawerTitle className="text-xl font-black uppercase tracking-tight text-center text-slate-900">Ficha Técnica de Cliente</DrawerTitle>
                        <DrawerDescription className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crear nueva cuenta corriente</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-6 pb-8 space-y-4 overflow-y-auto max-h-[70vh]">
                        <Input
                            placeholder="Nombre y Apellido (Titular) *"
                            value={manualName}
                            onChange={e => setManualName(e.target.value)}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5 text-slate-900"
                        />
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Teléfono / WhatsApp (Ej: 3875...)"
                                value={manualPhone}
                                onChange={e => setManualPhone(e.target.value)}
                                type="tel"
                                className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-900"
                            />
                        </div>
                        <Input
                            placeholder="DNI (Opcional)"
                            value={manualDNI}
                            onChange={e => setManualDNI(e.target.value)}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5 text-slate-900"
                        />
                        <Input
                            placeholder="Email (Opcional)"
                            value={manualEmail}
                            onChange={e => setManualEmail(e.target.value)}
                            type="email"
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5 text-slate-900"
                        />

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Límite de Crédito ($)</label>
                            <Input
                                placeholder="Límite en pesos (Ej: 10000)"
                                value={manualCreditLimit}
                                onChange={e => setManualCreditLimit(e.target.value)}
                                type="number"
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-5 text-slate-900 font-mono"
                            />
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Personas Autorizadas (Opcional)</label>
                            <p className="text-[10px] text-slate-400 leading-tight">Agrega nombres de familiares o empleados que pueden retirar mercadería fiada a nombre de este titular.</p>
                            
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej: María (Esposa)"
                                    value={newAuthPerson}
                                    onChange={e => setNewAuthPerson(e.target.value)}
                                    className="h-10 rounded-xl bg-white border-none font-bold text-slate-900 flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newAuthPerson.trim()) {
                                            e.preventDefault();
                                            setManualAuthPersons(prev => [...prev, newAuthPerson.trim()]);
                                            setNewAuthPerson('');
                                        }
                                    }}
                                />
                                <Button 
                                    onClick={() => {
                                        if (newAuthPerson.trim()) {
                                            setManualAuthPersons(prev => [...prev, newAuthPerson.trim()]);
                                            setNewAuthPerson('');
                                        }
                                    }}
                                    variant="secondary" 
                                    className="h-10 rounded-xl px-4 font-bold"
                                >
                                    Añadir
                                </Button>
                            </div>
                            
                            {manualAuthPersons.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {manualAuthPersons.map((person, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            {person}
                                            <button 
                                                onClick={() => setManualAuthPersons(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={async () => {
                                if (!manualName) return;
                                const phone = normalizePhone(manualPhone);
                                const limitNum = Number(manualCreditLimit) > 0 ? Number(manualCreditLimit) : 10000;
                                setIsManualContactOpen(false);
                                await createOrOpenCreditLine(manualName, phone, manualDNI, manualEmail, manualAuthPersons, limitNum);
                            }}
                            disabled={!manualName}
                            className="w-full h-14 bg-red-600 active:bg-red-700 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                        >
                            Guardar Ficha de Cliente
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>

            <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
                <DialogContent className="max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border-0 overflow-hidden flex flex-col text-center">
                    <DialogTitle className="font-black text-slate-800 uppercase italic tracking-widest text-lg mb-2">
                        Autorización Requerida
                    </DialogTitle>
                    <div className="w-16 h-16 max-sm:h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 mb-6">Hemos enviado un PIN de 4 dígitos a tu correo para autorizar esta acción destructiva.</p>
                    
                    <div className="space-y-4">
                        <Input 
                            type="text" 
                            maxLength={4}
                            value={securityPinInput} 
                            onChange={e => setSecurityPinInput(e.target.value)} 
                            placeholder="----" 
                            className="h-16 max-sm:h-12 text-center text-4xl tracking-[1em] font-black rounded-2xl bg-slate-50 border-slate-200"
                        />
                        <Button 
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(6);
                                verifyPinAndExecute();
                            }}
                            className="w-full h-14 bg-slate-900 active:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                            Verificar y Ejecutar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* BOTÓN WHATSAPP FLOTANTE */}
            {selectedLine?.customerPhone && (
                <button
                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); sendWhatsAppReceipt(selectedLine.customerPhone, selectedLine.customerName, selectedLine.currentDebt || 0, selectedLine.creditLimit || 10000); }}
                    className="fixed bottom-28 right-5 z-50 w-14 h-14 bg-emerald-500 active:bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-all active:scale-95"
                    title="Enviar estado de cuenta por WhatsApp"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </div>
        </RoleGuard>
    );
}
