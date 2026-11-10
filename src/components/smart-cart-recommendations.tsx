'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Tag, Gift, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  wholesaler: string;
  wholesalerId: string;
  brand?: string;
}

export function SmartCartRecommendations() {
  const { cartItems, addToCart, cartTotal } = useRedEconomiXCart();
  const firestore = useFirestore();

  // 1. Identificar categorías en el carrito
  const cartCategories = useMemo(() => {
    return Array.from(new Set(cartItems.map(item => (item.category || '').toUpperCase())));
  }, [cartItems]);

  // 2. Definir categorías complementarias
  const complementaryCategories = useMemo(() => {
    const map: Record<string, string[]> = {
      'ALMACÉN': ['LIMPIEZA', 'ADEREZOS'],
      'LIMPIEZA': ['ALMACÉN', 'CUIDADO PERSONAL'],
      'CUIDADO PERSONAL': ['CUIDADO BUCAL', 'CUIDADO DE LA PIEL'],
      'ADEREZOS': ['ALMACÉN'],
    };

    let targets: string[] = [];
    cartCategories.forEach(cat => {
      if (map[cat]) targets = [...targets, ...map[cat]];
    });

    if (targets.length === 0) targets = ['ALMACÉN', 'LIMPIEZA'];
    
    return Array.from(new Set(targets));
  }, [cartCategories]);

  // 3. Consultar productos sugeridos
  const recommendationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "wholesale_products"),
      where("category", "in", complementaryCategories.slice(0, 10)),
      limit(10)
    );
  }, [firestore, complementaryCategories]);

  const { data: suggestions, isLoading } = useCollection<Product>(recommendationsQuery);

  // 4. Lógica de Asistente: Identificar oferta de cierre
  const { suggestionsList, roundingOffer } = useMemo(() => {
    if (!suggestions) return { suggestionsList: [], roundingOffer: null };
    
    const cartIds = new Set(cartItems.map(item => item.id));
    const available = suggestions.filter(s => {
      if (cartIds.has(s.id)) return false;
      // Filtrar productos del catálogo maestro huérfanos
      const hasValidOwner = s.wholesalerId && s.wholesalerId !== 'unknown';
      return hasValidOwner;
    });
    
    // El producto más barato es el candidato ideal para el asistente
    const sorted = [...available].sort((a, b) => a.price - b.price);
    const offer = sorted.length > 0 ? sorted[0] : null;
    const others = sorted.slice(1, 8);
    
    return { suggestionsList: others, roundingOffer: offer };
  }, [suggestions, cartItems]);

  if (isLoading || (!roundingOffer && suggestionsList.length === 0)) return null;

  const ROUNDING_DISCOUNT = 100;

  return (
    <div className="py-8 space-y-6">
      {/* CARRUSEL DE SUGERENCIAS COMUNES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-xl">
              <Sparkles className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black tracking-widest text-slate-900 leading-none">¡Ofertas Imperdibles!</h3>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar px-2 -mx-2">
          {suggestionsList.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 w-40 bg-white rounded-3xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="relative w-full aspect-square rounded-2xl bg-slate-50 overflow-hidden mb-3 border border-slate-50 flex items-center justify-center">
                {product.imageUrl && product.imageUrl.trim() !== '' ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement)?.style && ((e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'); }}
                  />
                ) : null}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ display: (product.imageUrl && product.imageUrl.trim() !== '') ? 'none' : 'flex' }}
                >
                  <Package className="w-10 h-10 text-slate-300" />
                </div>
              </div>

              <div className="space-y-1 text-left mb-3 h-10 overflow-hidden">
                <h4 className="text-[10px] font-bold tracking-tight text-slate-800 leading-[1.1] line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-[9px] font-bold text-slate-400 tracking-tighter">{product.brand}</p>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-black text-slate-900">${product.price.toLocaleString('es-AR')}</span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-xl bg-slate-900 hover:bg-red-600 text-white transition-colors"
                  onClick={() => addToCart(product)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RoundingOfferBanner() {
  const { cartItems, addToCart, cartTotal } = useRedEconomiXCart();
  const firestore = useFirestore();

  // 1. Identificar categorías en el carrito
  const cartCategories = useMemo(() => {
    return Array.from(new Set(cartItems.map(item => (item.category || '').toUpperCase())));
  }, [cartItems]);

  // 2. Definir categorías complementarias
  const complementaryCategories = useMemo(() => {
    const map: Record<string, string[]> = {
      'ALMACÉN': ['LIMPIEZA', 'ADEREZOS'],
      'LIMPIEZA': ['ALMACÉN', 'CUIDADO PERSONAL'],
      'CUIDADO PERSONAL': ['CUIDADO BUCAL', 'CUIDADO DE LA PIEL'],
      'ADEREZOS': ['ALMACÉN'],
    };

    let targets: string[] = [];
    cartCategories.forEach(cat => {
      if (map[cat]) targets = [...targets, ...map[cat]];
    });

    if (targets.length === 0) targets = ['ALMACÉN', 'LIMPIEZA'];
    
    return Array.from(new Set(targets));
  }, [cartCategories]);

  // 3. Consultar productos sugeridos
  const recommendationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "wholesale_products"),
      where("category", "in", complementaryCategories.slice(0, 10)),
      limit(10)
    );
  }, [firestore, complementaryCategories]);

  const { data: snapshot, isLoading } = useCollection(recommendationsQuery);

  const suggestions = useMemo(() => {
    return snapshot?.map(doc => ({ id: doc.id, ...doc } as any)) || [];
  }, [snapshot]);

  // 4. Filtrar y separar la oferta de redondeo del resto
  const roundingOffer = useMemo(() => {
    const cartIds = new Set(cartItems.map(item => item.id));
    const available = suggestions.filter(s => {
      if (cartIds.has(s.id)) return false;
      const hasValidOwner = s.wholesalerId && s.wholesalerId !== 'unknown';
      return hasValidOwner;
    });
    
    const sorted = [...available].sort((a, b) => a.price - b.price);
    return sorted.length > 0 ? sorted[0] : null;
  }, [suggestions, cartItems]);

  if (isLoading || !roundingOffer || cartTotal <= 5000) return null;

  const ROUNDING_DISCOUNT = 100;

  return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-red-500 to-red-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-red-200 text-left mb-6"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12">
            <Gift className="h-24 w-24" />
          </div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center gap-4 text-left">
              <div className="h-16 max-sm:h-12 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 flex-shrink-0">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <div>
                <Badge className="bg-white text-red-600 border-none font-black text-[9px] uppercase tracking-widest mb-2">Oferta de Cierre</Badge>
                <h3 className="text-xl font-bold leading-tight">¿Redondeamos tu pedido?</h3>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-tight">Sumá este producto y te descontamos <span className="text-white font-black underline">${ROUNDING_DISCOUNT}</span> al toque.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-3 rounded-3xl border border-white/20 w-full">
               <div className="relative h-14 w-14 rounded-2xl bg-white overflow-hidden flex-shrink-0">
                  <Image src={roundingOffer.imageUrl} alt={roundingOffer.name} fill className="object-cover" />
               </div>
               <div className="flex-1 text-left pr-4">
                  <p className="text-[10px] font-black uppercase tracking-tight leading-none line-clamp-1">{roundingOffer.name}</p>
                  <p className="text-lg font-black mt-1">
                    <span className="text-white/40 line-through text-xs mr-2 font-bold">${roundingOffer.price.toLocaleString('es-AR')}</span>
                    ${Math.round(roundingOffer.price - ROUNDING_DISCOUNT).toLocaleString('es-AR')}
                  </p>
               </div>
               <Button 
                onClick={() => addToCart({
                  ...roundingOffer,
                  price: Math.round(roundingOffer.price - ROUNDING_DISCOUNT)
                })}
                className="rounded-2xl bg-white text-red-600 hover:bg-slate-50 font-black px-6 shadow-lg active:scale-95 transition-all"
               >
                 SUMAR +
               </Button>
            </div>
          </div>
        </motion.div>
  );
}
