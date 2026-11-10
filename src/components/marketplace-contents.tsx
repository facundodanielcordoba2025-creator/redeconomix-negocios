'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, useCollectionOnce, useDoc } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { 
  collection, query, orderBy, where, doc, setDoc, limit
} from 'firebase/firestore';
import { 
  SearchIcon, Smartphone, ShieldCheck, Zap, HandCoins, ShoppingBag, Download,
  ArrowRight, Info, Filter, Sparkles as SparklesIcon, Grid3X3, Package, Heart, User, ScanIcon, PartyPopper, Star, CheckCircle,
  Truck, Hammer, Wrench, Bike, Paintbrush, Wifi, Car, Wallet, Banknote, Tag, HardHat, Utensils, Smile as SmileCatIcon, Home, Store,
  X, CameraOff, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProductCard, ProductSkeleton } from '@/components/product-card';
import dynamic from 'next/dynamic';
import type { MapBusiness } from '@/components/marketplace-map';

const BarcodeScanner = dynamic(() => import('@/components/barcode-scanner').then(m => m.BarcodeScanner), { ssr: false });
const MarketplaceMap = dynamic(() => import('@/components/marketplace-map'), { ssr: false });

interface Product {
  id: string;
  productId: string;
  wholesaler: string;
  wholesalerId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  provider: string;
  rating: number;
  reviews: number;
  monthlyPayment: boolean;
  brand?: string;
  retailerId?: string;
  address?: string;
  code?: string;
  stock?: number;
  expirationDate?: string;
  updatedAt?: any;
}

