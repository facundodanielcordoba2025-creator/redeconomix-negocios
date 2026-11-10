'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Star, Plus, Minus, X, Tag, Truck, CreditCard, Loader2, Check, Clock, Zap, Banknote, Landmark, PartyPopper, ArrowRight, CheckCircle2, Search, Store , ShieldAlert} from 'lucide-react';
import { CheckoutPenalForm, PenalFormState } from '@/components/checkout-penal-form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createWholesalerOrder } from '@/app/redeconomix/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { calculateShipping, ShippingOption } from '@/lib/shipping-engine';
import { SmartCartRecommendations } from './smart-cart-recommendations';

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, description: 'Pago contra entrega' },
  { id: 'transferencia', label: 'Transferencia', icon: Landmark, description: 'CBU / Alias / QR' },
];

export function FloatingCartPanel() {
  const { cartItems, itemCount, cartTotal, updateQuantity, removeFromCart, clearCart, removeWholesalerItems } = useRedEconomiXCart();
  const [isOpen, setIsOpen] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  const [deliveryMethod, setDeliveryMethod] = useState<'domicilio' | 'local' | 'penal'>('domicilio');
    const [penalState, setPenalState] = useState<any | null>(null);
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [sellerBovedas, setSellerBovedas] = useState<Record<string, any>>({});
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const shippingOptions = useMemo(() => calculateShipping(postalCode, cartTotal), [postalCode, cartTotal]);

  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShipping) {
      setSelectedShipping(shippingOptions[0]);
    } else if (shippingOptions.length === 0) {
      setSelectedShipping(null);
    }
  }, [shippingOptions, selectedShipping]);

  // Check if all sellers have Boveda Segura configured
  useEffect(() => {
      const fetchSellers = async () => {
          if (!firestore || cartItems.length === 0) return;
          const wholesalerIds = [...new Set(cartItems.map(i => i.wholesalerId))];
          const bovedas: Record<string, any> = {};
          
          for (const wId of wholesalerIds) {
              try {
                  const snap = await getDoc(doc(firestore, 'users', wId));
                  if (snap.exists()) {
                      bovedas[wId] = snap.data()?.bovedaSegura || null;
                  }
              } catch (e) {
                  console.error("Error fetching seller boveda", e);
              }
          }
          setSellerBovedas(bovedas);
          
          // Si alguno no tiene bóveda y estaba seleccionada Transferencia, forzar Efectivo
          const allHaveBoveda = wholesalerIds.every(id => bovedas[id]?.alias || bovedas[id]?.cbu);
          if (!allHaveBoveda && selectedPayment.id === 'transferencia') {
              setSelectedPayment(PAYMENT_METHODS[0]);
          }
      };
      fetchSellers();
  }, [firestore, cartItems]);
  
  const allSellersHaveBoveda = useMemo(() => {
      if (cartItems.length === 0) return false;
      const wholesalerIds = [...new Set(cartItems.map(i => i.wholesalerId))];
      return wholesalerIds.every(id => sellerBovedas[id]?.alias || sellerBovedas[id]?.cbu);
  }, [cartItems, sellerBovedas]);

  if (itemCount === 0 && !showSuccess) return null;

  const isVolumeBuy = itemCount >= 10;
  const volumeDiscount = isVolumeBuy ? Math.floor(cartTotal * 0.02) : 0;
  const subtotal = cartTotal;
  const shippingCost = deliveryMethod === 'domicilio' ? (selectedShipping?.cost || 0) : 0;
  const finalTotal = subtotal - volumeDiscount + shippingCost;
  const totalPoints = Math.floor(finalTotal / 100);
  
  const changeDue = (selectedPayment.id === 'efectivo' && amountTendered) 
      ? Math.max(0, parseInt(amountTendered || '0') - finalTotal) 
      : 0;

  const handleConfirmOrder = async () => {
    if (!user || cartItems.length === 0) {
      if (!user) toast({ title: "Iniciá sesión", description: "Debés ingresar para comprar.", variant: "destructive" });
      return;
    }
    
    if (selectedPayment.id === 'efectivo' && amountTendered) {
        if (parseInt(amountTendered) < finalTotal) {
            toast({ title: "Monto inválido", description: "El monto a pagar debe ser mayor o igual al total.", variant: "destructive" });
            return;
        }
    }
    
    setIsConfirming(true);
    
    // 1. Agrupar items por Mayorista (Cross-commerce Checkout)
    const groupedByWholesaler = cartItems.reduce((acc, item) => {
        if (!acc[item.wholesalerId]) {
            acc[item.wholesalerId] = { items: [], subtotal: 0 };
        }
        acc[item.wholesalerId].items.push(item);
        acc[item.wholesalerId].subtotal += (item.price * item.quantity);
        return acc;
    }, {} as Record<string, { items: typeof cartItems, subtotal: number }>);
    
    const wholesalerIds = Object.keys(groupedByWholesaler);
    const globalDiscountRatio = isVolumeBuy ? 0.02 : 0;

    try {
      // 2. Disparar creación paralela para cada proveedor
      const orderPromises = wholesalerIds.map(wId => {
          const group = groupedByWholesaler[wId];
          
          // Cálculo proporcional: envío y descuento se reparten de acuerdo al peso del subtotal
          const weight = group.subtotal / cartTotal;
          const proportionalShipping = shippingCost * weight;
          const proportionalDiscount = group.subtotal * globalDiscountRatio;
          const penalFee = deliveryMethod === 'penal' ? 7500 : 0;
          const upsellsTotal = (deliveryMethod === 'penal' && penalState) ? ((penalState.upsells.botella ? 1000 : 0) + (penalState.upsells.bolsa ? 500 : 0)) : 0;
          const finalGroupTotal = group.subtotal - proportionalDiscount + proportionalShipping + penalFee + upsellsTotal;
          
          const formattedItems = group.items.map(item => ({
              productId: item.productId,
              wholesaleProductId: item.id,
              quantity: item.quantity,
              priceAtPurchase: item.price
          }));

          return createWholesalerOrder({
            wholesalerId: wId,
            retailerId: user.uid,
            items: formattedItems,
            totalAmount: finalGroupTotal,
            paymentMethod: selectedPayment.id,
            deliveryMethod: deliveryMethod,
            amountTendered: selectedPayment.id === 'efectivo' && amountTendered ? parseInt(amountTendered) : null,
            changeDue: changeDue,
            shippingMethod: 'delivery',
            shippingOptionId: deliveryMethod === 'domicilio' ? (selectedShipping?.id || 'standard') : null,
            shippingCost: deliveryMethod === 'domicilio' ? proportionalShipping : 0,
            penalDetails: deliveryMethod === 'penal' ? penalState : null,
            penalFee: deliveryMethod === 'penal' ? penalFee : 0,
            upsellsTotal: deliveryMethod === 'penal' ? upsellsTotal : 0,
            shippingDiscount: 0
          }).then(res => ({ ...res, wholesalerId: wId }));
      });

      const results = await Promise.all(orderPromises);
      
      const allSuccessful = results.every(r => r.success);

      if (allSuccessful) {
        clearCart();
        setIsOpen(false);
        setShowSuccess(true);
      } else {
        // Limpieza quirúrgica L99: Solo borrar del carrito lo que SÍ se pudo comprar
        results.forEach(r => {
           if (r.success && r.wholesalerId) {
               removeWholesalerItems(r.wholesalerId);
           }
        });
        
        const errorMsg = results.find(r => !r.success)?.error || "Algunas órdenes fallaron de parte del servidor.";
        toast({ title: "Error Parcial - Carrito Protegido", description: `Algunas compras tuvieron éxito. Las fallidas continúan en tu carrito para re-intento. Detalle: ${errorMsg}`, variant: "destructive" });
      }
    } catch (error) {
       console.error(error);
       toast({ title: "Error de Conexión", description: "No se pudo procesar el pedido. Intentá nuevamente.", variant: "destructive" });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-16 max-sm:h-12 rounded-full px-6 bg-[#FF2E55] text-white hover:bg-[#FF2E55]/90 shadow-[0_8px_30px_rgb(255,46,85,0.4)] transition-all hover:scale-105 group"
        >
          <ShoppingCart className="h-6 w-6 mr-3" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Tu Carrito</span>
            <span className="text-sm font-bold">{itemCount} items | ${finalTotal.toLocaleString()}</span>
          </div>
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-[#FF2E55] text-xs font-black h-7 w-7 rounded-full flex items-center justify-center border-2 border-[#FF2E55] shadow-lg group-hover:animate-bounce">
              {itemCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white flex flex-col border-none shadow-2xl">
          <SheetHeader className="p-8 pb-4 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
                <SheetTitle className="text-2xl font-black italic tracking-tighter text-slate-900">MI <span className="text-primary tracking-tight not-italic">CARRITO</span></SheetTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-slate-200">
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold text-[10px] tracking-tight py-1">SHOPPING SEGURO</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PEDIDO REDMAYORISTA</span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 no-scrollbar pb-32 focus-visible:outline-none">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Productos en tu Orden</h5>
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="h-20 max-sm:h-14 w-20 rounded-2xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 relative">
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform" unoptimized />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h6 className="font-bold text-sm text-slate-900 truncate leading-tight mb-1">{item.name}</h6>
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="text-xs font-black min-w-[30px] text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="text-sm font-black text-slate-900">${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SmartCartRecommendations />

            <div className="space-y-4 pb-2 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 rounded-2xl">
                    <button 
                        onClick={() => setDeliveryMethod('local')}
                        className={cn("flex-1 h-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", deliveryMethod === 'local' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                    >
                        <Store className="h-4 w-4" /> Retiro Local
                    </button>
                    <button 
                        onClick={() => setDeliveryMethod('domicilio')}
                        className={cn("flex-1 h-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", deliveryMethod === 'domicilio' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                    >
                        <Truck className="h-4 w-4" /> Envío Domicilio
                    </button>
                </div>

                {deliveryMethod === 'domicilio' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 mt-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Calcular Envío</h5>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <Zap className="h-3 w-3" /> Gratis desde $30.000
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Input 
                                placeholder="Tu Código Postal (ej: 1425)" 
                                maxLength={5}
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                                className="bg-white border-slate-200 h-14 rounded-2xl pl-12 font-bold text-slate-800 placeholder:text-slate-300"
                            />
                            <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-200" />
                        </div>

                        <div className="space-y-2">
                            {shippingOptions.length > 0 ? (
                                shippingOptions.map((option: ShippingOption) => (
                                    <div 
                                        key={option.id}
                                        onClick={() => setSelectedShipping(option)}
                                        className={cn(
                                            "relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                                            selectedShipping?.id === option.id 
                                                ? "bg-white border-[#BAFF00] shadow-sm ring-1 ring-[#BAFF00]/20" 
                                                : "bg-white/40 border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                selectedShipping?.id === option.id ? "bg-[#BAFF00] text-black" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-xs text-slate-900">{option.label}</p>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">{option.estimatedDays}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-sm",
                                                option.cost === 0 ? "text-emerald-500" : "text-slate-900"
                                            )}>
                                                {option.cost === 0 ? 'GRATIS' : `$${(option.cost || 0).toLocaleString('es-AR')}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : postalCode.length > 0 ? (
                                <p className="text-[10px] text-slate-400 text-center font-medium italic">Calculando para CP {postalCode}...</p>
                            ) : (
                                <p className="text-[10px] text-slate-400 text-center font-medium italic py-2">Ingresá tu CP para ver el costo de envío.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* PAYMENT METHODS */}
            <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Forma de Pago</h5>
                <div className="space-y-2">
                    {PAYMENT_METHODS.map(pm => {
                        const isDisabled = pm.id === 'transferencia' && !allSellersHaveBoveda;
                        return (
                            <div 
                                key={pm.id}
                                onClick={() => !isDisabled && setSelectedPayment(pm)}
                                className={cn(
                                    "relative p-4 rounded-2xl border transition-all flex items-center justify-between",
                                    isDisabled ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100" : "cursor-pointer group",
                                    selectedPayment.id === pm.id && !isDisabled
                                        ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20" 
                                        : !isDisabled && "bg-white/40 border-slate-100 hover:border-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedPayment.id === pm.id && !isDisabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <pm.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{pm.label}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                            {isDisabled ? "Comercio sin Bóveda Segura" : pm.description}
                                        </p>
                                    </div>
                                </div>
                                {!isDisabled && (
                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", selectedPayment.id === pm.id ? "border-blue-500" : "border-slate-200")}>
                                        {selectedPayment.id === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CASH CHANGE CALCULATOR */}
                {selectedPayment.id === 'efectivo' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-slate-100">
                        <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 block">¿Con cuánto vas a pagar?</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-4.5 font-bold text-slate-400">$</span>
                            <Input 
                                type="number"
                                placeholder={finalTotal.toString()}
                                value={amountTendered}
                                onChange={(e) => setAmountTendered(e.target.value)}
                                className="bg-white border-slate-200 h-14 rounded-2xl pl-8 font-bold text-slate-900 text-lg"
                            />
                        </div>
                        {changeDue > 0 && (
                            <p className="text-xs font-bold text-emerald-600 mt-2 ml-1">
                                Tu vuelto será de: ${changeDue.toLocaleString()}
                            </p>
                        )}
                        {amountTendered && parseInt(amountTendered) < finalTotal && (
                            <p className="text-xs font-bold text-red-500 mt-2 ml-1">
                                El monto debe ser al menos ${finalTotal.toLocaleString()}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            <div className="bg-amber-50/50 rounded-[1rem] border border-amber-100 p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-sm tracking-tight">Beneficio por Volumen</span>
                </div>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                    {isVolumeBuy 
                        ? `¡Activaste el descuento del 2%! Estás ahorrando $${volumeDiscount.toLocaleString()}.`
                        : `Agregá ${10 - itemCount} unidades más para desbloquear un 2% de descuento adicional.`
                    }
                </p>
            </div>
          </div>

          <div className="bg-white border-t border-slate-100 p-8 shrink-0 pb-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal Bruto</span>
                    <span className="font-bold text-slate-900">${subtotal.toLocaleString()}</span>
                </div>
                {isVolumeBuy && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                        <span className="font-bold uppercase tracking-widest text-[10px]">Descuento Volumen (2%)</span>
                        <span className="font-bold">-${volumeDiscount.toLocaleString()}</span>
                    </div>
                )}
                {deliveryMethod === 'domicilio' && shippingCost > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Costo de Envío</span>
                        <span className="font-bold text-slate-900">${shippingCost.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-slate-100 mt-4">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 tracking-tighter italic">TOTAL <span className="not-italic text-sm text-slate-400 ml-1">ARS</span></span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+ {totalPoints} Pts RedSorpresa</span>
                    </div>
                    <span className="text-3xl font-black tracking-tight text-[#FF2E55] leading-none italic">
                        ${finalTotal.toLocaleString()}
                    </span>
                </div>
            </div>

            <Button
              onClick={handleConfirmOrder}
              disabled={isConfirming || !selectedShipping}
              className="w-full h-16 max-sm:h-12 bg-[#FF2E55] hover:bg-black text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 group"
            >
              {isConfirming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>CONFIRMAR PEDIDO <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" /></>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md bg-white rounded-[3rem] p-10 border-none shadow-2xl">
          <DialogTitle className="sr-only">Orden Recibida</DialogTitle>
          <DialogDescription className="sr-only">Tu orden ha sido procesada de manera exitosa</DialogDescription>
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border-2 border-emerald-100">
              <PartyPopper className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">¡ORDEN RECIBIDA!</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Podés hacer el seguimiento desde Mis Pedidos</p>
            </div>
            <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Estimado de Entrega</span>
                    <span className="text-slate-900">20 Días Corridos</span>
                </div>
                <Separator className="bg-slate-200/50" />
                <Button onClick={() => setShowSuccess(false)} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">VOLVER AL MUNDO RED</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
