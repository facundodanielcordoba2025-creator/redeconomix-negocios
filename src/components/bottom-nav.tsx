'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Award, Rocket, Wallet, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNavGroups } from '@/lib/data';
import { Button } from './ui/button';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/creditos', label: 'Créditos', icon: Banknote },
  { href: '/benefits', label: 'Promos', icon: Award },
  { href: '/wallet', label: 'Billetera', icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex flex-col items-center justify-center gap-1 p-2 text-xs text-muted-foreground transition-colors hover:text-primary h-full',
          isActive && 'text-primary font-semibold'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="grid h-16 max-sm:h-12 grid-cols-5 items-center justify-items-stretch">
        {renderNavItem(navItems[0])}
        {renderNavItem(navItems[1])}

        <div className="flex items-center justify-center">
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex flex-col items-center justify-center -mt-6 cursor-pointer group">
                    <div className={cn(
                      "flex h-16 max-sm:h-12 w-16 items-center justify-center rounded-full text-white shadow-lg border-4 border-background transition-transform group-hover:scale-105 bg-red-600 shadow-red-600/30"
                    )}>
                        <Rocket className="h-8 w-8" />
                    </div>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-lg h-[85vh]">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-center font-headline text-2xl">Accesos Directos</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-4 p-4 text-center">
                  {mainNavGroups.flatMap(group => group.items).map((item) => (
                    <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-primary">
                              <item.icon className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-medium text-foreground">{item.label}</span>
                        </Link>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
        </div>

        {renderNavItem(navItems[2])}
        {renderNavItem(navItems[3])}
      </nav>
    </div>
  );
}
