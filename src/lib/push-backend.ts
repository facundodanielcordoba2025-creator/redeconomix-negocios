import { getAdminFirestore, getAdminMessaging } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Universal Native Push Notification Sender
 * @param userId The ID of the user to notify
 * @param title The title of the notification
 * @param body The main text of the notification
 * @param url Optional deep link URL to open when clicking the notification
 */
export async function sendNativePush(userId: string, title: string, body: string, url?: string) {
    try {
        const firestore = getAdminFirestore();
        const messaging = getAdminMessaging();

        const userDoc = await firestore.collection('users').doc(userId).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        if (!userData) return;

        // Extract tokens supporting both legacy single string and modern array formats
        const fcmTokens: string[] = Array.isArray(userData.fcmTokens) ? [...userData.fcmTokens] : [];
        if (userData.fcmToken && typeof userData.fcmToken === 'string' && !fcmTokens.includes(userData.fcmToken)) {
            fcmTokens.push(userData.fcmToken);
        }

        if (fcmTokens.length === 0) return; // No devices registered

        // Clean duplicates
        const uniqueTokens = [...new Set(fcmTokens)];

        const deepLink = url 
            ? (url.startsWith('http') ? url : `https://redeconomix-negocios-h6p3.vercel.app${url.startsWith('/') ? url : '/' + url}`)
            : 'https://redeconomix-negocios-h6p3.vercel.app/redeconomix/dashboard-negocio/resumen';

        const payload: any = {
            tokens: uniqueTokens,
            notification: {
                title,
                body
            },
            data: {
                url: deepLink,
                title,
                body
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    title,
                    body,
                    icon: 'https://redeconomix-negocios-h6p3.vercel.app/icon-192x192.png',
                    badge: 'https://redeconomix-negocios-h6p3.vercel.app/favicon.png',
                    tag: 'redeconomix-notification',
                    requireInteraction: true,
                    vibrate: [200, 100, 200]
                },
                fcmOptions: {
                    link: deepLink
                }
            },
            android: {
                priority: 'high',
                notification: {
                    title,
                    body,
                    color: '#C00000',
                    sound: 'default'
                }
            }
        };

        const response = await messaging.sendEachForMulticast(payload);
        
        // Optional: Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && (
                    resp.error?.code === 'messaging/invalid-registration-token' ||
                    resp.error?.code === 'messaging/registration-token-not-registered'
                )) {
                    failedTokens.push(uniqueTokens[idx]);
                }
            });
            
            if (failedTokens.length > 0) {
                await firestore.collection('users').doc(userId).update({
                    fcmTokens: FieldValue.arrayRemove(...failedTokens)
                }).catch(e => console.error("Error removing invalid push tokens", e));
            }
        }
        
        console.log(`Push sent to ${userId}: ${response.successCount} success, ${response.failureCount} failed.`);
    } catch (error) {
        console.error(`Failed to send Push to user ${userId}:`, error);
    }
}
