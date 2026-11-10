'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, Truck, Ban, Store, Search as SearchIcon,
  Clock, Zap, CheckCircle2, Calendar, DollarSign,
  Info, Rocket, Star, MessageSquare, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { OrderReceiptDialog } from '@/components/redeconomix-order-receipt';
import { OrderChatDialog } from '@/components/order-chat-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { processOrderCommission } from '@/lib/commission-engine';

type Order = {
  id: string;
  retailerId: string;
  retailerName: string;
  retailerBusinessName?: string;
  items: { productId: string; name: string; quantity: number; priceAtPurchase: number }[];
  totalAmount: number;
  status: 'pending' | 'received' | 'processing' | 'listo_para_despacho' | 'shipping' | 'delivered' | 'cancelled' | 'reception_confirmed';
  createdAt: { toDate: () => Date };
  displayId?: string;
  paymentMethod?: string;
  deliveryMethod?: string;
  amountTendered?: number;
  changeDue?: number;
  retailerAccountType?: string;
};

/* ============================================================
   CANCELLATION DIALOG
   ============================================================ */
function CancellationDialog({ order, isOpen, onClose, onConfirm }: { order: any, isOpen: boolean, onClose: () => void, onConfirm: (orderId: string, reason: string) => void }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] border-none font-sans pb-safe">
                <DrawerHeader className="px-6 pt-6 pb-2">
                    <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                    <DrawerTitle className="text-2xl font-black tracking-tight text-slate-900">Cancelar Pedido</DrawerTitle>
                    <DrawerDescription className="text-slate-500 font-semibold text-xs mt-1">Indica el motivo del rechazo para notificar al cliente.</DrawerDescription>
                </DrawerHeader>
                <div className="px-6 pb-8 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Motivo de Cancelación</Label>
                        <Textarea
                            placeholder="Ej: Falta de stock, zona no cubierta..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-slate-50 border-slate-100 rounded-2xl h-32 focus:ring-primary text-slate-900"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={onClose} 
                            className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-500 font-bold text-sm active:bg-slate-100 transition-all touch-manipulation select-none active:scale-[0.98]"
                        >
                            Volver
                        </button>
                        <button 
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(8);
                                onConfirm(order.id, reason);
                            }} 
                            disabled={!reason.trim()} 
                            className="flex-grow-[2] h-14 rounded-2xl bg-rose-600 text-white font-bold text-sm active:bg-rose-700 transition-all touch-manipulation select-none active:scale-[0.98] disabled:opacity-50"
                        >
                            Confirmar Cancelación
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

/* ============================================================
   LOGISTICS CHOICE DIALOG
   ============================================================ */
