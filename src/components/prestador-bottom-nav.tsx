'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Wallet, User, LayoutDashboard, History, MessageSquare, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PrestadorBottomNav() {
    const pathname = usePathname();

    const navItems = [
        {
            label: 'Pedidos',
            href: '/redeconomix/prestadores/panel',
            icon: Package,
        },
        {
            label: 'Extras',
            href: '/redeconomix/prestadores/extras',
            icon: CircleDollarSign,
        },
        {
            label: 'Billetera',
            href: '/redeconomix/prestadores/billetera',
            icon: Wallet,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-40 md:hidden pointer-events-none">
            <nav className="w-full h-auto min-h-[4.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 bg-white  border-t border-slate-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-around px-2 sm:px-4 pointer-events-auto text-slate-900 pb-safe">
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
                                    ? "bg-primary text-white shadow-lg scale-[1.02]" 
                                    : "text-slate-300 hover:text-slate-900 active:scale-95"
                            )}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-tight uppercase",
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
