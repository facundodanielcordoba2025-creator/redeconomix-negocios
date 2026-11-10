'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // 1. Esperar siempre a que Firebase verifique si hay sesión guardada en el dispositivo
    if (isUserLoading) return;

    // 2. Si definitivamente no hay sesión, ir al login
    if (!user) {
      router.replace('/login');
      return;
    }

    // 3. Si hay sesión activa, enrutar directamente al módulo correspondiente sin pasar por login
    const cachedRole = typeof window !== 'undefined' ? localStorage.getItem('rex_role') : null;
    if (cachedRole === 'cashier' || cachedRole === 'cashier_warehouse') {
      router.replace('/redeconomix/dashboard-negocio/control-ventas');
    } else {
      router.replace('/redeconomix/dashboard-negocio/resumen');
    }
  }, [isUserLoading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
          Iniciando RedEconomiX Negocios...
        </p>
      </div>
    </div>
  );
}
