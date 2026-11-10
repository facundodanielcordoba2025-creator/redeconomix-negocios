'use client';
import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function ClearCajaPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [status, setStatus] = useState('Esperando...');

  const handleClear = async () => {
    if (!user || !firestore) return;
    setStatus('Borrando operaciones...');
    
    try {
      const opsRef = collection(firestore, 'retailer_daily_operations');
      const qOps = query(opsRef, where('retailerId', '==', user.uid));
      const snapOps = await getDocs(qOps);
      for (const doc of snapOps.docs) {
        await deleteDoc(doc.ref);
      }
      
      setStatus(`Borrando turnos... (${snapOps.size} ops borradas)`);
      const shiftsRef = collection(firestore, 'retailer_cash_shifts');
      const qShifts = query(shiftsRef, where('retailerId', '==', user.uid));
      const snapShifts = await getDocs(qShifts);
      for (const doc of snapShifts.docs) {
        await deleteDoc(doc.ref);
      }
      
      setStatus(`¡Listo! Borrados ${snapOps.size} registros y ${snapShifts.size} turnos.`);
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Limpiar Historial de Caja</h1>
      <p>{status}</p>
      <Button onClick={handleClear} className="bg-red-600 text-white">Borrar todo el historial ahora</Button>
    </div>
  );
}
