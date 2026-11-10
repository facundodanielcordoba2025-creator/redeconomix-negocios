'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  LogOut,
  User as UserIcon,
  ChevronLeft,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Gift,
  Crown,
  AlertTriangle,
  Wallet,
  Home,
  Car,
  Smartphone,
  HardHat,
  Sparkles,
  Wrench,
  Newspaper,
  ShieldAlert,
  Repeat,
  Store,
  Building,
  MapPin,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, query, collection, where, limit, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { NotificationsBell } from './notifications-bell';
import { cn } from '@/lib/utils';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';

const DESKTOP_NAV_ITEMS = [
  { href: '/redeconomix', label: 'Marketplace', icon: Store },
  { href: '/redeconomix/billetera', label: 'Ganar Más', icon: TrendingUp },
  { href: '/redeconomix/dashboard-negocio', label: 'Mi Negocio', icon: Building },

  { href: '/programa-esencial', label: 'Bienestar', icon: ShieldCheck },
  // { href: '/gerald', label: 'GeralD', icon: Crown },
  { href: '/redeconomix/servicios', label: 'Servicios', icon: Wrench },
];

export function RedEconomiXHeader({ 
    title, 
    hideBackButton = false,
    showDangerAlert = false,
    backHref,
    variant = 'white',
    brandText,
    className
}: { 
    title?: string, 
    hideBackButton?: boolean, 
    showDangerAlert?: boolean, 
    backHref?: string,
    variant?: 'white' | 'red' | 'tech' | 'business' | 'transparent',
    brandText?: string,
    className?: string
}) {
    const { user } = useUser();
    const { itemCount } = useRedEconomiXCart();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname() || '';
    const [isClient, setIsClient] = useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userData } = useDoc(userDocRef);
    
    const isBusiness = 
        userData?.accountType?.toLowerCase() === 'retailer' || 
        userData?.accountType?.toLowerCase() === 'negocio' || 
        userData?.accountType?.toLowerCase() === 'comercio' || 
        userData?.accountType?.toLowerCase() === 'minorista' || 
        userData?.accountType?.toLowerCase() === 'shop' ||
        userData?.accountType?.toLowerCase() === 'preventista' ||
        userData?.accountType?.toLowerCase() === 'vendedor' ||
        userData?.accountType?.toLowerCase() === 'admin' ||
        userData?.accountType?.toLowerCase() === 'owner' ||
        userData?.accountType?.toLowerCase() === 'dueño' ||
        userData?.accountType?.toLowerCase() === 'socio' ||
        !!userData?.businessId || 
        !!userData?.branchId ||
        user?.uid?.startsWith('HvnrCjJj'); // BYPASS MAESTRO PARA FACUNDO

    const businessesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, "users"), where("accountType", "in", ["wholesaler", "retailer", "mayorista", "negocio", "admin", "kiosco", "tienda", "comercio", "supermercado", "distribuidor"]));
    }, [firestore]);
    const { data: allBusinesses } = useCollection<any>(businessesQuery);
    
    const [businessesWithProducts, setBusinessesWithProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!allBusinesses || allBusinesses.length === 0 || !firestore) return;
        const checkProducts = async () => {
            const withProducts = new Set<string>();
            for (const b of allBusinesses) {
                const uid = b.uid || b.id;
                try {
                    const rQuery = query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', uid), limit(1));
                    const rSnap = await getDocs(rQuery);
                    if (!rSnap.empty) {
                        withProducts.add(uid);
                        continue;
                    }
                    const wQuery = query(collection(firestore, 'wholesale_products'), where('wholesalerId', '==', uid), limit(1));
                    const wSnap = await getDocs(wQuery);
                    if (!wSnap.empty) {
                        withProducts.add(uid);
                    }
                } catch (e) { console.error("Error checking products for", uid, e); }
            }
            setBusinessesWithProducts(withProducts);
        };
        checkProducts();
    }, [allBusinesses, firestore]);
    
    useEffect(() => { setIsClient(true); }, []);

    const handleLogout = async () => {
        if (auth) { await signOut(auth); router.push('/login'); }
    };

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-[100] w-full pt-[env(safe-area-inset-top)] transition-all duration-500",
            variant === 'transparent' ? 'bg-transparent' : 
            variant === 'red' ? 'bg-[#FF0000]' : 
            variant === 'tech' ? 'bg-[#020617]' :
            variant === 'business' ? 'bg-[#002752]' :
            'bg-white'
        )}>
            {/* ── ROW 1: Brand + Actions ── */}
            <div className={cn(
                "w-full transition-colors duration-500",
                variant === 'white' ? "bg-white border-b border-slate-100 shadow-sm" : 
                variant === 'red' ? "bg-[#FF0000] border-none shadow-lg" : 
                variant === 'tech' ? "bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 shadow-2xl" :
                variant === 'business' ? "bg-[#002752] border-b border-white/5 shadow-2xl" :
                "bg-transparent border-none",
                className
            )}>
                <div className="container mx-auto flex h-[65px] md:h-16 items-center justify-between px-4 lg:px-8">

                {/* Logo & Brand Area */}
                <div className="flex items-center">
                    {!hideBackButton && (backHref || variant !== 'red') && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => backHref ? router.push(backHref) : router.back()} 
                            className={cn(
                                "mr-3 h-9 w-9 rounded-full transition-all md:hidden",
                                variant === 'white' ? "hover:bg-slate-100 text-slate-900" : "hover:bg-white/10 text-white"
                            )}
                         >
                            <ChevronLeft className="h-5 w-5" />
                         </Button>
                    )}
                    <Link href="/redeconomix" className="flex items-center group">
                        <div className="flex flex-col items-start leading-none pr-4">
                            {brandText ? (
                                 <span className={cn(
                                     "text-[20px] md:text-2xl font-black tracking-tighter",
                                     variant === 'white' ? "text-slate-900" : "text-white"
                                 )}>{brandText}</span>
                            ) : (
                                <div className="flex items-baseline leading-[0.8] notranslate" translate="no">
                                    <span className={cn(
                                        "text-[22px] md:text-2xl font-black tracking-tighter font-headline",
                                        variant === 'white' ? "text-slate-900" : "text-white"
                                    )}>RedEconomi</span>
                                    <span className={cn(
                                        "text-[28px] md:text-3xl font-black ml-[-1px] italic tracking-tighter transition-colors font-headline",
                                        variant === 'white' ? "text-[#FF0000]" : 
                                        variant === 'tech' ? "text-white" : 
                                        variant === 'business' ? "text-white" : "text-white"
                                    )}>X</span>
                                </div>
                            )}
                            {title && (
                                <span className={cn(
                                    "text-[10px] md:text-[11px] font-black uppercase tracking-widest mt-0.5 font-headline",
                                    variant === 'tech' ? "text-white/90" : 
                                    variant === 'white' ? "text-slate-500" : "text-white/90"
                                )}>
                                    {title}
                                </span>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Unified Actions Bar */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {showDangerAlert && (
                        <Button variant="destructive" size="sm" className="hidden xs:flex h-8 bg-black hover:bg-slate-800 text-white border-none rounded-full px-4 gap-2 text-[10px] font-black uppercase italic animate-pulse">
                            <AlertTriangle className="h-3 w-3 text-red-500" /> CUIDADO
                        </Button>
                    )}

                    {isClient && (
                        <>
                            <NotificationsBell variant={(variant === 'red' || variant === 'tech') ? 'white' : 'dark'} />
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => router.push('/redeconomix?showMap=true')} 
                                className={cn("hidden xs:flex h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all", variant === 'white' ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/20")}
                            >
                                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all", variant === 'white' ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/20")}>
                                        <Store className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 max-h-[350px] overflow-y-auto mt-3 p-4 rounded-[2rem] bg-white text-slate-900 border-slate-100 shadow-2xl relative z-[1000]">
                                    <DropdownMenuLabel className="font-bold uppercase text-[9px] tracking-widest text-slate-400 mb-2">Comercios</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => router.push('/redeconomix')} className="rounded-xl h-11 mb-1 cursor-pointer hover:bg-slate-50 font-bold">
                                        Todos los comercios
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-slate-100 mb-2" />
                                    {(() => {
                                        if (!allBusinesses) return null;
                                        return allBusinesses
                                            ?.filter(b => b.businessName || b.fullName)
                                            .filter(b => businessesWithProducts.has(b.uid || b.id))
                                            .filter(b => {
                                                const name = (b.businessName || b.fullName).toLowerCase().trim();
                                                if (name.includes('prueba')) return false;
                                                return true;
                                            })
                                            .map(b => (
                                                <DropdownMenuItem 
                                                    key={b.uid || b.id} onClick={() => router.push(`/redeconomix?storeId=${b.uid || b.id}`)} className="rounded-xl h-11 mb-1 cursor-pointer hover:bg-slate-50">
                                                    {b.businessName || b.fullName}
                                                </DropdownMenuItem>
                                            ));
                                    })()}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className={cn("w-[1px] h-4 mx-1", variant === 'white' ? "bg-slate-200" : "bg-white/20")} />
                            {user ? (
                                <div className="flex items-center gap-1 sm:gap-3">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn(
                                            "relative h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all",
                                            variant === 'white' ? "bg-slate-50 text-slate-600 hover:bg-slate-100" : "bg-white/10 text-white hover:bg-white/20"
                                        )}
                                        onClick={() => router.push('/redeconomix/carrito')}
                                    >
                                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                        {itemCount > 0 && (
                                            <span className={cn(
                                                "absolute -top-1 -right-1 h-4 w-4 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm",
                                                variant === 'white' ? "bg-[#FF0000]" : "bg-[#FF0000] border border-white/20"
                                            )}>
                                                {itemCount}
                                            </span>
                                        )}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0 transition-all border-none">
                                                <Avatar className="h-full w-full rounded-full ring-2 ring-white shadow-sm">
                                                    {user.photoURL ? <AvatarImage src={user.photoURL} /> : <AvatarFallback className="bg-slate-200 text-slate-600 font-bold text-[10px]">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>}
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 mt-3 p-4 rounded-[2rem] bg-white text-slate-900 border-slate-100 shadow-2xl relative z-[1000]">
                                            <DropdownMenuLabel className="font-bold uppercase text-[9px] tracking-widest text-slate-400 mb-2">Socio</DropdownMenuLabel>
                                            <DropdownMenuItem className="rounded-xl h-11 mb-1 cursor-pointer" onSelect={() => router.push('/redeconomix/perfil')}>
                                                <UserIcon className="mr-3 h-4 w-4 text-slate-500" /> Perfil
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl h-11 mb-1 cursor-pointer" onSelect={() => router.push('/redeconomix/referidos')}>
                                                <Gift className="mr-3 h-4 w-4 text-primary" /> Invitá y Gana
                                            </DropdownMenuItem>
                                            {(userData?.isSeller || userData?.sellerCode || userData?.accountType === 'vendedor') && (
                                                <DropdownMenuItem className="rounded-xl h-11 mb-1 cursor-pointer font-bold text-[#FF0000] focus:bg-red-50" onSelect={() => router.push('/redeconomix/mis-ventas')}>
                                                    <TrendingUp className="mr-3 h-4 w-4 text-[#FF0000]" /> Mis Ventas (Vendedor)
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={handleLogout} className="rounded-xl h-11 text-[#FF2E55] focus:bg-red-50 cursor-pointer font-bold">
                                                <LogOut className="mr-3 h-4 w-4" /> Salir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ) : (
                                <Button asChild className="h-8 px-4 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Link href="/login">Entrar</Link>
                                </Button>
                            )}
                        </>
                    )}
                </div>
                </div>
            </div>

            {/* ── ROW 2: Desktop Section Nav (hidden on mobile) ── */}
            <div className="hidden md:block bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 lg:px-8">
                    <nav className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar">
                        {DESKTOP_NAV_ITEMS.filter(item => {
                            if (item.label === 'Mi Negocio') return isBusiness;
                            return true;
                        }).map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/redeconomix' && pathname.startsWith(item.href));
                            // Special case for 'Marketplace' to act like '¡Ofertas!' in DIA
                            const isSpecial = item.label === 'Marketplace';
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-2 h-full text-[13px] font-bold whitespace-nowrap transition-colors duration-200 shrink-0",
                                        isActive || isSpecial
                                            ? "text-[#FF0000]"
                                            : "text-slate-600 hover:text-[#FF0000]"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-[18px] h-[18px]", 
                                        isActive || isSpecial ? "text-[#FF0000]" : "text-slate-400 group-hover:text-[#FF0000]"
                                    )} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}
