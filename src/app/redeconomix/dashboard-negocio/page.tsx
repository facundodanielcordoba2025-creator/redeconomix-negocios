'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Package, ShoppingCart, DollarSign, ArrowDownRight, Users, 
  Trophy, History, TrendingUp, Lock, ChevronRight, LayoutDashboard,
  Wallet, ArrowUpRight, BarChart3, AlertTriangle, Info, Clock, ShieldCheck,
  Store, Loader2, Save, Calendar, Activity, TrendingDown, Calculator,
  Sparkles, Copy, MessageCircle, Sparkles as SparklesIcon, Rocket, BookOpen,
  FileDown, Unlock, ShoppingBag, FileText, Briefcase, Smartphone
} from 'lucide-react';
import { FloatingCartPanel } from '@/components/floating-cart-panel';
import { RoleGuard } from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, getDocs, getDoc, limit, addDoc, updateDoc, doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { startOfDay, endOfDay, format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { useRole } from '@/hooks/use-role';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendSecurityPinEmail } from '../actions';
import { RedEconomiXHeader } from '@/components/redeconomix-header';


/* ============================================================
   NAV BUTTON COMPONENT (For NEGOCIO Tab)
   ============================================================ */
function DashboardNavButton({ title, icon: Icon, href, color, onClick }: { title: string, icon: any, href?: string, color: string, onClick?: () => void }) {
    const Component = href ? Link : 'button';
    
    // Filtramos la clase de fondo (ej: "bg-red-50") para que solo quede el color del texto ("text-red-600")
    const textColorOnly = color.split(' ').filter(c => !c.startsWith('bg-')).join(' ');

    return (
        <Component href={href || "#"} onClick={onClick} className="flex flex-col items-center gap-3 w-full group">
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn("flex items-center justify-center transition-all h-14", textColorOnly)}
            >
                <Icon className="h-10 w-10 opacity-90 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center leading-tight group-hover:text-slate-900 transition-colors">{title}</span>
        </Component>
    );
}

/* ============================================================
   MAIN DASHBOARD PAGE
   ============================================================ */