const PlaceHolderImages = [
    { id: 'redeconomixBanner1', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/oggie-8529f.firebasestorage.app/o/Mayorista%2Fmarketing%2Fhomeretiro25.webp?alt=media&token=7cac7dae-9d1a-48ab-9533-1ca8872dd637', description: 'Retiro 25% OFF' },
    { id: 'redeconomixBanner2', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/oggie-8529f.firebasestorage.app/o/Mayorista%2Fmarketing%2Ftarjeta_naranja_web.png?alt=media&token=48136562-960d-48b0-a31f-507b2935a6c4', description: 'Tarjeta Naranja' },
    { id: 'redeconomixBanner3', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/oggie-8529f.firebasestorage.app/o/Mayorista%2Fmarketing%2Fdanone_web.png?alt=media&token=79906de1-0059-4260-8033-18aa43df98d1', description: 'Danone' },
    { id: 'redeconomixBanner4', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/oggie-8529f.firebasestorage.app/o/Mayorista%2Fmarketing%2Fbanner_super_desk.png?alt=media&token=c94def45-5f3a-4aec-9900-301624db3a83', description: 'Supermercado' },
];


export function MarketplaceContents() {
  const db = useFirestore(); // Usamos 'db' para evitar cualquier conflicto con el nombre 'db'
  const { user: authUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isWelcomePremiumOpen, setIsWelcomePremiumOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGuestWelcomeOpen, setIsGuestWelcomeOpen] = useState(false);
  const [selectedProductForAssistant, setSelectedProductForAssistant] = useState<Product | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [autoOpenProductId, setAutoOpenProductId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const isWelcomeMode = searchParams.get('welcome') === 'true';
  const showMapParam = searchParams.get('showMap') === 'true';
  const storeIdParam = searchParams.get('storeId');
  const refCode = typeof window !== 'undefined' ? localStorage.getItem('rm_referral_code') : null;
  const [isMapView, setIsMapView] = useState(showMapParam);

  useEffect(() => {
    if (showMapParam) {
      setIsMapView(true);
    }
  }, [showMapParam]);

  const [visibleSearchCount, setVisibleSearchCount] = useState(24);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const { addToCart } = useRedEconomiXCart();
  const { toast } = useToast();

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!mounted) return;
    const pid = searchParams.get('productId');
    if (pid) {
      setAutoOpenProductId(pid);
    }
  }, [searchParams, mounted]);

  const categories = [
    { name: 'Todos los productos', icon: Grid3X3, value: 'all' },
    { name: 'Comidas', icon: Utensils, value: 'COMIDAS' },
    { name: 'Limpieza', icon: SparklesIcon, value: 'LIMPIEZA' },
    { name: 'Aceites', icon: HandCoins, value: 'ACEITES' },
    { name: 'Arroz', icon: Package, value: 'ARROZ' },
    { name: 'Almacén', icon: Package, value: 'ALMACÉN' },
    { name: 'Cuidado bucal', icon: SmileCatIcon, value: 'CUIDADO BUCAL' },
    { name: 'Cuidado de la piel', icon: Heart, value: 'CUIDADO DE LA PIEL' },
    { name: 'Cuidado personal', icon: User, value: 'CUIDADO PERSONAL' },
  ];

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
  }, [db, authUser]);

  const { data: userData } = useDoc(userDocRef);
  const isWholesaler = userData?.accountType === 'wholesaler';

  useEffect(() => {
    if (userData?.isPremium && !userData?.premiumWelcomeSeen) {
       setIsWelcomePremiumOpen(true);
    }
  }, [userData]);

  const markWelcomeSeen = async () => {
    if (!db || !authUser) return;
    try {
        await setDoc(doc(db, 'users', authUser.uid), { premiumWelcomeSeen: true }, { merge: true });
        setIsWelcomePremiumOpen(false);
    } catch (e) {
        console.error("Error marking welcome seen:", e);
        setIsWelcomePremiumOpen(false);
    }
  };

  // MOTOR DE SEMBRADO DESACTIVADO PARA EVITAR SOBRESCRITURA DE DATOS MANUALES
  useEffect(() => {
    // Ya no sembramos datos estáticos. Los productos se gestionan desde el Panel Admin.
    console.log("Marketplace cargado desde la base de datos real.");
  }, [db, authUser]);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    if (storeIdParam) {
       return query(collection(db, "wholesale_products"), where("wholesalerId", "==", storeIdParam));
    }
    return query(collection(db, "wholesale_products"), limit(1500));
  }, [db, storeIdParam]);
  const { data: wholesaleProducts } = useCollectionOnce<Product>(productsQuery);

  const retailerProductsQuery = useMemoFirebase(() => {
    if (!db) return null;
    if (storeIdParam) {
       return query(collection(db, "retailer_inventory"), where("retailerId", "==", storeIdParam));
    }
    return query(collection(db, "retailer_inventory"), limit(2000));
  }, [db, storeIdParam]);
  const { data: retailerProducts } = useCollectionOnce<Product>(retailerProductsQuery);



  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('No GPS for distances', err)
      );
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const businessesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "users"), 
      where("accountType", "in", ["wholesaler", "retailer", "mayorista", "negocio", "admin", "kiosco", "tienda", "comercio", "supermercado", "distribuidor"]),
      limit(500)
    );
  }, [db]);
  const { data: allBusinesses } = useCollectionOnce<any>(businessesQuery);

  const businessMap = useMemo(() => {
    const map = new Map<string, any>();
    if (allBusinesses) {
      allBusinesses.forEach(b => map.set(b.uid || b.id, b));
    }
    return map;
  }, [allBusinesses]);

  const mapBusinesses = useMemo<MapBusiness[]>(() => {
    if (!allBusinesses) return [];
    return allBusinesses
      .filter(b => b.latitude && b.longitude)
      .map(b => {
        let distance: number | undefined = undefined;
        if (userLocation) {
          distance = getDistance(userLocation[0], userLocation[1], b.latitude, b.longitude);
        }
        return {
          id: b.uid || b.id,
          businessName: b.businessName || b.fullName || 'Comercio',
          latitude: b.latitude,
          longitude: b.longitude,
          businessHours: b.businessHours,
          accountType: b.accountType,
          distance
        };
      });
  }, [allBusinesses, userLocation]);

  const activeWholesalerIds = useMemo(() => {
    if (!allBusinesses) return null;
    return new Set(allBusinesses.filter(w => (w.accountType === 'wholesaler' || w.accountType === 'mayorista') && w.isActive !== false).map(w => w.uid || w.id));
  }, [allBusinesses]);

  const products = useMemo(() => {
    if (wholesaleProducts === undefined && retailerProducts === undefined) return undefined;
    const arr: Product[] = [];
    if (wholesaleProducts) {
      for (const p of wholesaleProducts) {
        // Mostrar solo productos que tengan un dueño real (wholesalerId válido) y que ese dueño EXISTA en la app.
        // Ignoramos providerId para evitar mostrar el catálogo maestro sin dueño.
        const hasValidOwner = p.wholesalerId && p.wholesalerId !== 'unknown' && businessMap.has(p.wholesalerId);
        if (hasValidOwner) {
          arr.push(p);
        }
      }
    }
    if (retailerProducts) {
      for (const p of retailerProducts as any[]) {
        let rId = p.retailerId as string;
        
        // MODO RESCATE: Si el producto no tiene retailerId (ej. productos antiguos de Doña Lili),
        // intentamos buscar su UID haciendo match con el nombre del negocio.
        if (!rId && p.businessName) {
            const match = Array.from(businessMap.values()).find(b => 
                b.businessName?.toLowerCase().trim() === p.businessName.toLowerCase().trim() ||
                b.fullName?.toLowerCase().trim() === p.businessName.toLowerCase().trim()
            );
            if (match) {
                rId = match.uid || match.id;
            }
        }

        const business = businessMap.get(rId);
        
        // Si después de intentar rescatarlo sigue sin dueño, lo filtramos. (No más productos fantasma)
        if (!rId || !business) {
            continue;
        }

        let distance: number | undefined = undefined;
        if (userLocation && business?.latitude && business?.longitude) {
           distance = getDistance(userLocation[0], userLocation[1], business.latitude, business.longitude);
        }
        const branchStockSum = (p.stockByBranch && typeof p.stockByBranch === 'object')
          ? Object.values(p.stockByBranch).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0)
          : 0;
        const effectiveStock = branchStockSum > 0 ? branchStockSum : (Number(p.stock) || 0);
        const resolvedBusinessName = business.businessName || business.fullName || p.businessName || 'Comercio Local';

        arr.push({ 
          ...p,
          id: p.id,
          productId: p.id, // Asegurar que productId apunte al doc real de retailer_inventory para descontar stock
          retailerId: rId,
          wholesalerId: rId,
          wholesalerName: resolvedBusinessName,
          stock: effectiveStock,
          price: p.salePrice || p.price || 0,
          isRetailerProduct: true,
          businessName: resolvedBusinessName,
          businessHours: business.businessHours,
          distance,
          latitude: business.latitude,
          longitude: business.longitude,
          address: business.address
        });
      }
    }
    return arr;
  }, [wholesaleProducts, retailerProducts, businessMap, userLocation, authUser, userData]);

  useEffect(() => {
    if (products) {
      import('@capacitor/core').then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import('@capacitor/splash-screen').then(({ SplashScreen }) => {
            SplashScreen.hide().catch(() => {});
          });
        }
      });
    }
  }, [products]);

  const handleScanSuccess = useCallback((code: string) => {
    const cleanCode = code.trim();
    setSearchQuery(cleanCode);
    setDebouncedSearchQuery(cleanCode);
    setIsScannerOpen(false);
    
    const exactMatch = products?.find(p => 
      String(p.code).trim() === cleanCode || 
      String(p.productId).trim() === cleanCode || 
      String((p as any).barcode).trim() === cleanCode
    );

    if (exactMatch) {
        setAutoOpenProductId(exactMatch.id);
        toast({ 
            title: "¡Código Detectado!", 
            description: `Abriendo ficha de: ${exactMatch.name}`,
        });
    } else {
        setAutoOpenProductId(null);
        toast({ title: "Buscando...", description: `Código: ${cleanCode}. Si no aparece, verifica el stock.` });
    }
  }, [toast, products]);

  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const startScanner = useCallback(() => {
     setAutoOpenProductId(null); 
     setIsScannerLoading(true);
     setIsScannerOpen(true);
     setTimeout(() => {
         setIsScannerLoading(false);
     }, 1000);
  }, []);
  const stopScanner = useCallback(() => setIsScannerOpen(false), []);

  const productsByCategory = useMemo(() => {
    if (!products) return {};
    const categoriesAux: Record<string, Product[]> = {};
    
    let activeProducts = [...products];
    if (storeIdParam) {
        activeProducts = activeProducts.filter((p: any) => p.retailerId === storeIdParam || p.wholesalerId === storeIdParam);
    }
    
    // Primero ordenamos todos los productos por precio de menor a mayor
    const sortedProducts = activeProducts.sort((a, b) => (a.price || 0) - (b.price || 0));

    sortedProducts.forEach(p => {
      const cat = (p.category || 'Varios').toUpperCase();
      if (!categoriesAux[cat]) categoriesAux[cat] = [];
      categoriesAux[cat].push(p);
    });
    return categoriesAux;
  }, [products, storeIdParam]);

  const sortedCategories = useMemo(() => Object.keys(productsByCategory).sort(), [productsByCategory]);

  // activeWholesalerIds ya se define arriba junto con businessMap

  const filteredProducts = useMemo(() => {
    if (!products) return null;
    
    // FILTRO DE SEGURIDAD: Mostramos todo lo que no esté explícitamente desactivado
    let filtered = [...products];
    
    if (storeIdParam) {
        filtered = filtered.filter((p: any) => p.retailerId === storeIdParam || p.wholesalerId === storeIdParam);
    }

    filtered = filtered.filter((p: any) => {
      const cat = (p.category || '').toUpperCase();
      if (cat === 'INACTIVO') return false;
      
      // Precio efectivo: para kioscos usamos salePrice, para mayoristas price
      const effectivePrice = p.salePrice || p.price || 0;
      if (!effectivePrice || effectivePrice <= 0) return false;
      
      // Si es un producto de un kiosco/comercio local, DEBE tener stock
      const isRetailer = p.isRetailerProduct || !!p.retailerId;
      if (isRetailer) {
          if (p.stock === undefined || p.stock <= 0) return false;
      }
      
      return true;
    });
    
    if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => {
            const hasNameMatch = p.name?.toLowerCase().includes(q);
            const hasCodePartial = p.code && String(p.code).toLowerCase().includes(q);
            const hasBarcodePartial = (p as any).barcode && String((p as any).barcode).toLowerCase().includes(q);
            const isExactId = String(p.productId).toLowerCase() === q || String(p.id).toLowerCase() === q;
            return hasNameMatch || hasCodePartial || hasBarcodePartial || isExactId;
        });
        
        filtered.sort((a, b) => {
            const aExact = String(a.code).toLowerCase() === q || String(a.productId).toLowerCase() === q || String((a as any).barcode).toLowerCase() === q;
            const bExact = String(b.code).toLowerCase() === q || String(b.productId).toLowerCase() === q || String((b as any).barcode).toLowerCase() === q;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
        });
    }
    if (selectedCategory !== 'all') {
        const catQ = selectedCategory.toUpperCase();
        filtered = filtered.filter(p => {
            const prodCat = (p.category || '').toUpperCase();
            const prodName = (p.name || '').toUpperCase();
            
            if (catQ === 'ALMACÉN') {
                return prodCat.includes('ALMACÉN') || prodCat.includes('ACEITE') || prodCat.includes('ARROZ') || prodCat.includes('COMESTIBLES');
            }
            if (catQ === 'ACEITES') {
                return prodCat.includes('ACEITE') || prodName.includes('ACEITE');
            }
            if (catQ === 'ARROZ') {
                return prodCat.includes('ARROZ') || prodName.includes('ARROZ');
            }
            if (catQ === 'COMIDAS') {
                return prodCat.includes('COMIDA') || prodCat.includes('COMESTIBLES') || prodName.includes('COMIDA');
            }
            
            return prodCat === catQ || prodCat.includes(catQ) || prodName.includes(catQ);
        });
    }
    if (selectedBrand) {
        const brandQ = selectedBrand.toUpperCase();
        filtered = filtered.filter(p => (p.brand || '').toUpperCase() === brandQ || (p.name || '').toUpperCase().includes(brandQ));
    }

    // INTELIGENCIA DE COMPARACIÓN Y DE-DUPLICACIÓN: 
    // Agrupamos por SKU (code) para no mostrar tarjetas repetidas del mismo mayorista
    const uniqueProductsMap: Record<string, any> = {};
    
    filtered.forEach((p, index) => {
        const sku = (p.code || p.productId || p.id || '').toString().trim();
        const sellerId = p.retailerId ? p.retailerId : (p.wholesalerId || 'mayorista');
        
        // Si no tiene un SKU real, usamos su ID único o el índice para que no pise a otros sin código
        const isMissingSku = !sku || sku === 'undefined' || sku === 'null';
        const key = isMissingSku ? `unique_${p.id || index}` : `${sellerId}_${sku}`;
        
        if (!uniqueProductsMap[key] || (p.updatedAt?.seconds > (uniqueProductsMap[key].updatedAt?.seconds || 0))) {
            uniqueProductsMap[key] = p;
        }
    });

    // Convertimos de vuelta a array
    filtered = Object.values(uniqueProductsMap);

    // Detectar el mejor precio global por SKU entre todos los mayoristas
    const bestPriceMap: Record<string, number> = {};
    filtered.forEach(p => {
        const sku = (p.code || p.productId || p.id).toString().trim();
        if (!bestPriceMap[sku] || p.price < bestPriceMap[sku]) {
            bestPriceMap[sku] = p.price;
        }
    });

    // Marcar los productos ganadores
    filtered = filtered.map(p => {
        const sku = (p.code || p.productId || p.id).toString().trim();
        return {
            ...p,
            isBestPrice: p.price === bestPriceMap[sku]
        };
    });

    setVisibleSearchCount(24);
    return filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [products, activeWholesalerIds, debouncedSearchQuery, selectedCategory, selectedBrand, storeIdParam]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (filteredProducts && visibleSearchCount < filteredProducts.length) {
                setVisibleSearchCount(prev => prev + 24);
            }
        }
    }, { threshold: 0.1 });
    
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredProducts, visibleSearchCount, storeIdParam]);

  const handleAddToCart = (product: any) => {
    if (!authUser) { router.push('/login'); return; }
    addToCart(product);
    toast({ title: "Añadido al Carrito" });
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className={`min-h-screen text-slate-900 pb-32 transition-opacity duration-300 ${isScannerOpen ? 'opacity-0 pointer-events-none' : 'bg-white opacity-100'}`}>

      {/* HERO PORTADA */}
      <section className="relative w-full h-[220px] md:h-[300px] overflow-hidden bg-[#FF0000]">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200" alt="Hero" fill className="object-cover opacity-90 brightness-110" priority />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 z-10 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      <div className="container mx-auto px-4 md:px-8 -mt-8 md:-mt-12 relative z-30 space-y-6 md:space-y-8 text-slate-900">
        
        {/* COMBINED LIGHT SEARCH BAR & SCANNER */}
        <div className="w-full bg-white rounded-2xl p-2.5 sm:p-4 flex items-center border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.06)] gap-3 relative z-50 mb-4 mt-6">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-11 w-11 rounded-xl shrink-0 transition-all", selectedCategory !== 'all' ? "bg-[#FF0000] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}><Filter className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px] rounded-2xl p-4 shadow-2xl border border-slate-100 mt-2">
                    <DropdownMenuLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 p-2 mb-2">Filtrar Ahorros</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100 mb-2" />
                    {storeIdParam && (
                        <DropdownMenuItem 
                            onSelect={() => router.push('/redeconomix')} 
                            className="flex gap-3 h-12 rounded-xl mb-2 px-3 cursor-pointer transition-all bg-[#FF0000] text-white hover:bg-red-700 hover:text-white active:scale-95 shadow-md shadow-red-600/20"
                        >
                            <Store className="h-4 w-4" /> 
                            <span className="text-xs font-black tracking-wide">VER TODOS LOS COMERCIOS</span>
                        </DropdownMenuItem>
                    )}
                    {categories.map(cat => (
                        <DropdownMenuItem 
                            key={cat.value} 
                            onSelect={() => {
                                if (cat.value === 'all' && storeIdParam) {
                                    router.push('/redeconomix');
                                } else {
                                    setSelectedCategory(cat.value);
                                }
                            }} 
                            className={cn("flex gap-3 h-12 rounded-xl mb-1 px-3 cursor-pointer transition-all", selectedCategory === cat.value && !storeIdParam ? "bg-red-50 text-red-600 font-bold" : "hover:bg-slate-50 active:scale-95")}
                        >
                           <cat.icon className="h-4 w-4" /> 
                           <span className="text-xs font-medium">{cat.name}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex-1 bg-slate-50 rounded-xl flex items-center px-3.5 h-11 overflow-hidden border border-slate-100 focus-within:border-slate-300 focus-within:bg-white transition-colors">
                <SearchIcon className="h-4 w-4 text-slate-400 mr-2 shrink-0 hidden sm:block" />
                <Input 
                    placeholder="Buscar productos, marcas y más..." 
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 font-medium placeholder:text-slate-400 text-slate-900 shadow-none hover:shadow-none h-11 text-xs sm:text-sm px-0" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                />
            </div>

            <Button 
              onClick={startScanner} 
              disabled={isScannerLoading}
              className="bg-[#FF0000] hover:bg-[#E60000] text-white font-black text-[10px] sm:text-xs uppercase px-4 sm:px-5 rounded-xl h-11 border-none relative overflow-hidden active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
            >
              {isScannerLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Conectando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <ScanIcon className="h-3.5 w-3.5" />
                  <span className="text-[10px] sm:text-[11px] font-black tracking-wider leading-none">ESCANEAR</span>
                </div>
              )}
            </Button>
        </div>

        {/* OFERTAS BANNER */}
        <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FF6B35] to-[#E60000] p-4 sm:p-5 shadow-lg shadow-red-600/15 mb-6 flex items-center justify-between group">
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                    <Zap className="h-6 w-6 text-white fill-white" />
                </div>
                <div>
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Ofertas Flash</h3>
                    <p className="text-white/80 text-xs sm:text-sm font-medium leading-tight max-w-[200px] sm:max-w-none">
                        ¡Comestibles y productos a precios de liquidación!
                    </p>
                </div>
            </div>
            <Link href="/redeconomix/liquidacion-flash" className="relative z-10">
                <Button variant="secondary" className="bg-white text-red-600 hover:bg-slate-50 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-full h-10 sm:h-12 px-6 shadow-lg active:scale-95 transition-all">
                    Ver Todo
                </Button>
            </Link>
            
            {/* Decorative background elements */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 right-1/4 w-24 h-24 bg-black/10 rounded-full blur-xl" />
        </div>

        {/* LOADING SKELETONS */}
        {!products && !searchQuery && selectedCategory === 'all' && (
          <section className="space-y-6 pt-6">
             <div className="flex items-center justify-between px-2">
                <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse" />
             </div>
             <div className="flex gap-4 overflow-hidden px-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-none w-[46%] sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6">
                        <ProductSkeleton />
                    </div>
                ))}
             </div>
          </section>
        )}

        {/* CATEGORY EXPLORER */}
        {products && !searchQuery && selectedCategory === 'all' && sortedCategories.filter(cat => cat !== 'ELECTRONICA').map(cat => (
          <section key={cat} className="space-y-6 pt-6">
             <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">{cat}</h2>
                <Button variant="ghost" className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 rounded-full px-4 h-8">Ver Todo <ArrowRight className="ml-1 h-3 w-3" /></Button>
             </div>
             <Carousel opts={{ align: 'start' }} className="w-full">
                <CarouselContent className="-ml-4 pb-8">
                   {productsByCategory[cat].slice(0, 10).map(p => (
                      <CarouselItem key={p.id} className="pl-4 basis-[46%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                          <ProductCard 
                            product={p as any} 
                            onAddToCart={handleAddToCart} 
                            isWholesaler={isWholesaler} 
                            autoOpen={autoOpenProductId === p.id}
                            onAutoOpenClose={() => {
                                setAutoOpenProductId(null);
                                setSearchQuery('');
                            }}
                          />
                      </CarouselItem>
                   ))}
                </CarouselContent>
             </Carousel>
          </section>
        ))}

        {/* SEARCH RESULTS */}
        {(debouncedSearchQuery || selectedCategory !== 'all' || selectedBrand) && (
            <div className="pt-8 bg-white min-h-[500px]">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {!filteredProducts ? (
                       Array.from({ length: 12 }).map((_, i) => (
                           <div key={i}>
                               <ProductSkeleton />
                           </div>
                       ))
                   ) : (
                       filteredProducts.slice(0, visibleSearchCount).map(p => (
                           <ProductCard 
                            key={p.id} 
                            product={p as any} 
                            onAddToCart={handleAddToCart} 
                            isWholesaler={isWholesaler} 
                            autoOpen={autoOpenProductId === p.id}
                            onAutoOpenClose={() => {
                                setAutoOpenProductId(null);
                                setSearchQuery('');
                            }}
                           />
                       ))
                   )}
               </div>
               
               {/* L99: Observador de final de página */}
               {filteredProducts && visibleSearchCount < filteredProducts.length && (
                   <div ref={loadMoreRef} className="w-full py-20 flex justify-center items-center">
                       <div className="w-10 h-10 border-[6px] border-slate-100 border-t-[#FF2E55] rounded-full animate-spin" />
                   </div>
               )}
            </div>
        )}
        
        {isMapView && (
            <MarketplaceMap 
                businesses={mapBusinesses}
                userLocation={userLocation}
                onClose={() => {
                    setIsMapView(false);
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('showMap');
                    window.history.pushState({}, '', newUrl);
                }}
            />
        )}
      </div>
      
      {/* SCANNER DRAWER */}
      <Drawer open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DrawerContent className="bg-transparent border-none p-0 outline-none pb-12 shadow-none">
            {isScannerOpen && (
                <style>{`
                    [vaul-overlay] { display: none !important; }
                `}</style>
            )}
            <DrawerTitle className="sr-only">Escáner de Código de Barras</DrawerTitle>
            <div className={`w-full max-w-xl mx-auto h-[75vh] relative rounded-t-[3rem] overflow-hidden flex flex-col items-center justify-center pointer-events-auto transition-all ${isScannerLoading ? 'bg-black/90 backdrop-blur-xl shadow-[0_0_0_4000px_rgba(0,0,0,0.8)]' : 'bg-transparent shadow-[0_0_0_4000px_rgba(0,0,0,0.8)]'}`}>
                {/* Botón de Cierre Manual */}
                <button 
                    onClick={stopScanner}
                    className="absolute top-6 right-6 z-50 bg-red-600/90 text-white px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all"
                >
                    <CameraOff size={16} /> Apagar
                </button>
                
                {!isScannerLoading && (
                    <div className="relative w-[280px] h-[280px] mx-auto rounded-[2rem] overflow-visible z-10 flex items-center justify-center">
                        <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={stopScanner} continuous={true} holePunchColor="rgba(0,0,0,0.95)" />
                        
                        {/* Corner brackets para diseño visual */}
                        <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/10" />
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-[2rem]" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-[2rem]" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-[2rem]" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-[2rem]" />
                    </div>
                )}
                {isScannerLoading && (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 max-sm:h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-white font-bold tracking-widest text-sm animate-pulse">Iniciando Lente...</p>
                    </div>
                )}
            </div>
            
            <div className="mt-8 text-center text-white max-w-xs mx-auto pointer-events-none">
                <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-2 drop-shadow-md">Apunta al código de barras</p>
                <p className="text-[10px] opacity-80 drop-shadow-md">La cámara detectará automáticamente el producto en nuestro catálogo.</p>
            </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={isWelcomePremiumOpen} onOpenChange={markWelcomeSeen}>
        <DialogContent className="rounded-[3rem] p-0 bg-white max-w-sm overflow-hidden text-slate-900 border-none">
            <div className="p-10 text-center bg-amber-400 text-black">
                <PartyPopper className="h-16 max-sm:h-12 w-16 mx-auto mb-6" />
                <DialogTitle className="text-3xl font-bold">¡Bienvenido,<br />Socio Premium!</DialogTitle>
            </div>
            <div className="p-8 space-y-6 text-center">
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ya tienes acceso a beneficios exclusivos y giros extras.</p>
                <Button className="w-full h-16 max-sm:h-12 rounded-[2rem] bg-zinc-900 text-white font-bold" onClick={markWelcomeSeen}>¡Comenzar!</Button>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGuestWelcomeOpen} onOpenChange={setIsGuestWelcomeOpen}>
        <DialogContent className="rounded-[3rem] p-0 bg-white max-w-sm overflow-hidden text-slate-900 border-none shadow-2xl">
            <div className="p-10 text-center bg-red-600 text-white relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <Smartphone className="h-16 max-sm:h-12 w-16 mx-auto mb-6 relative z-10" />
                <DialogTitle className="text-2xl font-black uppercase tracking-tight relative z-10">¡Bienvenido a <br/>la Red!</DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2 relative z-10">Asesorado por {refCode || 'RedEconomiX'}</p>
            </div>
            <div className="p-8 space-y-6 text-center">
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed">
                    Estás navegando como invitado. Para realizar pedidos y recibir <span className="text-red-600">ofertas relámpago</span>, te recomendamos usar nuestra APP.
                </p>
                <div className="space-y-3">
                    <Button 
                        className="w-full h-16 max-sm:h-12 rounded-[1.5rem] bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[12px] tracking-widest" 
                        onClick={() => window.open('https://play.google.com/store/apps/details?id=com.redeconomix.app', '_blank')}
                    >
                        Descargar App <Download className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full h-12 rounded-[1.5rem] text-slate-400 font-black uppercase text-[10px] tracking-widest" 
                        onClick={() => setIsGuestWelcomeOpen(false)}
                    >
                        Continuar como invitado
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
