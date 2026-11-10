'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, Minus, Search, Check, X, AlertTriangle, QrCode,
  Trash2, Filter, Calendar, BarChart3, TrendingUp, 
  Zap, Package, ShoppingBag, DollarSign, Calculator, Lock,
  Phone, User, MessageCircle, MoreHorizontal, History, 
  CheckCircle, Clock, Store, FileText, Loader2, Rocket, LayoutDashboard, Trophy, Scan,
  UserPlus, DollarSign as MoneyIcon, LogOut, ShieldCheck, Wallet, Smartphone, Landmark, ShieldAlert,
  Camera, CameraOff, Sparkles, RotateCcw, ArrowLeft, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useCollection, useCollectionOnce, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getDocs, getDoc, addDoc, limit, serverTimestamp, orderBy, updateDoc, doc, increment, writeBatch, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { generateTicketPDF } from '@/lib/pdf-ticket';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { signOut } from 'firebase/auth';
import { RedEconomiXHeader } from '@/components/redeconomix-header';
import dynamic from 'next/dynamic';
import { saveProductsToOfflineCache, searchProductOffline, queueSaleForSync, removeSaleFromSyncQueue, initOfflineDB, matchesBarcodeSmart, deductStockFromOfflineCache, cleanBarcode, computeProductBranchStock } from '@/lib/offline-db';
import { syncPendingSalesToCloud } from '@/lib/offline-sync-manager';
import { useRole } from '@/hooks/use-role';
import { RoleGuard } from '@/components/role-guard';


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BarcodeScanner } from '@/components/barcode-scanner';
import { findMasterProductByCode } from '@/app/actions/product-actions';

type ScannedItem = {
    code?: string;
    barcode?: string;
    purchasePrice?: number;
    id: string;
    name: string;
    price: number;
    qty: number;
    stock?: number;
    promoType?: 'none' | '3x2' | '2x1' | '10off' | '20off';
    expirationDate?: string;
    isBundle?: boolean;
    bundleItems?: { id: string, name: string, qty: number }[];
    productId?: string;
    imageUrl?: string;
};

