'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function SellerGPSTracker() {
  const { user } = useUser();
  const firestore = useFirestore();
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.uid || !firestore) return;

    let isMounted = true;

    const trackLocation = async () => {
      // Limitar a máximo 1 sincronización cada 5 minutos mientras usa la app
      const now = Date.now();
      if (now - lastSyncRef.current < 5 * 60 * 1000) return;

      try {
        let lat: number | null = null;
        let lng: number | null = null;
        let accuracy: number | null = null;

        // 1. Probar con Capacitor Geolocation (App nativa Android en Play Store)
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          const perm = await Geolocation.checkPermissions();
          if (perm.location === 'granted') {
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            accuracy = pos.coords.accuracy ?? null;
          } else if (perm.location === 'prompt' || perm.location === 'prompt-with-rationale') {
            const req = await Geolocation.requestPermissions();
            if (req.location === 'granted') {
              const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              accuracy = pos.coords.accuracy ?? null;
            }
          }
        } catch (_) {
          // Si Capacitor no está disponible o falla, pasamos al navegador
        }

        // 2. Fallback con API Geolocation estándar del navegador/PWA
        if (lat === null && typeof window !== 'undefined' && 'geolocation' in navigator) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                accuracy = pos.coords.accuracy ?? null;
                resolve();
              },
              () => resolve(),
              { enableHighAccuracy: true, timeout: 8000 }
            );
          });
        }

        if (lat !== null && lng !== null && isMounted) {
          lastSyncRef.current = now;
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            lastLocation: {
              latitude: lat,
              longitude: lng,
              accuracy: accuracy ? Math.round(accuracy) : null,
              updatedAt: serverTimestamp(),
            },
            lastActiveAt: serverTimestamp(),
          });
        }
      } catch (err) {
        // Silencioso para no interrumpir al usuario
      }
    };

    // Al abrir la app
    trackLocation();

    // Cuando vuelve a poner la app en primer plano
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        trackLocation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.uid, firestore]);

  return null;
}
