'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Package, BookOpen, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RetailerBottomNav() {
  const pathname = usePathname() || '';

  const tabs = [
    { href: '/redeconomix/dashboard-negocio/resumen', label: 'Resumen', icon: LayoutDashboard },
    { href: '/redeconomix/dashboard-negocio/control-ventas', label: 'Caja', icon: Zap },
    { href: '/redeconomix/dashboard-negocio/stock', label: 'Stock', icon: Package },
    { href: '/redeconomix/dashboard-negocio/fiado', label: 'Cuentas', icon: BookOpen },
    { href: '/redeconomix/dashboard-negocio', label: 'Menú', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                isActive ? "text-[#D60000]" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-[#D60000] rounded-b-full shadow-sm" />
              )}
              <tab.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5]" : "stroke-[1.8]")} />
              <span className={cn("text-[10px] font-bold tracking-tight uppercase", isActive ? "text-[#D60000]" : "text-slate-500")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
