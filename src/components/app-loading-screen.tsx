import React, { useState, useEffect } from 'react';
import { RedEconomiXLogo, RocketIcon } from './branding';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDocs, collection, query, limit } from 'firebase/firestore';

export function AppLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const prefetchProducts = async () => {
      try {
        await getDocs(query(collection(firestore, 'wholesale_products'), limit(50)));
      } catch (error) {
        console.error('Failed to preload products:', error);
      } finally {
        setProductsLoaded(true);
      }
    };
    prefetchProducts();
  }, [firestore]);

  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // Failsafe: if Firebase takes too long, force the app to load after 2.5 seconds
    const timeout = setTimeout(() => setForceReady(true), 2500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const isFirebaseReady = forceReady || (!isUserLoading && (!user || (user && !isProfileLoading)) && productsLoaded);

    const duration = 200; // REDUCIDO DE 1200 A 200 para un arranque instantáneo
    const interval = 20;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          if (isFirebaseReady) {
            clearInterval(timer);
            setTimeout(() => setShow(false), 100); // Salida más rápida
            return 100;
          } else {
            return 98;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isUserLoading, user, isProfileLoading, productsLoaded, forceReady]);

  if (!show) return null;

  const isTakingOff = progress >= 80;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#FCFCFA] flex flex-col items-center justify-center px-8 overflow-hidden transition-opacity duration-700 ease-in-out">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-red-500/5 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex flex-col items-center text-center gap-12 w-full max-w-sm transition-all">
        {/* ROCKET ANIMATION AREA */}
        <div className="relative h-32 w-32 flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-[2.5rem] bg-red-700 flex items-center justify-center shadow-2xl shadow-red-500/30 relative z-20 transition-all ${isTakingOff ? 'translate-y-[-1000px] duration-1500' : 'animate-bounce'}`}
            style={{ transitionDuration: isTakingOff ? '1500ms' : '2000ms' }}
          >
             <RocketIcon className="h-12 w-12 text-white" />
             
             {isTakingOff && (
               <div className="absolute -bottom-4 w-8 h-12 bg-orange-500 blur-xl rounded-full -z-10 animate-pulse" />
             )}
          </div>
          
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200 opacity-50 animate-[spin_10s_linear_infinite]" />
        </div>

        <div className="w-full space-y-10 flex flex-col items-center">
           <div className="space-y-4 text-center">
              <div className="flex flex-col items-center">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                   RedEconomiX
                 </h1>
                 <p className="text-emerald-700 font-extrabold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   Optimizando tu módulo...
                 </p>
              </div>
           </div>

          <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-red-700 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] text-center w-full">
            {Math.round(progress)}% Completado
          </p>
        </div>
      </div>

      {/* Brand identity footer */}
      <div className="absolute bottom-16 flex flex-col items-center gap-4 opacity-40">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plataforma de Gestión Regional</p>
      </div>
    </div>
  );
}
