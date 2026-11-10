'use client';
import { getApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// This key is specific to the Firebase project and is safe to be public.
const VAPID_KEY = "BKkto2jH1u1vG_-4T8luQyf7ESeEyfo9opIM6uPNFnTAhOnYJVcL3_IzNRSg1Dy8FUwyeXjP79E6YMpz2jc3ASs";

export const requestAndSaveToken = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // ─── Native Platform (Capacitor) Flow ─────────────────────────────────────
    if (Capacitor.isNativePlatform()) {
      return { success: true, message: 'Plataforma nativa lista.' };
    }

    // ─── Web Browser Flow ─────────────────────────────────────────────────────
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    
    const supported = await isSupported();
    if (!supported) {
      console.log("Firebase Messaging is not supported in this browser.");
      return { success: false, message: 'Las notificaciones no están soportadas en este navegador o modo incógnito.' };
    }

    const app = getApp();
    const messaging = getMessaging(app);
    const firestore = getFirestore(app);

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      let registration = null;
      try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log("Service Worker registered with scope:", registration.scope);
      } catch (swError) {
          console.error("Service Worker registration failed:", swError);
          return { success: false, message: 'Fallo al registrar el Service Worker de notificaciones.' };
      }

      const currentToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration 
      });
      if (currentToken) {
        console.log("FCM Token:", currentToken);
        const userDocRef = doc(firestore, 'users', userId);
        await setDoc(userDocRef, { 
          fcmToken: currentToken,
          fcmTokens: arrayUnion(currentToken)
        }, { merge: true });
        return { success: true, message: '¡Notificaciones activadas con éxito en este dispositivo!' };
      } else {
        console.log("No registration token available. Request permission to generate one.");
        return { success: false, message: 'No se pudo obtener el token. Asegurate de no estar en modo incógnito.' };
      }
    } else {
      console.log("Unable to get permission to notify.");
      return { success: false, message: 'Permiso denegado. Podés activarlas manualmente desde la configuración del navegador.' };
    }
  } catch (err: any) {
    console.error("An error occurred while retrieving token: ", err);
    return { success: false, message: 'Ocurrió un error inesperado al activar las notificaciones.' };
  }
};
