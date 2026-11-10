'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MainNav } from './main-nav';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'sorteos', name: 'Sorteos' },
  { id: 'vehiculos', name: 'Vehículos' },
  { id: 'viviendas', name: 'Viviendas' },
  { id: 'fitness', name: 'Fitness' },
  { id: 'celulares', name: 'Celulares' },
  { id: 'creditos', name: 'Créditos' },
  { id: 'microasistencia', name: 'Microasistencia' },
  { id: 'beneficios', name: 'Beneficios' },
  { id: 'referencias', name: 'Referencias' },
  { id: 'proyectos', name: 'Proyectos' },
];

export function Header() {
  const auth = useAuth();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };

  const isMarketplace = pathname.startsWith('/marketplace');

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/marketplace?q=${categoryId}`);
  };


  return (
    <header className={cn(
        "sticky top-0 z-40 w-full border-b",
        isMarketplace ? "bg-accent border-accent-foreground/20" : "bg-background"
    )}>
      <div className="flex h-20 max-sm:h-14 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(isMarketplace && "text-accent-foreground hover:bg-black/10")}>
                    <Menu className="h-6 w-6" />
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                <MainNav />
                </SheetContent>
            </Sheet>
          </div>
          <Link href="/" className="hidden md:flex items-center gap-2">
             <div className="flex flex-col -space-y-1">
                <span className={cn("text-xs font-medium", isMarketplace ? "text-accent-foreground/80" : "text-muted-foreground")}>GRUPO</span>
                <span className={cn("font-headline text-2xl font-bold", isMarketplace ? "text-accent-foreground" : "text-primary")}>FRAMAB</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <Link href="/" className={cn("font-medium", isMarketplace ? "text-accent-foreground/80 hover:text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>Portal</Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("font-medium", isMarketplace ? "text-accent-foreground/80 hover:text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
                  Categorías
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} onSelect={() => handleCategoryClick(category.id)}>
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/marketplace?q=ofertas" className={cn("font-medium", isMarketplace ? "text-accent-foreground/80 hover:text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>Ofertas</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-2">
              {isUserLoading ? (
                 <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              ): user && !user.isAnonymous ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn("relative h-10 w-10 rounded-full", isMarketplace && "hover:bg-black/10")}>
                            <Avatar className="h-9 w-9">
                                {user.photoURL ? <AvatarImage src={user.photoURL} /> : <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>}
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => router.push('/chatbot')}>Pedir un favor</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/wallet')}>Mis compras</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout}>Salir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="ghost" className={cn(isMarketplace && "text-accent-foreground hover:bg-accent-foreground/80")}>
                    <Link href="/login">Ingresar</Link>
                </Button>
              )}
            </nav>
             <Button variant="ghost" size="icon" asChild className={cn(isMarketplace && "text-accent-foreground hover:bg-black/10")}>
                <Link href="/marketplace/carrito">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Carrito</span>
                </Link>
              </Button>
        </div>
      </div>
    </header>
  );
}
