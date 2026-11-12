'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Package, BookOpen, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';

export function RetailerBottomNav() {
  const pathname = usePathname() || '';
  const { role } = useRole();

  const allTabs = [
    { 
      href: '/redeconomix/dashboard-negocio/resumen', 
      label: 'Resumen', 
      icon: LayoutDashboard,
      isActive: pathname === '/redeconomix/dashboard-negocio/resumen',
      roles: ['admin']
    },
    { 
      href: '/redeconomix/dashboard-negocio/control-ventas', 
      label: 'Caja', 
      icon: Zap,
      isActive: pathname.includes('/control-ventas') || pathname.includes('/arqueo-caja'),
      roles: ['admin', 'cashier', 'cashier_warehouse', 'accountant']
    },
    { 
      href: '/redeconomix/dashboard-negocio/stock', 
      label: 'Stock', 
      icon: Package,
      isActive: pathname.includes('/stock'),
      roles: ['admin', 'cashier', 'warehouse', 'cashier_warehouse', 'accountant']
    },
    { 
      href: '/redeconomix/dashboard-negocio/fiado', 
      label: 'Cuentas', 
      icon: BookOpen,
      isActive: pathname.includes('/fiado'),
      roles: ['admin', 'accountant']
    },
    { 
      href: '/redeconomix/dashboard-negocio', 
      label: 'Menú', 
      icon: Menu,
      isActive: pathname === '/redeconomix/dashboard-negocio',
      roles: ['admin', 'cashier', 'warehouse', 'cashier_warehouse', 'accountant']
    },
  ];

  const currentRole = role || 'admin';
  const tabs = allTabs.filter(t => t.roles.includes(currentRole));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-xs md:hidden pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1.5">
      <div 
        className="h-14 max-w-md mx-auto items-center px-1 grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const active = tab.isActive;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors select-none",
                active 
                  ? "text-red-600" 
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active ? "text-red-600 stroke-[2.4]" : "text-slate-400 stroke-[1.8]")} />
              <span className={cn(
                "text-[9px] uppercase tracking-wider transition-colors",
                active ? "font-black text-red-600" : "font-bold text-slate-400"
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
