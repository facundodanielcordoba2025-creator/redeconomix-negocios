import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentMultipleTabManager, persistentLocalCache, getFirestore, Firestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

function createFirestore(firebaseApp: FirebaseApp) {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (e) {
    return getFirestore(firebaseApp);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = createFirestore(firebaseApp);

  return {
    firebaseApp,
    auth,
    firestore,
    storage: getStorage(firebaseApp, "gs://oggie-8529f.firebasestorage.app"),
    messaging: typeof window !== 'undefined' ? (async () => {
      try {
        const supported = await isSupported();
        return supported ? getMessaging(firebaseApp) : null;
      } catch (err) {
        console.warn('Firebase Messaging not supported in this browser:', err);
        return null;
      }
    })() : null
  };
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = createFirestore(app);
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn("Error setting auth persistence:", err);
  });
}
export const storage = getStorage(app, "gs://oggie-8529f.firebasestorage.app");

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from './firestore/use-collection-once';
