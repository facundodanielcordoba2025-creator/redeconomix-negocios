'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Home,
  ShoppingCart,
  Award,
  Ticket,
  ShieldCheck,
  Banknote,
  HeartHandshake,
  MessageCircle,
  Download,
  LogOut,
  Rocket,
  Recycle,
  Smartphone,
  Dumbbell,
  Waves,
  Blocks,
  Car,
  HardHat,
  Users,
  Store,
  Bike,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "./ui/button";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { mainNavGroups } from "@/lib/data";

export function MainNav() {
  const pathname = usePathname();
  const { canInstall, triggerInstall } = usePwaInstall();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        router.push('/');
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
        <div className="flex h-[72px] items-center border-b px-4 lg:h-[65px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <div className="flex flex-col -space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">RedEconomiX</span>
                    <span className="font-headline text-2xl font-bold text-primary">RedEconomiX</span>
                </div>
            </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
            <Accordion type="multiple" defaultValue={mainNavGroups.map(g => g.title)} className="w-full px-4 py-2">
                {mainNavGroups.map((group) => (
                <AccordionItem value={group.title} key={group.title} className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">{group.title}</AccordionTrigger>
                    <AccordionContent>
                    <div className="flex flex-col gap-1 py-2 pl-4">
                        {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                isActive && "bg-muted text-primary"
                            )}
                            >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            </Link>
                        );
                        })}
                    </div>
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
             {canInstall && (
                <div className="px-4 py-2">
                     <button
                        onClick={triggerInstall}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Download className="h-4 w-4" />
                        Instalar App
                    </button>
                </div>
            )}
        </div>
         <div className="mt-auto border-t p-4">
            {user && !user.isAnonymous ? (
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                            {user.photoURL ? <AvatarImage src={user.photoURL} /> : <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email!.charAt(0).toUpperCase()}</AvatarFallback>}
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{user.displayName || user.email}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Button asChild><Link href="/login">Ingresar</Link></Button>
                    <Button asChild variant="outline"><Link href="/register">Crear Cuenta</Link></Button>
                </div>
            )}
        </div>
    </div>
  );
}
