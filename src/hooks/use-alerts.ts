'use client';

import { useCallback } from 'react';
import { Haptics } from '@capacitor/haptics';

export function useAlerts() {
  /**
   * Dispara una alerta sonora y vibración
   * @param type 'siren' para pedidos nuevos, 'ping' para actualizaciones
   */
  const playAlert = useCallback((type: 'siren' | 'ping' = 'ping') => {
    // 1. Sonido
    const sirenUrl = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';
    const pingUrl = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
    
    let audio: HTMLAudioElement | null = null;
    try {
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        audio = new Audio(type === 'siren' ? sirenUrl : pingUrl);
        audio.play().catch(e => console.log("Audio play blocked by browser policy.", e));
      }
    } catch (err) {
      console.warn("Audio constructor failed:", err);
    }

    // 2. Vibración Nativa Capacitor (con fallback al navegador web)
    try {
      if (type === 'siren') {
        Haptics.vibrate({ duration: 1500 }).catch(() => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([500, 200, 500, 200, 500]);
          }
        });
      } else {
        Haptics.vibrate({ duration: 200 }).catch(() => {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(200);
          }
        });
      }
    } catch (err) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'siren') {
          navigator.vibrate([500, 200, 500, 200, 500]);
        } else {
          navigator.vibrate(200);
        }
      }
    }
  }, []);

  return { playAlert };
}
