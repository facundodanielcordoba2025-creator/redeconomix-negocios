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
        if (!user) return;
        const isNative = Capacitor.isNativePlatform();
        const hasNotification = typeof window !== 'undefined' && 'Notification' in window;

        if (isNative || hasNotification) {
            const perm = hasNotification ? Notification.permission : 'granted';
            const alreadyPrompted = sessionStorage.getItem(`fcm_prompted_${user.uid}`);

            // Si ya está otorgado el permiso, refrescar y registrar token en Firestore sin bloquearse
            // Si está pendiente, pedir permiso al usuario
            if (perm === 'granted' || !alreadyPrompted) {
                sessionStorage.setItem(`fcm_prompted_${user.uid}`, 'true');
                requestAndSaveToken(user.uid).then(result => {
                    if (result.success) {
                        console.log("[FCM] Dispositivo registrado con éxito para notificaciones.");
                    } else if (result.message.includes('Permiso denegado')) {
                        console.log("[FCM] Permiso denegado por el usuario.");
                    } else {
                        console.warn("[FCM] Estado registro:", result.message);
                    }
                }).catch(err => console.error("[FCM] Error registrando push:", err));
            }
        }
    }, [user]);

    return null;
}
