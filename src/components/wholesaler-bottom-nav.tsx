'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { 
    Package, DollarSign, Handshake, Truck, Users, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ============================================================
   BOTTOM NAV - REDESIGNED (6 ITEMS)
   ============================================================ */
export function WholesalerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/redeconomix/dashboard-mayorista/pedidos', label: 'Pedidos', icon: Handshake },
    { href: '/redeconomix/dashboard-mayorista/preventa', label: 'Preventa', icon: ShoppingCart },
    { href: '/redeconomix/dashboard-mayorista/stock', label: 'Stock', icon: Package },
    { href: '/redeconomix/dashboard-mayorista/rrhh', label: 'RRHH', icon: Users },
    { href: '/redeconomix/dashboard-mayorista/logistica', label: 'Logística', icon: Truck },
    { href: '/redeconomix/dashboard-mayorista/caja', label: 'Ventas', icon: DollarSign },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 md:hidden pointer-events-none">
        <nav className="w-full h-auto min-h-[4.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 bg-white  border-t border-slate-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 sm:px-4 pointer-events-auto text-slate-900 border">
          {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex flex-col items-center justify-center gap-1 group"
                  >
                      <div className={cn(
                          "p-2 rounded-xl transition-all font-bold",
                          isActive 
                            ? "bg-primary text-white shadow-lg" 
                            : "text-slate-300 hover:text-slate-900"
                      )}>
                          <item.icon className="h-6 w-6" />
                      </div>
                      <span className={cn(
                          "text-[10px] font-bold tracking-tight",
                          isActive ? "text-primary" : "text-slate-300"
                      )}>
                        {item.label}
                      </span>
                  </Link>
              );
          })}
        </nav>
    </div>
  );
}