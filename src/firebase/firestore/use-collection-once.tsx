'use client';
import { useState, useEffect } from 'react';
import { Query, getDocs, FirestoreError, getDocsFromCache, getDocsFromServer } from 'firebase/firestore';
import { WithId, UseCollectionResult, InternalQuery } from './use-collection';
import { errorEmitter } from '@/firebase/error-emitter';

export function useCollectionOnce<T = any>(query: Query<any> | null): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        // Primero intentamos desde caché para velocidad máxima
        try {
           const cacheSnap = await getDocsFromCache(query);
           if (isMounted && !cacheSnap.empty) {
             const docs = cacheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<T>));
             setData(docs);
             setIsLoading(false);
           }
        } catch (e) {
           // Si la caché falla o está vacía, no pasa nada, bajamos del servidor
        }

        // Siempre re-validamos desde el servidor de fondo (Stale-while-revalidate)
        const serverSnap = await getDocs(query);
        if (isMounted) {
          const docs = serverSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<T>));
          setData(docs);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { data, isLoading, error };
}
