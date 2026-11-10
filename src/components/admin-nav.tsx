"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Users,
  LineChart,
  Briefcase,
  Package,
  ShieldCheck,
  CreditCard,
  Heart,
  Settings,
  ShoppingBag,
  TrendingUp,
  Building,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "./ui/sheet";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles?: string[];
  alert?: boolean;
}

interface NavGroup {
  title: string;
  icon?: any;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    title: "Gestión Comercial",
    icon: ShoppingBag,
    items: [
      { href: "/admin/redeconomix", icon: ShieldCheck, label: "Resumen & Pedidos", roles: ["Admin", "Gestor de Pedidos"] },
      { href: "/admin/solicitudes", icon: Store, label: "Solicitudes B2B", roles: ["Admin", "Gestor de Pedidos"], alert: true },
      { href: "/admin/vendedores", icon: TrendingUp, label: "Vendedores", roles: ["Admin", "Gestor de Pedidos"] },
      { href: "/admin/mayoristas", icon: Building, label: "Mayoristas", roles: ["Admin", "Gestor de Pedidos"] },
      { href: "/admin/usuarios", icon: Users, label: "Usuarios", roles: ["Admin", "Gestor de Pedidos"] },
    ]
  },
  {
    title: "Catálogo & Servicios",
    icon: Package,
    items: [
      { href: "/admin/products", icon: Package, label: "Catálogo de Productos", roles: ["Admin", "Editor de Productos"] },
      { href: "/admin/providers", icon: Briefcase, label: "Red de Prestadores", roles: ["Admin", "Soporte"] },
    ]
  },
  {
    title: "Planes & Bienestar",
    icon: Heart,
    items: [
      { href: "/admin/subscriptions", icon: CreditCard, label: "Membresías & Solicitudes", roles: ["Admin", "Soporte"], alert: true },
      { href: "/admin/auditoria-reintegros", icon: Heart, label: "Auditoría Médica", roles: ["Admin", "Auditor Médico"], alert: true },
    ]
  },
  {
    title: "Administración",
    icon: Settings,
    items: [
      { href: "/admin/expenses", icon: LineChart, label: "Finanzas & Gastos", roles: ["Admin", "Gestor de Finanzas"] },
      { href: "/admin/team", icon: Users, label: "Equipo Directivo", roles: ["Admin"] },
    ]
  }
];

export function AdminNav({ inSheet = false }: { inSheet?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const fullPath = tabParam ? `${pathname}?tab=${tabParam}` : pathname;

  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);
  const userRole = (userData?.accountType as string) || "standard";

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b border-slate-100 px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin/redeconomix" className="flex items-center gap-2 font-semibold font-headline">
          <div className="flex flex-col -space-y-1 whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">ADMIN</span>
            <span className={cn("font-headline text-lg font-black tracking-tight text-slate-900", !inSheet && "transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100")}>
              REDECONOMIX
            </span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-2">
          {adminNavGroups.map((group) => {
            const filteredItems = group.items.filter(item => {
              if (!item.roles) return true;
              return item.roles.includes(userRole);
            });
            
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.title} className="py-2.5">
                <h3 className="mb-2 px-3 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  {group.icon && <group.icon className="h-3.5 w-3.5 text-slate-400" />}
                  <span className={cn("whitespace-nowrap", !inSheet && "transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100")}>
                    {group.title}
                  </span>
                </h3>
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href;

                  const link = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        isActive 
                          ? "bg-red-50 text-[#FF0000] font-black" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#FF0000]" : "text-slate-500")} />
                      <span className={cn("whitespace-nowrap truncate", !inSheet && "md:opacity-0 md:group-hover:opacity-100")}>
                        {item.label}
                      </span>
                      {item.alert && (
                        <span className={cn(
                          "ml-auto h-2 w-2 rounded-full bg-[#FF0000]", 
                          !inSheet && "transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100"
                        )} />
                      )}
                    </Link>
                  );

                  if (inSheet) {
                    return <SheetClose asChild key={item.href}>{link}</SheetClose>;
                  }
                  
                  return <div key={item.href}>{link}</div>;
                })}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
