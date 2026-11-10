'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the event interface, as it's not standard in all TS lib versions
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// 1. A simple in-memory store
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

// 2. The store object with methods to interact with the state
export const pwaInstallStore = {
  getPrompt: () => deferredPrompt,
  setPrompt: (prompt: BeforeInstallPromptEvent | null) => {
    deferredPrompt = prompt;
    listeners.forEach(l => l());
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// 3. The custom hook that components will use
export const usePwaInstall = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(pwaInstallStore.getPrompt());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = pwaInstallStore.subscribe(() => {
      setPrompt(pwaInstallStore.getPrompt());
    });
    return () => { unsubscribe(); };
  }, []);

  const triggerInstall = useCallback(() => {
    const promptToTrigger = pwaInstallStore.getPrompt();
    if (!promptToTrigger) {
      return;
    }
    promptToTrigger.prompt();
    promptToTrigger.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "¡Aplicación Instalada!",
          description: "Ya podés encontrar Ahorro.App en tu pantalla de inicio.",
        });
        console.log('User accepted the PWA installation');
        
        // Record the installation in Firestore
        if (db) {
          addDoc(collection(db, 'app_installs'), {
            platform: choiceResult.platform || 'unknown',
            timestamp: serverTimestamp(),
            userAgent: window.navigator ? window.navigator.userAgent : 'unknown',
          }).catch(console.error);
        }
      } else {
        console.log('User dismissed the PWA installation');
      }
      // The prompt can only be used once.
      pwaInstallStore.setPrompt(null);
    });
  }, [toast]);

  return { installPrompt: prompt, canInstall: !!prompt, triggerInstall };
};
