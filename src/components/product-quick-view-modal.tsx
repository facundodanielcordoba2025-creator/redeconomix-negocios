'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, Award, Clock, Star } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export interface ProductQuickViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any;
    onAddToCart: (quantity: number) => void;
}

export function ProductQuickViewModal({ open, onOpenChange, product, onAddToCart }: ProductQuickViewModalProps) {
    const [quantity, setQuantity] = useState(1);
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (open) setQuantity(1);
    }, [open]);

    if (!product) return null;

    const increaseQuantity = () => {
        if (quantity < (product.stock || 99)) setQuantity(prev => prev + 1);
    };
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const totalPrice = product.price * quantity;
    const savingsPoints = Math.floor(product.price / 100) * quantity;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-[95vw] rounded-[24px] p-0 overflow-hidden border-none bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
                
                {/* Image Header with Flash Style */}
                <div className="relative w-full aspect-square bg-slate-50 flex items-center justify-center p-8">
                    <Image 
                        src={product.imageUrl || "https://picsum.photos/seed/placeholder/400/400"} 
                        alt={product.name} 
                        fill 
                        className="object-contain p-10 mix-blend-multiply" 
                    />
                    
                    {/* Expiration Badge */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="bg-[#FF6B35] text-white hover:bg-[#FF6B35] border-none font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-md">
                            ¡Liquidación!
                        </Badge>
                        <Badge className="bg-yellow-400 text-yellow-900 border-none font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Vence Pronto
                        </Badge>
                    </div>

                    <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center flex-col shadow-sm border border-orange-100">
                        <span className="text-[10px] font-bold text-[#FF6B35] leading-none">-25%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">OFF</span>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-4 bg-white rounded-t-[2rem] -mt-6 relative z-10">
                    {/* Title & Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] flex items-center gap-1">
                                <Star className="h-3 w-3 fill-[#10B981]" /> Lo más buscado
                             </span>
                        </div>
                        <DialogTitle className="text-xl font-bold  uppercase tracking-tight text-slate-900 leading-tight mb-2">
                            {product.name}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 font-medium leading-relaxed">
                            {product.description || "Lote de alta rotación seleccionado para liquidación flash. Calidad garantizada para consumo inmediato."}
                        </DialogDescription>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-end gap-3">
                        <div className="flex flex-col">
                             <span className="text-sm text-slate-400 font-bold line-through ml-1 leading-none">
                                ${product.originalPrice?.toLocaleString('es-AR') || (product.price / 0.75).toLocaleString('es-AR')}
                             </span>
                             <span className="text-3xl font-bold  tracking-tight text-slate-900">
                                ${product.price.toLocaleString('es-AR')}
                             </span>
                        </div>
                        <Badge variant="outline" className="mb-1 rounded-lg border-emerald-100 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                            Precio de Oportunidad
                        </Badge>
                    </div>

                    {/* Rewards Info */}
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
                            <Award className="h-4 w-4 text-[#FF6B35]" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Sumás {savingsPoints} Puntos</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Estos puntos los podés usar para pagar facturas de luz, gas o recargas.</p>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Cantidad</span>
                        <div className="flex items-center gap-6 bg-slate-100 rounded-full px-2 py-1 select-none">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-200 active:scale-90 transition-transform" onClick={decreaseQuantity}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold  text-xl text-slate-900 w-6 text-center">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-200 active:scale-90 transition-transform" onClick={increaseQuantity}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 border-none bg-white">
                    <Button 
                        onClick={() => {
                            if (!user) {
                                router.push('/login');
                                return;
                            }
                            onAddToCart(quantity);
                        }}
                        className="w-full h-16 max-sm:h-12 rounded-[1.5rem] bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-bold text-lg  shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] flex items-center justify-between px-8"
                    >
                        <div className="flex items-center gap-2 uppercase tracking-tight">
                            <ShoppingCart className="h-5 w-5" />
                            <span>Confirmar Lote</span>
                        </div>
                        <span className="text-2xl tracking-tight">${totalPrice.toLocaleString('es-AR')}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
