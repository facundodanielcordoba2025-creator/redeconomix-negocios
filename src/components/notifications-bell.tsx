'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Bell, ShoppingCart, Info, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAlerts } from '@/hooks/use-alerts';

export function NotificationsBell({ variant = 'dark' }: { variant?: 'dark' | 'white' }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const [lastCount, setLastCount] = useState(0);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc(userDocRef);

  const isProfileIncomplete = userData && (!userData.phone || !userData.address || !userData.dni || !userData.province);

  const sortedNotifications = useMemo(() => {
    if (!notifications) return [];
    return [...notifications].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
      const fbNotifs = (sortedNotifications || []).filter(n => !n.read);
      if (isProfileIncomplete) {
          return [{
              id: 'profile_incomplete_alert',
              type: 'system_alert',
              title: '¡Tu perfil está incompleto!',
              message: 'Por favor, toca aquí para ir a "Mi Perfil" y completar tus datos faltantes (teléfono, dirección, DNI) para aprovechar la app al máximo.',
              createdAt: { toDate: () => new Date() },
              href: '/redeconomix/perfil',
              read: false
          }, ...fbNotifs];
      }
      return fbNotifs;
  }, [sortedNotifications, isProfileIncomplete]);
  
  const unreadCount = unreadNotifications.length;

  const { playAlert } = useAlerts();

  // --- EFECTO DE SONIDO & VIBRACIÓN GLOBAL ---
  useEffect(() => {
    if (unreadCount > lastCount && lastCount !== 0) {
        // Buscamos la última notificación para decidir el tono
        const latest = unreadNotifications[0];
        const title = latest?.title?.toLowerCase() || '';
        const isUrgent = title.includes('pedido') || 
                        title.includes('orden') ||
                        latest?.type === 'new_order';

        if (isUrgent) {
            playAlert('siren');
        } else {
            playAlert('ping');
        }

        toast({
            title: isUrgent ? "🚨 ¡URGENTE!" : "🔔 NOTIFICACIÓN",
            description: latest?.title || "Tienes novedades en RedEconomiX",
            variant: isUrgent ? "destructive" : "default",
        });
    }
    setLastCount(unreadCount);
  }, [unreadCount, lastCount, toast, playAlert]); // Quitamos unreadNotifications de aquí

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore || notificationId === 'profile_incomplete_alert') return;
    const notifRef = doc(firestore, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  };

  const handleNotificationClick = (notification: any) => {
    let targetHref = notification.href;
    
    // FORZAR REDIRECCIÓN AL PANEL DE MAYORISTA PARA PEDIDOS
    if (notification.orderId || notification.type === 'order_update' || notification.type === 'new_order') {
      targetHref = `/redeconomix/dashboard-mayorista/pedidos?openOrder=${notification.orderId || ''}`;
    }

    if (targetHref) {
        // Asegurarnos de que no redirija al panel de negocio si es un mayorista
        if (targetHref.includes('/dashboard-negocio')) {
            targetHref = targetHref.replace('/dashboard-negocio', '/dashboard-mayorista');
        }
        
        router.push(targetHref);
        if (!notification.read) {
            handleMarkAsRead(notification.id).catch(err => console.error("Failed to mark as read on navigate", err));
        }
    } else {
        setSelectedNotification(notification);
    }
  };

  const handleConfirmRead = async () => {
    if (!selectedNotification || isUpdating || !firestore) return;
    setIsUpdating(true);
    try {
        await handleMarkAsRead(selectedNotification.id);
        window.location.reload();
    } catch (error) {
        setIsUpdating(false);
    }
  };

  const getIconForType = (type: string) => {
      switch (type) {
          case 'order_update': return <ShoppingCart className="h-4 w-4 text-primary" />;
          case 'promotion': return <Info className="h-4 w-4 text-primary" />;
          case 'system_alert': return <Bell className="h-4 w-4 text-[#FF0000]" />;
          default: return <Bell className="h-4 w-4 text-primary" />;
      }
  }

  // Si está cargando o no hay usuario, mostramos un placeholder para no romper el layout
  if (isUserLoading || !user) {
    return <div className="h-10 w-10 flex items-center justify-center text-slate-300"><Bell className="h-5 w-5 animate-pulse" /></div>
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(
          "relative h-9 w-9 rounded-full transition-all group",
          variant === 'white' ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        )}>
          <Bell className={cn("h-5 w-5 transition-transform group-hover:scale-110", unreadCount > 0 && variant !== 'white' ? "fill-primary text-primary" : "")} />
          {unreadCount > 0 && (
            <span className={cn(
                "absolute -top-1 -right-1 h-4 w-4 bg-[#FF0000] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm",
                variant === 'white' ? "border border-white/20" : ""
            )}>
                {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-[2rem] p-4 bg-white shadow-2xl border-slate-100">
        <DropdownMenuLabel className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-80 overflow-y-auto">
            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!isLoading && unreadNotifications?.length === 0 && (
                 <div className="py-12 text-center">
                     <Bell className="h-8 w-8 text-slate-100 mx-auto mb-2" />
                     <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sin alertas nuevas</p>
                 </div>
            )}
            {unreadNotifications?.map(notification => (
                <DropdownMenuItem key={notification.id} onSelect={() => handleNotificationClick(notification)} className="rounded-2xl p-4 mb-1 hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/5 rounded-xl">{getIconForType(notification.type)}</div>
                        <div className="flex-1 space-y-1">
                            <p className="font-bold text-xs text-slate-900 uppercase tracking-tight leading-none">{notification.title}</p>
                            <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed">{notification.message}</p>
                            <p className="text-[8px] font-black text-primary uppercase tracking-tighter">
                                {notification.createdAt?.toDate?.() ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es }) : ''}
                            </p>
                        </div>
                    </div>
                </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

    <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="rounded-[3rem] p-8">
            <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-primary/5 rounded-2xl">
                        {selectedNotification && getIconForType(selectedNotification.type)}
                    </div>
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">{selectedNotification?.title}</DialogTitle>
                </div>
            </DialogHeader>
            <DialogDescription className="text-sm font-medium text-slate-600 leading-relaxed">
                {selectedNotification?.message}
            </DialogDescription>
            <DialogFooter className="mt-8">
                <Button onClick={handleConfirmRead} disabled={isUpdating} className="w-full h-12 rounded-2xl bg-primary hover:bg-red-600 text-white font-bold uppercase tracking-tight">
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entendido, marcar como leída"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
