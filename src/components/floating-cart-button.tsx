'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function FloatingCartButton() {
    const { itemCount, cartTotal } = useRedEconomiXCart();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted) return null;
    if (pathname === '/redeconomix/carrito' || pathname === '/redeconomix/perfil' || pathname?.includes('/redeconomix/empleados')) return null;
    if (itemCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                
                className="fixed bottom-24 right-4 z-[60]"
            >
                <button
                    onClick={() => router.push('/redeconomix/carrito')}
                    className="relative flex items-center gap-3 bg-slate-900 text-white pl-4 pr-5 py-3 rounded-2xl shadow-2xl shadow-slate-900/40 border border-slate-700 active:scale-95 transition-all hover:bg-slate-800"
                >
                    {/* Icon with red dot */}
                    <div className="relative">
                        <ShoppingCart className="w-5 h-5 text-white" />
                        <motion.span
                            key={itemCount}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-sm border border-slate-900"
                        >
                            {itemCount > 99 ? '99+' : itemCount}
                        </motion.span>
                    </div>

                    {/* Label + total */}
                    <div className="text-left leading-none">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Mi Carrito</p>
                        <p className="text-sm font-black text-white leading-none tabular-nums">
                            ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
