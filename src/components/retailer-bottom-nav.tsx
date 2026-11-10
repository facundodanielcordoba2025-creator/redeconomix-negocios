'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Package, BookOpen, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RetailerBottomNav() {
  const pathname = usePathname() || '';

  const tabs = [
    { 
      href: '/redeconomix/dashboard-negocio/resumen', 
      label: 'Resumen', 
      icon: LayoutDashboard,
      isActive: pathname === '/redeconomix/dashboard-negocio/resumen'
    },
    { 
      href: '/redeconomix/dashboard-negocio/control-ventas', 
      label: 'Caja', 
      icon: Zap,
      isActive: pathname.includes('/control-ventas') || pathname.includes('/arqueo-caja')
    },
    { 
      href: '/redeconomix/dashboard-negocio/stock', 
      label: 'Stock', 
      icon: Package,
      isActive: pathname.includes('/stock')
    },
    { 
      href: '/redeconomix/dashboard-negocio/fiado', 
      label: 'Cuentas', 
      icon: BookOpen,
      isActive: pathname.includes('/fiado')
    },
    { 
      href: '/redeconomix/dashboard-negocio', 
      label: 'Menú', 
      icon: Menu,
      isActive: pathname === '/redeconomix/dashboard-negocio'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] md:hidden pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1.5">
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-1">
        {tabs.map((tab) => {
          const active = tab.isActive;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-2xl transition-all select-none",
                active 
                  ? "text-red-600" 
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-7 rounded-xl transition-all",
                active ? "bg-red-50 text-red-600 shadow-2xs" : "text-slate-400"
              )}>
                <tab.icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />
              </div>
              <span className={cn(
                "text-[9px] uppercase tracking-wider transition-all",
                active ? "font-black text-red-600 scale-105" : "font-bold text-slate-400"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