function LogisticsChoiceDialog({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (type: 'own' | 'platform') => void }) {
    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] border-none font-sans pb-safe">
                <DrawerHeader className="px-6 pt-6 pb-2">
                    <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                    <DrawerTitle className="text-2xl font-black tracking-tight text-slate-900">Tipo de Despacho</DrawerTitle>
                    <DrawerDescription className="text-slate-500 font-semibold text-xs mt-1">¿Quién realizará la entrega?</DrawerDescription>
                </DrawerHeader>
                <div className="px-6 pb-8 space-y-4 grid gap-1">
                    <button 
                        onClick={() => {
                            if ('vibrate' in navigator) navigator.vibrate([8]);
                            onConfirm('own');
                        }}
                        className="flex items-center gap-6 p-6 rounded-[2rem] border border-slate-100 active:border-primary/20 active:bg-slate-50/50 transition-all text-left group touch-manipulation select-none active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center transition-colors">
                            <Store className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Logística Propia</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">Gestionada por tu depósito</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => {
                            if ('vibrate' in navigator) navigator.vibrate([8]);
                            onConfirm('platform');
                        }}
                        className="flex items-center gap-6 p-6 rounded-[2rem] border border-slate-100 active:border-primary/20 active:bg-slate-50/50 transition-all text-left group touch-manipulation select-none active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center transition-colors">
                            <Rocket className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Logística Cohete</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">Repartidores de la red</p>
                        </div>
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default function StoreOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { effectiveRetailerId } = useRole();
    const targetRetailerId = effectiveRetailerId || user?.uid;
    const { toast } = useToast();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
    const [chatOrder, setChatOrder] = useState<Order | null>(null);
    const [actionOrder, setActionOrder] = useState<Order | null>(null); // Drawer de acciones nativo

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(
            collection(firestore, "orders_wholesaler"),
            where("wholesalerId", "==", targetRetailerId)
        );
    }, [firestore, user, targetRetailerId]);

    const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery as any);
    const [dispatchingOrder, setDispatchingOrder] = useState<Order | null>(null);

    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    useEffect(() => {
        if (!isUserLoading && !isLoadingOrders) {
            const params = new URLSearchParams(window.location.search);
            const openOrderId = params.get('openOrder');
            if (openOrderId) {
                setHighlightedId(openOrderId);
                if (orders?.some(o => o.id === openOrderId)) {
                    setSelectedOrderId(openOrderId);
                }
            }
        }
    }, [isUserLoading, isLoadingOrders, orders]);

    const selectedOrder = useMemo(() => orders?.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);

    const [filterStatus, setFilterStatus] = useState('Todos');

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        const sorted = [...orders].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });

        let result = sorted;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((o: Order) => 
                (o.displayId || o.id).toLowerCase().includes(q) ||
                (o.retailerBusinessName || o.retailerName || '').toLowerCase().includes(q)
            );
        }
        
        if (filterStatus === 'Activos') return result.filter((o: Order) => ['pending', 'received', 'processing', 'listo_para_despacho', 'shipping'].includes(o.status));
        if (filterStatus === 'Entregados') return result.filter((o: Order) => ['delivered', 'reception_confirmed'].includes(o.status));
        if (filterStatus === 'Cancelados') return result.filter((o: Order) => o.status === 'cancelled');
        
        return result;
    }, [orders, searchQuery, filterStatus]);

    const statusLabelsEs: Record<string, string> = {
        pending: 'Nuevo Pedido',
        received: 'Pedido Recibido',
        processing: 'En Preparación',
        listo_para_despacho: 'Listo para Despacho',
        shipping: 'En Camino',
        delivered: 'Entregado',
        reception_confirmed: 'Recepción Confirmada',
        cancelled: 'Cancelado',
    };


    const handleStatusChange = async (orderId: string, newStatus: Order['status'], reason?: string) => {
        if (!firestore || !user) return;
        toast({ title: 'Actualizando estado...' });
        try {
            // Todos los pedidos están en orders_wholesaler (colección unificada)
            const orderRef = doc(firestore, 'orders_wholesaler', orderId);
            await updateDoc(orderRef, { 
                status: newStatus, 
                updatedAt: serverTimestamp(),
                ...(reason ? { cancellationReason: reason } : {})
            });
            const etiqueta = statusLabelsEs[newStatus] || newStatus;
            toast({ title: '✅ Estado actualizado', description: `Pedido marcado como: ${etiqueta}` });

            // Notificaciones y emails en segundo plano
            try {
                const { updateWholesalerOrderStatus } = await import('../../actions');
                await updateWholesalerOrderStatus(orderId, newStatus, reason);
            } catch (serverErr) {
                console.warn('Server action falló (notificaciones):', serverErr);
            }

            // Procesar comisión si aplica
            if (newStatus === 'delivered' || newStatus === 'reception_confirmed') {
                processOrderCommission(firestore, orderId).catch(console.error);
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error al actualizar', description: 'Verificá tu conexión e intentá de nuevo.', variant: 'destructive' });
        }
    };



    const handleStartRoute = async (order: Order, type: 'own' | 'platform') => {
        if (!firestore || !user) return;
        setDispatchingOrder(null);
        toast({ title: 'Iniciando despacho...' });
        try {
            const routeData = {
                wholesalerId: targetRetailerId,
                wholesalerName: (order as any).wholesalerName || orders?.find(o => o.wholesalerId === targetRetailerId)?.wholesalerName || "Mayorista", 
                carrierId: type === 'own' ? 'INTERNAL_FLEET' : null,
                status: type === 'own' ? 'assigned' : 'pending',
                cityId: 'CABA', 
                totalStops: 1,
                stops: [{ 
                    orderId: order.id || '', 
                    retailerName: order.retailerBusinessName || order.retailerName || 'Cliente', 
                    address: (order as any).retailerAddress || 'Dirección Cliente', 
                    status: 'pending' 
                }],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            await addDoc(collection(firestore, 'deliveryRoutes'), routeData);
            const orderRef = doc(firestore, 'orders_wholesaler', order.id);
            await updateDoc(orderRef, { status: 'shipping', updatedAt: serverTimestamp() });
            toast({ title: '¡Pedido en camino!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error al despachar', variant: 'destructive' });
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending':
            case 'received': return { label: 'Nuevo Pedido', color: 'bg-red-600 text-white shadow-md', icon: Clock };
            case 'processing': return { label: 'En Preparación', color: 'bg-slate-700 text-white shadow-sm', icon: Zap };
            case 'listo_para_despacho': return { label: 'Listo para Despacho', color: 'bg-red-500 text-white font-bold', icon: CheckCircle2 };
            case 'shipping': return { label: 'En Camino', color: 'bg-slate-800 text-white shadow-sm', icon: Truck };
            case 'delivered': 
            case 'reception_confirmed': return { label: 'Entregado', color: 'bg-slate-100 text-slate-500', icon: Truck };
            case 'cancelled': return { label: 'Cancelado', color: 'bg-slate-100 text-slate-400', icon: Ban };
            default: return { label: status, color: 'bg-slate-100 text-slate-400', icon: Info };
        }
    };

    if (isUserLoading || isLoadingOrders) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 min-h-screen bg-white font-sans pb-28 px-4 pt-[90px] md:pt-4">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-none">Ventas <span className="text-primary">Online</span></h1>
                    <p className="text-slate-500 font-medium text-sm">Gestión de tus pedidos web.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar ID o Cliente..."
                        className="h-12 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['Todos', 'Activos', 'Entregados', 'Cancelados'].map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            if ('vibrate' in navigator) navigator.vibrate(6);
                            setFilterStatus(status);
                        }}
                        className={cn(
                            "px-6 py-2.5 rounded-full font-bold text-sm transition-all border whitespace-nowrap active:scale-95 select-none touch-manipulation",
                            filterStatus === status 
                                ? "bg-primary text-white border-primary shadow-lg shadow-red-500/20" 
                                : "bg-slate-50 text-slate-500 border-slate-100 active:bg-slate-200"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                <AnimatePresence>
                {filteredOrders.map((order, idx) => {
                    const style = getStatusStyle(order.status);
                    const totalUnits = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
                    return (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                            <Card className={cn(
                                "border-slate-100 shadow-sm rounded-2xl overflow-hidden group relative",
                                order.id === highlightedId && "ring-2 ring-primary animate-pulse"
                            )}>
                                <div className="p-5 flex flex-col md:flex-row gap-5 relative">
                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Store className="h-6 w-6 text-primary/30" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold tracking-tight text-slate-900">{totalUnits} {totalUnits === 1 ? 'Unidad' : 'Unidades'}</h3>
                                                <Badge className={cn("rounded-md font-bold text-[9px] px-2 py-0.5 border-none", style.color)}>
                                                    {style.label}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-bold text-slate-900 truncate pr-16">
                                                {order.retailerBusinessName || order.retailerName}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {order.paymentMethod === 'efectivo' && (
                                                    <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] px-2 py-0">
                                                        Efectivo {order.amountTendered ? `(Paga con $${order.amountTendered.toLocaleString('es-AR')})` : ''} 
                                                        {order.changeDue && order.changeDue > 0 ? ` - Vuelto: $${order.changeDue.toLocaleString('es-AR')}` : ''}
                                                    </Badge>
                                                )}
                                                {order.paymentMethod === 'transferencia' && (
                                                    <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] px-2 py-0">Transferencia</Badge>
                                                )}
                                                {order.deliveryMethod === 'local' && (
                                                    <Badge className="bg-red-50 text-red-600 border-none text-[9px] px-2 py-0">Retiro Local</Badge>
                                                )}
                                                {order.deliveryMethod === 'domicilio' && (
                                                    <Badge className="bg-slate-800 text-white border-none text-[9px] px-2 py-0">Envío Domicilio</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 pt-1">
                                                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${order.totalAmount.toLocaleString("es-AR")}</span>
                                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{order.createdAt.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                                                <span className="font-bold text-slate-200">#{order.displayId || order.id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                                            <button
                                                className="h-9 px-4 rounded-xl font-bold text-[11px] border border-slate-100 bg-white text-slate-600 active:bg-slate-100 active:scale-95 transition-all select-none touch-manipulation"
                                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setSelectedOrderId(order.id); }}
                                            >
                                                Ver Detalle
                                            </button>
                                            <button
                                                className="h-9 px-4 rounded-xl font-bold text-[11px] border border-slate-100 bg-white text-slate-600 active:bg-slate-100 active:scale-95 transition-all select-none touch-manipulation"
                                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); setChatOrder(order); }}
                                            >
                                                <MessageSquare className="inline h-3.5 w-3.5 mr-1" />Chat
                                            </button>
                                            
                                            {!['delivered', 'reception_confirmed', 'cancelled'].includes(order.status as string) && (
                                                <button
                                                    className="h-9 px-6 rounded-xl font-bold text-[11px] bg-primary text-white shadow-md shadow-red-500/20 ml-auto active:scale-95 active:bg-red-700 transition-all select-none touch-manipulation"
                                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate([8, 40, 8]); setActionOrder(order); }}
                                                >
                                                    ⚡ Accionar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>

            {/* Diálogos */}
            <OrderReceiptDialog order={selectedOrder} isOpen={!!selectedOrderId} onClose={() => setSelectedOrderId(null)} canEdit={true} />
            <CancellationDialog order={cancellingOrder} isOpen={!!cancellingOrder} onClose={() => setCancellingOrder(null)} onConfirm={(orderId, reason) => { handleStatusChange(orderId, 'cancelled', reason); setCancellingOrder(null); }} />
            {chatOrder && <OrderChatDialog orderId={chatOrder.id} otherPartyId={chatOrder.retailerId} otherPartyName={chatOrder.retailerBusinessName || chatOrder.retailerName} isOpen={!!chatOrder} onClose={() => setChatOrder(null)} />}
            <LogisticsChoiceDialog isOpen={!!dispatchingOrder} onClose={() => setDispatchingOrder(null)} onConfirm={(type) => dispatchingOrder && handleStartRoute(dispatchingOrder, type)} />

            {/* ── DRAWER NATIVO: Accionar Pedido ── */}
            <Drawer open={!!actionOrder} onOpenChange={(open) => { if (!open) setActionOrder(null); }}>
                <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe">
                    <DrawerHeader className="px-6 pt-6 pb-2">
                        <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-4" />
                        <DrawerTitle className="text-xl font-black tracking-tight text-slate-900">
                            Gestionar Pedido
                        </DrawerTitle>
                        {actionOrder && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {actionOrder.retailerBusinessName || actionOrder.retailerName} · #{(actionOrder.displayId || actionOrder.id.slice(-6)).toUpperCase()}
                            </p>
                        )}
                    </DrawerHeader>

                    <div className="px-6 pb-8 space-y-3 mt-2">
                        {/* Acciones de estado */}
                        <button
                            className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation select-none border border-slate-200"
                            onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); handleStatusChange(actionOrder!.id, 'processing'); setActionOrder(null); }}
                        >
                            <Zap className="h-6 w-6 text-slate-700 mb-1" />
                            <p className="font-black text-slate-900 text-sm text-center">Marcar En Preparación</p>
                            <p className="text-[10px] text-slate-500 font-medium text-center">El cliente recibe una notificación</p>
                        </button>

                        {actionOrder?.deliveryMethod === 'local' ? (
                            <>
                                <button
                                    className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation select-none border border-slate-200"
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); handleStatusChange(actionOrder!.id, 'listo_para_despacho'); setActionOrder(null); }}
                                >
                                    <CheckCircle2 className="h-6 w-6 text-slate-700 mb-1" />
                                    <p className="font-black text-slate-900 text-sm text-center">Listo para Retiro</p>
                                    <p className="text-[10px] text-slate-500 font-medium text-center">El cliente puede pasar a buscarlo</p>
                                </button>
                                <button
                                    className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 active:bg-red-100 active:scale-[0.98] transition-all touch-manipulation select-none border border-red-200"
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); handleStatusChange(actionOrder!.id, 'delivered'); setActionOrder(null); }}
                                >
                                    <Store className="h-6 w-6 text-red-600 mb-1" />
                                    <p className="font-black text-red-700 text-sm text-center">Marcar como Entregado</p>
                                    <p className="text-[10px] text-red-500 font-medium text-center">Confirmar que el cliente retiró el pedido</p>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation select-none border border-slate-200"
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); handleStatusChange(actionOrder!.id, 'listo_para_despacho'); setActionOrder(null); }}
                                >
                                    <CheckCircle2 className="h-6 w-6 text-slate-700 mb-1" />
                                    <p className="font-black text-slate-900 text-sm text-center">Listo para Despacho</p>
                                    <p className="text-[10px] text-slate-500 font-medium text-center">Pedido armado y esperando envío</p>
                                </button>
                                <button
                                    className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-red-600 active:bg-red-700 active:scale-[0.98] transition-all touch-manipulation select-none border border-red-700"
                                    onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); setDispatchingOrder(actionOrder); setActionOrder(null); }}
                                >
                                    <Truck className="h-6 w-6 text-white mb-1" />
                                    <p className="font-black text-white text-sm text-center">Despachar Ahora</p>
                                    <p className="text-[10px] text-red-100 font-medium text-center">Asignar repartidor o logística propia</p>
                                </button>
                            </>
                        )}

                        <div className="pt-2 border-t border-slate-100 mt-2">
                            <button
                                className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-all touch-manipulation select-none border border-slate-200"
                                onClick={() => { if ('vibrate' in navigator) navigator.vibrate([15, 50, 15]); setCancellingOrder(actionOrder); setActionOrder(null); }}
                            >
                                <Ban className="h-6 w-6 text-slate-400 mb-1" />
                                <p className="font-black text-slate-600 text-sm text-center">Cancelar Pedido</p>
                                <p className="text-[10px] text-slate-400 font-medium text-center">Se notifica al cliente con el motivo</p>
                            </button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
