'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, CheckCircle2, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type ScannedItem = {
    id: string;
    name: string;
    price: number;
    qty: number;
    promoType?: 'none' | '3x2' | '2x1' | '10off' | '20off';
};

export default function CustomerDisplay() {
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [lastAction, setLastAction] = useState<'IDLE' | 'PAYMENT_SUCCESS'>('IDLE');
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number, change?: number } | null>(null);
  
  useEffect(() => {
    // 1. Escuchar actualizaciones del BroadcastChannel (misma compu / mismo navegador)
    const channel = new BroadcastChannel('tpv-sync-channel');
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'CART_UPDATE') {
        setItems(payload.items || []);
        setTotal(payload.total || 0);
        setLastAction('IDLE');
      } else if (type === 'PAYMENT_SUCCESS') {
        setLastAction('PAYMENT_SUCCESS');
        setPaymentDetails({ amount: payload.total, change: payload.change });
        setTimeout(() => { setItems([]); setTotal(0); setLastAction('IDLE'); setPaymentDetails(null); }, 8000);
      }
    };

    // 2. Escuchar Firestore (Otras compus / Tablets / Celulares)
    let unsubscribe = () => {};
    const urlParams = new URLSearchParams(window.location.search);
    const rid = urlParams.get('rid');
    
    if (rid) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('@/firebase').then(({ db }) => {
          if (!db) return;
          unsubscribe = onSnapshot(doc(db, 'retailer_daily_operations', `display_${rid}`), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.status === 'PAYMENT_SUCCESS') {
                setLastAction('PAYMENT_SUCCESS');
                setPaymentDetails({ amount: data.total, change: data.change });
                setTimeout(() => { setItems([]); setTotal(0); setLastAction('IDLE'); setPaymentDetails(null); }, 8000);
              } else {
                setItems(data.items || []);
                setTotal(data.total || 0);
                setLastAction('IDLE');
              }
            }
          });
        });
      });
    }

    return () => {
      channel.close();
      unsubscribe();
    };
  }, []);

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

  // Auto-scroll al último ítem agregado
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-red-500/30">
      
      {/* HEADER */}
      <header className="h-24 bg-slate-950 flex items-center justify-between px-10 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">REDECONOMIX</h1>
            <p className="text-red-400 font-bold tracking-widest text-sm uppercase">Caja de Cobro</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 font-medium">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: RECEIPT LIST */}
        <div className="w-2/3 bg-slate-900 flex flex-col relative border-r border-slate-800">
          
          <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            <AnimatePresence>
              {items.length === 0 && lastAction === 'IDLE' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"
                >
                  <ShoppingBag className="w-24 h-24 text-slate-700" />
                  <h2 className="text-3xl font-bold">Bienvenido</h2>
                  <p className="text-xl">Su compra aparecerá aquí...</p>
                </motion.div>
              )}

              {lastAction === 'PAYMENT_SUCCESS' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-emerald-400 space-y-6"
                >
                  <div className="w-32 h-32 bg-emerald-400/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-20 h-20 text-emerald-400" />
                  </div>
                  <h2 className="text-5xl font-black tracking-tight text-white">¡Muchas gracias!</h2>
                  <p className="text-2xl text-emerald-200">Su pago fue procesado con éxito.</p>
                  
                  {paymentDetails?.change !== undefined && paymentDetails.change > 0 && (
                    <div className="mt-8 bg-emerald-950 border border-emerald-800 rounded-3xl p-8 text-center animate-pulse">
                      <p className="text-emerald-400 text-xl font-bold uppercase tracking-widest mb-2">Su Vuelto</p>
                      <p className="text-6xl font-black text-white">${paymentDetails.change.toLocaleString('es-AR')}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {lastAction === 'IDLE' && items.map((item, index) => {
                const subtotal = calculateItemTotal(item);
                const hasPromo = item.promoType && item.promoType !== 'none';
                
                return (
                  <motion.div 
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center py-6 border-b border-slate-800/50"
                  >
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                      <div className="flex items-center gap-4 text-slate-400 text-lg">
                        <span className="bg-slate-800 px-3 py-1 rounded-lg text-white font-bold">{item.qty} un</span>
                        <span>x ${item.price.toLocaleString('es-AR')}</span>
                        {hasPromo && (
                          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider">
                            Promo: {item.promoType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-white">
                        ${subtotal.toLocaleString('es-AR')}
                      </p>
                      {hasPromo && (
                        <p className="text-slate-500 line-through text-lg">
                          ${(item.price * item.qty).toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* RIGHT COLUMN: TOTAL & PAYMENT */}
        <div className="w-1/3 bg-slate-950 p-10 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 font-bold tracking-widest text-lg uppercase mb-4">Total a Pagar</p>
            <div className="text-[5rem] leading-none font-black text-white tracking-tighter">
              ${total.toLocaleString('es-AR')}
            </div>
            {items.length > 0 && (
              <p className="text-slate-500 mt-4 text-xl">
                {items.reduce((sum, item) => sum + item.qty, 0)} artículos
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
               <p className="text-center text-slate-400 text-lg">Escaneando productos...</p>
               {/* Aquí se podría insertar un QR de MP dinámico en el futuro */}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
