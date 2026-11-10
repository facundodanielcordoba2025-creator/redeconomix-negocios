import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCy_6_lNuQS7hawxPXkibNTCVwfQgvlQOc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-8047565887-3a8da.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-8047565887-3a8da",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "oggie-8529f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "673509915934",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:673509915934:web:5b3120c431e0492768dd0f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y0MGMQGEKP"
};

// Singleton initialization for both client and server use
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const storage = getStorage(app);

