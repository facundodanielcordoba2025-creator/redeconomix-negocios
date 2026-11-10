import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-8047565887-3a8da",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let initializedApp: any = null;

export function initializeAdmin() {
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  if (!apps.length) {
    try {
      if (firebaseAdminConfig.privateKey && firebaseAdminConfig.clientEmail) {
        initializedApp = admin.initializeApp({
          credential: admin.credential?.cert ? admin.credential.cert(firebaseAdminConfig as any) : cert(firebaseAdminConfig as any),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
        });
        console.log('Firebase Admin initialized successfully via Service Account env vars');
      } else {
        const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(localKeyPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
          initializedApp = admin.initializeApp({
            credential: admin.credential?.cert ? admin.credential.cert(serviceAccount) : cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
          });
          console.log('Firebase Admin initialized successfully via local serviceAccountKey.json');
        } else {
          initializedApp = admin.initializeApp({ projectId: firebaseAdminConfig.projectId });
          console.log('Firebase Admin initialized via Default Credentials');
        }
      }
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  } else {
    initializedApp = apps[0];
  }

  const currentApp = initializedApp || (admin.getApps ? admin.getApps()[0] : (admin.apps as any)?.[0]);

  const firestoreFn: any = () => getFirestore(currentApp);
  firestoreFn.FieldValue = FieldValue;
  (admin as any).firestore = firestoreFn;
  (admin as any).messaging = () => getMessaging(currentApp);
  (admin as any).auth = () => getAuth(currentApp);
  (admin as any).storage = () => getStorage(currentApp);

  return admin;
}

export function getAdminFirestore() {
  initializeAdmin();
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  return getFirestore(apps[0]);
}

export function getAdminMessaging() {
  initializeAdmin();
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  return getMessaging(apps[0]);
}

export function getAdminAuth() {
  initializeAdmin();
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  return getAuth(apps[0]);
}

export const adminDb = {
  get collection() { return getAdminFirestore().collection.bind(getAdminFirestore()); },
  get batch() { return getAdminFirestore().batch.bind(getAdminFirestore()); },
  get runTransaction() { return getAdminFirestore().runTransaction.bind(getAdminFirestore()); },
  get doc() { return getAdminFirestore().doc.bind(getAdminFirestore()); }
} as any;

export const adminAuth = {
  get generatePasswordResetLink() { return getAdminAuth().generatePasswordResetLink.bind(getAdminAuth()); },
  get getUser() { return getAdminAuth().getUser.bind(getAdminAuth()); },
  get verifyIdToken() { return getAdminAuth().verifyIdToken.bind(getAdminAuth()); }
} as any;

export const adminStorage = {
  get bucket() { 
    initializeAdmin();
    const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
    return getStorage(apps[0]).bucket.bind(getStorage(apps[0])); 
  }
} as any;

export { admin };
export default admin;
