'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, CheckCircle, Clock, X, Package, Loader2,
  User, MapPin, Phone, ChevronDown, ChevronUp, Store,
  Truck, DollarSign, Zap, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { collection, query, where, orderBy, limit, doc, updateDoc, serverTimestamp, addDoc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type StoreOrder = {
  id: string;
  type: 'store_cart';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    qty: number;
    imageUrl?: string | null;
    code: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
  shippingMode: 'pickup' | 'delivery';
  storeName?: string;
  deliveryAddress?: string;
  createdAt: any;
  retailerId?: string;
};

// ─────────────────────────────────────────────
// Order Card
// ─────────────────────────────────────────────
function OrderCard({ order, onMarkCompleted, onCancel }: {
  order: StoreOrder;
  onMarkCompleted: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(order.status === 'pending');
  const [isActing, setIsActing] = useState(false);

  const statusConfig = {
    pending: { label: 'Pendiente de Cobro', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', pulse: true },
    processing: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', pulse: true },
    completed: { label: 'Cobrado y Entregado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', pulse: false },
    cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', pulse: false },
  };

  const cfg = statusConfig[order.status] || statusConfig.pending;
  const createdDate = order.createdAt?.toDate
    ? format(order.createdAt.toDate(), "d MMM, HH:mm", { locale: es })
    : 'Ahora';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-[2.5rem] overflow-hidden border shadow-sm transition-all",
        order.status === 'pending' ? 'border-amber-200 shadow-amber-100' : 'border-slate-100'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          order.status === 'pending' ? 'bg-amber-100' :
          order.status === 'completed' ? 'bg-emerald-100' :
          'bg-slate-100'
        )}>
          <ShoppingCart className={cn(
            "w-6 h-6",
            order.status === 'pending' ? 'text-amber-600' :
            order.status === 'completed' ? 'text-emerald-600' :
            'text-slate-500'
          )} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-black uppercase tracking-tighter text-slate-900 truncate">
              {order.customerName || 'Cliente App'}
            </p>
            {order.status === 'pending' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                NUEVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{createdDate}</p>
            <span className="text-slate-200">·</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              {order.shippingMode === 'pickup' ? '🏪 Retiro' : '🚚 Envío'}
            </p>
            <span className="text-slate-200">·</span>
            <p className="text-sm font-black text-slate-900">${order.totalAmount.toLocaleString('es-AR')}</p>
          </div>
        </div>

        {/* Chevron */}
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-4">

              {/* Order ID */}
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID de Pedido</p>
                <p className="text-xs font-black text-slate-700 font-mono tracking-widest">#{order.id.slice(-8).toUpperCase()}</p>
              </div>

              {/* Customer */}
              {order.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">{order.customerPhone}</p>
                </div>
              )}

              {/* Shipping info */}
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-2xl",
                order.shippingMode === 'pickup' ? 'bg-emerald-50 border border-emerald-100' : 'bg-blue-50 border border-blue-100'
              )}>
                {order.shippingMode === 'pickup'
                  ? <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  : <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                }
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {order.shippingMode === 'pickup' ? 'Retiro en Local' : 'Envío a Domicilio'}
                  </p>
                  {order.deliveryAddress && <p className="text-xs font-bold text-slate-500 mt-0.5">{order.deliveryAddress}</p>}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Productos</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                          : <Package className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.qty} unidad{item.qty > 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900 tabular-nums">${(item.price * item.qty).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>

              {/* Total + payment */}
              <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total a Cobrar</p>
                  <p className="text-2xl font-black text-white tabular-nums">${order.totalAmount.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-900/40 px-3 py-2 rounded-xl border border-emerald-800">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Efectivo</p>
                </div>
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={() => onCancel(order.id)}
                    disabled={isActing}
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      setIsActing(true);
                      await onMarkCompleted(order.id);
                      setIsActing(false);
                    }}
                    disabled={isActing}
                    className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {isActing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><CheckCircle className="w-4 h-4 mr-1.5" />Cobrado y Entregado</>
                    }
                  </Button>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Venta registrada exitosamente</p>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Pedido cancelado</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Orders Panel
