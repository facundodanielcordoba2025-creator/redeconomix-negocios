'use server';
import * as admin from 'firebase-admin';
import { sendNativePush } from './push-backend';

// Inicializar de forma segura la app de admin
try {
  if (!admin.apps.length) {
    // Esta inicialización vacía funciona en entornos de Firebase (como App Hosting o Cloud Functions)
    // porque las credenciales se proporcionan automáticamente.
    admin.initializeApp();
  }
} catch (e) {
  console.error('Error al inicializar Firebase Admin SDK', e);
}

const firestore = admin.firestore();
const messaging = admin.messaging();

export type NotificationType = 'order_update' | 'promotion' | 'low_stock' | 'announcement' | 'chat';

export async function createNotification(userId: string, title: string, message: string, type: NotificationType, href?: string) {
    if (!admin.apps.length) {
        console.error("Admin SDK no inicializado. No se puede crear la notificación.");
        return;
    }

    const notificationsCol = firestore.collection('notifications');
    const userDocRef = firestore.doc(`users/${userId}`);

    try {
        const userDoc = await userDocRef.get();
        const fcmToken = userDoc.exists ? userDoc.data()?.fcmToken : null;
        
        // 1. Guardar la notificación en la base de datos para el historial del usuario
        await notificationsCol.add({
            userId,
            title,
            message,
            type,
            href: href || null,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Enviar notificación push universal (maneja múltiples dispositivos, deduplicación y limpieza)
        await sendNativePush(userId, title, message, href || '/');
    } catch (error) {
        console.error("Error en createNotification:", error);
    }
}
