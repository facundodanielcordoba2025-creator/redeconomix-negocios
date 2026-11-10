'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { RocketBackground } from '@/components/rocket-background';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/redeconomix/register');
  }, [router]);

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <RocketBackground />
      <div className="relative z-10 flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
        <p className="mt-4 text-white font-bold  uppercase tracking-widest text-shadow-sm">Redirigiendo a la página de registro...</p>
      </div>
    </div>
  );
}