function SalesTerminalContent() {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const mode = searchParams.get('mode') || 'sales';
    const isSales = mode === 'sales';
    const [isClient, setIsClient] = useState(false);
    
    const { role, employee, effectiveRetailerId } = useRole();
    const targetRetailerId = effectiveRetailerId || user?.uid;
    const [selectedAdminBranch, setSelectedAdminBranch] = useState<string>('central');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('redeconomix_active_branch');
            if (saved) {
                setSelectedAdminBranch(saved);
            }
        }
    }, []);

    const branchesQuery = useMemoFirebase(() => {
        if (!firestore || !targetRetailerId) return null;
        return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', targetRetailerId));
    }, [firestore, targetRetailerId]);
    const { data: branches } = useCollection(branchesQuery);

    const centralBranch = useMemo(() => branches?.find((b: any) => b.isCentral), [branches]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('redeconomix_active_branch');
            if (saved) {
                setSelectedAdminBranch(saved);
            } else if (centralBranch?.id) {
                setSelectedAdminBranch(centralBranch.id);
            }
        }
    }, [centralBranch?.id]);

    // Shift Logic in Terminal (Realtime scoped to cashier)
    const activeShiftQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        const targetEmployeeId = role === 'admin' ? 'admin' : (employee?.id || null);
        if (!targetEmployeeId && role !== 'admin') return null;

        return query(
            collection(firestore, 'retailer_shifts'),
            where('retailerId', '==', targetRetailerId),
            where('status', '==', 'open'),
            where('employeeId', '==', targetEmployeeId),
            limit(1)
        );
    }, [firestore, user, role, employee?.id, targetRetailerId]);
    const { data: activeShiftData, isLoading: isLoadingShift } = useCollection(activeShiftQuery);
    const currentShift = activeShiftData && activeShiftData.length > 0 ? activeShiftData[0] : null;

    useEffect(() => {
        if (role === 'admin' && currentShift?.branchId) {
            setSelectedAdminBranch(currentShift.branchId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('redeconomix_active_branch', currentShift.branchId);
            }
        }
    }, [role, currentShift?.branchId]);

    // Resolve active branch:
    // If a shift is open, active branch is strictly LOCKED to that open shift!
    // If no shift is open, it uses selectedAdminBranch (stored in localStorage) or employee.branchId
    const rawActiveBranchId = currentShift?.branchId 
        || (role === 'admin' ? selectedAdminBranch : employee?.branchId) 
        || 'central';

    // Normalizar 'central' al ID real de Firestore si existe en la base de datos
    const activeBranchId = useMemo(() => {
        if ((rawActiveBranchId === 'central' || !rawActiveBranchId) && centralBranch?.id) {
            return centralBranch.id;
        }
        return rawActiveBranchId;
    }, [rawActiveBranchId, centralBranch?.id]);

    const getBranchName = (bId?: string) => {
        if (!bId || bId === 'central' || (centralBranch && bId === centralBranch.id)) {
            return centralBranch?.name || 'Casa Central';
        }
        const found = branches?.find((b: any) => b.id === bId);
        return found ? found.name : 'Sucursal';
    };

    const getBranchStock = useCallback((p: any, bIdOverride?: string) => {
        if (!p) return 0;
        const bId = bIdOverride || activeBranchId;
        return Math.max(0, computeProductBranchStock(p, bId, branches));
    }, [activeBranchId, branches]);

    const handleAdminBranchChange = (newBranchId: string) => {
        if (currentShift && currentShift.branchId && currentShift.branchId !== newBranchId) {
            toast({
                title: "Caja Abierta 🔒",
                description: `Tenés una caja abierta en "${getBranchName(currentShift.branchId)}". Para operar en otra sucursal, primero cerrá la caja actual desde el panel de inicio.`,
                variant: "destructive"
            });
            return;
        }
        setSelectedAdminBranch(newBranchId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('redeconomix_active_branch', newBranchId);
        }
        toast({
            title: "Sucursal Fija Guardada",
            description: `Se fijó la sucursal activa: "${getBranchName(newBranchId)}".`,
        });
    };

    // REFUND STATE & RECENT SALES
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [selectedSaleToRefund, setSelectedSaleToRefund] = useState<any | null>(null);
    const [refundPin, setRefundPin] = useState('');
    const [refundReason, setRefundReason] = useState('Cliente devolvió el producto');
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);
    const [refundSearch, setRefundSearch] = useState('');
    const [refundItemQuantities, setRefundItemQuantities] = useState<{ [key: number]: number }>({});

    const recentSalesQuery = useMemoFirebase(() => {
        if (!firestore || !targetRetailerId) return null;
        return query(
            collection(firestore, 'retailer_daily_operations'),
            where('retailerId', '==', targetRetailerId),
            orderBy('date', 'desc'),
            limit(30)
        );
    }, [firestore, targetRetailerId]);
    const { data: recentSalesRaw, isLoading: isLoadingRecentSales } = useCollection(recentSalesQuery);

    const recentSales = useMemo(() => {
        if (!recentSalesRaw) return [];
        return recentSalesRaw.filter((op: any) => 
            (op.type === 'sale' || op.type === 'credit_sale') &&
            (!activeBranchId || op.branchId === activeBranchId)
        );
    }, [recentSalesRaw, activeBranchId]);

    const handleSelectSaleForRefund = (sale: any) => {
        setSelectedSaleToRefund(sale);
        setRefundPin('');
        setRefundReason('Cliente devolvió el producto');
        const initialQtys: { [key: number]: number } = {};
        if (Array.isArray(sale.items)) {
            if (sale.items.length === 1) {
                initialQtys[0] = Number(sale.items[0].qty || 1);
            } else {
                sale.items.forEach((_: any, idx: number) => {
                    initialQtys[idx] = 0;
                });
            }
        }
        setRefundItemQuantities(initialQtys);
    };

    const refundItemsCalculation = useMemo(() => {
        if (!selectedSaleToRefund) {
            return { itemsToRefund: [], totalAmount: 0, totalUnits: 0, isFullRefund: false };
        }
        const saleItems = Array.isArray(selectedSaleToRefund.items) ? selectedSaleToRefund.items : [];
        if (saleItems.length === 0) {
            const fullAmount = Number(selectedSaleToRefund.total || selectedSaleToRefund.amount || 0);
            return { itemsToRefund: [], totalAmount: fullAmount, totalUnits: 1, isFullRefund: true };
        }

        const itemsToRefund: Array<{ item: any; index: number; returnQty: number; subtotal: number }> = [];
        let totalAmount = 0;
        let totalUnits = 0;
        let totalOriginalUnits = 0;

        saleItems.forEach((item: any, idx: number) => {
            const origQty = Number(item.qty || 1);
            totalOriginalUnits += origQty;
            const returnQty = Number(refundItemQuantities[idx] || 0);
            if (returnQty > 0) {
                const price = Number(item.price || item.salePrice || 0);
                const subtotal = price * returnQty;
                itemsToRefund.push({ item, index: idx, returnQty, subtotal });
                totalAmount += subtotal;
                totalUnits += returnQty;
            }
        });

        const isFullRefund = totalUnits > 0 && totalUnits === totalOriginalUnits;
        return { itemsToRefund, totalAmount, totalUnits, isFullRefund };
    }, [selectedSaleToRefund, refundItemQuantities]);

    const handleConfirmRefund = async () => {
        if (!firestore || !user || !selectedSaleToRefund) return;
        const retailerId = targetRetailerId || user.uid;

        // Validar PIN dinámicamente con el PIN Maestro del Dueño
        try {
            const ownerSnap = await getDoc(doc(firestore, 'users', retailerId));
            const ownerPin = ownerSnap.data()?.securityPin || '0000';
            if (refundPin.trim() !== String(ownerPin).trim()) {
                toast({
                    title: "Código Incorrecto 🔒",
                    description: "El código no coincide con el PIN Maestro del Dueño. Solicitá autorización al dueño.",
                    variant: "destructive"
                });
                return;
            }
        } catch (err) {
            toast({
                title: "Error de verificación 🔒",
                description: "No se pudo validar el código de autorización.",
                variant: "destructive"
            });
            return;
        }

        if (refundItemsCalculation.totalAmount <= 0) {
            toast({
                title: "Seleccioná al menos un producto ⚠️",
                description: "Marcá los productos y cantidades que el cliente va a devolver.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessingRefund(true);
        try {
            const batch = writeBatch(firestore);
            const saleRef = doc(firestore, 'retailer_daily_operations', selectedSaleToRefund.id);
            const refundTime = new Date().toISOString();
            const cashierWhoRefunds = employee?.name || user?.email || 'Dueño';
            const branchToRestore = selectedSaleToRefund.branchId || activeBranchId;
            const restoredItems: string[] = [];

            // 1. Restaurar Stock únicamente de los artículos seleccionados
            for (const r of refundItemsCalculation.itemsToRefund) {
                const item = r.item;
                const qtyToAdd = r.returnQty;

                if (item.isBundle && item.bundleItems) {
                    for (const component of item.bundleItems) {
                        const compRef = doc(firestore, 'retailer_inventory', component.id);
                        const compQtyToAdd = Number(component.qty || 1) * qtyToAdd;
                        const updateData: any = {
                            stock: increment(compQtyToAdd),
                            updatedAt: serverTimestamp()
                        };
                        if (branchToRestore) {
                            updateData[`stockByBranch.${branchToRestore}`] = increment(compQtyToAdd);
                        }
                        batch.update(compRef, updateData);
                    }
                } else if (item.productId && !item.productId.startsWith('manual-')) {
                    const prodRef = doc(firestore, 'retailer_inventory', item.productId);
                    const updateData: any = {
                        stock: increment(qtyToAdd),
                        updatedAt: serverTimestamp()
                    };
                    if (branchToRestore) {
                        updateData[`stockByBranch.${branchToRestore}`] = increment(qtyToAdd);
                    }
                    batch.update(prodRef, updateData);
                }
                restoredItems.push(`${qtyToAdd}x ${item.name}`);
            }

            if (selectedSaleToRefund.items?.length === 0) {
                restoredItems.push('Venta General');
            }

            const refundTotal = refundItemsCalculation.totalAmount;
            const refundMethod = selectedSaleToRefund.paymentMethod || 'cash';
            const newStatus = refundItemsCalculation.isFullRefund ? 'refunded' : 'partially_refunded';

            // 2. Marcar venta original
            batch.update(saleRef, {
                status: newStatus,
                lastRefundedAt: refundTime,
                refundReason: refundReason.trim() || 'Cliente devolvió el producto',
                refundHistory: arrayUnion({
                    refundedAt: refundTime,
                    refundedBy: cashierWhoRefunds,
                    items: restoredItems,
                    amount: refundTotal,
                    reason: refundReason.trim() || 'Cliente devolvió el producto'
                }),
                updatedAt: serverTimestamp()
            });

            // 3. Registrar egreso de dinero en caja para que cuadre el arqueo
            if (refundMethod !== 'credit') {
                const expenseRef = doc(collection(firestore, 'retailer_daily_operations'));
                batch.set(expenseRef, {
                    retailerId: targetRetailerId,
                    type: 'expense',
                    category: 'DEVOLUCION_VENTA',
                    concept: `Devolución: ${restoredItems.join(', ')}`,
                    total: refundTotal,
                    amount: refundTotal,
                    paymentMethod: refundMethod,
                    branchId: branchToRestore,
                    employeeId: employee?.id || 'admin',
                    employeeName: cashierWhoRefunds,
                    relatedSaleId: selectedSaleToRefund.id,
                    date: refundTime,
                    status: 'completed',
                    createdAt: serverTimestamp()
                });
            }

            // 4. Log de auditoría de inventario
            const logRef = doc(collection(firestore, 'retailer_inventory_logs'));
            batch.set(logRef, {
                retailerId: targetRetailerId,
                action: 'DEVOLUCION',
                details: `Devolución ${newStatus === 'refunded' ? 'Total' : 'Parcial'} #${selectedSaleToRefund.id.slice(-6)}: ${restoredItems.join(', ')}. Restituido a stock. Egreso caja: $${refundTotal}. Motivo: ${refundReason}`,
                userEmail: user.email,
                cashierName: cashierWhoRefunds,
                branchId: branchToRestore,
                timestamp: serverTimestamp()
            });

            await batch.commit();

            toast({
                title: "Devolución Realizada con Éxito ✅",
                description: `Se restituyó el stock (${restoredItems.join(', ')}) y se registraron $${refundTotal.toLocaleString('es-AR')} de egreso en caja.`,
            });

            setSelectedSaleToRefund(null);
            setRefundPin('');
            setIsRefundModalOpen(false);
        } catch (err: any) {
            console.error("Error al procesar devolución:", err);
            toast({
                title: "Error al Procesar Devolución 🚫",
                description: err.message || "Ocurrió un error inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsProcessingRefund(false);
        }
    };

    
    // SCANNER & CART STATE
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'transfer' | 'credit' | 'qr' | null>(null);
    
    // MANUAL ADD STATE
    const [isManualAddOpen, setIsManualAddOpen] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualPrice, setManualPrice] = useState('');
    
    // VARIANT CONFLICT STATE
    const [isVariantConflictModalOpen, setIsVariantConflictModalOpen] = useState(false);
    const [variantConflictItems, setVariantConflictItems] = useState<any[]>([]);
    
    // FORM STATE
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);
    const [calcResult, setCalcResult] = useState<string>('');
    const [customerName, setCustomerName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [expenseConcept, setExpenseConcept] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isProcessingRef = useRef(false);
    const [localProducts, setLocalProducts] = useState<any[]>([]);

    // Cargar catálogo de IndexedDB al iniciar para carga instantánea offline
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
                console.warn("No se pudo pre-cargar catálogo local IndexedDB", e);
            }
        };
        loadOfflineCatalog();
    }, []);

    // FIADO / CLIENT SEARCH STATE
    const [foundUser, setFoundUser] = useState<any>(null);
    const [foundCreditLine, setFoundCreditLine] = useState<any>(null);
    const [isSearchingClient, setIsSearchingClient] = useState(false);
    const [localClients, setLocalClients] = useState<any[]>([]);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    useEffect(() => {
        if (!firestore || !user) return;
        const fetchLocalClients = async () => {
            const q = query(collection(firestore, 'retailer_credit_lines'), where('retailerId', '==', targetRetailerId));
            const snap = await getDocs(q);
            const clients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLocalClients(clients);
        };
        fetchLocalClients();
    }, [firestore, user]);


    const [newCreditLimit, setNewCreditLimit] = useState<string>('');
    const [payWith, setPayWith] = useState<string>('');

    // TAKEN BY MODAL STATE
    const [isTakenByModalOpen, setIsTakenByModalOpen] = useState(false);
    const [pendingOperation, setPendingOperation] = useState<any>(null);

    // SUCCESS MODAL STATE
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastSaleDetails, setLastSaleDetails] = useState<{
        id?: string;
        amount: number;
        paymentMethod: string;
        targetPhone: string;
        customerName: string;
        items: ScannedItem[];
        payWith?: string;
    } | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isScannerOpen) {
            timer = setTimeout(() => {
                setIsScannerOpen(false);
                toast({ title: "Escáner en pausa", description: "La cámara se cerró por 20 seg de inactividad para que no se ponga lento." });
            }, 20000);
        }
        return () => clearTimeout(timer);
    }, [isScannerOpen, toast, scannedItems]);


    // FETCH USER PROFILE FOR BANKING INFO
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return doc(firestore, 'users', targetRetailerId);
    }, [firestore, user, targetRetailerId]);
    const { data: userProfile } = useDoc(userDocRef);

    const logInventoryAction = async (productId: string, productName: string, action: string, details: string) => {
        if (!firestore || !user) return;
        await addDoc(collection(firestore, 'retailer_inventory_logs'), {
            retailerId: targetRetailerId,
            productId,
            productName,
            action,
            details,
            userEmail: user.email,
            cashierName: currentShift?.cashierName || user.email,
            timestamp: serverTimestamp()
        });
    };

    function isNearExpiry(dateStr?: string) {
        if(!dateStr) return false;
        const expiry = new Date(dateStr);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }

    // BROADCAST CHANNEL FOR CUSTOMER DISPLAY
    const [tpvChannel, setTpvChannel] = useState<BroadcastChannel | null>(null);

    useEffect(() => { 
        setIsClient(true); 
        setIsOnline(navigator.onLine);
        
        // Setup BroadcastChannel
        const channel = new BroadcastChannel('tpv-sync-channel');
        setTpvChannel(channel);

        const handleOnline = () => {
            setIsOnline(true);
            toast({ title: "Conexión Restaurada 🟢", description: "Sincronizando operaciones fantasma..." });
            syncPendingSalesToCloud(firestore);
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast({ title: "Modo Offline Activado 🔴", description: "Las ventas se guardarán en caja fuerte.", variant: "destructive" });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Disparo de seguridad inicial por si quedaron ventas colgadas de ayer
        if (navigator.onLine) {
            syncPendingSalesToCloud(firestore);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            channel.close();
        }
    }, [firestore]);

    const totalCart = useMemo(() => {
        return scannedItems.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    }, [scannedItems]);

    // Send updates to customer display whenever cart changes
    useEffect(() => {
        if (tpvChannel) {
            tpvChannel.postMessage({
                type: 'CART_UPDATE',
                payload: {
                    items: scannedItems,
                    total: totalCart
                }
            });
        }
        
        // Sincronización en la nube para Tablets/IPads en otros dispositivos
        if (firestore && user?.uid) {
            import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
                setDoc(doc(firestore, 'retailer_daily_operations', `display_${user.uid}`), {
                    recordType: 'CUSTOMER_DISPLAY',
                    status: 'IDLE',
                    items: scannedItems,
                    total: totalCart,
                    updatedAt: serverTimestamp()
                }, { merge: true }).catch(console.error);
            });
        }
    }, [scannedItems, totalCart, tpvChannel, firestore, user?.uid]);

    function calculateItemTotal(item: ScannedItem) {
        const { price, qty, promoType } = item;
        if (!promoType || promoType === 'none') return price * qty;
        
        switch (promoType) {
            case '2x1': 
                return (Math.floor(qty / 2) + (qty % 2)) * price;
            case '3x2':
                return (Math.floor(qty / 3) * 2 + (qty % 3)) * price;
            case '10off':
                return price * qty * 0.9;
            case '20off':
                return price * qty * 0.8;
            default:
                return price * qty;
        }
    }

    // FETCH OPS
    const opsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        if (!isSales) {
            return query(
                collection(firestore, 'retailer_daily_operations'), 
                where('retailerId', '==', targetRetailerId),
                where('type', '==', 'expense'),
                limit(15)
            );
        }
        return query(
            collection(firestore, 'retailer_daily_operations'), 
            where('retailerId', '==', targetRetailerId),
            where('type', 'in', ['sale', 'credit_sale']),
            limit(15)
        );
    }, [firestore, user, isSales, targetRetailerId]);
    const { data: rawOps } = useCollectionOnce(opsQuery);
    
    // ORDENAMIENTO EN CLIENTE PARA EVITAR ERROR DE ÍNDICE FIREBASE
    const ops = useMemo(() => {
        if (!rawOps) return [];
        return [...rawOps].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [rawOps]);

    const handleCalcInput = (val: string) => {
        if (val === 'C') { setCalcResult(''); return; }
        if (val === '=') return; // We can add eval() logic later if needed
        setCalcResult(prev => {
            if (val === ',' && prev.includes('.')) return prev;
            const targetVal = val === ',' ? '.' : val;
            return prev + targetVal;
        });
    };

    // BUSCAR PRODUCTOS REALES PARA EL ESCÁNER (Y BUSCADOR)
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', targetRetailerId));
    }, [firestore, user, targetRetailerId]);
    const { data: allProducts } = useCollection(productsQuery);

    // Refs en vivo para evitar closures obsoletos dentro de cámaras/escáneres continuos
    const productsRef = useRef<any[]>([]);
    const activeBranchIdRef = useRef<string>(activeBranchId);
    const branchesRef = useRef<any[] | null | undefined>(branches);

    useEffect(() => {
        activeBranchIdRef.current = activeBranchId;
    }, [activeBranchId]);

    useEffect(() => {
        branchesRef.current = branches;
    }, [branches]);

    // Sincronizar catálogo al dispositivo (Modo Offline)
    useEffect(() => {
        if (allProducts && allProducts.length > 0) {
            productsRef.current = allProducts;
            setLocalProducts(allProducts);
            saveProductsToOfflineCache(allProducts);
        }
    }, [allProducts]);

    useEffect(() => {
        if (localProducts && localProducts.length > 0 && (!allProducts || allProducts.length === 0)) {
            productsRef.current = localProducts;
        }
    }, [localProducts, allProducts]);

    const getLiveBranchStock = (p: any, bIdOverride?: string) => {
        if (!p) return 0;
        const bId = bIdOverride || activeBranchIdRef.current || activeBranchId;
        return Math.max(0, computeProductBranchStock(p, bId, branchesRef.current || branches));
    };

    const executeAddItem = (found: any, originalBarcode: string) => {
        let itemToAdd = found;
        const currentBranch = activeBranchIdRef.current || activeBranchId;
        let currentStock = getLiveBranchStock(itemToAdd, currentBranch);
        const liveCatalog = (productsRef.current && productsRef.current.length > 0) ? productsRef.current : (localProducts || []);

        // Si el elemento no tiene stock en esta sucursal, buscar si existe un registro hermano/duplicado con el mismo código que SÍ tenga stock
        if (currentStock <= 0) {
            const targetBarcode = originalBarcode || found.barcode || found.code || '';
            const alt = liveCatalog.find((p: any) => 
                p.id !== itemToAdd.id && 
                matchesBarcodeSmart(p, targetBarcode) &&
                getLiveBranchStock(p, currentBranch) > 0
            );
            if (alt) {
                itemToAdd = alt;
                currentStock = getLiveBranchStock(itemToAdd, currentBranch);
            }
        }

        if (currentStock <= 0) {
            // Revisar si existe stock en otra sucursal para informar con claridad al cajero
            let otherBranchInfo = '';
            const activeBranchesList = branchesRef.current || branches || [];
            if (activeBranchesList.length > 0) {
                const otherBranchesWithStock: string[] = [];
                activeBranchesList.forEach((b: any) => {
                    if (b.id !== currentBranch) {
                        const qty = getLiveBranchStock(itemToAdd, b.id);
                        if (qty > 0) {
                            otherBranchesWithStock.push(`${qty} en ${b.name}`);
                        }
                    }
                });
                if (otherBranchesWithStock.length > 0) {
                    otherBranchInfo = ` (Hay disponible: ${otherBranchesWithStock.join(', ')})`;
                }
            } else if (itemToAdd.stockByBranch && typeof itemToAdd.stockByBranch === 'object') {
                const otherBranchesWithStock: string[] = [];
                Object.entries(itemToAdd.stockByBranch).forEach(([bId, qty]) => {
                    const numQty = Number(qty) || 0;
                    if (bId !== currentBranch && numQty > 0) {
                        const bName = getBranchName(bId);
                        otherBranchesWithStock.push(`${numQty} en ${bName}`);
                    }
                });
                if (otherBranchesWithStock.length > 0) {
                    otherBranchInfo = ` (Hay disponible: ${otherBranchesWithStock.join(', ')})`;
                }
            }

            toast({ 
                title: "Producto creado pero sin stock", 
                description: `"${itemToAdd.name}" está creado en el sistema, pero no tiene stock disponible en ${getBranchName(currentBranch)}.${otherBranchInfo}`, 
                variant: "destructive" 
            });
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
            return;
        }

        const existingItem = scannedItems.find(item => item.productId === itemToAdd.id || item.id.includes(itemToAdd.id));
        if (existingItem && (existingItem.qty + 1) > currentStock) {
            toast({ title: "Stock Insuficiente", description: `Solo tienes ${currentStock} unidades de ${itemToAdd.name}.`, variant: "destructive" });
            return;
        }

        setScannedItems(prev => {
            // LÓGICA "ONE-TOUCH" (Agrupamiento automático Súper Fácil)
            const existingIndex = prev.findIndex(item => item.id.includes(itemToAdd.id));
            if (existingIndex >= 0) {
                const cloned = [...prev];
                cloned[existingIndex].qty += 1; // Sube a 2, 3, etc. sin preguntar
                return cloned;
            } else {
                const newItem: ScannedItem = {
                    id: itemToAdd.id + Date.now(),
                    productId: itemToAdd.id, // ID original del inventario
                    name: itemToAdd.name,
                    price: Number(itemToAdd.salePrice || itemToAdd.price || 0),
                    purchasePrice: Number(itemToAdd.purchasePrice || itemToAdd.costPrice || 0),
                    qty: 1,
                    stock: currentStock,
                    promoType: itemToAdd.promoType || 'none',
                    expirationDate: itemToAdd.expirationDate,
                    isBundle: itemToAdd.isBundle || false,
                    bundleItems: itemToAdd.bundleItems || [],
                    imageUrl: itemToAdd.imageUrl,
                    code: itemToAdd.code || itemToAdd.barcode || originalBarcode || ""
                };
                return [newItem, ...prev]; // Agrega arriba
            }
        });
        toast({ title: "¡Añadido!", description: `${itemToAdd.name} en carrito.` });
    };

    const handleAddItem = async (barcode: string) => {
        const cleanCode = cleanBarcode(barcode);
        if (!cleanCode) return;
        const currentBranch = activeBranchIdRef.current || activeBranchId;
        const liveCatalog = (productsRef.current && productsRef.current.length > 0) ? productsRef.current : (localProducts || []);
        
        // 1. Búsqueda exacta y estricta en memoria RAM en vivo (productsRef)
        const exactMatches = liveCatalog.filter((p: any) => matchesBarcodeSmart(p, cleanCode));

        const getTime = (obj: any) => {
            if (!obj) return 0;
            if (typeof obj.toMillis === 'function') return obj.toMillis();
            if (obj.seconds) return obj.seconds * 1000;
            if (typeof obj === 'string' || typeof obj === 'number') return new Date(obj).getTime();
            return 0;
        };

        // Si existen duplicados del mismo producto cargados en el inventario:
        // Priorizar el que tiene stock en la sucursal activa, luego el más reciente
        exactMatches.sort((a, b) => {
            const stockA = getLiveBranchStock(a, currentBranch);
            const stockB = getLiveBranchStock(b, currentBranch);
            if (stockA > 0 && stockB <= 0) return -1;
            if (stockB > 0 && stockA <= 0) return 1;

            const timeA = Math.max(getTime(a.updatedAt), getTime(a.createdAt));
            const timeB = Math.max(getTime(b.updatedAt), getTime(b.createdAt));
            if (timeA === 0 && timeB === 0) {
                 const priceA = Number(a.salePrice || a.price || 0);
                 const priceB = Number(b.salePrice || b.price || 0);
                 return priceB - priceA;
            }
            return timeB - timeA;
        });

        // DE-DUPLICAR por ID/código único
        const uniqueMatches: any[] = [];
        const seenIds = new Set<string>();
        exactMatches.forEach(p => {
            if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                uniqueMatches.push(p);
            }
        });

        let found = uniqueMatches.length > 0 ? uniqueMatches[0] : null;
        
        // 2. Si no hay en RAM, buscar en el Motor Offline (IndexedDB)
        if (!found) {
            found = await searchProductOffline(cleanCode);
        }

        // 3. Red de rescate LIVE de Firestore:
        // Se ejecuta TANTO cuando el producto no está en RAM, COMO cuando en RAM figura con stock <= 0
        // (por si María o el dueño acaban de cargar stock en otro dispositivo hace un instante).
        const needsLiveVerification = !found || getLiveBranchStock(found, currentBranch) <= 0;
        if (needsLiveVerification && firestore && targetRetailerId && (typeof navigator === 'undefined' || navigator.onLine)) {
            try {
                // Consultamos por código directo para que sea instantáneo (<100ms)
                const [snapCode, snapBarcode] = await Promise.all([
                    getDocs(query(
                        collection(firestore, 'retailer_inventory'),
                        where('retailerId', '==', targetRetailerId),
                        where('code', '==', cleanCode)
                    )),
                    getDocs(query(
                        collection(firestore, 'retailer_inventory'),
                        where('retailerId', '==', targetRetailerId),
                        where('barcode', '==', cleanCode)
                    ))
                ]);

                const onlineMap = new Map<string, any>();
                snapCode.forEach(d => onlineMap.set(d.id, { id: d.id, ...d.data() }));
                snapBarcode.forEach(d => onlineMap.set(d.id, { id: d.id, ...d.data() }));

                // Si no hubo match exacto por string (ej. ceros a la izquierda), consultar inventario del retailer
                if (onlineMap.size === 0 && !found) {
                    const fullSnap = await getDocs(query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', targetRetailerId)));
                    fullSnap.forEach(d => {
                        const data = { id: d.id, ...d.data() };
                        if (matchesBarcodeSmart(data, cleanCode)) {
                            onlineMap.set(d.id, data);
                        }
                    });
                }

                const onlineMatches = Array.from(onlineMap.values());
                if (onlineMatches.length > 0) {
                    onlineMatches.sort((a, b) => getLiveBranchStock(b, currentBranch) - getLiveBranchStock(a, currentBranch));
                    const bestOnline = onlineMatches[0];
                    found = bestOnline;
                    // Actualizar inmediatamente memoria en vivo y estado local
                    const updatedCatalog = [bestOnline, ...liveCatalog.filter((p: any) => p.id !== bestOnline.id)];
                    productsRef.current = updatedCatalog;
                    setLocalProducts(updatedCatalog);
                }
            } catch (err) {
                console.warn("Error en verificación live Firestore:", err);
            }
        }

        if (found) {
            executeAddItem(found, barcode);
        } else {
            // El producto NO existe en el inventario del negocio
            try {
                const masterRes = await findMasterProductByCode(cleanCode);
                if (masterRes.success && masterRes.product) {
                    const prodName = (masterRes.product as any).name || 'Producto del Catálogo';
                    toast({
                        title: "Producto no creado",
                        description: `"${prodName}" no está creado en tu inventario. Para venderlo, primero cargalo en el módulo Stock con su precio y cantidad.`,
                        variant: "destructive"
                    });
                } else {
                    toast({ 
                        title: "Producto no creado", 
                        description: `El código ${cleanCode} no existe en el sistema ni en el catálogo maestro. Debes crearlo primero en el módulo Stock.`, 
                        variant: "destructive" 
                    });
                }
            } catch {
                toast({ 
                    title: "Producto no creado", 
                    description: `El código ${cleanCode} no existe en tu inventario. Debes crearlo primero en el módulo Stock.`, 
                    variant: "destructive" 
                });
            }
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); // Vibración de error
        }
    };

    // PHYSICAL BARCODE SCANNER SUPPORT (NICTOM, SYMBOL, Honeywell, etc.)
    const handleAddItemRef = React.useRef(handleAddItem);
    useEffect(() => {
        handleAddItemRef.current = handleAddItem;
    }, [handleAddItem]);

    useEffect(() => {
        let barcodeBuffer = '';
        let lastKeyTime = 0;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const now = Date.now();
            // Aumentamos a 300ms para tolerar pistolas inalámbricas/bluetooth con lag sin partir el código
            if (now - lastKeyTime > 300) {
                barcodeBuffer = '';
            }
            lastKeyTime = now;

            if (e.key === 'Enter') {
                const cleaned = cleanBarcode(barcodeBuffer);
                if (cleaned.length >= 3) {
                    e.preventDefault();
                    handleAddItemRef.current(cleaned);
                }
                barcodeBuffer = '';
                return;
            }

            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                barcodeBuffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleUpdateQty = (itemId: string, delta: number) => {
        const itemToUpdate = scannedItems.find(item => item.id === itemId);
        if (itemToUpdate) {
            const newQty = Math.max(0, itemToUpdate.qty + delta);
            const fixedQty = parseFloat(newQty.toFixed(3));
            if (itemToUpdate.stock !== undefined && fixedQty > itemToUpdate.stock) {
                toast({ title: "Stock Insuficiente", description: `Solo tienes ${itemToUpdate.stock} unidades.`, variant: "destructive" });
                return;
            }
        }

        setScannedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(0, item.qty + delta);
                // Usamos parseFloat(toFixed(3)) para evitar errores de coma flotante tipicos de JS (0.1+0.2)
                const fixedQty = parseFloat(newQty.toFixed(3));
                return fixedQty > 0 ? { ...item, qty: fixedQty } : null;
            }
            return item;
        }).filter(Boolean) as ScannedItem[]);
    };

    const handleSetQty = (itemId: string, val: string) => {
        const numericVal = parseFloat(val);
        const itemToUpdate = scannedItems.find(item => item.id === itemId);
        if (itemToUpdate && itemToUpdate.stock !== undefined && numericVal > itemToUpdate.stock) {
            toast({ title: "Stock Insuficiente", description: `Solo tienes ${itemToUpdate.stock} unidades.`, variant: "destructive" });
            return;
        }

        setScannedItems(prev => prev.map(item => {
            if (item.id === itemId) {
                if (isNaN(numericVal)) return { ...item, qty: 0 };
                return { ...item, qty: numericVal };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setScannedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleManualAdd = () => {
        if (!manualName.trim() || !manualPrice) {
            toast({ title: "Datos incompletos", description: "Ingrese nombre y precio.", variant: "destructive" });
            return;
        }
        const price = parseFloat(manualPrice);
        if (isNaN(price) || price <= 0) {
            toast({ title: "Precio inválido", description: "El precio debe ser mayor a 0.", variant: "destructive" });
            return;
        }
        const newItem: ScannedItem = {
            id: `manual-${Date.now()}`,
            name: manualName.trim(),
            price: price,
            qty: 1,
            productId: `manual-${Date.now()}`,
            code: `MANUAL`
        };
        setScannedItems(prev => [newItem, ...prev]);
        setIsManualAddOpen(false);
        setManualName('');
        setManualPrice('');
        toast({ title: "Producto Agregado", description: manualName.trim() });
    };

    // --- INTELIGENT FIADO SEARCH ---
    const handleSearchClient = async (overridePhone?: string | React.MouseEvent) => {
        const target = typeof overridePhone === 'string' ? overridePhone : customerName;
        if (!target || !firestore || !user) return;
        setIsSearchingClient(true);
        setFoundUser(null);
        setFoundCreditLine(null);

        try {
            const rawTerm = target.trim().toLowerCase();
            const cleanDigits = target.replace(/\D/g, '');

            // Consultar Cuentas Corrientes autorizadas del negocio
            const q = query(collection(firestore, 'retailer_credit_lines'), where('retailerId', '==', targetRetailerId));
            const snap = await getDocs(q);
            const clients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setLocalClients(clients);

            // Buscar coincidencia por nombre, teléfono, dni o persona autorizada
            const matchingLine = clients.find(c => {
                const name = (c.customerName || '').toLowerCase();
                const phone = (c.customerPhone || '').replace(/\D/g, '');
                const dni = (c.customerDNI || '').replace(/\D/g, '');
                const authPersons = Array.isArray(c.authorizedPersons) ? c.authorizedPersons.map((p: string) => p.toLowerCase()) : [];

                const matchName = name.includes(rawTerm);
                const matchPhone = cleanDigits.length >= 6 && phone.includes(cleanDigits);
                const matchDni = cleanDigits.length >= 6 && dni.includes(cleanDigits);
                const matchAuth = authPersons.some((p: string) => p.includes(rawTerm));

                return matchName || matchPhone || matchDni || matchAuth;
            });

            if (matchingLine) {
                setFoundCreditLine(matchingLine);
                setFoundUser({
                    id: matchingLine.customerId || matchingLine.id,
                    displayName: matchingLine.customerName,
                    phone: matchingLine.customerPhone
                });
                setCustomerName(matchingLine.customerName);

                if (matchingLine.status === 'blocked') {
                    toast({
                        title: "Cuenta Bloqueada 🔒",
                        description: `${matchingLine.customerName} tiene el crédito suspendido por el dueño. No se puede vender fiado.`,
                        variant: "destructive"
                    });
                } else {
                    const available = (Number(matchingLine.creditLimit) || 0) - (Number(matchingLine.currentDebt) || 0);
                    toast({
                        title: "Cliente Autorizado ✅",
                        description: `${matchingLine.customerName} | Crédito disponible: $${available.toLocaleString('es-AR')}`
                    });
                }
            } else {
                setFoundCreditLine(null);
                setFoundUser(null);
                toast({
                    title: "Cliente No Autorizado ❌",
                    description: `"${target}" no tiene cuenta corriente autorizada. Solo el dueño puede crearla desde Cuentas Corrientes.`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Ocurrió un problema en la búsqueda", variant: 'destructive' });
        } finally {
            setIsSearchingClient(false);
        }
    };

    // --- CONTACT PICKER ---
    const handleContactPicker = async () => {
        if (!('contacts' in navigator && 'ContactsManager' in window)) {
            toast({ title: "Función no compatible", description: "El botón de agenda solo funciona en la App de Android. Por favor ingresa el número manualmente arriba.", variant: "destructive" });
            return;
        }
        try {
            const props = ['tel'];
            const opts = { multiple: false };
            const contacts = await (navigator as any).contacts.select(props, opts);
            
            if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
                let phone = contacts[0].tel[0];
                phone = phone.replace(/[^0-9]/g, '');
                if (phone.startsWith('549')) phone = phone.substring(3);
                if (phone.startsWith('54')) phone = phone.substring(2);
                setCustomerName(phone);
                handleSearchClient(phone);
            }
        } catch (ex) {
            console.error(ex);
        }
    };

    const handleCreateCreditLine = async () => {
        if (!firestore || !user || !foundUser) return;
        const limitNum = parseFloat(newCreditLimit);
        if (isNaN(limitNum) || limitNum <= 0) {
            toast({ title: "Error", description: "El límite debe ser un número mayor a cero.", variant: 'destructive' });
            return;
        }
        try {
            const newRef = await addDoc(collection(firestore, 'retailer_credit_lines'), {
                retailerId: targetRetailerId,
                customerId: foundUser.id,
                customerName: foundUser.displayName || foundUser.name || 'Cliente',
                customerPhone: foundUser.phone || '',
                isUnregistered: foundUser.isUnregistered || false,
                creditLimit: limitNum,
                currentDebt: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            const newCreditLineData = {
                id: newRef.id,
                retailerId: targetRetailerId,
                customerId: foundUser.id,
                customerName: foundUser.displayName || 'Cliente',
                customerPhone: foundUser.phone || '',
                isUnregistered: foundUser.isUnregistered || false,
                creditLimit: limitNum,
                currentDebt: 0
            };
            setFoundCreditLine(newCreditLineData);
            setNewCreditLimit('');
            toast({ title: "Línea de Fiado Creada", description: "Ahora puedes finalizar la venta." });
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "No se pudo crear la línea de fiado.", variant: 'destructive' });
        }
    };

    const handleConfirmOperation = async (method: string, splitData?: any, takenBy?: string) => {
        if (!user || (!isSales && !calcResult) || (isSales && scannedItems.length === 0)) return;

        // BLINDAJE ATÓMICO ANTIDUPLICADOS: Bloquea clics repetidos en 0 milisegundos
        if (isProcessingRef.current) {
            console.warn("⚠️ [POS-SHIELD] Operación ya en proceso. Ignorando clic concurrente.");
            return;
        }

        const amount = isSales ? totalCart : parseFloat(calcResult || '0');
        if (amount <= 0) return;

        // VERIFICACIÓN DE FIADO (CREDIT)
        if (method === 'credit') {
            if (!foundCreditLine) {
                toast({ title: "Fiado Bloqueado ❌", description: "Debes buscar y seleccionar un cliente con cuenta corriente autorizada antes de fiar.", variant: 'destructive' });
                return;
            }
            if (foundCreditLine.status === 'blocked') {
                toast({ title: "Cuenta Bloqueada 🔒", description: `${foundCreditLine.customerName} tiene el crédito suspendido por el dueño. No se puede fiar.`, variant: 'destructive' });
                return;
            }
            const currentDebt = Number(foundCreditLine.currentDebt) || 0;
            const creditLimit = Number(foundCreditLine.creditLimit) || 0;
            const availableCredit = creditLimit - currentDebt;
            if (amount > availableCredit) {
                toast({ 
                    title: "Límite Excedido ⚠️", 
                    description: `El total ($${amount.toLocaleString('es-AR')}) supera el crédito disponible ($${availableCredit.toLocaleString('es-AR')}).`, 
                    variant: 'destructive' 
                });
                return;
            }
            if (foundCreditLine?.authorizedPersons && foundCreditLine.authorizedPersons.length > 0 && !takenBy) {
                setIsTakenByModalOpen(true);
                setPendingOperation({ method, splitData });
                return;
            }
        }

        // Activamos cerrojo sincrónico y estado visual de envío
        isProcessingRef.current = true;
        setIsSubmitting(true);

        try {
            let targetPhone = '';
            if (foundUser && foundUser.phone) {
                targetPhone = foundUser.phone;
            } else if (/^\d{8,}$/.test(customerName.replace(/\D/g, ''))) {
                targetPhone = customerName.replace(/\D/g, '');
            }

            let opId = '';
            if (firestore) {
                const tempRef = doc(collection(firestore, 'retailer_daily_operations'));
                opId = tempRef.id;
            } else {
                opId = 'offline_' + Date.now();
            }

            // Congelar los ítems de esta operación exacta
            const currentScannedItems = isSales ? JSON.parse(JSON.stringify(scannedItems)) : [];

            const data = JSON.parse(JSON.stringify({
                id: opId,
                retailerId: targetRetailerId,
                type: isSales ? (method === 'credit' ? 'credit_sale' : 'sale') : 'expense',
                paymentMethod: method,
                splitDetails: method === 'mixed' ? splitData : null,
                total: amount,
                items: currentScannedItems,
                concept: isSales ? 'Venta Directa' : expenseConcept,
                status: method === 'credit' ? 'pending' : 'completed',
                date: new Date().toISOString(),
                customerName: isSales ? customerName.trim() || 'Cliente Final' : customerName,
                customerPhone: isSales ? targetPhone : '',
                branchId: activeBranchId,
                employeeId: employee?.id || 'admin',
                employeeName: employee?.name || 'Dueño',
                takenBy: takenBy || '',
                receiptSent: false
            }));

            // --- DESCUENTO INMEDIATO DEL STOCK LOCAL (CON O SIN INTERNET) ---
            if (isSales && currentScannedItems.length > 0) {
                // 1. Descuento en memoria React para reflejo visual inmediato en pantalla y escáner
                setLocalProducts(prev => {
                    const updated = [...prev];
                    for (const item of currentScannedItems) {
                        if (item.isBundle && item.bundleItems) {
                            for (const comp of item.bundleItems) {
                                const idx = updated.findIndex(p => p.id === comp.id);
                                if (idx !== -1) {
                                    const currentStock = Number(updated[idx].stock) || 0;
                                    const deductQty = (Number(comp.qty) || 1) * (Number(item.qty) || 1);
                                    const newStock = Math.max(0, currentStock - deductQty);
                                    const newStockByBranch = { ...(updated[idx].stockByBranch || {}) };
                                    if (activeBranchId) {
                                        newStockByBranch[activeBranchId] = Math.max(0, (Number(newStockByBranch[activeBranchId]) || 0) - deductQty);
                                    }
                                    updated[idx] = { ...updated[idx], stock: newStock, stockByBranch: newStockByBranch };
                                }
                            }
                        } else if (item.productId && !item.productId.startsWith('manual-')) {
                            const idx = updated.findIndex(p => p.id === item.productId);
                            if (idx !== -1) {
                                const currentStock = Number(updated[idx].stock) || 0;
                                const deductQty = Number(item.qty) || 1;
                                const newStock = Math.max(0, currentStock - deductQty);
                                const newStockByBranch = { ...(updated[idx].stockByBranch || {}) };
                                if (activeBranchId) {
                                    newStockByBranch[activeBranchId] = Math.max(0, (Number(newStockByBranch[activeBranchId]) || 0) - deductQty);
                                }
                                updated[idx] = { ...updated[idx], stock: newStock, stockByBranch: newStockByBranch };
                            }
                        }
                    }
                    return updated;
                });

                // 2. Descuento en el almacenamiento físico offline del celular / terminal (IndexedDB)
                await deductStockFromOfflineCache(currentScannedItems, activeBranchId);
            }

            // MOTOR HÍBRIDO (El Fantasma con protección contra cortes de conexión)
            let committedToCloud = false;

            if (isOnline && firestore) {
                try {
                    // BLINDAJE ATÓMICO (writeBatch)
                    const batch = writeBatch(firestore);
                    const opRef = doc(firestore, 'retailer_daily_operations', opId);
                    
                    batch.set(opRef, {
                        ...data,
                        createdAt: serverTimestamp()
                    });

                    // AGREGACIÓN AUTOMÁTICA DE RESUMEN DIARIO (Unificado por targetRetailerId)
                    const dateId = format(new Date(), 'yyyy-MM-dd');
                    const summaryRef = doc(firestore, 'retailer_daily_summaries', `${targetRetailerId}_${dateId}`);
                    const summaryUpdates: any = {
                        date: dateId,
                        retailerId: targetRetailerId,
                        updatedAt: serverTimestamp(),
                    };
                    
                    if (isSales) {
                        if (method === 'mixed' && splitData) {
                            if (splitData.cash > 0) summaryUpdates.ventasContado = increment(splitData.cash);
                            if (splitData.transfer > 0) summaryUpdates.ventasTransferencia = increment(splitData.transfer);
                            if (splitData.credit > 0) summaryUpdates.ventasFiado = increment(splitData.credit);
                        } else if (method === 'cash') summaryUpdates.ventasContado = increment(amount);
                        else if (method === 'transfer') summaryUpdates.ventasTransferencia = increment(amount);
                        else if (method === 'credit') summaryUpdates.ventasFiado = increment(amount);
                        else if (method === 'qr') summaryUpdates.ventasQR = increment(amount);
                    } else {
                        summaryUpdates.dailyExpenses = increment(amount);
                    }
                    
                    batch.set(summaryRef, summaryUpdates, { merge: true });

                    // ACTUALIZAR LÍNEA DE CRÉDITO Y TRANSACCIÓN DE FIADO
                    if (method === 'credit' && foundCreditLine) {
                        const lineRef = doc(firestore, 'retailer_credit_lines', foundCreditLine.id);
                        batch.set(lineRef, {
                            currentDebt: increment(amount),
                            updatedAt: serverTimestamp()
                        }, { merge: true });

                        const combinedDetail = isSales ? currentScannedItems.map((item: any) => `${item.name} x${item.qty}`).join(', ') : expenseConcept;
                        const txRef = doc(collection(firestore, 'retailer_credit_transactions'));
                        batch.set(txRef, {
                            retailerId: targetRetailerId,
                            creditLineId: foundCreditLine.id,
                            type: 'venta',
                            amount: amount,
                            description: combinedDetail,
                            takenBy: takenBy || null,
                            date: new Date().toISOString()
                        });
                    }

                    if (isSales) {
                        const liveCatalog = (productsRef.current && productsRef.current.length > 0) ? productsRef.current : (localProducts || []);
                        const deductionsByDocId = new Map<string, number>();

                        for (const item of currentScannedItems) {
                            if (item.isBundle && item.bundleItems) {
                                for (const component of item.bundleItems) {
                                    let compId = component.id;
                                    const existsDirectly = liveCatalog.some((p: any) => p.id === compId);
                                    if (!existsDirectly) {
                                        const matchComp = liveCatalog.find((p: any) => 
                                            matchesBarcodeSmart(p, (component as any).code || (component as any).barcode || '') && getLiveBranchStock(p) > 0
                                        ) || liveCatalog.find((p: any) => 
                                            matchesBarcodeSmart(p, (component as any).code || (component as any).barcode || '')
                                        );
                                        if (matchComp && matchComp.id) {
                                            compId = matchComp.id;
                                        } else {
                                            continue;
                                        }
                                    }
                                    const deductQty = (Number(component.qty) || 1) * (Number(item.qty) || 1);
                                    deductionsByDocId.set(compId, (deductionsByDocId.get(compId) || 0) + deductQty);
                                }
                            } else if (item.productId && !item.productId.startsWith('manual-')) {
                                let targetId = item.productId;
                                const existsDirectly = liveCatalog.some((p: any) => p.id === targetId);
                                if (!existsDirectly) {
                                    const matchProd = liveCatalog.find((p: any) => 
                                        matchesBarcodeSmart(p, item.code || item.barcode || '') && getLiveBranchStock(p) > 0
                                    ) || liveCatalog.find((p: any) => 
                                        matchesBarcodeSmart(p, item.code || item.barcode || '')
                                    );
                                    if (matchProd && matchProd.id) {
                                        targetId = matchProd.id;
                                    } else {
                                        continue;
                                    }
                                }
                                const deductQty = Number(item.qty) || 1;
                                deductionsByDocId.set(targetId, (deductionsByDocId.get(targetId) || 0) + deductQty);
                            }
                        }

                        for (const [docId, deductQty] of deductionsByDocId.entries()) {
                            const docRef = doc(firestore, 'retailer_inventory', docId);
                            const prodInRam = liveCatalog.find((p: any) => p.id === docId);
                            const hasBranchMap = prodInRam?.stockByBranch && typeof prodInRam.stockByBranch === 'object' && Object.keys(prodInRam.stockByBranch).length > 0;

                            if (activeBranchId && prodInRam && !hasBranchMap) {
                                // Inicializar mapa de sucursal limpio si era un producto legado sin stockByBranch
                                const centralId = centralBranch ? centralBranch.id : 'central';
                                const baseStock = Math.max(0, Number(prodInRam.stock) || 0);
                                const newStockByBranch: Record<string, number> = {
                                    [centralId]: activeBranchId === centralId ? Math.max(0, baseStock - deductQty) : baseStock
                                };
                                if (activeBranchId !== centralId) {
                                    newStockByBranch[activeBranchId] = 0;
                                }
                                const newTotal = Object.values(newStockByBranch).reduce((a, b) => a + b, 0);
                                batch.update(docRef, {
                                    stock: newTotal,
                                    stockByBranch: newStockByBranch,
                                    updatedAt: serverTimestamp()
                                });
                            } else {
                                const updateData: any = {
                                    stock: increment(-deductQty),
                                    updatedAt: serverTimestamp()
                                };
                                if (activeBranchId) {
                                    updateData[`stockByBranch.${activeBranchId}`] = increment(-deductQty);
                                }
                                batch.update(docRef, updateData);
                            }
                        }
                    }
                    
                    // Timeout preventivo de 8 segundos si la conexión WiFi se congela, con limpieza automática si termina después
                    const commitPromise = batch.commit();
                    commitPromise.then(() => {
                        removeSaleFromSyncQueue(opId).catch(() => {});
                    }).catch(() => {});

                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 8000)
                    );
                    await Promise.race([commitPromise, timeoutPromise]);
                    committedToCloud = true;

                    // ENVIAR NOTIFICACIÓN A LA BILLETERA DEL CLIENTE (No bloqueante)
                    if (isSales && foundUser && !foundUser.isUnregistered) {
                        try {
                            await addDoc(collection(firestore, `users/${foundUser.id}/notifications`), {
                                title: "Nuevo Recibo de Compra 🧾",
                                body: `Tienes un nuevo comprobante de compra por $${amount.toLocaleString()} en tu billetera.`,
                                type: 'receipt',
                                isRead: false,
                                createdAt: serverTimestamp(),
                                retailerId: targetRetailerId
                            });
                        } catch (notifErr) {
                            console.error("Non-blocking notification error:", notifErr);
                        }
                    }

                    // Registro de logs (no bloqueante)
                    if (isSales) {
                        currentScannedItems.forEach((item: any) => {
                            if (item.isBundle && item.bundleItems) {
                                item.bundleItems.forEach((c: any) => logInventoryAction(c.id, c.name, 'SALE (BUNDLE)', `Vendido en combo "${item.name}".`));
                            } else if (item.productId) {
                                logInventoryAction(item.productId, item.name, 'SALE', `Vendido ${item.qty} unidades.`);
                            }
                        });
                    }
                } catch (netErr: any) {
                    console.warn("⚠️ [POS-SHIELD] Conexión inestable o timeout en batch. Guardando en cola offline segura:", netErr);
                    committedToCloud = false;
                }
            }

            if (!committedToCloud) {
                await queueSaleForSync(data);
                toast({ 
                    title: "Venta Registrada Offline 📦", 
                    description: "El stock local fue descontado. La venta se sincronizará a la nube apenas regrese internet." 
                });
            }

            if (isSales) {
                setLastSaleDetails({
                    id: opId,
                    amount,
                    paymentMethod: method,
                    targetPhone,
                    customerName: customerName.trim() || 'Consumidor Final',
                    items: [...currentScannedItems],
                    payWith: payWith || undefined
                });
                
                // NOTIFICAR PANTALLA CLIENTE
                const payAmount = payWith ? parseFloat(payWith) : amount;
                const change = payAmount > amount ? payAmount - amount : 0;
                
                if (tpvChannel) {
                    tpvChannel.postMessage({
                        type: 'PAYMENT_SUCCESS',
                        payload: { total: amount, change }
                    });
                }
                
                // NOTIFICAR NUBE (TABLETS)
                if (firestore && targetRetailerId && committedToCloud) {
                    import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
                        setDoc(doc(firestore, 'retailer_daily_operations', `display_${targetRetailerId}`), {
                            recordType: 'CUSTOMER_DISPLAY',
                            status: 'PAYMENT_SUCCESS',
                            items: [],
                            total: amount,
                            change: change,
                            updatedAt: serverTimestamp()
                        }, { merge: true }).catch(console.error);
                    });
                }

                setIsSuccessModalOpen(true);

                // Limpiar carrito inmediatamente
                setScannedItems([]);
                setCustomerName('');
                setFoundUser(null);
                setFoundCreditLine(null);
                setPayWith('');
                setIsRegModalOpen(false);
                setSelectedPaymentMethod(null);
            } else { 
                toast({ title: "Gasto Registrado ✅" });
                setIsRegModalOpen(false);
                setCalcResult(''); 
                setExpenseConcept(''); 
            }
        } catch (e: any) { 
            console.error("CRITICAL CHECKOUT ERROR:", e);
            toast({ title: "Fallo en la Venta 🚫", description: e.message || "Error al procesar la venta. Revisar logs.", variant: 'destructive' }); 
        } finally {
            isProcessingRef.current = false;
            setIsSubmitting(false);
        }
    };

    if (!isClient) return null;

    return (
        <div className={cn("min-h-screen pb-44 sm:pb-36 pt-20 sm:pt-24 md:pt-2 w-full max-w-2xl mx-auto px-1 sm:px-0", isSales ? "bg-transparent" : "bg-slate-50")}>
            <main className="w-full space-y-4">
                
                {/* --- SECCIÓN VENTAS --- */}
                {isSales && (
                    <div className="space-y-4">
                        
                        {/* --- ENCABEZADO DE SUCURSAL Y MODO --- */}
                        <div className="flex justify-between items-center w-full gap-2 px-1 relative z-20">
                            {role === 'admin' ? (
                                currentShift ? (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            toast({
                                                title: "Sucursal Fija por Caja Abierta 🔒",
                                                description: `El turno actual está abierto en "${getBranchName(currentShift.branchId)}". Para cambiar de sucursal, primero cerrá la caja desde el panel de inicio.`,
                                            });
                                        }}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl cursor-pointer transition-colors shadow-sm select-none border-none active:scale-95"
                                        title="Caja abierta - Sucursal fija"
                                    >
                                        <Store className="w-4 h-4 text-white shrink-0" />
                                        <span className="text-xs font-black uppercase tracking-wider text-white">
                                            {getBranchName(activeBranchId)}
                                        </span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Turno Activo" />
                                        <Lock className="w-3 h-3 text-white/90 ml-0.5" />
                                    </button>
                                ) : (
                                    <Select value={selectedAdminBranch} onValueChange={handleAdminBranchChange}>
                                        <SelectTrigger className="w-[190px] h-10 bg-white border-slate-200 text-xs font-black uppercase rounded-2xl shadow-xs">
                                            <div className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-red-600 shrink-0" />
                                                <SelectValue placeholder="Sucursal" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches && branches.length > 0 ? (
                                                branches.map((b: any) => (
                                                    <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.name}</SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="central" className="text-xs font-bold uppercase">Casa Central</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )
                            ) : (
                                <div className="flex items-center gap-2 bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm border-none">
                                    <Store className="w-4 h-4 text-white shrink-0" /> 
                                    <span className="text-white">{getBranchName(activeBranchId)}</span>
                                    {currentShift && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Caja Abierta" />
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => window.open(`/redeconomix/dashboard-negocio/pantalla-cliente?rid=${targetRetailerId}`, '_blank', 'width=1024,height=768')}
                                    className="hidden md:flex bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest items-center gap-1.5 shadow-xs active:scale-95 transition-all shrink-0"
                                >
                                    <LayoutDashboard size={14} className="text-slate-500" /> Pantalla
                                </button>
                            </div>
                        </div>

                        {/* Lector de Código de Barras */}
                        <div className={cn(
                            "relative w-full rounded-3xl transition-all",
                            isScannerOpen 
                                ? "bg-transparent border-2 border-red-500/80 shadow-md h-[260px]" 
                                : "bg-white border border-slate-200 shadow-xs h-[210px] overflow-hidden flex items-center justify-center"
                        )}>
                             {isScannerOpen ? (
                                 <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-transparent">
                                     <BarcodeScanner 
                                        onScanSuccess={(code) => {
                                            if ("vibrate" in navigator) navigator.vibrate(30);
                                            handleAddItemRef.current(code);
                                        }} 
                                        onClose={() => setIsScannerOpen(false)} 
                                        continuous={true} 
                                        holePunchColor="#f8fafc" 
                                     />
                                     <button 
                                         onClick={() => {
                                             if ("vibrate" in navigator) navigator.vibrate(20);
                                             setIsScannerOpen(false);
                                         }}
                                         className="absolute top-3 right-3 z-50 bg-red-600/90 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all backdrop-blur-md"
                                     >
                                         <CameraOff size={14} /> Apagar
                                     </button>
                                 </div>
                             ) : (
                                 <div className="flex flex-col items-center justify-center space-y-3 p-4">
                                     <div className="text-center space-y-0.5">
                                         <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                                             Lector de Código de Barras
                                         </p>
                                         <p className="text-[10px] font-medium text-slate-400">
                                             Cámara en espera para ahorrar batería
                                         </p>
                                     </div>
                                     <button 
                                         onClick={() => {
                                             if ("vibrate" in navigator) navigator.vibrate(20);
                                             setIsScannerOpen(true);
                                         }}
                                         className="bg-red-600 hover:bg-red-700 active:scale-95 text-white h-11 px-6 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all mx-auto"
                                     >
                                         <Camera size={16} /> Encender Lector
                                     </button>
                                 </div>
                             )}
                        </div>

                        {/* Carrito / Resumen de Venta */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden relative z-10">
                            <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedSaleToRefund(null);
                                        setRefundPin('');
                                        setRefundSearch('');
                                        setIsRefundModalOpen(true);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider px-3 h-8 rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                                    title="Devoluciones de Venta"
                                >
                                    <RotateCcw size={12} className="stroke-[2.5]" /> Devolución
                                </button>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsManualAddOpen(true)} 
                                        className="bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase tracking-wider px-3 h-8 rounded-xl flex items-center gap-1 shadow-xs transition-all"
                                    >
                                        <Plus size={13} className="stroke-[2.5]" /> Manual
                                    </button>
                                    <button 
                                        onClick={() => setScannedItems([])} 
                                        disabled={scannedItems.length === 0}
                                        className="bg-white hover:bg-red-50 active:scale-95 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 font-bold text-[10px] uppercase tracking-wider px-2.5 h-8 rounded-xl flex items-center gap-1 shadow-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
                                        title="Vaciar"
                                    >
                                        <Trash2 size={13} /> Vaciar
                                    </button>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 min-h-[160px]">
                                     {scannedItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                                            <ShoppingBag className="h-10 w-10 mb-2 opacity-40 text-slate-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escaneá o sumá productos al ticket</p>
                                        </div>
                                    ) : (
                                        scannedItems.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                                                <div className="h-11 w-11 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">{item.name}</p>
                                                        {item.promoType && item.promoType !== 'none' && (
                                                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">{item.promoType}</span>
                                                        )}
                                                        {isNearExpiry(item.expirationDate) && (
                                                            <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">VENCE PRONTO</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleUpdateQty(item.id, -1)} 
                                                            className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors active:scale-95 shrink-0"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <Input 
                                                            type="number" 
                                                            step="0.001"
                                                            value={item.qty === 0 ? '' : item.qty} 
                                                            onChange={(e) => handleSetQty(item.id, e.target.value)}
                                                            className="h-7 w-14 p-0 bg-slate-100 border-none text-xs font-black text-center tabular-nums focus-visible:ring-1 focus-visible:ring-red-500 rounded-lg"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleUpdateQty(item.id, 1)} 
                                                            className="w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors active:scale-95 shrink-0"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">un/kg</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1 shrink-0">
                                                    <p className="text-sm font-black text-slate-900 tabular-nums">${calculateItemTotal(item).toLocaleString()}</p>
                                                    {item.promoType && item.promoType !== 'none' && (
                                                        <p className="text-[9px] text-slate-400 line-through tabular-nums">${(item.price * item.qty).toLocaleString()}</p>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)} 
                                                        className="text-[10px] font-bold text-slate-400 hover:text-red-600 uppercase flex items-center gap-1 transition-colors"
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Quitar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Total Venta</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                                            ${totalCart.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Selector de Cliente */}
                                <div className="border-t border-slate-100 pt-4 mt-4">
                                {foundUser ? (
                                    <div className="bg-red-50/50 rounded-2xl border border-red-200 p-4 relative z-10 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-slate-900 tracking-wider">
                                                        {foundUser.displayName || foundUser.name || 'Cliente Verificado'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-bold">
                                                        {foundUser.phone ? `Tel: ${foundUser.phone}` : ''}
                                                        {foundUser.phone && foundUser.dni ? ' • ' : ''}
                                                        {foundUser.dni ? `DNI: ${foundUser.dni}` : ''}
                                                    </p>
                                                    {foundUser.isUnregistered ? (
                                                        <span className="inline-block mt-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                            Temporal (No Registrado)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block mt-1 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-800 border border-red-200">
                                                            Registrado en App
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    setFoundUser(null);
                                                    setFoundCreditLine(null);
                                                    setCustomerName('');
                                                }}
                                                variant="ghost"
                                                className="h-8 w-8 p-0 rounded-full hover:bg-red-100/60 text-slate-400 hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Campo para editar nombre del cliente temporal */}
                                        {foundUser.isUnregistered && (
                                            <div className="mt-3 pt-3 border-t border-red-100">
                                                <Label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Nombre para el Ticket</Label>
                                                <Input 
                                                    placeholder="Ingrese nombre del cliente temporal"
                                                    value={customerName === foundUser.phone ? '' : customerName}
                                                    onChange={(e) => {
                                                        const newName = e.target.value;
                                                        setCustomerName(newName);
                                                        setFoundUser((prev: any) => prev ? { ...prev, displayName: newName } : null);
                                                    }}
                                                    className="h-9 bg-white border-red-200 rounded-xl text-xs font-bold text-slate-800"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-3 sm:p-4 space-y-2 relative z-10">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Buscar Cliente Autorizado (Nombre, Celular o DNI)
                                        </Label>
                                        <div className="flex gap-2 w-full">
                                            <div className="relative flex-1 min-w-0">
                                                <Input 
                                                    placeholder="Ej: Nombre, Celular o DNI" 
                                                    value={customerName}
                                                    onChange={(e) => {
                                                        setCustomerName(e.target.value);
                                                    }}
                                                    onFocus={() => setIsClientDropdownOpen(true)}
                                                    onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 200)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSearchClient();
                                                    }}
                                                    className="h-11 px-3.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus-visible:ring-red-500 shadow-xs w-full"
                                                />
                                                {isClientDropdownOpen && localClients.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                                                        {localClients.filter(c => c.customerName?.toLowerCase().includes(customerName.toLowerCase()) || (c.customerPhone && c.customerPhone.includes(customerName))).map(client => (
                                                            <div 
                                                                key={client.id}
                                                                onClick={() => {
                                                                    setCustomerName(client.customerName);
                                                                    setFoundUser({ id: client.customerId || client.id, displayName: client.customerName, phone: client.customerPhone, isUnregistered: true });
                                                                    setFoundCreditLine(client);
                                                                    setIsClientDropdownOpen(false);
                                                                }}
                                                                className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer"
                                                            >
                                                                <p className="text-xs font-bold text-slate-900">{client.customerName}</p>
                                                                {client.customerPhone && <p className="text-[10px] font-bold text-slate-400">Tel: {client.customerPhone}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button 
                                                onClick={() => handleSearchClient()} 
                                                disabled={isSearchingClient || !customerName}
                                                className="px-3.5 sm:px-5 h-11 bg-red-600 text-white rounded-xl border-none hover:bg-red-700 gap-1.5 font-bold text-xs uppercase tracking-wider shadow-md shadow-red-600/20 shrink-0 transition-transform active:scale-95"
                                            >
                                                {isSearchingClient ? (
                                                    <span className="animate-spin text-sm">⏳</span>
                                                ) : (
                                                    <Search className="w-3.5 h-3.5" />
                                                )}
                                                BUSCAR
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>

                            {totalCart > 0 && (
                                <div className="space-y-3 pt-3 border-t border-slate-100 px-3 sm:px-4 pb-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <Button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('cash')} 
                                            className={cn(
                                                "h-13 sm:h-15 px-2 py-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xs",
                                                selectedPaymentMethod === 'cash' 
                                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500" 
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <Wallet className={cn("h-4 w-4 sm:h-5 sm:w-5", selectedPaymentMethod === 'cash' ? "text-white" : "text-red-600")} /> 
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Efectivo</span>
                                        </Button>
                                        <Button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('transfer')} 
                                            className={cn(
                                                "h-13 sm:h-15 px-2 py-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xs",
                                                selectedPaymentMethod === 'transfer' 
                                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500" 
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <Smartphone className={cn("h-4 w-4 sm:h-5 sm:w-5", selectedPaymentMethod === 'transfer' ? "text-white" : "text-red-600")} /> 
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Transf.</span>
                                        </Button>
                                        <Button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('credit')} 
                                            className={cn(
                                                "h-13 sm:h-15 px-2 py-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xs",
                                                selectedPaymentMethod === 'credit' 
                                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500" 
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <BookOpen className={cn("h-4 w-4 sm:h-5 sm:w-5", selectedPaymentMethod === 'credit' ? "text-white" : "text-red-600")} /> 
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Fiado</span>
                                        </Button>
                                        <Button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('qr')} 
                                            className={cn(
                                                "h-13 sm:h-15 px-2 py-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xs",
                                                selectedPaymentMethod === 'qr' 
                                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/25 ring-2 ring-red-500" 
                                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            <QrCode className={cn("h-4 w-4 sm:h-5 sm:w-5", selectedPaymentMethod === 'qr' ? "text-white" : "text-red-600")} /> 
                                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">QR</span>
                                        </Button>
                                    </div>

                                    {/* DYNAMIC SUB-PANELS */}
                                    {selectedPaymentMethod === 'cash' && (
                                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                            <Label className="text-[9px] font-bold uppercase text-slate-500 mb-1.5 block tracking-wider">¿Con cuánto paga el cliente?</Label>
                                            <div className="relative mb-3">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 font-bold">$</span>
                                                <Input 
                                                    type="number"
                                                    placeholder="Ej: 5000"
                                                    value={payWith}
                                                    onChange={(e) => setPayWith(e.target.value)}
                                                    className="h-11 pl-7 bg-white border-slate-200 rounded-xl font-black text-slate-900 text-lg tabular-nums shadow-inner"
                                                />
                                            </div>
                                            {parseFloat(payWith) > totalCart && (
                                                <div className="text-center bg-red-50 border border-red-200 p-2.5 rounded-xl shadow-xs mb-3">
                                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Vuelto a entregar</p>
                                                    <p className="text-xl font-black text-red-700 tabular-nums">${(parseFloat(payWith) - totalCart).toLocaleString()}</p>
                                                </div>
                                            )}
                                            <Button 
                                                onClick={() => handleConfirmOperation('cash')} 
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center justify-center transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                        PROCESANDO VENTA...
                                                    </span>
                                                ) : (
                                                    "FINALIZAR VENTA"
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'transfer' && (
                                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-3 text-center shadow-xs">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CBU / CVU del Local</p>
                                                <p className="text-sm sm:text-base font-black text-slate-900 tracking-wider break-all">{userProfile?.banking?.cbu || 'No configurado'}</p>
                                                
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-1">Alias</p>
                                                <p className="text-sm sm:text-base font-black text-slate-900 tracking-wider break-all">{userProfile?.banking?.alias || 'No configurado'}</p>
                                            </div>
                                            <Button 
                                                onClick={() => handleConfirmOperation('transfer')} 
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center justify-center transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                        PROCESANDO VENTA...
                                                    </span>
                                                ) : (
                                                    "FINALIZAR VENTA"
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'credit' && (
                                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                            {foundCreditLine ? (
                                                <>
                                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-3 shadow-xs flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Cliente Autorizado</span>
                                                            <span className="text-xs font-black text-slate-900">{foundCreditLine.customerName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Estado</span>
                                                            <span className={cn("text-xs font-black", foundCreditLine.status === 'blocked' ? "text-red-600" : "text-emerald-600")}>
                                                                {foundCreditLine.status === 'blocked' ? "🔒 BLOQUEADA" : "✅ HABILITADA"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Límite Total</span>
                                                            <span className="text-xs font-black text-slate-900">${(Number(foundCreditLine.creditLimit) || 0).toLocaleString("es-AR")}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Deuda Previa</span>
                                                            <span className="text-xs font-black text-red-600">${(Number(foundCreditLine.currentDebt) || 0).toLocaleString("es-AR")}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Disponible para Fiar</span>
                                                            <span className={cn("text-xs font-black", ((Number(foundCreditLine.creditLimit) || 0) - (Number(foundCreditLine.currentDebt) || 0) - totalCart) < 0 ? "text-red-600" : "text-emerald-600")}>
                                                                ${((Number(foundCreditLine.creditLimit) || 0) - (Number(foundCreditLine.currentDebt) || 0)).toLocaleString("es-AR")}
                                                            </span>
                                                        </div>
                                                        <div className="h-px w-full bg-slate-100 my-1" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold uppercase text-slate-800">Monto de esta Compra</span>
                                                            <span className="text-base font-black text-red-600">
                                                                ${totalCart.toLocaleString("es-AR")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {foundCreditLine.status === 'blocked' ? (
                                                        <div className="p-3 bg-red-100 text-red-700 rounded-xl text-center text-xs font-bold border border-red-200 mb-2">
                                                            🚫 Cuenta suspendida por el dueño. No se puede fiar.
                                                        </div>
                                                    ) : totalCart > ((Number(foundCreditLine.creditLimit) || 0) - (Number(foundCreditLine.currentDebt) || 0)) ? (
                                                        <div className="p-3 bg-amber-100 text-amber-800 rounded-xl text-center text-xs font-bold border border-amber-200 mb-2">
                                                            ⚠️ El monto supera el crédito disponible del cliente.
                                                        </div>
                                                    ) : null}

                                                    <Button 
                                                        onClick={() => handleConfirmOperation('credit')} 
                                                        disabled={isSubmitting || foundCreditLine.status === 'blocked' || totalCart > ((Number(foundCreditLine.creditLimit) || 0) - (Number(foundCreditLine.currentDebt) || 0))}
                                                        className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center justify-center transition-all disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? (
                                                            <span className="flex items-center gap-2">
                                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                                PROCESANDO...
                                                            </span>
                                                        ) : (
                                                            "FINALIZAR VENTA FIADA"
                                                        )}
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="text-center py-4 space-y-4">
                                                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">Cliente no seleccionado</p>
                                                        <p className="text-xs text-slate-500 mt-1">Busque arriba el nombre o teléfono del cliente con cuenta corriente autorizada.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedPaymentMethod === 'qr' && (
                                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 animate-in slide-in-from-top-2 duration-200 text-center">
                                            {userProfile?.banking?.qrImage ? (
                                                <div className="bg-white p-2 rounded-xl border border-slate-100 mb-3 shadow-xs inline-block mx-auto max-w-[240px] w-full">
                                                    <img src={userProfile.banking.qrImage} alt="QR de Pago" className="w-full h-auto rounded-lg object-contain" />
                                                </div>
                                            ) : (
                                                <div className="bg-white p-5 rounded-xl border border-slate-100 mb-3 shadow-xs inline-block mx-auto">
                                                    <QrCode className="h-20 w-20 text-slate-800 mx-auto" />
                                                </div>
                                            )}
                                            
                                            <Button 
                                                onClick={() => handleConfirmOperation('qr')} 
                                                disabled={isSubmitting}
                                                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center justify-center transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                        PROCESANDO VENTA...
                                                    </span>
                                                ) : (
                                                    "FINALIZAR VENTA"
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- SECCIÓN GASTOS --- */}
                {!isSales && (
                    <div className="space-y-6">
                        <button 
                            onClick={() => setIsRegModalOpen(true)} 
                            className="h-44 w-full bg-red-600 rounded-[3rem] flex flex-col items-center justify-center text-white shadow-xl shadow-red-600/25 border-4 border-red-500 active:scale-[0.99] transition-all"
                        >
                            <TrendingUp className="h-16 max-sm:h-12 w-16 mb-2" />
                            <span className="text-xl font-black uppercase italic tracking-widest leading-none">Registrar Gasto</span>
                            <p className="text-[9px] font-bold text-red-100 mt-2 tracking-widest uppercase italic">Salidas de Caja y Compras</p>
                        </button>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 px-4 italic tracking-widest text-center">Historial Operativo (Egresos)</h3>
                            <div className="space-y-3">
                                {!ops || ops?.length === 0 ? (
                                    <div className="py-20 text-center opacity-20">
                                         <Clock className="w-10 h-10 mx-auto mb-2" />
                                         <p className="text-[10px] font-black uppercase tracking-widest">Sin registros de egresos</p>
                                    </div>
                                ) : (
                                    ops?.map((op: any) => (
                                        <div key={op.id} className="p-6 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                               <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100"><DollarSign className="h-6 w-6" /></div>
                                               <div>
                                                   <h4 className="font-black text-xs uppercase italic tracking-tighter">{op.concept || 'Gasto General'}</h4>
                                                   <p className="text-[8px] font-bold text-slate-400 uppercase">{op.date ? format(new Date(op.date), "d MMM, HH:mm", { locale: es }) : 'Hoy'}</p>
                                               </div>
                                            </div>
                                            <div className="text-2xl font-black italic tabular-nums text-red-600">-${op.total?.toLocaleString() || '0'}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL GASTOS: CALCULADORA */}
            <Drawer open={isRegModalOpen} onOpenChange={setIsRegModalOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-12 sm:pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                    <DrawerTitle className="sr-only">Registrar Gasto Comercial</DrawerTitle>
                    <DrawerDescription className="sr-only">Formulario para registrar egresos</DrawerDescription>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-12 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-right shadow-xl relative overflow-hidden shrink-0">
                             <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -ml-16 -mt-16" />
                             <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase italic tracking-widest relative z-10">Monto del Egreso</p>
                             <div className="text-4xl font-black text-white tracking-tighter tabular-nums italic relative z-10">${calcResult ? parseFloat(calcResult).toLocaleString() : '0'}</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                             {['7','8','9','/','4','5','6','*','1','2','3','-','C','0',',','+','='].map(btn => (
                                  <button 
                                     key={btn} 
                                     onClick={() => {
                                         if ('vibrate' in navigator) navigator.vibrate(6);
                                         if (btn !== '=') handleCalcInput(btn);
                                     }} 
                                     className={cn(
                                         "h-14 rounded-2xl font-black text-lg transition-all active:scale-90 shadow-sm flex items-center justify-center touch-manipulation select-none", 
                                         btn === '=' ? "col-span-4 bg-red-600 text-white shadow-lg shadow-red-600/25 active:bg-red-700" : "bg-slate-50 text-slate-900 active:bg-slate-100"
                                     )}
                                  >
                                     {btn === '*' ? '×' : btn}
                                  </button>
                             ))}
                        </div>
                         <div className={cn("space-y-4 pt-4 border-t border-slate-100 transition-opacity duration-200 pb-6 sm:pb-0", calcResult ? "opacity-100" : "opacity-0 pointer-events-none")}>
                             <Input placeholder="Concepto (ej: Pago Proveedor)" value={expenseConcept} onChange={e => setExpenseConcept(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                             <div className="grid grid-cols-2 gap-3">
                                  <button 
                                      onClick={() => {
                                          if ('vibrate' in navigator) navigator.vibrate(8);
                                          handleConfirmOperation('cash');
                                      }} 
                                      disabled={isSubmitting}
                                      className="bg-red-600 active:bg-red-700 disabled:opacity-50 text-white h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-md shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center touch-manipulation select-none"
                                  >
                                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Ya lo pagué"}
                                  </button>
                                  <button 
                                      onClick={() => {
                                          if ('vibrate' in navigator) navigator.vibrate(8);
                                          handleConfirmOperation('credit');
                                      }} 
                                      disabled={isSubmitting}
                                      className="border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 text-slate-800 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xs transition-all active:scale-[0.98] flex items-center justify-center touch-manipulation select-none"
                                  >
                                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-slate-800" /> : "Deuda / Fiado"}
                                  </button>
                              </div>
                          </div>
                     </div>
                </DrawerContent>
            </Drawer>


            {/* Modal para Seleccionar Quién Retira (Fiado) */}
            <Dialog open={isTakenByModalOpen} onOpenChange={setIsTakenByModalOpen}>
                <DialogContent className="max-w-[400px] rounded-[2.5rem] p-6 bg-white shadow-2xl border-0 overflow-hidden">
                    <DialogTitle className="font-black text-slate-800 uppercase tracking-widest text-lg text-center mb-4">
                        ¿Quién retira la compra?
                    </DialogTitle>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setIsTakenByModalOpen(false);
                                handleConfirmOperation(pendingOperation.method, pendingOperation.splitData, 'Titular');
                            }}
                            disabled={isSubmitting}
                            className="w-full h-14 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-2xl font-bold text-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> : `${foundCreditLine?.customerName || foundUser?.displayName || 'Titular'} (Titular)`}
                        </button>
                        {foundCreditLine?.authorizedPersons?.map((person: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setIsTakenByModalOpen(false);
                                    handleConfirmOperation(pendingOperation.method, pendingOperation.splitData, person);
                                }}
                                disabled={isSubmitting}
                                className="w-full h-14 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 rounded-2xl font-bold text-slate-900 transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> : person}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Venta Exitosa y WhatsApp */}
            <Drawer open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-12 sm:pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                    <DrawerTitle className="sr-only">Venta Registrada Exitosamente</DrawerTitle>
                    <DrawerDescription className="sr-only">Detalles del comprobante y envío de WhatsApp</DrawerDescription>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {/* Header Rojo */}
                        <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 text-center text-white relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                            <div className="w-16 h-16 max-sm:h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight italic">¡Venta Registrada!</h2>
                            <p className="text-red-100 text-[9px] font-bold uppercase tracking-widest mt-1">
                                {new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })}
                            </p>
                        </div>

                        {/* Cuerpo del comprobante */}
                        <div className="p-6 space-y-4 pb-12 sm:pb-6">
                            {/* Monto total */}
                            <div className="bg-slate-50 rounded-[2rem] p-5 text-center border border-slate-100 shrink-0">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Total cobrado</p>
                                <p className="text-4xl font-black text-slate-900 tabular-nums">${lastSaleDetails?.amount?.toLocaleString('es-AR')}</p>
                            </div>

                            {/* Detalles */}
                            <div className="bg-slate-50 rounded-[2rem] p-5 space-y-3 border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</span>
                                    <span className="text-sm font-black text-slate-800 truncate max-w-[180px]">{lastSaleDetails?.customerName || 'Consumidor Final'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medio de Pago</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                                        lastSaleDetails?.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                                        lastSaleDetails?.paymentMethod === 'transfer' ? 'bg-blue-100 text-blue-700' :
                                        lastSaleDetails?.paymentMethod === 'qr' ? 'bg-violet-100 text-violet-700' :
                                        lastSaleDetails?.paymentMethod === 'credit' ? 'bg-amber-400 text-amber-950 font-black border border-amber-500 shadow-sm animate-pulse' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {lastSaleDetails?.paymentMethod === 'cash' ? '💵 Efectivo' :
                                         lastSaleDetails?.paymentMethod === 'transfer' ? '🏦 Transf.' :
                                         lastSaleDetails?.paymentMethod === 'qr' ? '📲 QR / CBU' :
                                         lastSaleDetails?.paymentMethod === 'credit' ? '⚡ FIADO (CTA CTE)' :
                                         lastSaleDetails?.paymentMethod || 'Otro'}
                                    </span>
                                </div>
                                {lastSaleDetails?.paymentMethod === 'cash' && lastSaleDetails?.payWith && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paga con</span>
                                        <span className="text-xs font-bold text-slate-600">${Number(lastSaleDetails.payWith).toLocaleString('es-AR')} → vuelto ${(Number(lastSaleDetails.payWith) - lastSaleDetails.amount).toLocaleString('es-AR')}</span>
                                    </div>
                                )}
                                {lastSaleDetails?.items && lastSaleDetails.items.length > 0 && (
                                    <div className="border-t border-slate-200 pt-3 space-y-1.5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Detalle</p>
                                        {lastSaleDetails.items.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs font-bold text-slate-700">
                                                <span className="truncate max-w-[200px]">{item.qty}x {item.name}</span>
                                                <span className="text-slate-500 tabular-nums">${calculateItemTotal(item).toLocaleString('es-AR')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botones */}
                            <div className="space-y-3 pt-2 pb-6 sm:pb-0">
                                <button
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        if (!lastSaleDetails) return;
                                        const { amount, customerName, targetPhone, items, paymentMethod, payWith } = lastSaleDetails;
                                        const isNotUser = !foundUser || foundUser.isUnregistered;
                                        const methodLabel =
                                            paymentMethod === 'cash' ? 'Efectivo' :
                                            paymentMethod === 'transfer' ? 'Transferencia bancaria' :
                                            paymentMethod === 'qr' ? 'QR / CBU' :
                                            paymentMethod === 'credit' ? 'Cuenta corriente (fiado)' :
                                            paymentMethod || 'Otro';

                                        const itemsText = items
                                            .map((i: any) => `  ${i.qty}x ${i.name}  $${calculateItemTotal(i).toLocaleString('es-AR')}`)
                                            .join('\n');

                                        let msg = `COMPROBANTE DE COMPRA\n`;
                                        const now = new Date();
                                        msg += `${now.toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })} - ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n`;
                                        msg += `────────────────────────────\n`;
                                        msg += `Cliente: ${customerName || 'Consumidor Final'}\n`;
                                        msg += `Medio de pago: ${methodLabel}\n`;
                                        msg += `────────────────────────────\n`;
                                        msg += `${itemsText}\n\n`;
                                        msg += `*TOTAL: $${amount.toLocaleString('es-AR')}*\n`;
                                        
                                        if (paymentMethod === 'cash' && payWith) {
                                            const paidAmount = parseFloat(payWith);
                                            if (!isNaN(paidAmount) && paidAmount > amount) {
                                                msg += `Pago con: $${paidAmount.toLocaleString('es-AR')}\n`;
                                                msg += `Vuelto de: $${(paidAmount - amount).toLocaleString('es-AR')}\n`;
                                            }
                                        }

                                        msg += `────────────────────────────\n`;
                                        msg += `Gracias por su compra.\n\n`;

                                        if (isNotUser) {
                                            msg += `Descarga tu App y obtené premios, descuentos, reintegros y mucho más.\n`;
                                            msg += `www.redeconomix.com`;
                                        }

                                        const encodedMsg = encodeURIComponent(msg);
                                        try {
                                            if (lastSaleDetails?.id && firestore) {
                                                updateDoc(doc(firestore, 'retailer_daily_operations', lastSaleDetails.id), { receiptSent: true }).catch(console.error);
                                            }
                                            const waUrl = targetPhone && targetPhone.trim().length >= 8
                                                ? `https://wa.me/549${targetPhone.replace(/[^0-9]/g,'')}?text=${encodedMsg}`
                                                : `https://api.whatsapp.com/send?text=${encodedMsg}`;
                                            
                                            window.open(waUrl, '_blank') || (window.location.href = waUrl);
                                        } catch (err: any) {
                                            console.error("Error al abrir WhatsApp:", err);
                                            alert("Error al intentar abrir WhatsApp. Intenta de nuevo.");
                                        }
                                    }}
                                    className="w-full h-14 bg-[#25D366] active:bg-[#1db954] text-white font-black text-xs rounded-2xl uppercase tracking-widest shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] touch-manipulation select-none"
                                >
                                    <Smartphone className="w-5 h-5 shrink-0" />
                                    Enviar por WhatsApp
                                </button>
                                
                                <button
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        setIsSuccessModalOpen(false);
                                    }}
                                    className="w-full h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 text-slate-700 border-none font-bold text-xs rounded-2xl uppercase tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none"
                                >
                                    Nueva Venta
                                </button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* MODAL CARGA MANUAL */}
            <Drawer open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-12 sm:pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                    <DrawerTitle className="sr-only">Carga Manual de Producto</DrawerTitle>
                    <DrawerDescription className="sr-only">Formulario para agregar un producto sin código de barra al ticket</DrawerDescription>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-12 space-y-4">
                        <div className="text-center font-black text-slate-900 uppercase tracking-tighter text-lg mb-2">
                            Carga Manual
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Buscador o Nombre Manual</Label>
                            <Input 
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                placeholder="Buscá en tu stock o escribí nombre..."
                                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                            />
                            
                            {/* Resultados de Búsqueda (Se muestran solo al escribir más de 1 letra) */}
                            {manualName.trim().length > 1 && localProducts && (
                                <div className="mt-2 space-y-1">
                                    {localProducts
                                        .filter(p => p.name?.toLowerCase().includes(manualName.toLowerCase()) || p.code?.toLowerCase().includes(manualName.toLowerCase()))
                                        .sort((a, b) => {
                                            const stockA = getBranchStock(a);
                                            const stockB = getBranchStock(b);
                                            return stockB - stockA;
                                        })
                                        .slice(0, 8)
                                        .map(p => {
                                            const bStock = getBranchStock(p);
                                            return (
                                                <div 
                                                    key={p.id}
                                                    onClick={() => {
                                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                                        executeAddItem(p, p.barcode || p.code || p.id);
                                                        setIsManualAddOpen(false);
                                                        setManualName('');
                                                        setManualPrice('');
                                                    }}
                                                    className="bg-slate-100 hover:bg-slate-200 p-3 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase text-slate-700">{p.name}</span>
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest",
                                                            bStock > 0 ? "text-slate-500" : "text-rose-500 font-black"
                                                        )}>
                                                            Stock: {bStock}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-emerald-600">${p.salePrice || p.price}</span>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            )}
                        </div>
                        <div>
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Precio Unitario</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <Input 
                                    type="number"
                                    value={manualPrice}
                                    onChange={(e) => setManualPrice(e.target.value)}
                                    placeholder="0"
                                    className="h-12 pl-7 bg-slate-50 border-slate-200 rounded-xl font-black tabular-nums text-lg"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(8);
                                handleManualAdd();
                            }}
                            className="w-full h-14 bg-red-600 active:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 mt-2 mb-6 sm:mb-0 flex items-center justify-center transition-all active:scale-[0.98] touch-manipulation select-none"
                        >
                            Agregar al Ticket
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>
            {/* MODAL DE CONFLICTO DE VARIANTE (Bulto/Unidad) */}
            <Drawer open={isVariantConflictModalOpen} onOpenChange={setIsVariantConflictModalOpen}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-12 sm:pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                    <DrawerTitle className="sr-only">Elegir Variante de Producto</DrawerTitle>
                    <DrawerDescription className="sr-only">Selecciona la variante exacta que acabas de escanear (ej. bulto o unidad)</DrawerDescription>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-12 space-y-4">
                        <div className="text-center font-black text-slate-900 uppercase tracking-tighter text-xl mb-4 leading-tight">
                            ¿Qué Escaneaste?
                        </div>
                        <div className="grid gap-3">
                            {variantConflictItems.map((p, idx) => (
                                <button
                                    key={p.id || idx}
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(10);
                                        // Execute the add item logic using the exact selected product
                                        // We pass p.code as fallback if barcode is missing, so it doesn't fail
                                        executeAddItem(p, p.barcode || p.code || '');
                                        setIsVariantConflictModalOpen(false);
                                        setVariantConflictItems([]);
                                    }}
                                    className="w-full text-left bg-slate-50 active:bg-slate-100 hover:bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center transition-all active:scale-[0.98] shadow-sm"
                                >
                                    <div className="flex flex-col flex-1 pr-4">
                                        <span className="font-black text-sm text-slate-800 uppercase leading-snug">{p.name}</span>
                                        <div className="flex gap-2 mt-1 items-center">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Stock: {p.stock ?? 0}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                {p.barcode || p.code}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-emerald-600 tabular-nums">
                                        ${p.salePrice || p.price || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => {
                                setIsVariantConflictModalOpen(false);
                                setVariantConflictItems([]);
                            }}
                            className="w-full h-12 mt-4 mb-6 sm:mb-0 text-slate-500 font-bold text-xs uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* DRAWER DEVOLUCIÓN DE VENTAS CON PIN */}
            <Drawer open={isRefundModalOpen} onOpenChange={(open) => {
                setIsRefundModalOpen(open);
                if (!open) {
                    setSelectedSaleToRefund(null);
                    setRefundPin('');
                    setRefundSearch('');
                }
            }}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-12 sm:pb-safe font-sans max-h-[92vh] flex flex-col overflow-hidden">
                    <DrawerTitle className="sr-only">Devolución de Ventas</DrawerTitle>
                    <DrawerDescription className="sr-only">Procesar devolución de productos y dinero de la caja</DrawerDescription>
                    
                    <div className="p-5 pb-12 sm:pb-5 overflow-y-auto space-y-4 max-w-lg mx-auto w-full">
                        {!selectedSaleToRefund ? (
                            <>
                                <div className="text-center space-y-1">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-red-100">
                                        <RotateCcw className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">Devolución de Ventas</h3>
                                    <p className="text-xs font-medium text-slate-500">Seleccioná la venta del cliente para devolver productos</p>
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <Input 
                                        placeholder="Buscar por producto o cajero..." 
                                        value={refundSearch} 
                                        onChange={e => setRefundSearch(e.target.value)} 
                                        className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                                    {isLoadingRecentSales ? (
                                        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600" /></div>
                                    ) : recentSales.length === 0 ? (
                                        <div className="text-center py-10 text-xs font-bold text-slate-400 uppercase">No hay ventas registradas recientemente</div>
                                    ) : (
                                        recentSales
                                            .filter((s: any) => {
                                                if (!refundSearch.trim()) return true;
                                                const search = refundSearch.toLowerCase();
                                                const hasItem = (s.items || []).some((it: any) => (it.name || '').toLowerCase().includes(search));
                                                const hasEmployee = (s.employeeName || '').toLowerCase().includes(search);
                                                return hasItem || hasEmployee;
                                            })
                                            .map((sale: any) => {
                                                const isRefunded = sale.status === 'refunded';
                                                const isPartiallyRefunded = sale.status === 'partially_refunded';
                                                const saleItems = sale.items || [];
                                                return (
                                                    <div 
                                                        key={sale.id} 
                                                        className={cn(
                                                            "p-3.5 rounded-2xl border transition-all text-left space-y-2.5",
                                                            isRefunded ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm"
                                                        )}
                                                    >
                                                        {/* Fila 1: Datos y Monto */}
                                                        <div className="flex justify-between items-center gap-2">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-xs font-bold text-slate-600">
                                                                    {sale.date ? format(new Date(sale.date), 'HH:mm') : '-'} hs
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 truncate max-w-[110px]">
                                                                    {sale.employeeName || 'Dueño'}
                                                                </span>
                                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                    {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transf.' : sale.paymentMethod === 'qr' ? 'QR' : sale.paymentMethod === 'credit' ? 'Fiado' : 'Efectivo'}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm font-black text-slate-900 shrink-0 tabular-nums">
                                                                ${Number(sale.total || sale.amount || 0).toLocaleString('es-AR')}
                                                            </span>
                                                        </div>

                                                        {/* Fila 2: Lista de Artículos */}
                                                        <div className="space-y-0.5 text-xs text-slate-700 font-medium pl-2 border-l-2 border-slate-200">
                                                            {saleItems.length === 0 ? (
                                                                <p className="text-slate-400 italic">Venta General</p>
                                                            ) : (
                                                                saleItems.map((it: any, i: number) => (
                                                                    <p key={i} className="truncate">
                                                                        • {it.qty}x {it.name}
                                                                    </p>
                                                                ))
                                                            )}
                                                        </div>

                                                        {/* Fila 3: Acción */}
                                                        {isRefunded ? (
                                                            <div className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 text-center">
                                                                ↩️ Venta Devuelta Total
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1 pt-1">
                                                                {isPartiallyRefunded && (
                                                                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mb-1">
                                                                        ↩️ Devolución Parcial Registrada
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectSaleForRefund(sale)}
                                                                    className="w-full h-9 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                                                >
                                                                    <RotateCcw size={13} /> Devolver artículos de esta venta
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                {/* Encabezado de la Venta Seleccionada */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedSaleToRefund(null)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Volver a las ventas
                                    </button>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                        Venta #{selectedSaleToRefund.id.slice(-6)}
                                    </span>
                                </div>

                                <div className="text-left space-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                                            Elegí qué productos devolver
                                        </h3>
                                        <span className="text-xs font-bold text-slate-400">
                                            Ticket: ${Number(selectedSaleToRefund.total || selectedSaleToRefund.amount || 0).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Marcá las casillas de los artículos devueltos por el cliente:
                                    </p>
                                </div>

                                {/* Selección Rápida si son varios artículos */}
                                {selectedSaleToRefund.items && selectedSaleToRefund.items.length > 1 && (
                                    <div className="flex justify-end gap-3 text-[11px] font-bold">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const all: { [key: number]: number } = {};
                                                selectedSaleToRefund.items.forEach((it: any, idx: number) => {
                                                    all[idx] = Number(it.qty || 1);
                                                });
                                                setRefundItemQuantities(all);
                                            }}
                                            className="text-red-600 hover:underline"
                                        >
                                            Marcar todos
                                        </button>
                                        <span className="text-slate-300">•</span>
                                        <button
                                            type="button"
                                            onClick={() => setRefundItemQuantities({})}
                                            className="text-slate-500 hover:underline"
                                        >
                                            Desmarcar todos
                                        </button>
                                    </div>
                                )}

                                {/* Lista de Productos con Checkbox y Stepper */}
                                <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                                    {(selectedSaleToRefund.items || []).length === 0 ? (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
                                            Venta General sin desglose de productos. Se reintegrará el dinero de caja.
                                        </div>
                                    ) : (
                                        selectedSaleToRefund.items.map((it: any, idx: number) => {
                                            const maxQty = Number(it.qty || 1);
                                            const returnQty = refundItemQuantities[idx] || 0;
                                            const isChecked = returnQty > 0;
                                            const itemPrice = Number(it.price || it.salePrice || 0);

                                            return (
                                                <div 
                                                    key={idx}
                                                    className={cn(
                                                        "p-3 rounded-2xl border transition-all text-left space-y-2",
                                                        isChecked 
                                                            ? "bg-red-50/40 border-red-300 shadow-sm" 
                                                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <input 
                                                            type="checkbox"
                                                            id={`refund-item-${idx}`}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setRefundItemQuantities(prev => ({
                                                                    ...prev,
                                                                    [idx]: checked ? maxQty : 0
                                                                }));
                                                            }}
                                                            className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer shrink-0"
                                                        />
                                                        <label htmlFor={`refund-item-${idx}`} className="flex-1 min-w-0 cursor-pointer">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <p className="text-xs font-black uppercase text-slate-900 leading-snug">
                                                                    {it.name}
                                                                </p>
                                                                <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                                                                    ${(itemPrice * (isChecked ? returnQty : maxQty)).toLocaleString('es-AR')}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                                ${itemPrice.toLocaleString('es-AR')} c/u • Comprados: {maxQty} un.
                                                            </p>
                                                        </label>
                                                    </div>

                                                    {/* Control de cantidad devuelta si compró más de 1 unidad */}
                                                    {isChecked && maxQty > 1 && (
                                                        <div className="flex items-center justify-between pt-2 border-t border-red-200/60 pl-6">
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">
                                                                Cant. a devolver:
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRefundItemQuantities(prev => ({
                                                                        ...prev,
                                                                        [idx]: Math.max(1, (prev[idx] || 1) - 1)
                                                                    }))}
                                                                    className="w-7 h-7 bg-white border border-red-200 text-red-600 rounded-lg font-bold flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all text-xs"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="text-xs font-black text-slate-900 w-6 text-center tabular-nums">
                                                                    {returnQty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRefundItemQuantities(prev => ({
                                                                        ...prev,
                                                                        [idx]: Math.min(maxQty, (prev[idx] || 1) + 1)
                                                                    }))}
                                                                    className="w-7 h-7 bg-white border border-red-200 text-red-600 rounded-lg font-bold flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all text-xs"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Resumen del Reintegro */}
                                <div className="bg-red-50/70 border border-red-200 rounded-2xl p-3.5 space-y-1.5 text-xs text-left">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                                        <span>Reintegro al inventario:</span>
                                        <span className="text-slate-900 font-bold max-w-[200px] truncate text-right">
                                            {refundItemsCalculation.itemsToRefund.map(r => `${r.returnQty}x ${r.item.name}`).join(', ') || 'Ninguno seleccionado'}
                                        </span>
                                    </div>
                                    <div className="border-t border-red-200/70 pt-1.5 flex justify-between items-center font-black text-sm text-slate-900">
                                        <span className="text-xs uppercase">Dinero a devolver de caja:</span>
                                        <span className="text-base text-red-600 tabular-nums">
                                            -${refundItemsCalculation.totalAmount.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Motivo Opcional */}
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        Motivo (opcional)
                                    </label>
                                    <Input 
                                        value={refundReason}
                                        onChange={e => setRefundReason(e.target.value)}
                                        placeholder="Ej: Cambio de producto / Fallado"
                                        className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                                    />
                                </div>

                                {/* PIN de Seguridad */}
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                                        <Lock className="w-3.5 h-3.5 text-red-600" /> Clave de Autorización
                                    </label>
                                    <Input 
                                        type="password"
                                        maxLength={4}
                                        value={refundPin}
                                        onChange={e => setRefundPin(e.target.value)}
                                        placeholder="••••"
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 text-center text-lg font-black tracking-[0.25em]"
                                    />
                                    <p className="text-[9px] text-slate-400 font-medium text-center">Clave de 4 dígitos del negocio requerida para autorizar</p>
                                </div>

                                {/* Botones de Confirmación */}
                                <div className="grid grid-cols-2 gap-2 pt-1 pb-8 sm:pb-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSelectedSaleToRefund(null)}
                                        className="h-11 rounded-xl font-bold uppercase tracking-wider text-xs border-slate-200"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleConfirmRefund}
                                        disabled={isProcessingRefund || refundItemsCalculation.totalAmount <= 0 || refundPin.length < 4}
                                        className="h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-md disabled:opacity-50"
                                    >
                                        {isProcessingRefund ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirmar ($${refundItemsCalculation.totalAmount.toLocaleString('es-AR')}) ↩️`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default function PosInterface() {
    return (
        <RoleGuard moduleName="Caja y Ventas" allowedRoles={['admin', 'cashier', 'cashier_warehouse', 'accountant']}>
            <PosInterfaceContent />
        </RoleGuard>
    );
}

function PosInterfaceContent() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#FF0000] w-10 h-10" /></div>}>
            <SalesTerminalContent />
        </Suspense>
    );
}
