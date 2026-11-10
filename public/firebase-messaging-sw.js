try {
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
} catch (e) {
  console.error('[firebase-messaging-sw.js] Error loading firebase scripts:', e);
}

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp({
      apiKey: "AIzaSyCy_6_lNuQS7hawxPXkibNTCVwfQgvlQOc",
      authDomain: "studio-8047565887-3a8da.firebaseapp.com",
      projectId: "studio-8047565887-3a8da",
      storageBucket: "oggie-8529f.firebasestorage.app",
      messagingSenderId: "673509915934",
      appId: "1:673509915934:web:5b3120c431e0492768dd0f",
    });

    const messaging = firebase.messaging();

    // Background Message Handler
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Alerta Recibida en Segundo Plano:', payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || 'RedEconomiX';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: payload.data?.orderId || 'general-notification',
        data: {
            url: payload.data?.href || '/'
        },
        actions: [
            { action: 'open', title: 'Ver Ahora' }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (error) {
  console.error("Firebase SW Init Error:", error);
}

// Click Handler: Lleva al usuario a la pantalla correcta
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
