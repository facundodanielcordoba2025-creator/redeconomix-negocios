'use client';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { requestAndSaveToken } from '@/lib/firebase-notifications';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

export function FirebaseNotificationsHandler() {
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        if (user && (isNative || (typeof window !== 'undefined' && 'Notification' in window))) {
            const requested = sessionStorage.getItem('fcm_permission_requested');
            if (!requested) {
                requestAndSaveToken(user.uid).then(result => {
                    if (result.success) {
                        toast({ title: "Notificaciones Activadas", description: result.message });
                    } else if (result.message.includes('Permiso denegado')) {
                        toast({ title: "Permiso de Notificaciones", description: result.message, duration: 10000 });
                    } else {
                        console.warn("FCM Token Error:", result.message);
                    }
                });
                sessionStorage.setItem('fcm_permission_requested', 'true');
            }
        }
    }, [user, toast]);

    return null; // Este componente no renderiza nada
}
