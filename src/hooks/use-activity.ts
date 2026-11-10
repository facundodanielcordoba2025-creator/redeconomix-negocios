import { useEffect, useCallback, useRef, useState } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAlerts } from './use-alerts';

export function useActivityTracking() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { playAlert } = useAlerts();
  const lastUpdate = useRef<number>(Date.now());
  const [showReminder, setShowReminder] = useState(false);

  // Get user role from doc
  const userDocRef = user && firestore ? doc(firestore, 'users', user.uid) : null;
  const { data: userData } = useDoc(userDocRef as any);

  const isUpdating = useRef(false);

  const updateActivity = useCallback(async () => {
    if (!user || !firestore || !userData || isUpdating.current) return;
    
    const role = userData.role || userData.accountType;
    if (role !== 'provider' && role !== 'wholesaler' && role !== 'prestador' && role !== 'mayorista') return;

    // Throttle to every 60 seconds for performance
    if (Date.now() - lastUpdate.current < 60000) return;

    isUpdating.current = true;
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastSeen: serverTimestamp(),
        isOnline: true
      });
      lastUpdate.current = Date.now();
    } catch (e) {
      console.error("Error updating activity:", e);
    } finally {
      isUpdating.current = false;
    }
  }, [user, firestore, userData]);

  const extendSession = useCallback(async () => {
    if (!user || !firestore || isUpdating.current) return;
    isUpdating.current = true;
    try {
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastSeen: serverTimestamp(),
        isOnline: true
      });
      lastUpdate.current = Date.now();
      setShowReminder(false);
    } catch (e) {
      console.error("Error extending session:", e);
    } finally {
      isUpdating.current = false;
    }
  }, [user, firestore]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart'];
    const handleUpdate = () => updateActivity();
    
    events.forEach(e => window.addEventListener(e, handleUpdate));

    const interval = setInterval(() => {
      if (!firestore || !user || !userData || (userData.role !== 'provider' && userData.role !== 'wholesaler')) return;
      if (!userData.isOnline) return;

      const elapsedMs = Date.now() - lastUpdate.current;
      const minutesSinceLastAction = elapsedMs / (1000 * 60);
      
      // Reminder after 60 minutes
      if (minutesSinceLastAction >= 60 && minutesSinceLastAction < 120) {
        if (!showReminder) {
            playAlert('siren');
            setShowReminder(true);
        }
      }

      // Offline after 120 minutes
      if (minutesSinceLastAction >= 120 && !isUpdating.current) {
        isUpdating.current = true;
        if (firestore) {
          updateDoc(doc(firestore, 'users', user!.uid), { isOnline: false })
            .finally(() => {
              isUpdating.current = false;
              setShowReminder(false);
            });
        } else {
          isUpdating.current = false;
          setShowReminder(false);
        }
      }
    }, 1000 * 60);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleUpdate));
      clearInterval(interval);
    };
  }, [updateActivity, playAlert, user, firestore, userData, showReminder]);

  return { showReminder, extendSession, setShowReminder };
}
