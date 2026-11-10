'use client';

// Componente de Navegación Principal - RedEconomiX

import React, { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Store, ShoppingCart, User, Rocket, ShieldCheck, ShieldAlert, Building, Smartphone, Zap, Star, Ticket, Gift, Wallet, Banknote, Bike, LayoutDashboard, X, Users, QrCode, MapPin, DollarSign, Trophy, History, Package, HardHat, Facebook, BarChart3, Handshake, Car, Truck, Sparkles, Wrench, Home, GraduationCap, Newspaper, Crown, Repeat, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';


export const RedEconomiXBottomNav = memo(() => {
  const pathname = usePathname() || '';
  const { user } = useUser();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isLinkedEmployee, setIsLinkedEmployee] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const employeeDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'employees', user.uid);
  }, [firestore, user]);

  const { data: userDocData, isLoading: isUserLoading } = useDoc(userDocRef);
  const { data: employeeDocData, isLoading: isEmployeeLoading } = useDoc(employeeDocRef);

  const userData = userDocData || (employeeDocData ? { ...employeeDocData, accountType: employeeDocData.accountType || 'preventista' } : null);
  const isLoading = isUserLoading && isEmployeeLoading;

  useEffect(() => {
    async function checkEmployee() {
      if (!firestore || !user) {
        setIsLinkedEmployee(false);
        return;
      }
      try {
        let isEmp = false;
        if (user.email) {
          const q = query(
            collection(firestore, 'retailer_employees'),
            where('email', '==', user.email.toLowerCase().trim()),
            where('status', '==', 'active')
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            isEmp = true;
          }
        }

        if (!isEmp && userData?.dni) {
          const qDni = query(
            collection(firestore, 'retailer_employees'),
            where('dni', '==', String(userData.dni).trim()),
            where('status', '==', 'active')
          );
          const snapDni = await getDocs(qDni);
          if (!snapDni.empty) {
            isEmp = true;
          }
        }

        setIsLinkedEmployee(isEmp);
      } catch (e) {
        console.error("Error comprobando empleado:", e);
      }
    }
    checkEmployee();
  }, [firestore, user, userData?.dni]);
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
    isLinkedEmployee ||
    user?.uid?.startsWith('HvnrCjJj'); // BYPASS MAESTRO PARA FACUNDO
  const isWholesaler = userData?.accountType?.toLowerCase() === 'wholesaler' || userData?.accountType?.toLowerCase() === 'mayorista';
  const isProvider = userData?.accountType === 'provider' || userData?.accountType === 'prestador';

  useEffect(() => {
    if (isLauncherOpen) {
      document.body.classList.add('launcher-open');
    } else {
      document.body.classList.remove('launcher-open');
    }
    return () => document.body.classList.remove('launcher-open');
  }, [isLauncherOpen]);

  useEffect(() => { setIsClient(true); }, []);

  const isVendedor = pathname.startsWith('/redeconomix/empleados');

  if (!isClient || isLoading) return null; // Evitar el flickeo de perfil


  if (isVendedor) {
    // ... (rest of preventista logic remains same)
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
        <nav className="w-full h-auto min-h-[4.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 bg-white/95 backdrop-blur-md border-t border-slate-200/80 rounded-t-3xl shadow-none flex items-center justify-around px-2 sm:px-4 pointer-events-auto">
          <Link href="/redeconomix/empleados" className="flex flex-col items-center justify-center gap-1 group">
            <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix/empleados' ? "text-red-600" : "text-slate-300 hover:text-slate-900")}><Zap className="h-6 w-6" /></div>
            <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix/empleados' ? "text-red-600 font-black" : "text-slate-300")}>Panel</span>
          </Link>
          <Link href="/redeconomix/empleados/wallet" className="flex flex-col items-center justify-center gap-1 group">
            <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix/empleados/wallet' ? "text-red-600" : "text-slate-300 hover:text-slate-900")}><Wallet className="h-6 w-6" /></div>
            <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix/empleados/wallet' ? "text-red-600 font-black" : "text-slate-300")}>Billetera</span>
          </Link>
          <div className="relative -mt-12 flex justify-center">
             <Link href="/redeconomix/empleados">
                <div className="relative h-20 w-20 rounded-[2rem] flex items-center justify-center border-4 border-white rotate-45 bg-primary shadow-[0_8px_40px_rgba(255,0,0,0.3)]"><QrCode className="h-10 w-10 text-white -rotate-45" /></div>
             </Link>
          </div>
          <Link href="/redeconomix/empleados/negocios" className="flex flex-col items-center justify-center gap-1 group">
             <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix/empleados/negocios' ? "bg-primary text-white shadow-lg" : "text-slate-300 hover:text-slate-900")}><Users className="h-6 w-6" /></div>
            <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix/empleados/negocios' ? "text-primary" : "text-slate-300")}>Mi Cartera</span>
          </Link>
          <Link href="/redeconomix/empleados/perfil" className="flex flex-col items-center justify-center gap-1 group">
             <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix/empleados/perfil' ? "bg-primary text-white shadow-lg" : "text-slate-300 hover:text-slate-900")}><User className="h-6 w-6" /></div>
            <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix/empleados/perfil' ? "text-primary" : "text-slate-300")}>Perfil</span>
          </Link>
        </nav>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none">
        <nav className="w-full h-auto min-h-[4.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 bg-white/95 backdrop-blur-md border-t border-slate-200/80 rounded-t-3xl shadow-none flex items-center justify-around px-2 sm:px-4 pointer-events-auto">
          {!isWholesaler && (
            <Link href="/redeconomix" className="flex flex-col items-center justify-center gap-1 group">
              <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix' ? "text-red-600" : "text-slate-400 hover:text-slate-900")}>
                <Store className="h-6 w-6" />
              </div>
              <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix' ? "text-red-600 font-black" : "text-slate-400")}>Marketplace</span>
            </Link>
          )}
          {/* LÓGICA DE NEGOCIO / MAYORISTA / ELECTRÓNICA */}
          {user && userData ? (
            <>
              {isWholesaler ? (
                // SI ES MAYORISTA, SOLO VE OPCIONES DE GESTIÓN
                <>
                  <Link href="/redeconomix/dashboard-mayorista/pedidos" className="flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.includes('/pedidos') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                      <Handshake className="h-6 w-6" />
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight", pathname.includes('/pedidos') ? "text-red-600 font-black" : "text-slate-400")}>Pedidos</span>
                  </Link>
                  <Link href="/redeconomix/dashboard-mayorista/stock" className="flex flex-col items-center justify-center gap-1 group">
                    <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.includes('/stock') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                      <Package className="h-6 w-6" />
                    </div>
                    <span className={cn("text-[10px] font-bold tracking-tight", pathname.includes('/stock') ? "text-red-600 font-black" : "text-slate-400")}>Stock</span>
                  </Link>
                </>
              ) : isBusiness ? (
                <Link href="/redeconomix/dashboard-negocio" className="flex flex-col items-center justify-center gap-1 group">
                  <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.startsWith('/redeconomix/dashboard-negocio') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                    <Building className="h-6 w-6" />
                  </div>
                  <span className={cn("text-[10px] font-bold tracking-tight", pathname.startsWith('/redeconomix/dashboard-negocio') ? "text-red-600 font-black" : "text-slate-400")}>Mi Negocio</span>
                </Link>
              ) : isProvider ? (
                <Link href="/redeconomix/prestadores/panel" className="flex flex-col items-center justify-center gap-1 group">
                  <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.startsWith('/redeconomix/prestadores/panel') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                    <Handshake className="h-6 w-6" />
                  </div>
                  <span className={cn("text-[10px] font-bold tracking-tight", pathname.startsWith('/redeconomix/prestadores/panel') ? "text-red-600 font-black" : "text-slate-400")}>Prestador</span>
                </Link>
              ) : (
                <Link href="/redeconomix/billetera" className="flex flex-col items-center justify-center gap-1 group">
                  <div className={cn("p-2 rounded-xl transition-all font-bold", pathname === '/redeconomix/billetera' ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <span className={cn("text-[10px] font-bold tracking-tight", pathname === '/redeconomix/billetera' ? "text-red-600 font-black" : "text-slate-400")}>Ganar Más</span>
                </Link>
              )}
            </>
          ) : (
             <div className="flex flex-col items-center justify-center gap-1 opacity-20">
                <div className="p-2 rounded-xl bg-slate-100"><Zap className="h-6 w-6 text-slate-400" /></div>
                <span className="text-[10px] font-black uppercase text-slate-400 animate-pulse tracking-widest">Cargando</span>
             </div>
          )}

          <div className="relative -mt-12 flex justify-center">
              <Dialog open={isLauncherOpen} onOpenChange={setIsLauncherOpen}>
                <DialogTrigger asChild>
                  <button className="cursor-pointer group outline-none">
                        <div className={cn(
                          "relative h-16 w-16 rounded-[1.5rem] flex items-center justify-center border-4 border-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 font-bold shadow-none", 
                          pathname === '/redeconomix/liquidacion-flash' ? 'bg-[#FF6B35]' : 
                          pathname === '/redcashback' ? 'bg-[#6B38FB]' :
                          pathname === '/pasanaku' ? 'bg-indigo-600' : 'bg-[#FF0000]'
                        )}>
                          <Rocket className="h-9 w-9 -rotate-[15deg] transition-transform group-hover:scale-110 text-white fill-white" />
                        </div>

                   </button>
                </DialogTrigger>
                <DialogContent hideCloseButton={true} className="max-w-[95%] h-auto max-h-[85vh] w-[95%] rounded-[3.5rem] bg-white p-0 border-none shadow-2xl overflow-hidden flex flex-col focus:outline-none">
                  <div className="h-40 bg-primary text-center text-white relative shrink-0 flex items-center justify-center transition-colors">
                    <div className="absolute top-0 left-0 w-full h-full bg-black/5 pointer-events-none" />
                    <div className="absolute top-6 right-6 z-50">
                        <DialogClose asChild>
                            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 shadow-lg border border-white/20">
                                <X className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </button>
                        </DialogClose>
                    </div>

                     <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/20 bg-white/10 shadow-lg pointer-events-none">
                            <Sparkles className="h-8 w-8 text-white fill-white/10 animate-pulse" />
                        </div>
                        <DialogTitle className="text-sm font-black tracking-widest text-white uppercase mt-1">Ecosistema RedEconomiX</DialogTitle>
                        <DialogDescription className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Descubrí todos nuestros servicios</DialogDescription>
                     </div>
                  </div>

                  <div className="flex-1 p-5 grid grid-cols-3 gap-3 bg-white pb-8">
                     {(isBusiness ? [
                        // General Benefits
                        { href: '/programa-esencial', label: 'Bienestar', icon: ShieldCheck },
                        
                        // Ecosystem Tools
                        { href: '/redeconomix/billetera', label: 'Ganar Más', icon: TrendingUp },

                        // { href: '/gerald', label: 'GeralD', icon: Crown },
                        { href: '/redeconomix/servicios', label: 'Servicios', icon: Wrench },
                     ] : [
                        { href: '/programa-esencial', label: 'Bienestar', icon: ShieldCheck },

                        { href: '/redeconomix/billetera', label: 'Ganar Más', icon: TrendingUp },
                        // { href: '/gerald', label: 'GeralD', icon: Crown },
                        { href: '/redeconomix/servicios', label: 'Servicios', icon: Wrench },
                     ]).map((item) => (
                         <DialogClose key={item.label} asChild>
                            <Link href={item.href} onClick={() => setIsLauncherOpen(false)}>
                                <div className="bg-primary rounded-2xl flex flex-col h-24 shadow-sm border-2 border-white overflow-hidden transition-all group cursor-pointer hover:-translate-y-1 active:scale-95">
                                    <div className="flex-1 flex items-center justify-center p-2">
                                        <item.icon className="h-7 w-7 text-white drop-shadow-sm transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="bg-white h-8 flex items-center justify-center p-1"><span className="text-[9px] leading-tight font-bold text-slate-800 text-center uppercase tracking-tight">{item.label}</span></div>
                                </div>
                            </Link>
                         </DialogClose>
                     ))}
                  </div>
                </DialogContent>
              </Dialog>
          </div>

          {!isWholesaler && (
            <>
              <Link href="/programa-esencial" className="flex flex-col items-center justify-center gap-1 group">
                <div className={cn("p-2 rounded-xl transition-all font-bold", pathname?.startsWith('/programa-esencial') ? "text-red-600" : "text-slate-500 hover:text-primary")}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <span className={cn("text-[10px] font-bold tracking-tight", pathname?.startsWith('/programa-esencial') ? "text-red-600 font-black" : "text-slate-400")}>Bienestar</span>
              </Link>
              <Link href="/redeconomix/mis-compras" className="flex flex-col items-center justify-center gap-1 group">
                <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.startsWith('/redeconomix/mis-compras') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <span className={cn("text-[10px] font-bold tracking-tight", pathname.startsWith('/redeconomix/mis-compras') ? "text-red-600 font-black" : "text-slate-400")}>Mis Compras</span>
              </Link>
            </>
          )}

          {isWholesaler && (
            <>
              <Link href="/redeconomix/dashboard-mayorista/logistica" className="flex flex-col items-center justify-center gap-1 group">
                <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.includes('/logistica') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                  <Truck className="h-6 w-6" />
                </div>
                <span className={cn("text-[10px] font-bold tracking-tight", pathname.includes('/logistica') ? "text-red-600 font-black" : "text-slate-400")}>Rutas</span>
              </Link>
              <Link href="/redeconomix/dashboard-mayorista/caja" className="flex flex-col items-center justify-center gap-1 group">
                <div className={cn("p-2 rounded-xl transition-all font-bold", pathname.includes('/caja') ? "text-red-600" : "text-slate-500 hover:text-slate-900")}>
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className={cn("text-[10px] font-bold tracking-tight", pathname.includes('/caja') ? "text-red-600 font-black" : "text-slate-400")}>Ventas</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
});

RedEconomiXBottomNav.displayName = 'RedEconomiXBottomNav';
