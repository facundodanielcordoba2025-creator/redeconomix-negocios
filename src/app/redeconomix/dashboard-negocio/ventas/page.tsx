'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToControlVentas() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/redeconomix/dashboard-negocio/control-ventas');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 max-sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 font-sans">Abriendo Terminal Elite...</p>
    </div>
  );
}
