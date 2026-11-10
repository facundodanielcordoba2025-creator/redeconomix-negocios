'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ShieldAlert, LogOut, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UserStatusGuard({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  const userDocRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userData } = useDoc<any>(userDocRef);

  const isBlocked = !!user && userData && (userData.isActive === false || userData.status === 'blocked');

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[99999] bg-white flex items-center justify-center p-6 text-slate-900">
        <div className="max-w-md w-full bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center shadow-lg space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-[#FF0000]">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Acceso Inhabilitado
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tu cuenta ha sido suspendida por la administración de RedEconomiX por infringir las normativas de uso o por disposición operativa.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-left text-xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Identidad vinculada</p>
            <p className="font-semibold text-slate-800">{user.email || userData.email || 'Usuario'}</p>
            {userData.accountType && (
              <p className="text-[11px] text-slate-500 capitalize">Tipo de cuenta: <span className="font-medium">{userData.accountType}</span></p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              className="w-full bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-xs uppercase tracking-wider h-11 rounded-xl flex items-center justify-center gap-2"
              onClick={async () => {
                if (auth) {
                  await signOut(auth);
                }
                localStorage.clear();
                window.location.href = '/login';
              }}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>

            <a
              href="mailto:info@redeconomix.com?subject=Consulta%20por%20cuenta%20suspendida"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold py-2 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Contactar a Soporte Oficial
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
