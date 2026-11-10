'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { createPermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        memoizedDocRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            setData({ ...(snapshot.data({ serverTimestamps: 'estimate' }) as T), id: snapshot.id });
          } else {
            setData(null);
          }
          setError(null);
          setIsLoading(false);
        },
        (error: FirestoreError) => {
          console.error("Firestore (useDoc) Error:", error);
          setError(error);
          if (error.code === 'permission-denied') {
              errorEmitter.emit('permission-error', createPermissionError({
                operation: 'get',
                path: memoizedDocRef.path,
              }));
          }
          setData(null);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.warn("Ignored Firestore onSnapshot init error (Fast Refresh):", err);
    }

    return () => {
      // Prevent Firestore "INTERNAL ASSERTION FAILED (ID: ca9)" during React 18 Strict Mode rapid unmounts
      setTimeout(() => {
        try {
          unsubscribe();
        } catch (e) {
          console.warn("Ignored Firestore unsubscribe error:", e);
        }
      }, 50);
    };
  }, [memoizedDocRef?.path]); 

  return { data, isLoading, error };
}
