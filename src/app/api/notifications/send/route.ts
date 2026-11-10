import { NextResponse } from 'next/server';
import { admin, adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUserId, title, message } = body;

    if (!targetUserId || !title || !message) {
      return NextResponse.json({ error: 'Faltan parámetros (targetUserId, title, message)' }, { status: 400 });
    }

    // Obtener el fcmToken del usuario desde Firestore
    const userDoc = await adminDb.collection('users').doc(targetUserId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) {
      // El usuario no tiene activadas las notificaciones o no tiene la app instalada
      return NextResponse.json({ success: false, reason: 'El usuario no tiene token FCM registrado' });
    }

    // Enviar notificación Push vía Firebase Admin SDK
    const payload = {
      notification: {
        title,
        body: message,
      },
      token: fcmToken,
      // Configuraciones opcionales para Android e iOS
      android: {
        notification: {
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().send(payload);
    
    return NextResponse.json({ success: true, messageId: response });

  } catch (error: any) {
    console.error('Error enviando notificación Push FCM:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}
