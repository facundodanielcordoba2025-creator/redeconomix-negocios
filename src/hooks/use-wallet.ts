'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

export function useWallet() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Reference to the user's wallet document
  const walletRef = user && firestore ? doc(firestore, 'wallets', user.uid) : null;
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletRef);

  // Lock to prevent multiple initialization attempts
  const [isInitializing, setIsInitializing] = useState(false);
  const initializingRef = useRef(false);

  // Initialize wallet if it doesn't exist
  useEffect(() => {
    if (user && firestore && !isWalletLoading && !walletData && !initializingRef.current) {
      const initWallet = async () => {
        initializingRef.current = true;
        setIsInitializing(true);
        try {
          await setDoc(doc(firestore, 'wallets', user.uid), {
            uid: user.uid,
            balanceAvailable: 0,
            balancePending: 0,
            totalEarned: 0,
            currency: 'ARS',
            updatedAt: serverTimestamp(),
            status: 'active'
          }, { merge: true });
        } catch (error) {
          console.error("Wallet initialization error:", error);
          initializingRef.current = false;
        } finally {
          setIsInitializing(false);
        }
      };
      initWallet();
    }
  }, [user, firestore, isWalletLoading, walletData]);

  const addBalance = async (amount: number, type: 'available' | 'pending' = 'available') => {
    if (!walletRef) return;
    await setDoc(walletRef, {
      [type === 'available' ? 'balanceAvailable' : 'balancePending']: increment(amount),
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  return {
    wallet: walletData || { balanceAvailable: 0, balancePending: 0, totalEarned: 0 },
    isLoading: isUserLoading || isWalletLoading,
    addBalance
  };
}
