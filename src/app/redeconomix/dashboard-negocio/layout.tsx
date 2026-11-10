'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Loader2, User, Users, LogOut, MessageSquare, PanelLeft, 
  LayoutDashboard, ShoppingBag, Package, DollarSign, 
  ShieldCheck, Zap, Bell, ChevronRight, Store, ArrowLeft, BookOpen
} from "lucide-react";
import { RedEconomiXHeader } from '@/components/redeconomix-header';
import { RetailerBottomNav } from '@/components/retailer-bottom-nav';
import { NotificationsBell } from '@/components/notifications-bell';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/use-role';

const navLinks = [
    { href: "/redeconomix/dashboard-negocio/resumen", label: "Resumen", icon: LayoutDashboard },
    { href: "/redeconomix/dashboard-negocio/control-ventas", label: "Caja / TPV", icon: Zap },
    { href: "/redeconomix/dashboard-negocio/pedidos", label: "Ventas Online", icon: ShoppingBag },
    { href: "/redeconomix/dashboard-negocio/fiado", label: "Cuentas Corrientes", icon: BookOpen },
    { href: "/redeconomix/dashboard-negocio/stock", label: "Stock", icon: Package },
    { href: "/redeconomix/dashboard-negocio/proveedores", label: "Proveedores", icon: Users },
    { href: "/redeconomix/dashboard-negocio/contabilidad", label: "Contabilidad", icon: DollarSign },
    { href: "/redeconomix/dashboard-negocio/rrhh", label: "Recursos Humanos", icon: ShieldCheck },
    { href: "/redeconomix/dashboard-negocio/proyectos", label: "Proyectos de Expansión", icon: Store },
];

