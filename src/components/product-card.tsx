'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, Star, Zap, Clock, Share2, Award, Minus, Plus, MessageCircle, Users, Send, Copy, Store, MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { proxyImg } from "@/lib/utils";
import type { ProductForCart } from '@/context/redeconomix-cart-context';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('@/components/mini-map'), { 
    ssr: false, 
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs font-bold">Cargando mapa...</div> 
});

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';

export type Product = {
  id: string;
  productId: string;
  wholesalerId: string;
  name: string;
  description: string;
  price: number;
  category: string; 
  imageIds?: string[];
  imageUrl?: string;
  provider: string;
  wholesalerName?: string;
  rating: number;
  reviews: number;
  monthlyPayment: boolean;
  stock?: number;
  code?: string;
  expirationDate?: string;
  isRetailerProduct?: boolean;
  retailerId?: string;
  businessName?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  businessHours?: string;
};

import fixMap from '@/lib/masonline-images-fix.json';

export const ProductCard = memo(({ 
    product, 
    onViewDetails, 
    onAddToCart, 
    isWholesaler = false,
    autoOpen = false,
    onAutoOpenClose
}: { 
    product: Product, 
    onViewDetails?: (product: Product) => void, 
    onAddToCart: (product: ProductForCart) => void,
    isWholesaler?: boolean,
    autoOpen?: boolean,
    onAutoOpenClose?: () => void
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.wholesalerId === 'inaki_oran' ? 5 : 1);
  const { cartItems, addToCart, updateQuantity } = useRedEconomiXCart();

  const PLACEHOLDER_URLS = [
    "https://firebasestorage.googleapis.com/v0/b/oggie-8529f.firebasestorage.app/o/freepik__supermercado-que-vende-por-celular-fondo-rojo-celu__44957.png?alt=media&token=89be3278-3372-4336-b374-4ed0f2369b04",
    "/favicon.png"
  ];
  
  let fallbackImage = (product as any).image || (product.imageIds && product.imageIds.length > 0 ? product.imageIds[0] : null) || "/favicon.png";
  let initialImageUrl = (!product.imageUrl || PLACEHOLDER_URLS.includes(product.imageUrl)) && !PLACEHOLDER_URLS.includes(fallbackImage) ? fallbackImage : (product.imageUrl || fallbackImage);
  // Replace MasOnline Tartagal incorrect scraped images with the exact correct ones
  if (product.wholesalerName === 'MasOnline Tartagal' && initialImageUrl.includes('vtexassets')) {
      const fixedImageUrl = (fixMap as any)[product.id];
      initialImageUrl = fixedImageUrl || "/favicon.png";
  }
  const [imgSrc, setImgSrc] = useState(proxyImg(initialImageUrl));
  
  // Sync image source if the product's image changes
  React.useEffect(() => {
    setImgSrc(proxyImg(initialImageUrl));
  }, [initialImageUrl]);
  
  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
  const selectedCartItem = cartItems.find(item => item.id === product.id);
  const isSelected = !!selectedCartItem;

  React.useEffect(() => {
     if (autoOpen) {
        setIsModalOpen(true);
     }
  }, [autoOpen]);

  const handleModalOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    
    if (isSelected && selectedCartItem) {
      setQuantity(selectedCartItem.quantity);
    } else {
      setQuantity(product.wholesalerId === 'inaki_oran' ? 5 : 1);
    }
    setIsModalOpen(true);
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareModalOpen(true);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://redeconomix.com';
  const shareUrl = `${baseUrl}/p/${product.id}${user ? `?ref=${user.uid}` : ''}`;
  const shareText = `Mirá este producto en RedEconomiX: ${product.name}. Precio: $${(product.price || 0).toLocaleString('es-AR')}`;

  const socialLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  };

  const handleConfirmAdd = () => {
    if (!user) { router.push('/login'); return; }
    if (isOutOfStock) {
        toast({ title: "Sin Stock", variant: "destructive" });
        return;
    }
    
    if (isSelected) {
        updateQuantity(product.id, quantity);
        toast({ title: "Cantidad actualizada" });
    } else {
        addToCart({
            id: product.id,
            productId: (product as any).isRetailerProduct ? product.id : (product.productId || product.id),
            name: product.name,
            price: product.price,
            wholesaler: product.wholesalerName || product.businessName || 'Comercio Local',
            wholesalerId: product.wholesalerId || (product as any).retailerId || 'unknown',
            retailerId: (product as any).retailerId,
            isRetailerProduct: !!(product as any).isRetailerProduct,
            branchId: (product as any).branchId,
            imageUrl: imgSrc,
            category: product.category,
            code: product.code,
        }, quantity);
        toast({ title: "Agregado al pedido" });
    }
    setIsModalOpen(false);
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => {
    const min = product.wholesalerId === 'inaki_oran' ? 5 : 1;
    return prev > min ? prev - 1 : min;
  });

  const totalDynamicPrice = product.price * quantity;
  const savingsPoints = Math.floor(product.price / 200);

  // Determinar si es un producto propio del kiosquero actual
  const isOwnProduct = product.isRetailerProduct && user && user.uid === product.retailerId;

  return (
    <>
        <div
            className="h-full active:scale-[0.98] transition-all"
            onClick={handleModalOpen}
        >
            <Card
              className={cn(
                "group relative h-full flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-200 cursor-pointer",
                isOwnProduct 
                  ? "bg-emerald-50/40 border border-emerald-300 shadow-sm" 
                  : isSelected 
                    ? "border-2 border-[#FF0000] shadow-md bg-white" 
                    : (product as any).isBestPrice 
                      ? "border border-red-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] bg-white" 
                      : "border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] bg-white",
                isOutOfStock && "opacity-60 grayscale"
              )}
            >
              {isOwnProduct && (
                 <div className="absolute top-2 left-2 z-10">
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
                       <Store className="w-2.5 h-2.5" /> Tu producto
                    </span>
                 </div>
              )}
              {/* Image Area */}
              <div className="relative aspect-square w-full bg-white p-3 flex items-center justify-center overflow-hidden">
                 {(product as any).isBestPrice && !isOwnProduct && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#FF0000] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm tracking-wide">
                            Mejor Precio
                        </span>
                    </div>
                 )}
                 {isSelected && (
                    <div className="absolute top-2 right-2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10 flex items-center gap-1">
                        <ShoppingCart className="h-2.5 w-2.5" /> En Carrito
                    </div>
                 )}
                  <Image
                    src={imgSrc || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=400&auto=format&fit=crop"}
                    alt={product.name}
                    fill
                    className={cn(
                      "object-contain p-2 transition-transform duration-300 group-hover:scale-105",
                      !imgSrc && "opacity-20 grayscale"
                    )}
                    sizes="(max-width: 768px) 50vw, 25vw"
                    draggable={false}
                    priority={false}
                    onError={() => {
                      if (imgSrc !== '/favicon.png') {
                        setImgSrc('/favicon.png');
                      }
                    }}
                  />
                  {/* Clean Share Button - Discreet */}
                  <button 
                    onClick={handleShare}
                    className="absolute bottom-2 right-2 h-7 w-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-slate-100 hover:scale-105 transition-all z-10 active:scale-95 opacity-0 group-hover:opacity-100"
                    aria-label="Compartir producto"
                  >
                    <Share2 className="w-3 h-3 text-slate-600" />
                  </button>

                  {/* Iñaki Delay Badge */}
                  {product.wholesalerId === 'inaki_oran' && (
                      <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-sm z-10 flex items-center gap-1 uppercase">
                          <Clock className="h-2 w-2" /> Semanal
                      </div>
                  )}
              </div>

              {/* Content Area */}
              <CardContent className="p-3 pt-1 flex-1 flex flex-col justify-between">
                 <h3 className="text-xs sm:text-sm font-medium text-slate-800 leading-snug line-clamp-2 h-9 overflow-hidden">
                     {product.name}
                 </h3>
                 
                 <div className="pt-2 space-y-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(product.price || 0)}
                        </span>
                        {(product as any).originalPrice && (product as any).originalPrice > (product.price || 0) && (
                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                                ${((product as any).originalPrice || 0).toLocaleString('es-AR')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-[#FF0000]">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format((product.price || 0) * 0.95)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">P/SOCIOS</span>
                    </div>

                    {/* Merchant & Distance Line */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 min-w-0">
                            <Store className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate font-medium text-slate-600">
                                {product.isRetailerProduct ? (product.businessName || 'Comercio Local') : (product.provider || product.wholesalerName || 'Proveedor')}
                            </span>
                        </div>
                        {product.distance !== undefined && (
                            <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                                {product.distance < 1000 ? `${Math.round(product.distance)}m` : `${(product.distance / 1000).toFixed(1)}km`}
                            </span>
                        )}
                    </div>
                 </div>
              </CardContent>
            </Card>
        </div>

        {/* Quick View / Add to Cart Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open && onAutoOpenClose) onAutoOpenClose();
        }}>
            <DialogContent className="max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden border-none bg-white shadow-2xl top-[50%] md:top-[50%] translate-y-[-50%]">
                <DialogHeader className="sr-only">
                    <DialogTitle>{product.name}</DialogTitle>
                </DialogHeader>
                
                {/* Product Image Header */}
                <div className="relative w-full h-[180px] md:h-[240px] bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
                    <Image src={imgSrc} alt={product.name} fill className="object-contain p-4 md:p-8 mix-blend-multiply" unoptimized />
                </div>

                <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-4 overflow-y-auto max-h-[60vh]">
                    {/* Title & Price */}
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight mb-1">
                            {product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border border-slate-200/60">
                                SKU: {product.code || "N/A"}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                                <Store className="w-3.5 h-3.5 text-slate-400" />
                                {product.isRetailerProduct ? (product.businessName || 'Comercio Local') : (product.provider || product.wholesalerName || 'Proveedor')}
                            </span>
                            {product.distance !== undefined && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs text-red-600 font-bold flex items-center gap-0.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {product.distance < 1000 ? `${Math.round(product.distance)}m` : `${(product.distance / 1000).toFixed(1)}km`}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                                ${(product.price || 0).toLocaleString('es-AR')}
                            </span>
                            {isWholesaler && (
                                <Badge variant="outline" className="ml-auto border-emerald-100 bg-emerald-50 text-emerald-700 font-bold">
                                    Stock: {product.stock ?? 0}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Savings Message */}
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-3">
                        <div className="mt-0.5"><Star className="h-4 w-4 text-amber-500 fill-amber-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-amber-900">Beneficio RedEconomiX</p>
                            <p className="text-[11px] text-amber-700/80 leading-snug mt-0.5">
                                Programando tus compras por bulto cerrado ahorras hasta un <span className="font-bold">5% mensual</span> en stock.
                            </p>
                        </div>
                    </div>

                    {/* Iñaki Warning */}
                    {product.wholesalerId === 'inaki_oran' && (
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-start gap-3">
                            <div className="mt-0.5"><Clock className="h-4 w-4 text-blue-600" /></div>
                            <div>
                                <p className="text-xs font-bold text-blue-900">Logística Semanal</p>
                                <p className="text-[11px] text-blue-700/80 leading-snug mt-0.5">
                                    Este producto se entrega <span className="font-bold">el mismo día de la semana próxima</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mt-2 border border-slate-200 rounded-2xl p-3 md:p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-900 text-xs md:text-sm">Unidades</p>
                            <p className="text-[10px] md:text-[11px] text-slate-500">Añadir al pedido</p>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 bg-slate-100 rounded-full px-2 py-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full text-slate-600 hover:bg-slate-200" onClick={decreaseQuantity}>
                                <Minus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <span className="font-bold text-slate-900 text-sm md:text-base w-6 text-center tabular-nums">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full text-slate-600 hover:bg-slate-200" onClick={increaseQuantity}>
                                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </div>
                    </div>
                    {product.wholesalerId === 'inaki_oran' && (
                        <p className="text-[10px] text-amber-600 font-bold text-center mt-1 uppercase tracking-widest">
                            Este mayorista solo permite compras de 5 unidades o más.
                        </p>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-slate-100 bg-white">
                    <Button 
                        onClick={handleConfirmAdd}
                        disabled={isOutOfStock}
                        className="w-full h-14 rounded-full bg-[#FF0000] text-white font-bold text-base shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] flex items-center justify-between px-8"
                    >
                        <span>{isSelected ? "Actualizar cantidad" : "Añadir a mi orden"}</span>
                        <span className="font-bold">${(totalDynamicPrice || 0).toLocaleString('es-AR')}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        {/* Share Modal */}
        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogContent className="sm:max-w-md rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-[#FF0000]" /> Compartir Producto
                    </DialogTitle>
                    <DialogDescription>
                        Elegí dónde querés compartir este producto de RedEconomiX.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-[100px] gap-3 rounded-[24px] bg-[#25D366]/5 border-[#25D366]/20 hover:bg-[#25D366] hover:text-white group transition-all duration-300"
                        onClick={() => window.open(socialLinks.whatsapp, '_blank')}
                    >
                        <svg className="w-8 h-8 text-[#25D366] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        <span className="text-sm font-bold text-[#25D366] group-hover:text-white transition-colors">WhatsApp</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-[100px] gap-3 rounded-[24px] bg-[#1877F2]/5 border-[#1877F2]/20 hover:bg-[#1877F2] hover:text-white group transition-all duration-300"
                        onClick={() => window.open(socialLinks.facebook, '_blank')}
                    >
                        <svg className="w-8 h-8 text-[#1877F2] group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="text-sm font-bold text-[#1877F2] group-hover:text-white transition-colors">Facebook</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-[100px] gap-3 rounded-[24px] bg-slate-50 border-slate-200 hover:bg-slate-900 hover:text-white group transition-all duration-300"
                        onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            toast({ title: "Enlace copiado" });
                        }}
                    >
                        <Copy className="h-7 w-7 text-slate-700 group-hover:text-white transition-colors" />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-white transition-colors">Copiar Link</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex flex-col h-[100px] gap-3 rounded-[24px] bg-black/5 border-black/10 hover:bg-black hover:text-white group transition-all duration-300"
                        onClick={() => window.open(socialLinks.twitter, '_blank')}
                    >
                        <svg className="w-7 h-7 text-black group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span className="text-sm font-bold text-black group-hover:text-white transition-colors">X / Twitter</span>
                    </Button>
                </div>
                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsShareModalOpen(false)}
                        className="w-full rounded-xl"
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Map Modal */}
        <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
            <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden bg-white">
                <DialogHeader className="p-4 border-b border-slate-100 pb-3">
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-600" /> Ubicación del Local
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        {product.address || product.businessName || 'Dirección del comercio'}
                    </DialogDescription>
                </DialogHeader>
                {product.latitude && product.longitude && (
                    <div className="w-full h-[300px] bg-slate-50 relative z-0">
                        <MiniMap lat={Number(product.latitude)} lng={Number(product.longitude)} />
                    </div>
                )}
                <DialogFooter className="p-4 border-t border-slate-100 bg-white sm:justify-start">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsMapModalOpen(false)}
                        className="w-full rounded-xl h-12"
                    >
                        Cerrar mapa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export const ProductSkeleton = memo(() => {
  return (
    <div className="h-full">
      <Card className="group relative h-full flex flex-col rounded-2xl bg-white overflow-hidden border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Image Area Skeleton */}
        <div className="relative aspect-square w-full p-4 flex items-center justify-center bg-slate-50 animate-pulse">
           <div className="w-3/4 h-3/4 bg-slate-200/70 rounded-xl" />
        </div>
        
        {/* Content Area Skeleton */}
        <CardContent className="p-4 pt-1 flex-1 flex flex-col gap-2">
           <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse mt-2" />
           <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse" />
           
           <div className="mt-auto pt-2 space-y-2">
              <div className="h-6 bg-slate-100 rounded-lg w-1/2 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-full w-1/3 animate-pulse" />
              <div className="flex gap-1 mt-2">
                 <div className="h-2 bg-slate-100 rounded-full w-8 animate-pulse" />
                 <div className="h-2 bg-slate-100 rounded-full w-12 animate-pulse" />
                 <div className="h-2 bg-slate-100 rounded-full w-10 animate-pulse" />
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
});

ProductSkeleton.displayName = 'ProductSkeleton';
