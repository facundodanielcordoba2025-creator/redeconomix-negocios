'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { createPermissionError } from '@/firebase/errors';
import { useMemoFirebase } from '@/firebase/provider';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>))  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        memoizedTargetRefOrQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: ResultItemType[] = [];
          snapshot.docs.forEach(doc => {
            results.push({ ...(doc.data({ serverTimestamps: 'estimate' }) as T), id: doc.id });
          });
          
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        (error: FirestoreError) => {
          console.error("Firestore (useCollection) Error:", error);
          setError(error);
          if (error.code === 'permission-denied') {
              const path = (memoizedTargetRefOrQuery as any)?._query?.path?.toString() || 
                           (memoizedTargetRefOrQuery as any)?.path?.toString() || 
                           'unknown_collection';
                           
              errorEmitter.emit('permission-error', createPermissionError({
                operation: 'list',
                path: path,
              }));
          }
          setData(null);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.warn("Ignored Firestore useCollection init error (Fast Refresh):", err);
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
  }, [memoizedTargetRefOrQuery ? (memoizedTargetRefOrQuery as any)._query?.path?.toString() || (memoizedTargetRefOrQuery as any).path : null]);
  
  return { data, isLoading, error };
}