export default function RetailerDashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { role } = useRole();

  const allowedNavLinks = React.useMemo(() => {
    if (role === 'cashier') {
      return navLinks.filter(l => 
        l.href === '/redeconomix/dashboard-negocio/control-ventas' ||
        l.href === '/redeconomix/dashboard-negocio/stock'
      );
    }
    if (role === 'warehouse') {
      return navLinks.filter(l => 
        l.href === '/redeconomix/dashboard-negocio/stock'
      );
    }
    return navLinks;
  }, [role]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const employeeDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'employees', user.uid);
  }, [firestore, user]);

  const { data: userDocData, isLoading: isUserLoadingDoc } = useDoc(userDocRef);
  const { data: employeeDocData, isLoading: isEmployeeLoadingDoc } = useDoc(employeeDocRef);

  const userData = userDocData || (employeeDocData ? { ...employeeDocData, accountType: employeeDocData.accountType || 'preventista' } : null);
  const isLoading = isUserLoading || isUserLoadingDoc || isEmployeeLoadingDoc;
  const [isClient, setIsClient] = useState(false);
  const [isLinkedEmployee, setIsLinkedEmployee] = useState(false);
  const [checkingEmployee, setCheckingEmployee] = useState(true);

  useEffect(() => {
    async function verifyLinkedEmployee() {
      if (!firestore || !user?.email) {
        setCheckingEmployee(false);
        return;
      }
      try {
        const q = query(
          collection(firestore, 'retailer_employees'),
          where('email', '==', user.email.toLowerCase().trim()),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsLinkedEmployee(true);
        }
      } catch (err) {
        console.error("Error verificando empleado vinculado:", err);
      } finally {
        setCheckingEmployee(false);
      }
    }
    verifyLinkedEmployee();
  }, [firestore, user]);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isLoading && isClient && !checkingEmployee) {
      // Excepción para la Pantalla Cliente: debe ser pública para que tablets/smartTVs sin login puedan verla
      if (pathname?.includes('/pantalla-cliente')) {
        return; 
      }

      const type = userData?.accountType?.toLowerCase();
      const isBusiness = 
        type === 'retailer' || 
        type === 'negocio' || 
        type === 'comercio' || 
        type === 'minorista' || 
        type === 'shop' ||
        type === 'preventista' ||
        type === 'vendedor' ||
        type === 'admin' ||
        type === 'owner' ||
        type === 'dueño' ||
        type === 'socio' ||
        !!userData?.businessId || 
        !!userData?.branchId ||
        isLinkedEmployee ||
        user?.uid?.startsWith('HvnrCjJj');

      if (!user) {
        router.replace('/login');
      }
    }
  }, [isLoading, isClient, checkingEmployee, user, router, pathname]);

  // 1. Apagar cámara y limpiar clases al cambiar de ruta/pestaña
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('scanner-active');
      document.body.classList.remove('scanner-active-continuous');
      document.documentElement.classList.remove('scanner-active');
      document.documentElement.classList.remove('scanner-active-continuous');
      
      try {
        const { Capacitor } = require('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { BarcodeScanner } = require('@capacitor-mlkit/barcode-scanning');
          BarcodeScanner.stopScan().catch(() => {});
        }
      } catch (e) {
        console.warn("No se pudo detener el escáner al cambiar de ruta", e);
      }

      // Detener tracks de video web para evitar que la cámara quede prendida
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
          }
        });
      } catch (e) {}
    }
  }, [pathname]);

  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isPinned || isHovered;

  if (!isClient || checkingEmployee) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cargando Panel...</p>
      </div>
    );
  }

  // Bypass para la pantalla de cliente: Renderizar SOLO los hijos, sin sidebar ni header
  if (pathname?.includes('/pantalla-cliente')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col md:flex-row scanner-transparent-wrapper relative overflow-x-hidden">
       {/* --- SIDEBAR (DESKTOP) AUTO-COLLAPSIBLE ON HOVER --- */}
       <aside 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "hidden md:flex flex-col border-r border-slate-200/80 bg-white sticky top-0 h-screen z-50 transition-all duration-300 ease-in-out group",
            isExpanded ? "w-72 shadow-[15px_0_40px_rgba(0,0,0,0.1)]" : "w-20 shadow-[5px_0_20px_rgba(0,0,0,0.02)]"
          )}
       >
            <div className="p-4 pb-2 flex items-center justify-between border-b border-slate-100 h-20 shrink-0">
                <Link href="/redeconomix/dashboard-negocio" className="flex items-center gap-3 overflow-hidden">
                    <div className="w-11 h-11 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0 group-hover:scale-105 transition-transform">
                        <Store className="h-6 w-6 text-white" />
                    </div>
                    {isExpanded && (
                      <span className="text-lg font-bold tracking-tight uppercase whitespace-nowrap text-slate-900 animate-in fade-in duration-200">
                        Mi <span className="text-red-600">Negocio</span>
                      </span>
                    )}
                </Link>

                {/* Pin / Unpin Button */}
                {isExpanded && (
                  <button 
                    onClick={() => setIsPinned(!isPinned)}
                    title={isPinned ? "Desfijar barra lateral (se ocultará automáticamente)" : "Fijar barra lateral abierta"}
                    className={cn(
                      "p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0",
                      isPinned && "text-red-600 bg-red-50 hover:bg-red-100"
                    )}
                  >
                    <PanelLeft className="h-5 w-5" />
                  </button>
                )}
            </div>

            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto no-scrollbar">
                {isExpanded && (
                  <p className="px-3 text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 animate-in fade-in duration-200">
                    Panel de Control
                  </p>
                )}
                {allowedNavLinks.map(link => {
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href}>
                            <Button 
                              variant="ghost" 
                              title={!isExpanded ? link.label : undefined}
                              className={cn(
                                "w-full h-14 rounded-2xl font-bold uppercase text-xs tracking-widest gap-4 transition-all overflow-hidden relative group shrink-0",
                                isExpanded ? "justify-start px-4" : "justify-center px-0",
                                isActive ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            )}>
                                <link.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-red-600")} />
                                {isExpanded && (
                                  <span className="truncate animate-in fade-in duration-200">{link.label}</span>
                                )}
                                {isActive && isExpanded && (
                                  <ChevronRight className="ml-auto h-4 w-4 text-white animate-in slide-in-from-left-2 shrink-0" />
                                )}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
       </aside>

       {/* --- MAIN AREA --- */}
       <div className="flex-1 flex flex-col min-h-screen bg-slate-50 scanner-transparent-wrapper">
            <div className="md:hidden">
                <RedEconomiXHeader 
                    variant="red" 
                    title="Negocio" 
                    hideBackButton={true}
                    backHref="/redeconomix/dashboard-negocio"
                />
            </div>
            <main className="flex-1 p-3 sm:p-4 md:p-8 lg:p-12 pb-36 md:pb-12 bg-slate-50">
                {children}
            </main>
            <div className="md:hidden">
                <RetailerBottomNav />
            </div>
       </div>
    </div>
  );
}
