'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseNotificationsHandler } from '@/components/FirebaseNotificationsHandler';
import { RedEconomiXCartProvider } from '@/context/redeconomix-cart-context';
import { RedEconomiXBottomNav } from '@/components/redeconomix-bottom-nav';
import { FloatingCartButton } from '@/components/floating-cart-button';
import { pwaInstallStore } from '@/hooks/use-pwa-install';
import { cn } from '@/lib/utils';
import { initPerformance } from '@/performance-engine/init-performance';
import { PWAInstallModal } from '@/components/pwa-install-modal';
import { AppLoadingScreen } from '@/components/app-loading-screen';
import { MobileSafeguard } from '@/components/mobile-safeguard';
import { RedEconomiXHeader } from '@/components/redeconomix-header';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { useUser } from '@/firebase';
import { UserStatusGuard } from '@/components/user-status-guard';
import { SellerGPSTracker } from '@/components/seller-gps-tracker';

function RouteAndSessionTracker() {
  const pathname = usePathname() || '';
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (user) {
      localStorage.setItem('rex_session_active', '1');
    }

    const isAppRoute = pathname.startsWith('/redeconomix') || pathname.startsWith('/redbusiness');
    const isExcluded = pathname === '/login' || 
                       pathname.startsWith('/register') || 
                       pathname.startsWith('/redeconomix/register') ||
                       pathname === '/descarga';
    if (isAppRoute && !isExcluded) {
      localStorage.setItem('rex_last_route', pathname);
    }
  }, [pathname, user]);

  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';



  useEffect(() => {
    // 🚀 Performance Engine Activation
    // initPerformance();
  }, []);

  useEffect(() => {
    // Dynamic theme-color mapping based on route


    const color = '#FEFEFE';
    
    // Update theme-color meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);

    // Also update apple-mobile-web-app-status-bar-style if needed
    // Note: for transparent/dynamic, 'default' is usually best on iOS
  }, [pathname]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      pwaInstallStore.setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const isAdminPage = pathname?.startsWith('/admin');
  const isWholesalerDashboard = pathname?.startsWith('/redeconomix/dashboard-mayorista');
  const isRetailerDashboard = pathname?.startsWith('/redeconomix/dashboard-negocio');
  const isProviderDashboard = pathname?.startsWith('/redeconomix/prestadores');
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/redeconomix/register') || 
                     pathname?.startsWith('/register') || 
                     pathname === '/redeconomix/empleados/login' ||
                     pathname === '/descarga';
  const isRedInversiones = pathname?.startsWith('/redbusiness');
  const isRedServicios = pathname?.startsWith('/redeconomix/servicios');
  const isProgramaEsencial = pathname?.startsWith('/programa-esencial');
  const isLiquidacionFlash = pathname?.startsWith('/redeconomix/liquidacion-flash');
  const isMarketplaceHome = pathname === '/redeconomix' || pathname === '/redeconomix/';
  const isGerald = pathname?.startsWith('/gerald');
  const isQueTrueque = pathname?.startsWith('/que-trueque');
  const isPublicLanding = pathname === '/mayoristas' || pathname === '/vendedores';

  const isCustomHeaderPage = isRedInversiones || isRedServicios || isProgramaEsencial || isLiquidacionFlash || isMarketplaceHome || isGerald || isQueTrueque || isPublicLanding;

  const shouldShowBottomNav = !isAdminPage && 
                               !isWholesalerDashboard && 
                               !isRetailerDashboard && 
                               !isProviderDashboard && 
                               !isAuthPage && 
                               !isPublicLanding &&
                               pathname !== '/' &&
                               pathname !== '/descarga' &&
                               !pathname?.startsWith('/register') &&
                               !isQueTrueque;
  const shouldShowHeader = shouldShowBottomNav && !isCustomHeaderPage && !isPublicLanding;

  return (
    <FirebaseClientProvider>
      <UserStatusGuard>
        <SellerGPSTracker />
        <RouteAndSessionTracker />
        {/* <MobileSafeguard /> */}
        <RedEconomiXCartProvider>
        <FirebaseNotificationsHandler />
        {shouldShowHeader && !isAuthPage && (
          <RedEconomiXHeader 
            variant={
              pathname?.includes('/redeconomix/perfil') ? 'red' :
              (pathname?.includes('/redeconomix/servicios') || pathname?.includes('/redeconomix/regalos')) ? 'tech' : 'white'
            } 
          />
        )}
        <main className={cn(
          shouldShowBottomNav && "pb-20 md:pb-0",
          shouldShowHeader && "pt-[calc(65px+env(safe-area-inset-top))] md:pt-[104px]"
        )}>
          {children}
        </main>
        {shouldShowBottomNav && (
          <>
            {!isGerald && <FloatingCartButton />}
            <RedEconomiXBottomNav />
          </>
        )}
        <Toaster position="bottom-center" />
        <ShadcnToaster />
        <PWAInstallModal />
      </RedEconomiXCartProvider>
      </UserStatusGuard>
    </FirebaseClientProvider>
  );
}
