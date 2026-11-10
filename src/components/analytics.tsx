'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';
    const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || 'PIXEL_ID';

    // 1. Inyectar & Registrar Google Analytics
    if (GA_ID && GA_ID !== 'G-XXXXXXXXXX') {
      if (!(window as any).gtag) {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `;
        document.head.appendChild(script2);
        (window as any).gtag = function() {
          (window as any).dataLayer.push(arguments);
        };
      }
      (window as any).gtag('config', GA_ID, { page_path: pathname + searchParams.toString() });
    }

    // 2. Inyectar & Registrar Meta Pixel (Facebook Pixel)
    if (PIXEL_ID && PIXEL_ID !== 'PIXEL_ID') {
      if (!(window as any).fbq) {
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        (window as any).fbq('init', PIXEL_ID);
      }
      (window as any).fbq('track', 'PageView');
    }

    // 3. Registrar en Firebase Firestore (Evitando rutas de administrador para no inflar la DB)
    if (pathname.startsWith('/admin')) {
      return;
    }

    const logPageView = async () => {
      if (!firestore) return;
      try {
        // Generar un Session ID persistente por pestaña
        let sessionId = sessionStorage.getItem('rex_analytics_session_id');
        if (!sessionId) {
          sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('rex_analytics_session_id', sessionId);
        }

        const referrer = document.referrer || '';

        await addDoc(collection(firestore, 'page_views'), {
          path: pathname,
          search: searchParams.toString(),
          timestamp: serverTimestamp(),
          userId: user?.uid || null,
          userEmail: user?.email || null,
          sessionId,
          referrer,
          userAgent: navigator.userAgent
        });
      } catch (err) {
        console.error('[Analytics] Error logging view to Firestore:', err);
      }
    };

    logPageView();
  }, [pathname, searchParams, firestore, user]);

  return null;
}
