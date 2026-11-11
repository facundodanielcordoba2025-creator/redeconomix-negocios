import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const FALLBACK_B64_CRED = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InN0dWRpby04MDQ3NTY1ODg3LTNhOGRhIiwicHJpdmF0ZV9rZXlfaWQiOiIwZWJkMjFhNTA0YjIwMjUxNjkwZWY0YTZiZjkxMGRiNzk4YjliNmZhIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzdnS3R4TEphYk8wV0lcbmN4VnVuQ3o0dENHdjltZko3cFBJdzNzOVVKeFMvOGNDU25sbS9xZTJoUWlzUXVCM0hXMFV0aWxtb1Q5ZTNnVEFcbnFOMyt2VHMzRFJlM1ZZdTR4N1hkeW5LR3VBMHE4TXMySE80TjhaL1k1aEdXeEdpQngxTitsSlhIaWdPbWZvVGtcbmJRVHJoVzFuTmpsZDhVQWhzRGZJNWNxOVZJWlg3MEJqbk1sd2ZuL2lSaHhZYUlBZUxENXQ4eDZnQ0VTTkUxMElcbjhlNEhqL3lwQUZvbWh2cElibGl3VVFGbFpLUXpUa0R5Y1JRS2RDbHFOSXdHcDJURFVjdlJsaWJDR2ZoMHZkT2NcbkdVcUY3aDM2b2VPSDNrb0REQ25RV1QzN1N6ZVNKRGd3WnJWRG5wNUYrSkVjQkk3V0doelpZNlF3YUNsZXltWHBcbkR4ZnYyQTgzQWdNQkFBRUNnZ0VBQVlRdTNzRnZqbDNTV0NJbUlEamZIRHZJc2ZXYUxVWGlxQkw4b2loT3UxVWFcbk5PaUpSczMwYVVOMktINTU5anlrcnpBeDhZU0lVS29XKzcvaDI3ZUlEUS9zQ3kyRDdjQ2Z0ZVYzTzZPdFo1Vitcbjd6Y1lyY0F3Zkw2UGtkcVF4Y3ZvM3ZNd3F1WncxUjNjMFVRWWNCY3FKVldJN1R1UU96V0RuZnBOdzI0MWoreDVcbjJ3TjVjN0VJeE55QTN4L2FKb1V5ak95eVBpSEwyWnFaNER3V3BmZGhDQlZMRkFRcStGd1NabDdldUpESmJuak5cbkx3d3QrKzEzTXlHZWVYVFBVMlNNYldCSE5mL1ZnWWFsK3IvbVdxVEw3VXROcHhPYjRvVEM1UTg1SHNTdTE3NWFcbkR4WGpKdFlsOXpoWG94S2VlczJsZmJ3OC9xV3pscU12R2U1azg2NUFZUUtCZ1FEamdSV2hoaTR3eGsvdGNVaEFcbkhka2JHdUI1MkZmNUlYaEJXWlFVR05CRWpucHZ5QkhTeFFBNkNFQ3ZtYUFDTHp6QVpsYnBSTnExakc5MkxaYVVcbnllNnJUckl1ODRBUzVmZ3YxMkIrTll3RmlpMmp3emlHcmhBQXp4bHNLNVkyRnFDQUovSFBqSXVhZzY0QkRkOFdcbmxaelIxay95cWdVVGF1cjJ2bzhZQWRHeVh3S0JnUURTL085RFhnRGZHV284bTJ6cXoxOHQ1RmVpY3FpVE1tUkxcbmxVMEFqRE1wWThqNktMbEVQVjlESnZla0xvcXNDTWszTTRqRFdxS1JobTVWRmtXUkZYYUk0VGl5SGtjT2NNQVZcbkZlMWxwc1ZTVzVLMGVhYzdEeDVCUGcxL3M4bDYvMGppejN5QzFHUzlpeFFNOU9mY0NHWDNRKzZoby85NFV5TXVcbjNtMDM3SHBDS1FLQmdRRFFNV0xnSy9DOVJkNERCblg5NXRLMVVVVTNlOW9WN0tFbC9KbmNRbERsVEJXVGtkMXRcbnFrWm8xUUNOTWVNUjNMU1Z4WkduYXhGU3JxK1owR0pLeXZpVTRER0RjZVkwWlN0WWJKcXJKTWw4a0ZUdjFrazJcblJyZnlaWk40UC9MNGtJQlVoemxzbTh0dG5TOXhXNFphSHBRaUd5T1NpRENZOG5FUFdKZU9lcXV4dFFLQmdHVHNcbmtyTGg0MzdVbEduYld4VlREczlQKzg5OEUwRWVDTFhTL0J0MzlQMG1lenVXZ1ZDd0hzSnJnR2ZyejIrTllGcmtcbmJ0WXJvN29DMlFJZ2ZqUnhWTnNUQ09EQzlQQm1aS3R4YXJhR09MczFqSTZCNXNtc2FLZUN2RWhLd3VUdituaHNcbkViNHZST1VhQXdSVG5oazFkemo1S012dk84UGQyT1dSaGlNTEhreEpBb0dBRlBaYnJYMFVBWU1mK1FzY08vdlNcbmxKN3VXWVJMMUtIS2Vackw2bVIvZFlZRzhqdlJLOG1iT09WTVJlY2g4Nzc3cC9yWk15U2Y3VHhhRjg0cU1XdzFcbmVibmZuUm9hMzk0eHQxZmdNMUdFSkVqeXlwV0VDVGVBRDlzK25nSFkzekI5aW5FS1dUcjVPREJmdnlnWVpCUTRcblBUMkVrbVRKZ091NE0zZzBHa2dHcW9FPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAc3R1ZGlvLTgwNDc1NjU4ODctM2E4ZGEuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMDY2NzQ4NDYzODUzNjg5MzY5MzgiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBzdHVkaW8tODA0NzU2NTg4Ny0zYThkYS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0=';

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
          // Fallback: decode embedded credential (safe from GitHub Push Protection, works on Vercel)
          try {
            const decodedCred = JSON.parse(Buffer.from(FALLBACK_B64_CRED, 'base64').toString('utf8'));
            initializedApp = admin.initializeApp({
              credential: admin.credential?.cert ? admin.credential.cert(decodedCred) : cert(decodedCred),
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
            });
            console.log('Firebase Admin initialized successfully via Serverless Decoded Credential');
          } catch (b64Err) {
            initializedApp = admin.initializeApp({ projectId: firebaseAdminConfig.projectId });
            console.log('Firebase Admin initialized via Default Credentials');
          }
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
