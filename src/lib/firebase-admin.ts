import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-8047565887-3a8da",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // We handle the private key with care for both \n and string formats
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function initializeAdmin() {
  const apps = admin.apps || [];
  if (!apps.length) {
    try {
      if (firebaseAdminConfig.privateKey && firebaseAdminConfig.clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
        });
        console.log('Firebase Admin initialized successfully via Service Account env vars');
      } else {
        // Fallback 1: Buscar archivo serviceAccountKey.json local
        const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        if (fs.existsSync(localKeyPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
          });
          console.log('Firebase Admin initialized successfully via local serviceAccountKey.json');
        } else {
          // Fallback 2: Default credentials
          admin.initializeApp({ projectId: firebaseAdminConfig.projectId });
          console.log('Firebase Admin initialized via Default Credentials');
        }
      }
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  }
  return admin;
}

export const adminDb = {
  get collection() { return initializeAdmin().firestore().collection.bind(initializeAdmin().firestore()); },
  get batch() { return initializeAdmin().firestore().batch.bind(initializeAdmin().firestore()); },
  get runTransaction() { return initializeAdmin().firestore().runTransaction.bind(initializeAdmin().firestore()); },
  get doc() { return initializeAdmin().firestore().doc.bind(initializeAdmin().firestore()); }
} as any;

export const adminAuth = {
  get generatePasswordResetLink() { return initializeAdmin().auth().generatePasswordResetLink.bind(initializeAdmin().auth()); },
  get getUser() { return initializeAdmin().auth().getUser.bind(initializeAdmin().auth()); },
  get verifyIdToken() { return initializeAdmin().auth().verifyIdToken.bind(initializeAdmin().auth()); }
} as any;

export const adminStorage = {
  get bucket() { return initializeAdmin().storage().bucket.bind(initializeAdmin().storage()); }
} as any;

export { admin };
export default admin;
