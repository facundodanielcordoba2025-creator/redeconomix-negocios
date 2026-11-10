'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

/**
 * 🛡️ MOBILE SAFEGUARD v1.0
 * Polyfills y blindaje para evitar cierres en TWA/WebViews Legacy
 */
export function MobileSafeguard() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Hide Splash Screen promptly once React has hydrated
    if (Capacitor.isNativePlatform()) {
      // Breve margen de 350ms para asegurar renderizado fluido del DOM inicial sin parpadeos
      setTimeout(() => {
        SplashScreen.hide().catch(err => console.log('SplashScreen hide error', err));
      }, 350);
      
      // Native Android Back Button Handler
      App.addListener('backButton', ({ canGoBack }) => {
        // 0. Verificar si el scanner de código de barras está activo
        const isScannerActive = document.body.classList.contains('scanner-active') || 
                                document.body.classList.contains('scanner-active-continuous') ||
                                !!document.querySelector('#universal-scanner-container');
                                
        if (isScannerActive) {
          document.body.classList.remove('scanner-active', 'scanner-active-continuous');
          document.documentElement.classList.remove('scanner-active', 'scanner-active-continuous');
          try {
            const { BarcodeScanner } = require('@capacitor-mlkit/barcode-scanning');
            BarcodeScanner.stopScan().catch(() => {});
          } catch (e) {}
          try {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              const stream = video.srcObject as MediaStream;
              if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach(track => track.stop());
              }
            });
          } catch (e) {}
          router.back();
          return;
        }

        // 1. Verificar si hay algún modal abierto (radix-ui, dialog, sheet, etc)
        const openModal = document.querySelector('[role="dialog"]') || document.querySelector('[data-state="open"]');
        if (openModal) {
          // Si hay modal, intentamos cerrarlo emitiendo la tecla Escape
          const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true });
          document.dispatchEvent(escapeEvent);
        } else if (canGoBack) {
          // Si no hay modal y hay historial web, retroceder normalmente de forma segura para Next.js
          router.back();
        } else {
          // Si no hay historial web (pantalla principal), podríamos minimizar la app
          App.minimizeApp();
        }
      });
    }

    // 1. Blindaje de CustomEvent (Nivel Global con Fuerza Bruta)
    try {
       // Prueba de fuego
       new (window as any).CustomEvent('safeguard_test');
    } catch (e) {
       console.log("🛡️ Safely polyfilling CustomEvent (FORCED)...");
       var customEventPolyfill = function(this: any, event: string, params: any) {
         params = params || { bubbles: false, cancelable: false, detail: undefined };
         var evt = document.createEvent('CustomEvent');
         evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
         return evt;
       };
       customEventPolyfill.prototype = window.Event.prototype;
       try {
         Object.defineProperty(window, 'CustomEvent', { value: customEventPolyfill, configurable: true });
       } catch (e2) {
         (window as any).CustomEvent = customEventPolyfill;
       }
    }

    // 2. Blindaje de ResizeObserver (Versión Funcional Legacy)
    if (!(window as any).ResizeObserver) {
       console.log("🛡️ Safely polyfilling ResizeObserver (FORCED)...");
       var RO = function(this: any) {
          this.observe = function() {};
          this.unobserve = function() {};
          this.disconnect = function() {};
       };
       try {
         Object.defineProperty(window, 'ResizeObserver', { value: RO, configurable: true });
       } catch (e) {
         (window as any).ResizeObserver = RO;
       }
    }

    // 3. Blindaje de IntersectionObserver (Versión Funcional Legacy)
    if (!(window as any).IntersectionObserver) {
       console.log("🛡️ Safely polyfilling IntersectionObserver (FORCED)...");
       var IO = function(this: any) {
          this.observe = function() {};
          this.unobserve = function() {};
          this.disconnect = function() {};
       };
       try {
         Object.defineProperty(window, 'IntersectionObserver', { value: IO, configurable: true });
       } catch (e) {
         (window as any).IntersectionObserver = IO;
       }
    }

    // 4. Blindaje final contra "new BarcodeDetector" accidental
    if ('BarcodeDetector' in window && typeof (window as any).BarcodeDetector !== 'function') {
        try {
            // Intentamos invalidarlo si no es una función para evitar Illegal Constructor
            // @ts-ignore
            delete window.BarcodeDetector;
        } catch (e) {}
    }

  }, []);

  return null;
}