export default function BusinessDashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { role, cashierName, lockSession, employee, effectiveRetailerId } = useRole();

    const [showSecurityTooltip, setShowSecurityTooltip] = useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', effectiveRetailerId || "");
    }, [firestore, effectiveRetailerId, user]);
    const { data: userData } = useDoc(userDocRef);
    const verificationStatus = userData?.verificationStatus || (userData?.isVerified ? 'verified' : 'pending');

    // Business Logic States (From remote)
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [calcResult, setCalcResult] = useState<string>('');
    const [expenseConcept, setExpenseConcept] = useState('');
    const [expenseProvider, setExpenseProvider] = useState('');
    const [providerPhone, setProviderPhone] = useState('');
    const [isStockPurchase, setIsStockPurchase] = useState(false);
    const [stockCode, setStockCode] = useState('');
    const [stockQty, setStockQty] = useState('');



    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [initialCash, setInitialCash] = useState<string>('');
    const [finalCashInput, setFinalCashInput] = useState<string>('');
    const [isClosingShift, setIsClosingShift] = useState(false);
    const [shiftCashierName, setShiftCashierName] = useState('');

    useEffect(() => {
        if (employee?.name) {
            setShiftCashierName(employee.name);
        } else if (role === 'admin') {
            setShiftCashierName('Dueño (Admin)');
        }
    }, [employee, role]);

    
    // Shift Report Logic
    const [closingStep, setClosingStep] = useState<'input' | 'summary'>('input');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isOpeningShiftLoading, setIsOpeningShiftLoading] = useState(false);
    const [shiftReport, setShiftReport] = useState<any>(null);

    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [maintenanceStep, setMaintenanceStep] = useState<'request' | 'validate' | 'actions'>('request');
    const [isCleaning, setIsCleaning] = useState(false);
    const [maintenancePin, setMaintenancePin] = useState('');
    const [cleanRange, setCleanRange] = useState<'24h' | '7d' | '15d' | '1m' | 'all'>('24h');
    const [isSendingPin, setIsSendingPin] = useState(false);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

    // Branches & Shift Branch Persistence
    const branchesQuery = useMemoFirebase(() => {
        if (!firestore || !effectiveRetailerId) return null;
        return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', effectiveRetailerId));
    }, [firestore, effectiveRetailerId]);
    const { data: branches } = useCollection(branchesQuery);

    const [shiftBranchId, setShiftBranchId] = useState<string>('central');

    useEffect(() => {
        if (employee?.branchId) {
            setShiftBranchId(employee.branchId);
        } else if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('redeconomix_active_branch');
            if (saved) setShiftBranchId(saved);
        }
    }, [employee?.branchId]);

    // Shift Logic (Scoped to each cashier/admin)
    const activeShiftQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const targetEmployeeId = role === 'admin' ? 'admin' : (employee?.id || null);
        if (!targetEmployeeId && role !== 'admin') return null;

        return query(
            collection(firestore, 'retailer_shifts'),
            where('retailerId', '==', effectiveRetailerId || ""),
            where('status', '==', 'open'),
            where('employeeId', '==', targetEmployeeId),
            limit(1)
        );
    }, [firestore, user, role, employee?.id, effectiveRetailerId]);
    const { data: activeShiftData, isLoading: isLoadingShift } = useCollection(activeShiftQuery);
    const currentShift = activeShiftData && activeShiftData.length > 0 ? activeShiftData[0] : null;

    useEffect(() => {
        if (currentShift?.branchId) {
            setShiftBranchId(currentShift.branchId);
            if (typeof window !== 'undefined') {
                localStorage.setItem('redeconomix_active_branch', currentShift.branchId);
            }
        }
    }, [currentShift?.branchId]);

    // UI List only needs 5 recent ops
    const opsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        let q = query(
            collection(firestore, 'retailer_daily_operations'), 
            where('retailerId', '==', effectiveRetailerId || ""), 
            where('date', '>=', startOfDay(new Date()).toISOString())
        );
        if (role !== 'admin' && employee?.branchId) {
            q = query(q, where('branchId', '==', employee.branchId));
        }
        return query(q, limit(5));
    }, [firestore, user, role, employee?.branchId]);
    const { data: allOps, isLoading } = useCollection(opsQuery);

    const pendingReceiptsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'retailer_daily_operations'),
            where('retailerId', '==', effectiveRetailerId || ""),
            where('date', '>=', startOfDay(new Date()).toISOString())
        );
    }, [firestore, effectiveRetailerId, user]);
    const { data: todayAllOps } = useCollection(pendingReceiptsQuery);
    
    const pendingReceipts = (todayAllOps || []).filter(op => 
        (op.type === 'sale' || op.type === 'credit_sale') && op.receiptSent === false
    );

    // DAILY SUMMARY LOGIC (O(1) Doc Read instead of O(N) Collection)
    const dailySummaryRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const dateId = format(new Date(), 'yyyy-MM-dd');
        return doc(firestore, 'retailer_daily_summaries', `${effectiveRetailerId}_${dateId}`);
    }, [firestore, effectiveRetailerId, user]);
    const { data: dailySummary } = useDoc(dailySummaryRef);

    const ventasContado = dailySummary?.ventasContado || 0;
    const ventasTransferencia = dailySummary?.ventasTransferencia || 0;
    const ventasFiadoHoy = dailySummary?.ventasFiado || 0;
    const ventasQR = dailySummary?.ventasQR || 0;
    const dailyExpenses = dailySummary?.dailyExpenses || 0;
    // We assume cobrosFiado will be added to the summary later, for now we will also fetch the credit ops
    
    // Credit Transactions Logic (Today) - We can keep this for now since it's small, or we can also move cobros to the summary
    const creditOpsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        let q = query(
            collection(firestore, 'retailer_credit_transactions'),
            where('retailerId', '==', effectiveRetailerId || ""),
            where('date', '>=', startOfDay(new Date()).toISOString())
        );
        if (role !== 'admin' && employee?.branchId) {
            q = query(q, where('branchId', '==', employee.branchId));
        }
        return q;
    }, [firestore, user, role, employee?.branchId]);
    const { data: creditOps } = useCollection(creditOpsQuery);

    const cobrosFiadoHoy = useMemo(() => {
        if (!creditOps) return 0;
        return creditOps
            .filter((op: any) => op.type === 'pago')
            .reduce((sum: number, op: any) => sum + (op.amount || 0), 0);
    }, [creditOps]);

    // Active Credit Lines Logic (Debtors) - Keeping it as it's needed to show total pending debt if used in UI
    const activeCreditLinesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'retailer_credit_lines'),
            where('retailerId', '==', effectiveRetailerId || ""),
            where('currentDebt', '>', 0)
        );
    }, [firestore, effectiveRetailerId, user]);
    const { data: activeCreditLines } = useCollection(activeCreditLinesQuery);

    const dailySales = ventasContado + ventasTransferencia + ventasQR;
    const efectivoEnCajaHoy = ventasContado + cobrosFiadoHoy;

    const sendWhatsAppReceipt = (op: any) => {
        if (!firestore) return;
        const { amount, customerName, customerPhone, items, paymentMethod, id, date } = op;
        const methodLabel =
            paymentMethod === 'cash' ? 'Efectivo' :
            paymentMethod === 'transfer' ? 'Transferencia bancaria' :
            paymentMethod === 'qr' ? 'QR / CBU' :
            paymentMethod === 'credit' ? 'Cuenta corriente (fiado)' :
            paymentMethod || 'Otro';

        const itemsText = (items || [])
            .map((i: any) => `  ${i.qty}x ${i.name}  $${(i.price * i.qty).toLocaleString('es-AR')}`)
            .join('\n');

        let msg = `COMPROBANTE DE COMPRA\n`;
        const opDate = new Date(date || Date.now());
        msg += `${opDate.toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' })} - ${opDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n`;
        msg += `────────────────────────────\n`;
        msg += `Cliente: ${customerName || 'Consumidor Final'}\n`;
        msg += `Medio de pago: ${methodLabel}\n`;
        msg += `────────────────────────────\n`;
        msg += `${itemsText}\n\n`;
        msg += `*TOTAL: $${(amount || 0).toLocaleString('es-AR')}*\n`;
        msg += `────────────────────────────\n`;
        msg += `Gracias por su compra.\n\n`;
        msg += `Descarga tu App y obtené premios, descuentos, reintegros y mucho más.\n`;
        msg += `www.redeconomix.com`;

        const encodedMsg = encodeURIComponent(msg);
        try {
            if (id) {
                updateDoc(doc(firestore, 'retailer_daily_operations', id), { receiptSent: true }).catch(console.error);
            }
            const waUrl = customerPhone && customerPhone.trim().length >= 8
                ? `https://wa.me/549${customerPhone.replace(/[^0-9]/g,'')}?text=${encodedMsg}`
                : `https://api.whatsapp.com/send?text=${encodedMsg}`;
            
            window.open(waUrl, '_blank') || (window.location.href = waUrl);
        } catch (err: any) {
            console.error("Error al abrir WhatsApp:", err);
            toast({ title: "Error", description: "No se pudo abrir WhatsApp.", variant: "destructive" });
        }
    };

    const generateShiftReport = async () => {
        if (!firestore || !user || !currentShift) return;
        setIsGeneratingReport(true);
        try {
            const q = query(
                collection(firestore, 'retailer_daily_operations'),
                where('retailerId', '==', effectiveRetailerId || ""),
                where('date', '>=', currentShift.startTime)
            );
            const snapshot = await getDocs(q);
            let ops = snapshot.docs.map(doc => doc.data() as any);
            
            const shiftBranchId = currentShift.branchId || employee?.branchId;
            if (shiftBranchId) {
                ops = ops.filter((op: any) => op.branchId === shiftBranchId);
            }
            if (currentShift.employeeId && currentShift.employeeId !== 'admin') {
                ops = ops.filter((op: any) => op.employeeId === currentShift.employeeId || op.cashierName === currentShift.cashierName);
            } else if (currentShift.employeeId === 'admin') {
                ops = ops.filter((op: any) => !op.employeeId || op.employeeId === 'admin' || op.employeeName === 'Dueño');
            }
            
            let cash = 0;
            let transfer = 0;
            let qr = 0;
            let fiado = 0;
            let expenses = 0;
            let itemsObj: any = {};
            
            ops.forEach(op => {
                if (op.status === 'voided' || op.status === 'refunded') return;
                const amount = parseFloat(op.total || 0);
                if (op.type === 'expense') {
                    expenses += amount;
                } else if (op.type === 'sale' || op.type === 'credit_sale' || op.type === 'checkout') {
                    if (op.paymentMethod === 'mixed' && op.splitDetails) {
                        cash += parseFloat(op.splitDetails.cash || 0);
                        transfer += parseFloat(op.splitDetails.transfer || 0);
                        fiado += parseFloat(op.splitDetails.credit || 0);
                    } else if (op.paymentMethod === 'cash') cash += amount;
                    else if (op.paymentMethod === 'transfer') transfer += amount;
                    else if (op.paymentMethod === 'qr') qr += amount;
                    else if (op.paymentMethod === 'credit') fiado += amount;
                    
                    if (op.items && Array.isArray(op.items)) {
                        op.items.forEach((item: any) => {
                            if (!itemsObj[item.name]) itemsObj[item.name] = { qty: 0, total: 0 };
                            itemsObj[item.name].qty += parseFloat(item.qty || 1);
                            itemsObj[item.name].total += (parseFloat(item.price || 0) * parseFloat(item.qty || 1));
                        });
                    }
                }
            });
            
            const expectedCash = (currentShift.initialCash || 0) + cash - expenses;
            const actualCash = parseFloat(finalCashInput) || 0;
            const difference = actualCash - expectedCash;
            
            setShiftReport({
                cash, transfer, qr, fiado, expenses, 
                expectedCash, actualCash, difference,
                items: itemsObj
            });
            setClosingStep('summary');
        } catch (e: any) {
            console.error(e);
            toast({ title: "Error", description: e.message || "No se pudo generar el reporte", variant: "destructive" });
        } finally {
            setIsGeneratingReport(false);
        }
    };



    const handleCalcInput = (btn: string) => {
        if (btn === 'C') { setCalcResult(''); return; }
        if (btn === '=') {
            try {
                // Safe evaluation of basic math
                const result = Function('"use strict";return (' + (calcResult || '0').replace(/,/g, '.') + ')')();
                setCalcResult(String(result));
            } catch (e) {
                // do nothing if invalid
            }
            return;
        }
        setCalcResult(prev => {
            const currentStr = prev || '';
            // Prevent consecutive operators
            const lastChar = currentStr.slice(-1);
            const isOperator = ['+', '-', '*', '/'].includes(btn);
            if (isOperator && ['+', '-', '*', '/'].includes(lastChar)) {
                return currentStr.slice(0, -1) + btn;
            }
            return currentStr + btn;
        });
    };

    const handleConfirmExpense = async (method: 'cash' | 'transfer' | 'credit') => {
        if (!user || !firestore || !calcResult) return;
        if (!expenseProvider) {
            toast({ title: "Proveedor Faltante 🚫", description: "El nombre del proveedor es obligatorio.", variant: "destructive" });
            return;
        }

        let finalAmount = 0;
        try {
            finalAmount = Function('"use strict";return (' + (calcResult || '0').replace(/,/g, '.') + ')')();
        } catch (e) {
            toast({ title: "Monto Inválido 🚫", description: "Verificá la cuenta ingresada.", variant: "destructive" });
            return;
        }

        try {
            const targetBranch = currentShift?.branchId || shiftBranchId || employee?.branchId || 'central';
            const centralBranch = branches?.find((b: any) => b.isCentral);
            const normalizedBranchId = (targetBranch === 'central' && centralBranch?.id) ? centralBranch.id : targetBranch;

            if (isStockPurchase && stockCode) {
                const stockRef = query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', effectiveRetailerId || ""), where('code', '==', stockCode));
                const stockSnap = await getDocs(stockRef);
                if (!stockSnap.empty) {
                    const addQty = Math.max(0, parseInt(stockQty || '0', 10) || 0);
                    const invDoc = stockSnap.docs[0];
                    const updatePayload: any = {
                        stock: increment(addQty),
                        updatedAt: serverTimestamp()
                    };
                    if (normalizedBranchId) {
                        updatePayload[`stockByBranch.${normalizedBranchId}`] = increment(addQty);
                    }
                    await updateDoc(doc(firestore, 'retailer_inventory', invDoc.id), updatePayload);
                }
            }

            const batch = writeBatch(firestore);
            const expenseRef = doc(collection(firestore, 'retailer_daily_operations'));
            batch.set(expenseRef, {
                id: expenseRef.id,
                retailerId: effectiveRetailerId,
                type: 'expense',
                paymentMethod: method,
                total: finalAmount,
                concept: expenseConcept || (method === 'cash' ? 'Gasto Manual' : 'Extracción'),
                provider: expenseProvider,
                isStockPurchase,
                status: 'completed',
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                branchId: normalizedBranchId,
                employeeId: employee?.id || 'admin',
                employeeName: employee?.name || 'Dueño'
            });

            if (effectiveRetailerId) {
                const dateId = format(new Date(), 'yyyy-MM-dd');
                const summaryRef = doc(firestore, 'retailer_daily_summaries', `${effectiveRetailerId}_${dateId}`);
                batch.set(summaryRef, {
                    date: dateId,
                    retailerId: effectiveRetailerId,
                    dailyExpenses: increment(finalAmount),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }

            await batch.commit();

            toast({ title: "Gasto Registrado ✅", description: "Operación anotada exitosamente." });
            setIsExpenseModalOpen(false);
            setCalcResult('');
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: 'destructive' });
        }
    };

    const handleGeneratePin = async () => {
        if (!firestore || !user) return;
        setIsSendingPin(true);
        try {
            const newPin = Math.floor(1000 + Math.random() * 9000).toString();
            await updateDoc(doc(firestore, 'users', effectiveRetailerId || ""), {
                securityPin: newPin,
                pinCreatedAt: serverTimestamp()
            });
            
            // ENVÍO REAL MEDIANTE RESEND
            await sendSecurityPinEmail(user.email || '', newPin);

            toast({ 
                title: "📧 PIN Enviado", 
                description: `Revisá tu correo ${user.email}.` 
            });
            setMaintenanceStep('validate');
        } catch (e: any) {
            toast({ title: "Error", description: "No se pudo procesar el envío.", variant: 'destructive' });
        } finally {
            setIsSendingPin(false);
        }
    };

    const handleVerifyPin = async () => {
        if (!firestore || !user || !effectiveRetailerId) return;
        const userSnap = await getDoc(doc(firestore, 'users', effectiveRetailerId));
        const storedPin = userSnap.data()?.securityPin;

        if (storedPin && maintenancePin === String(storedPin)) {
            setMaintenanceStep('actions');
            toast({ title: "Acceso Concedido 🔓" });
        } else {
            toast({ title: "PIN Incorrecto 🚫", variant: 'destructive' });
        }
    };

    const handleResetBusiness = async () => {
        if (!firestore || !user) return;
        setIsCleaning(true);
        try {
            const collectionsToClear = ['retailer_daily_operations', 'retailer_inventory_logs', 'retailer_shifts', 'retailer_sales'];
            if (cleanRange === 'all') collectionsToClear.push('retailer_inventory');

            let dateLimit = new Date();
            if (cleanRange === '24h') dateLimit = subDays(new Date(), 1);
            else if (cleanRange === '7d') dateLimit = subDays(new Date(), 7);
            else if (cleanRange === '15d') dateLimit = subDays(new Date(), 15);
            else if (cleanRange === '1m') dateLimit = subDays(new Date(), 30);

            for (const colName of collectionsToClear) {
                let q;
                if (cleanRange === 'all') {
                    q = query(collection(firestore, colName), where('retailerId', '==', effectiveRetailerId || ""));
                } else {
                    q = query(
                        collection(firestore, colName), 
                        where('retailerId', '==', effectiveRetailerId || ""),
                        where('date', '>=', dateLimit.toISOString())
                    );
                }
                
                const snap = await getDocs(q);
                const batch = writeBatch(firestore);
                snap.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }

            toast({ title: "🚀 Mantenimiento Completado", description: "Los registros han sido depurados exitosamente." });
            setIsMaintenanceOpen(false);
            setMaintenanceStep('request');
            setMaintenancePin('');
            router.refresh();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: 'destructive' });
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <RoleGuard moduleName="Panel Principal" allowedRoles={['admin', 'cashier', 'warehouse', 'accountant', 'cashier_warehouse']}>
            <div className="min-h-screen bg-slate-50 -mx-4 md:-mx-8 lg:-mx-12 -mt-4 md:-mt-8 lg:-mt-12 pb-36">
            
            {/* 1. TOP WHITE HEADER (Under fixed red header) */}
            <div className="bg-white text-slate-900 rounded-b-[3.5rem] px-6 md:px-10 pt-[110px] max-sm:pt-[125px] pb-10 relative overflow-hidden shadow-sm border-b border-slate-100">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-slate-50 rounded-full blur-[100px]" />
                
                <div className="flex justify-between items-start md:items-center mb-6 relative z-10 w-full">
                    <button 
                        onClick={() => {
                            if (role !== 'locked') {
                                lockSession();
                                toast({ title: "Caja Bloqueada 🔒", description: "Inicia sesión nuevamente para continuar." });
                            }
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-sm border-none transition-all active:scale-95"
                    >
                        {role === 'admin' ? <Unlock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {role === 'admin' ? 'DUEÑO (ADMIN)' : 'EMPLEADO'}
                        </span>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[220px]">
                            {role === 'admin' 
                                ? (userData?.fantasyName || userData?.businessName || userData?.fullName || userData?.displayName || 'Comercio')
                                : (cashierName || 'Usuario')}
                        </span>
                    </div>

                    <button 
                        onClick={() => {
                            if (verificationStatus === 'verified') {
                                toast({ title: "Socio Verificado ✅", description: "Tu negocio cumple con todos los requisitos.", className: "bg-emerald-600 text-white border-none" });
                            } else if (verificationStatus === 'missing_data') {
                                toast({ title: "Faltan Datos ⚠️", description: "Completá tu perfil para verificarte.", className: "bg-amber-500 text-white border-none" });
                            } else {
                                toast({ title: "No Verificado ❌", description: "Aún no sos un socio verificado.", variant: "destructive" });
                            }
                        }}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-none transition-all active:scale-95",
                            verificationStatus === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                            verificationStatus === 'missing_data' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                            'bg-red-600 hover:bg-red-700 text-white'
                        )}
                    >
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="text-center space-y-3 relative z-10">
                    {role === 'admin' ? (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">SALDO VENTA DEL DIA</p>
                            <div className="text-5xl font-black tracking-tight flex items-center justify-center gap-1 text-slate-900">
                                <span className="text-2xl font-bold text-slate-400">$</span>
                                {dailySales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                <Info className="w-3 h-3 text-slate-300 ml-1" />
                            </div>
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 mt-4 bg-slate-50 rounded-full border border-slate-100">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Gastos del día</span>
                                <span className="text-[12px] font-black text-red-600">$ {dailyExpenses.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </>
                    ) : (
                        <div className="py-2">
                            <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest">
                                Operador de Caja Activo
                            </span>
                            <h2 className="text-2xl font-black uppercase text-slate-900 mt-2">
                                {cashierName || 'Turno Habilitado'}
                            </h2>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="container mx-auto px-5 -mt-8 relative z-20">
                
                {/* SHIFT STATUS (Premium Slider) */}
                {!isLoadingShift && (
                    <div className="mb-6">
                        {currentShift ? (
                            <div className="p-4 bg-white border border-red-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3 pl-2">
                                    <div className="relative">
                                        <Clock className="w-5 h-5 text-red-500" />
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Jornada Activa</span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{currentShift.cashierName}</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => { setIsShiftModalOpen(true); setIsClosingShift(true); }} 
                                    className="rounded-full bg-red-600 hover:bg-red-700 text-white border-none h-10 px-6 font-black uppercase text-[9px] tracking-widest transition-all shadow-sm active:scale-95"
                                >
                                    Cerrar Caja
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                onClick={() => { setIsShiftModalOpen(true); setIsClosingShift(false); }}
                                className="w-full h-16 max-sm:h-14 bg-red-600 hover:bg-red-700 text-white rounded-full font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 text-xs flex items-center justify-center gap-3"
                            >
                                <Lock className="w-5 h-5" /> Abrir Caja
                            </Button>
                        )}
                    </div>
                )}
                
                {/* SCANNER / VENTA RAPIDA */}
                <Link href="/redeconomix/dashboard-negocio/control-ventas">
                    <motion.div   className="bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20 text-white rounded-[2rem] p-6 flex items-center justify-between group transition-all mb-8">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Scan className="w-8 h-8" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black uppercase tracking-tight">Punto de Venta</h3>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    </motion.div>
                </Link>

                {/* 2. MÓDULOS DE GESTIÓN */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-6">
                                    {/* Módulos visibles para todos o según rol */}
                                    <DashboardNavButton title="Stock" icon={Package} href="/redeconomix/dashboard-negocio/stock" color="bg-red-50 text-red-600" />
                                    


                                    {role === 'admin' && (
                                        <>
                                            <DashboardNavButton title="Resumen" icon={LayoutDashboard} href="/redeconomix/dashboard-negocio/resumen" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Compras" icon={ShoppingCart} href="/redeconomix/dashboard-negocio/compras" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Contabilidad" icon={FileText} href="/redeconomix/dashboard-negocio/contabilidad" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Proveedores" icon={Users} href="/redeconomix/dashboard-negocio/proveedores" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Proyectos Expansión" icon={Briefcase} href="/redeconomix/dashboard-negocio/proyectos" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Registrar Gasto" icon={Wallet} onClick={() => setIsExpenseModalOpen(true)} color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Cuentas Corrientes" icon={BookOpen} href="/redeconomix/dashboard-negocio/fiado" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Recursos Humanos" icon={ShieldCheck} href="/redeconomix/dashboard-negocio/rrhh" color="bg-red-50 text-red-600" />
                                            <DashboardNavButton title="Ventas Online" icon={ShoppingBag} href="/redeconomix/dashboard-negocio/pedidos" color="bg-red-50 text-red-600" />
                                        </>
                                    )}

                                    {/* Para cajeros y almacén solo se muestra el botón de Stock (y Punto de Venta arriba) */}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODALS (From logic) */}
            {/* MODALS (From logic) */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="max-w-[420px] mx-auto rounded-[2.5rem] bg-white p-6 max-h-[95vh] overflow-y-auto border-none shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Registrar Gasto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="bg-slate-950 rounded-[2rem] p-5 text-right text-white shadow-xl">
                             <p className="text-[9px] font-bold text-slate-500 mb-1 uppercase italic tracking-widest">Monto del Egreso</p>
                             <div className="text-4xl font-black italic tracking-widest">${calcResult || '0'}</div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['7','8','9','/','4','5','6','*','1','2','3','-','C','0',',','+','='].map(btn => (
                                <Button 
                                    key={btn} 
                                    onClick={() => {
                                        if ("vibrate" in navigator) navigator.vibrate(20);
                                        handleCalcInput(btn);
                                    }} 
                                    className={cn(
                                        "h-12 max-sm:h-10 rounded-xl font-black text-lg max-sm:text-sm transition-all active:scale-90 shadow-sm", 
                                        btn === '=' ? "col-span-4 bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700" : "bg-slate-50 text-slate-900 border-none hover:bg-slate-100"
                                    )}
                                >
                                    {btn === '*' ? '×' : btn}
                                </Button>
                            ))}
                        </div>
                        
                        <div className={cn("space-y-2 pt-3 border-t border-slate-100 transition-opacity duration-200", calcResult ? "opacity-100" : "opacity-0 pointer-events-none hidden")}>
                            <Input placeholder="Proveedor" value={expenseProvider} onChange={e => setExpenseProvider(e.target.value)} className="h-10 rounded-xl bg-slate-50 font-bold" />
                            <Input placeholder="Descripción" value={expenseConcept} onChange={e => setExpenseConcept(e.target.value)} className="h-10 rounded-xl bg-slate-50 font-bold" />
                            <Button onClick={() => {
                                if ("vibrate" in navigator) navigator.vibrate(50);
                                handleConfirmExpense('cash');
                            }} className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-md shadow-red-600/20">Confirmar Pago Efectivo</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ROLE & SHIFT MODALS (Omitted details for brevity but they should be fully implemented as in remote) */}


            <Dialog open={isShiftModalOpen} onOpenChange={(val) => {
                setIsShiftModalOpen(val);
                if (!val) {
                    setClosingStep('input');
                    setShiftReport(null);
                    setFinalCashInput('');
                }
            }}>
                <DialogContent className="max-w-[420px] rounded-3xl p-6 bg-white shadow-2xl border-0 print:p-0 print:shadow-none print:rounded-none max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogTitle className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg mb-2 print:hidden">
                        {isClosingShift ? "Cierre de Turno" : "Apertura de Caja"}
                    </DialogTitle>
                    <div className="space-y-4 print:space-y-2 overflow-y-auto px-1 pb-2">
                        {!isClosingShift && (
                            <>
                                <Input value={shiftCashierName} onChange={e => setShiftCashierName(e.target.value)} placeholder="Nombre y Apellido del vendedor" readOnly={role !== 'admin'} className="h-14 rounded-2xl bg-slate-50 font-bold text-center" />
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-wider ml-1">Sucursal de esta Caja</label>
                                    <Select value={shiftBranchId} onValueChange={(val) => {
                                        setShiftBranchId(val);
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('redeconomix_active_branch', val);
                                        }
                                    }}>
                                        <SelectTrigger className="w-full h-14 bg-slate-50 border-slate-200 text-sm font-bold rounded-2xl">
                                            <div className="flex items-center gap-2">
                                                <Store className="w-4 h-4 text-slate-500" />
                                                <SelectValue placeholder="Seleccionar Sucursal" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="central" className="font-bold">Casa Central</SelectItem>
                                            {branches?.map((b: any) => (
                                                <SelectItem key={b.id} value={b.id} className="font-bold">{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        
                        {closingStep === 'input' && (
                            <>
                                <Input type="number" value={isClosingShift ? finalCashInput : initialCash} onChange={e => isClosingShift ? setFinalCashInput(e.target.value) : setInitialCash(e.target.value)} placeholder={isClosingShift ? "Monto final $" : "Monto inicial $"} className="h-14 rounded-2xl bg-slate-50 font-black text-2xl text-center" />
                                <Button 
                                    onClick={async () => {
                                        if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]);
                                        if(!firestore || !user) return;
                                        if(isClosingShift) {
                                            if(!finalCashInput) {
                                                toast({ title: "Falta el monto", description: "Ingresá el efectivo contado.", variant: "destructive" });
                                                return;
                                            }
                                            await generateShiftReport();
                                        } else {
                                            if (!shiftCashierName.trim()) {
                                                toast({ title: "Datos incompletos", description: "Por favor, ingresá el nombre y apellido del vendedor.", variant: "destructive" });
                                                return;
                                            }
                                            setIsOpeningShiftLoading(true);
                                            try {
                                                const branchToOpen = shiftBranchId || employee?.branchId || 'central';
                                                const branchObj = branches?.find((b: any) => b.id === branchToOpen);
                                                const branchNameToSave = branchToOpen === 'central' ? 'Casa Central' : (branchObj?.name || 'Sucursal');
                                                await addDoc(collection(firestore, 'retailer_shifts'), { 
                                                    retailerId: effectiveRetailerId, 
                                                    cashierName: shiftCashierName.trim() || employee?.name || 'Dueño', 
                                                    startTime: new Date().toISOString(), 
                                                    initialCash: Number(initialCash), 
                                                    status: 'open',
                                                    branchId: branchToOpen,
                                                    branchName: branchNameToSave,
                                                    employeeId: employee?.id || 'admin'
                                                });
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('redeconomix_active_branch', branchToOpen);
                                                }
                                                setIsShiftModalOpen(false);
                                            } catch (err: any) {
                                                toast({ title: "Error al abrir turno", description: err.message, variant: "destructive" });
                                            } finally {
                                                setIsOpeningShiftLoading(false);
                                            }
                                        }
                                    }}
                                    disabled={isGeneratingReport || isOpeningShiftLoading}
                                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
                                >
                                    {(isGeneratingReport || isOpeningShiftLoading) ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (isClosingShift ? "Cerrar Caja" : "Abrir Caja")}
                                </Button>
                            </>
                        )}
                        
                        {closingStep === 'summary' && shiftReport && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 print:space-y-2">
                                <div className="text-center print:block hidden mb-4">
                                    <h2 className="text-xl font-black uppercase">Resumen de Turno</h2>
                                    <p className="text-sm font-bold">Vendedor: {currentShift?.cashierName}</p>
                                    <p className="text-xs text-slate-500">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 print:bg-white print:border-black print:p-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 print:text-black print:border-black">Arqueo de Efectivo</h4>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 print:text-black"><span className="uppercase text-[9px]">Caja Inicial:</span> <span>${currentShift?.initialCash || 0}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 print:text-black"><span className="uppercase text-[9px]">+ Ventas Efectivo:</span> <span>${shiftReport.cash}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-rose-600 print:text-black"><span className="uppercase text-[9px]">- Egresos (Prov.):</span> <span>${shiftReport.expenses}</span></div>
                                    <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2 print:border-black"><span className="uppercase text-[10px]">Esperado en Sistema:</span> <span>${shiftReport.expectedCash}</span></div>
                                    <div className="flex justify-between text-sm font-black text-slate-900"><span className="uppercase text-[10px]">Efectivo Contado:</span> <span>${shiftReport.actualCash}</span></div>
                                    <div className={cn("flex justify-between text-sm font-black rounded-lg p-2 mt-2 print:border print:border-black print:bg-white print:text-black", shiftReport.difference >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                        <span className="uppercase text-[10px]">{shiftReport.difference >= 0 ? "Sobrante" : "Faltante"}:</span> 
                                        <span>${Math.abs(shiftReport.difference)}</span>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 print:bg-white print:border-black print:p-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 print:text-black print:border-black">Otros Medios de Pago</h4>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 print:text-black"><span className="uppercase text-[9px]">Transferencias:</span> <span>${shiftReport.transfer}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 print:text-black"><span className="uppercase text-[9px]">QR:</span> <span>${shiftReport.qr}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 print:text-black"><span className="uppercase text-[9px]">Mercadería Fiada:</span> <span>${shiftReport.fiado}</span></div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 print:bg-white print:border-black print:p-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 print:text-black print:border-black">Productos Vendidos</h4>
                                    <div className="max-h-[150px] overflow-y-auto space-y-2 print:max-h-none print:overflow-visible">
                                        {Object.keys(shiftReport.items).length > 0 ? Object.entries(shiftReport.items).map(([name, data]: any) => (
                                            <div key={name} className="flex justify-between text-[11px] font-bold text-slate-600 print:text-black">
                                                <span className="truncate w-3/4">{data.qty}x {name}</span>
                                                <span>${data.total}</span>
                                            </div>
                                        )) : <p className="text-[10px] font-bold text-slate-400 print:text-black">No hay productos registrados</p>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-4 print:hidden">
                                    <Button variant="outline" onClick={async () => {
                                        try {
                                            const { jsPDF } = await import('jspdf');
                                            const doc = new jsPDF();
                                            let y = 20;
                                            doc.setFont("helvetica", "bold");
                                            doc.setFontSize(16);
                                            doc.text("RESUMEN DE TURNO - REDECONOMIX", 105, y, { align: "center" });
                                            y += 15;
                                            
                                            doc.setFontSize(12);
                                            doc.setFont("helvetica", "normal");
                                            doc.text(`Cajero: ${currentShift?.cashierName || 'No definido'}`, 20, y);
                                            doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, y);
                                            y += 15;
                                            
                                            doc.setFont("helvetica", "bold");
                                            doc.text("ARQUEO DE CAJA", 20, y);
                                            y += 10;
                                            doc.setFont("helvetica", "normal");
                                            doc.text(`Caja Inicial: $${currentShift?.initialCash || 0}`, 20, y); y += 8;
                                            doc.text(`Ventas en Efectivo: $${shiftReport.cash}`, 20, y); y += 8;
                                            doc.text(`Egresos / Proveedores: $${shiftReport.expenses}`, 20, y); y += 8;
                                            doc.text(`Efectivo Final (Contado): $${shiftReport.actualCash}`, 20, y); y += 8;
                                            doc.setFont("helvetica", "bold");
                                            doc.text(`Diferencia: ${shiftReport.difference >= 0 ? '+' : '-'}$${Math.abs(shiftReport.difference)}`, 20, y); y += 15;
                                            
                                            doc.text("OTROS MEDIOS DE PAGO", 20, y);
                                            y += 10;
                                            doc.setFont("helvetica", "normal");
                                            doc.text(`Transferencias: $${shiftReport.transfer}`, 20, y); y += 8;
                                            doc.text(`QR: $${shiftReport.qr}`, 20, y); y += 8;
                                            doc.text(`Fiado (Cuenta Corriente): $${shiftReport.fiado}`, 20, y); y += 15;

                                            doc.setFont("helvetica", "bold");
                                            doc.text("PRODUCTOS VENDIDOS", 20, y);
                                            y += 10;
                                            doc.setFont("helvetica", "normal");
                                            Object.entries(shiftReport.items).forEach(([name, data]: any) => {
                                                if (y > 270) { doc.addPage(); y = 20; }
                                                doc.text(`${data.qty}x`, 20, y);
                                                doc.text(`${name}`, 35, y);
                                                doc.text(`$${data.total}`, 160, y);
                                                y += 8;
                                            });
                                            
                                            const fileName = `cierre-turno-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
                                            const pdfBlob = doc.output('blob');
                                            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                                            
                                            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                                await navigator.share({
                                                    files: [file],
                                                    title: 'Resumen de Turno',
                                                    text: 'Te comparto el reporte del cierre de turno.'
                                                });
                                                toast({ title: "Compartir", description: "Se abrió el menú para compartir." });
                                            } else {
                                                doc.save(fileName);
                                                toast({ title: "PDF Generado", description: "El reporte se ha descargado exitosamente." });
                                            }
                                        } catch (e: any) {
                                            toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" });
                                        }
                                    }} className="h-12 border-slate-200 text-slate-600 uppercase font-black tracking-widest text-[9px] gap-2">
                                        <FileDown className="w-4 h-4" /> PDF
                                    </Button>
                                    <Button variant="outline" onClick={() => {
                                        const text = `*Resumen de Turno: ${currentShift?.cashierName}*\n\n` +
                                            `*Arqueo*\n` +
                                            `- Caja Inicial: $${currentShift?.initialCash || 0}\n` +
                                            `- Ventas Efectivo: $${shiftReport.cash}\n` +
                                            `- Egresos (Prov.): $${shiftReport.expenses}\n` +
                                            `- Efectivo Contado: $${shiftReport.actualCash}\n` +
                                            `- Diferencia: ${shiftReport.difference >= 0 ? '+' : '-'}$${Math.abs(shiftReport.difference)}\n\n` +
                                            `*Otros*\n` +
                                            `- Transf: $${shiftReport.transfer}\n` +
                                            `- QR: $${shiftReport.qr}\n` +
                                            `- Fiado: $${shiftReport.fiado}\n`;
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
                                    }} className="h-12 bg-green-50 hover:bg-green-100 text-green-600 border-green-200 uppercase font-black tracking-widest text-[9px] gap-2">
                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                    </Button>
                                </div>
                                
                                <Button 
                                    onClick={async () => {
                                        if (!firestore) return;
                                        if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]);
                                        await updateDoc(doc(firestore, 'retailer_shifts', currentShift.id), { 
                                            endTime: new Date().toISOString(), 
                                            actualFinalCash: Number(finalCashInput), 
                                            report: shiftReport,
                                            status: 'closed' 
                                        });

                                        await addDoc(collection(firestore, 'retailer_daily_operations'), {
                                            retailerId: effectiveRetailerId,
                                            type: 'cierre',
                                            concept: `CIERRE DE CAJA: ${currentShift.cashierName || 'Dueño'}`,
                                            totalAmount: Number(finalCashInput),
                                            amount: Number(finalCashInput),
                                            total: Number(finalCashInput),
                                            paymentMethod: 'cash',
                                            status: 'completed',
                                            date: new Date().toISOString(),
                                            createdAt: serverTimestamp(),
                                            employeeName: currentShift.cashierName || 'Dueño',
                                        });
                                        setIsShiftModalOpen(false);
                                        lockSession();
                                        toast({ title: "Turno Cerrado 🔒", description: "Caja lista para el relevo del turno entrante." });
                                    }}
                                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest print:hidden shadow-xl shadow-red-600/30"
                                >
                                    Cerrar Turno y Entregar Caja
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Drawer open={isMaintenanceOpen} onOpenChange={(val) => { setIsMaintenanceOpen(val); if(!val) setMaintenanceStep('request'); }}>
                <DrawerContent className="max-w-[420px] mx-auto rounded-t-[3rem] p-8 pb-32 bg-white shadow-2xl border-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {maintenanceStep === 'request' && (
                            <motion.div key="request" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-center space-y-6">
                                <div className="w-20 h-20 max-sm:h-14 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <DrawerTitle className="text-2xl font-black uppercase tracking-tight">Acceso al Vault</DrawerTitle>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Para realizar cambios sensibles, solicitá tu PIN.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm"><Save className="w-4 h-4 text-slate-400" /></div>
                                    <span className="text-[9px] font-black text-slate-900 truncate">{user?.email}</span>
                                </div>
                                <Button 
                                    onClick={() => {
                                        if ("vibrate" in navigator) navigator.vibrate(30);
                                        handleGeneratePin();
                                    }} 
                                    disabled={isSendingPin}
                                    className="w-full h-16 max-sm:h-12 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all shadow-xl shadow-red-500/20"
                                >
                                    {isSendingPin ? <Loader2 className="animate-spin" /> : "GENERAR NÚMERO DE PIN"}
                                </Button>
                            </motion.div>
                        )}

                        {maintenanceStep === 'validate' && (
                            <motion.div key="validate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-center space-y-6">
                                <div className="w-20 h-20 max-sm:h-14 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 mx-auto">
                                    <Clock className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <DrawerTitle className="text-2xl font-black uppercase tracking-tight">Validar Identidad</DrawerTitle>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Ingresá el PIN que recibiste por correo.</p>
                                </div>
                                <Input 
                                    type="number" 
                                    value={maintenancePin} 
                                    onChange={e => setMaintenancePin(e.target.value)} 
                                    placeholder="4 DÍGITOS" 
                                    className="h-20 max-sm:h-14 rounded-[2rem] bg-slate-50 border-slate-100 text-center text-4xl font-black tracking-[0.5em] italic"
                                    autoFocus
                                />
                                <div className="flex flex-col gap-3">
                                    <Button onClick={() => {
                                        if ("vibrate" in navigator) navigator.vibrate(30);
                                        handleVerifyPin();
                                    }} className="h-16 max-sm:h-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">Validar Acceso</Button>
                                    <button onClick={() => setMaintenanceStep('request')} className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors">Volver a solicitar PIN</button>
                                </div>
                            </motion.div>
                        )}

                        {maintenanceStep === 'actions' && (
                            <motion.div key="actions" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                                <div className="w-20 h-20 max-sm:h-14 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <DrawerTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Centro de Control</DrawerTitle>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Acciones Administrativas</p>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    {/* LIMPIEZA DE DATOS */}
                                    <div className="pt-4 border-t border-slate-50">
                                        <p className="text-[9px] font-black uppercase text-slate-400 mb-3 text-left">Limpieza de Datos</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { id: '24h', label: 'Últimas 24hs' },
                                                { id: '7d', label: 'Últimos 7 días' },
                                                { id: '15d', label: 'Últimos 15 días' },
                                                { id: '1m', label: 'Último Mes' },
                                                { id: 'all', label: 'Inicio de Actividad (TODO)' }
                                            ].map((r) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setCleanRange(r.id as any)}
                                                    className={cn(
                                                        "p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between",
                                                        cleanRange === r.id ? "bg-rose-500 text-white border-rose-500 shadow-lg" : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                                                    )}
                                                >
                                                    {r.label}
                                                    {cleanRange === r.id && <ShieldCheck className="w-4 h-4 text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => {
                                        if ("vibrate" in navigator) navigator.vibrate([100, 100, 100]);
                                        handleResetBusiness();
                                    }}
                                    disabled={isCleaning}
                                    className={cn(
                                        "w-full h-16 max-sm:h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl",
                                        cleanRange === 'all' ? "bg-rose-600 text-white shadow-rose-900/20" : "bg-slate-900 text-white"
                                    )}
                                >
                                    {isCleaning ? <Loader2 className="animate-spin" /> : `CONFIRMAR BORRADO: ${cleanRange.toUpperCase()}`}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DrawerContent>
            </Drawer>

            <Drawer open={isReferralModalOpen} onOpenChange={setIsReferralModalOpen}>
                <DrawerContent className="max-w-[420px] mx-auto rounded-t-[3.5rem] bg-white p-0 pb-32 overflow-hidden border-none shadow-2xl">
                    <div className="p-10 text-center bg-amber-400 text-black">
                        <Trophy className="h-16 max-sm:h-12 w-16 mx-auto mb-4" />
                        <DrawerTitle className="text-3xl font-black uppercase tracking-tight leading-tight">¡Invitá y Gana!</DrawerTitle>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">Crecé tu red de beneficios</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-600 leading-relaxed text-center italic">
                                "Invitá a otro comercio a unirse a RedEconomiX. Por cada uno que realice su primera compra, recibís <span className="text-primary font-black">$1.000 en crédito</span> inmediato."
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Tu Link de Invitación</p>
                            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                                <span className="flex-1 px-4 text-[11px] font-bold text-slate-500 truncate">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/redeconomix/invitacion?ref=${effectiveRetailerId?.substring(0, 8)}` : ''}
                                </span>
                                <Button 
                                    size="sm" 
                                    className="h-10 rounded-xl bg-slate-900 text-white"
                                    onClick={() => {
                                        if ("vibrate" in navigator) navigator.vibrate(20);
                                        const url = `${window.location.origin}/redeconomix/invitacion?ref=${effectiveRetailerId?.substring(0, 8)}`;
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "Link Copiado", description: "Ya podés compartirlo con otros negocios." });
                                    }}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-16 max-sm:h-12 rounded-2xl bg-amber-400 hover:bg-amber-500 text-black font-black uppercase text-xs tracking-widest"
                            onClick={() => {
                                if ("vibrate" in navigator) navigator.vibrate(30);
                                const url = `${window.location.origin}/redeconomix/invitacion?ref=${effectiveRetailerId?.substring(0, 8)}`;
                                const text = `👋 ¡Hola! Te invito a sumarte a RedEconomiX. Registrate desde mi link y aprovechá los precios mayoristas:\n\n${url}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                        >
                            Compartir en WhatsApp <MessageCircle className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
            <FloatingCartPanel />
        </div>
        </RoleGuard>
    );
}
