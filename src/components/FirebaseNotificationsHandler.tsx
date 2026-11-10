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
                        toast({ title: "Notificaciones de Ventas", description: "Notificaciones push activadas para este dispositivo." });
                    } else if (result.message.includes('Permiso denegado')) {
                        console.log("FCM permission denied:", result.message);
                    } else {
                        console.warn("FCM Token Error:", result.message);
                    }
                }).catch(console.error);
                sessionStorage.setItem('fcm_permission_requested', 'true');
            }
        }
    }, [user, toast]);

    return null;
}
