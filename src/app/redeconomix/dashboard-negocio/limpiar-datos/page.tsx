'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { wipeRetailerData } from './actions';

export default function WipeDataPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isWiping, setIsWiping] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  const addLog = (msg: string) => {
    setProgress(prev => [...prev, msg]);
    console.log(msg);
  };

  
  const handleWipeCajaOnly = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero.');
      return;
    }
    const confirm1 = window.confirm('¿Seguro que quieres poner en cero el historial de caja? (Esto borrará operaciones y turnos de caja)');
    if (!confirm1) return;

    setIsWiping(true);
    setProgress(['Iniciando borrado de caja...']);
    try {
      const { getFirestore } = await import('firebase/firestore');
      const db = getFirestore();
      
      let opsCount = 0;
      const qOps = query(collection(db, 'retailer_daily_operations'), where('retailerId', '==', user.uid));
      const snapOps = await getDocs(qOps);
      for (const doc of snapOps.docs) {
        await deleteDoc(doc.ref);
        opsCount++;
      }
      setProgress(prev => [...prev, `✔️ Borradas ${opsCount} operaciones.`]);

      let shiftsCount = 0;
      const qShifts = query(collection(db, 'retailer_cash_shifts'), where('retailerId', '==', user.uid));
      const snapShifts = await getDocs(qShifts);
      for (const doc of snapShifts.docs) {
        await deleteDoc(doc.ref);
        shiftsCount++;
      }
      setProgress(prev => [...prev, `✔️ Borrados ${shiftsCount} turnos de caja.`]);

      let sumCount = 0;
      const qSums = query(collection(db, 'retailer_daily_summaries'), where('retailerId', '==', user.uid));
      const snapSums = await getDocs(qSums);
      for (const doc of snapSums.docs) {
        await deleteDoc(doc.ref);
        sumCount++;
      }
      setProgress(prev => [...prev, `✔️ Borrados ${sumCount} resúmenes diarios.`]);

      toast.success('¡Caja puesta en cero!');
      setIsDone(true);
    } catch (e: any) {
      setProgress(prev => [...prev, '❌ Error: ' + e.message]);
      toast.error('Error al borrar la caja');
    }
    setIsWiping(false);
  };

  const handleWipeData = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero.');
      return;
    }

    const confirm1 = window.confirm('⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE. ¿Estás absolutamente seguro de que quieres borrar TODOS los productos y ventas de tu negocio?');
    if (!confirm1) return;
    
    const confirm2 = window.prompt('Para confirmar, escribe la palabra: BORRAR');
    if (confirm2 !== 'BORRAR') {
      toast.error('Operación cancelada.');
      return;
    }

    setIsWiping(true);
    setProgress([]);

    try {
      addLog('Iniciando proceso de limpieza total (Factory Reset) desde servidor...');
      
      // 1. Clear IndexedDB Cache first
      addLog('Borrando caché offline del dispositivo (IndexedDB)...');
      try {
        const req = indexedDB.deleteDatabase('offline-pos-db');
        req.onsuccess = () => addLog('✔️ Caché offline eliminada.');
        req.onerror = () => addLog('⚠️ No se pudo borrar la caché offline, pero continuaremos.');
      } catch (e) {
        addLog('⚠️ Error al borrar caché offline.');
      }

      // 2. Call Server Action to wipe Firestore (bypassing security rules)
      addLog('Enviando petición de borrado de bases de datos al servidor...');
      const response = await wipeRetailerData(user.uid);
      
      // Merge logs
      setProgress(prev => [...prev, ...response.log]);
      
      if (response.success) {
        toast.success('¡Base de datos limpiada correctamente!');
        setIsDone(true);
      } else {
        toast.error('Hubo un error durante la limpieza.');
      }

    } catch (e: any) {
      console.error(e);
      addLog(`❌ ERROR FATAL: ${e.message}`);
      toast.error('Hubo un error durante la limpieza.');
    } finally {
      setIsWiping(false);
    }
  };

  if (!user) {
    return <div className="p-10 text-center">Iniciando sesión...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-mono">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-8 shadow-2xl border border-red-900/50 relative overflow-hidden">
        {/* Background danger stripes */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #ef4444 10px, #ef4444 20px)' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6 text-red-500">
            <ShieldAlert className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Limpieza de Pruebas</h1>
              <p className="text-sm text-red-400">Herramienta de reseteo de Mi Negocio</p>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 text-xs text-slate-400 leading-relaxed">
            <p className="mb-2"><strong className="text-red-400">¡ATENCIÓN!</strong> Esta herramienta fue creada exclusivamente para borrar los datos de prueba antes de la puesta en producción real.</p>
            <p>Al ejecutar este proceso, se eliminarán todos los documentos asociados a tu cuenta (ID: <span className="text-white">{user.uid}</span>) en las siguientes colecciones:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300">
              <li>Inventario y Productos</li>
              <li>Ventas, Ingresos y Egresos</li>
              <li>Arqueos y Cierres de Caja</li>
              <li>Cuentas Corrientes y Pagos</li>
            </ul>
          </div>

          {!isDone ? (
            
            <div className="flex flex-col gap-4">
              <Button 
                onClick={handleWipeData} 
                disabled={isWiping}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all"
              >
                {isWiping ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> EJECUTANDO PURGA...</span>
                ) : (
                  <span className="flex items-center gap-2"><Trash2 className="h-5 w-5" /> INICIAR PURGA TOTAL</span>
                )}
              </Button>
              
              <Button 
                onClick={handleWipeCajaOnly} 
                disabled={isWiping}
                variant="outline"
                className="w-full h-14 border-2 border-red-600 text-red-600 hover:bg-red-50 font-black text-lg uppercase tracking-widest rounded-xl"
              >
                {isWiping ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> BORRANDO CAJA...</span>
                ) : (
                  <span className="flex items-center gap-2">SOLO BORRAR HISTORIAL DE CAJA</span>
                )}
              </Button>
            </div>

          ) : (
            <Button 
              onClick={() => router.push('/redeconomix/dashboard-negocio')} 
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-widest rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Tablero
            </Button>
          )}

          {/* Terminal / Logs */}
          {progress.length > 0 && (
            <div className="mt-6 bg-black rounded-xl p-4 border border-slate-800 h-48 overflow-y-auto">
              <div className="text-[10px] text-emerald-500 font-bold mb-2">Terminal Output:</div>
              {progress.map((log, i) => (
                <div key={i} className={cn("text-xs mb-1", log.includes('❌') || log.includes('⚠️') ? 'text-red-400' : log.includes('✨') ? 'text-emerald-400 font-bold' : 'text-slate-300')}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