// ─────────────────────────────────────────────
export function StoreCartOrdersPanel() {
  const { user } = useUser();
  const { effectiveRetailerId } = useRole();
  const targetRetailerId = effectiveRetailerId || user?.uid;
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !targetRetailerId) return null;
    return query(
      collection(firestore, 'orders_wholesaler'),
      where('wholesalerId', '==', targetRetailerId),
      where('status', 'in', ['pending', 'processing']),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
  }, [firestore, targetRetailerId]);

  const completedQuery = useMemoFirebase(() => {
    if (!firestore || !targetRetailerId) return null;
    return query(
      collection(firestore, 'orders_wholesaler'),
      where('wholesalerId', '==', targetRetailerId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [firestore, targetRetailerId]);

  const { data: pendingOrders, isLoading } = useCollection<StoreOrder>(ordersQuery as any);
  const { data: completedOrders } = useCollection<StoreOrder>(completedQuery as any);

  const handleMarkCompleted = useCallback(async (orderId: string) => {
    if (!firestore || !user || !targetRetailerId) return;
    try {
      const order = (pendingOrders || []).find((o: any) => o.id === orderId) as StoreOrder | undefined;
      if (!order) return;

      const batch = writeBatch(firestore);

      // Update order status
      batch.update(doc(firestore, 'orders_wholesaler', orderId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: user.uid,
      });

      // Si es un carrito de tienda física (store_cart), descontar stock y stockByBranch en retailer_inventory
      if (order.type === 'store_cart' && Array.isArray(order.items)) {
        for (const item of order.items) {
          const qty = Math.max(0, Number(item.qty || (item as any).quantity) || 0);
          if (!item.productId || qty <= 0) continue;
          const prodRef = doc(firestore, 'retailer_inventory', item.productId);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            const pData = prodSnap.data() || {};
            const currentMap = pData.stockByBranch && typeof pData.stockByBranch === 'object' ? { ...pData.stockByBranch } : {};
            const mapKeys = Object.keys(currentMap);
            if (mapKeys.length > 0) {
              const bKey = mapKeys.find(k => Number(currentMap[k]) > 0) || mapKeys[0];
              currentMap[bKey] = Math.max(0, (Number(currentMap[bKey]) || 0) - qty);
              const newTotal = Object.values(currentMap).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0);
              batch.update(prodRef, { stock: newTotal, stockByBranch: currentMap, updatedAt: serverTimestamp() });
            } else {
              batch.update(prodRef, { stock: increment(-qty), updatedAt: serverTimestamp() });
            }
          }
        }
      }

      // Register as a sale in retailer_daily_operations
      const opRef = doc(collection(firestore, 'retailer_daily_operations'));
      batch.set(opRef, {
        retailerId: targetRetailerId,
        type: 'sale',
        paymentMethod: 'cash',
        total: order.totalAmount,
        items: order.items,
        concept: 'Venta App (Carrito Tienda)',
        status: 'completed',
        date: new Date().toISOString(),
        customerName: order.customerName || 'Cliente App',
        customerPhone: order.customerPhone || '',
        sourceOrderId: orderId,
        createdAt: serverTimestamp(),
      });

      const dateId = format(new Date(), 'yyyy-MM-dd');
      const summaryRef = doc(firestore, 'retailer_daily_summaries', `${targetRetailerId}_${dateId}`);
      batch.set(summaryRef, {
        retailerId: targetRetailerId,
        date: dateId,
        dailySales: increment(Number(order.totalAmount) || 0),
        salesCount: increment(1),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Notify customer
      if (order.customerId) {
        const notifRef = doc(collection(firestore, `users/${order.customerId}/notifications`));
        batch.set(notifRef, {
          title: '🛍️ ¡Tu pedido fue entregado!',
          body: `Tu compra en ${order.storeName || 'el local'} por $${order.totalAmount.toLocaleString('es-AR')} fue procesada exitosamente.`,
          type: 'order_completed',
          isRead: false,
          createdAt: serverTimestamp(),
          retailerId: targetRetailerId,
        });
      }

      await batch.commit();

      toast({ title: '✅ Venta registrada', description: `$${order.totalAmount.toLocaleString('es-AR')} añadido a la caja del día.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }, [firestore, user, targetRetailerId, pendingOrders, toast]);

  const handleCancel = useCallback(async (orderId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'orders_wholesaler', orderId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
      });
      toast({ title: 'Pedido cancelado' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  }, [firestore, toast]);

  const allActive = pendingOrders || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando pedidos app...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Orders */}
      {allActive.length > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">
              {allActive.length} Pedido{allActive.length > 1 ? 's' : ''} Pendiente{allActive.length > 1 ? 's' : ''}
            </p>
          </div>
          {allActive.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order as StoreOrder}
              onMarkCompleted={handleMarkCompleted}
              onCancel={handleCancel}
            />
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
          <ShoppingCart className="w-10 h-10 text-slate-400" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
            Sin pedidos activos desde la App
          </p>
          <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed max-w-[180px]">
            Cuando un cliente arme un carrito y elija tu local, aparecerá aquí.
          </p>
        </div>
      )}

      {/* Completed Today */}
      {completedOrders && completedOrders.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Completados Hoy</p>
          {completedOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order as StoreOrder}
              onMarkCompleted={handleMarkCompleted}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
