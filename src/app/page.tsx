'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/redeconomix/dashboard-negocio');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#D60000] border-r-transparent align-[-0.125em]" role="status" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
          Iniciando RedEconomiX Negocios...
        </p>
      </div>
    </div>
  );
}
