'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VentaMayoristaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/redeconomix/dashboard-negocio/stock');
  }, [router]);

  return (
    <div className="p-8 text-center text-slate-500">
      Redirigiendo a Gestión de Stock...
    </div>
  );
}
