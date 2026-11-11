/**
 * RedEconomiX - Sensor de Puerta ONVIF Directo para Cámara Tomate SC-Y3009W (iCSee)
 * Envía la notificación PUSH de forma DIRECTA a Firebase (Google) sin demoras ni intermediarios
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('/Users/facundocordoba/studio/node_modules/firebase-admin');

const CAMERA_IP = process.env.CAMERA_IP || '192.168.43.26';
const CAMERA_PORT = process.env.CAMERA_PORT || '8899';
const RETAILER_ID = process.env.RETAILER_ID || 'HvnrCjJjK7armD1qs0ISB7yG1nj1';
const COOLDOWN_MS = 15000; // 15 segundos entre avisos para no saturar si entra un grupo

const FALLBACK_B64_CRED = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InN0dWRpby04MDQ3NTY1ODg3LTNhOGRhIiwicHJpdmF0ZV9rZXlfaWQiOiIwZWJkMjFhNTA0YjIwMjUxNjkwZWY0YTZiZjkxMGRiNzk4YjliNmZhIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzdnS3R4TEphYk8wV0lcbmN4VnVuQ3o0dENHdjltZko3cFBJdzNzOVVKeFMvOGNDU25sbS9xZTJoUWlzUXVCM0hXMFV0aWxtb1Q5ZTNnVEFcbnFOMyt2VHMzRFJlM1ZZdTR4N1hkeW5LR3VBMHE4TXMySE80TjhaL1k1aEdXeEdpQngxTitsSlhIaWdPbWZvVGtcbmJRVHJoVzFuTmpsZDhVQWhzRGZJNWNxOVZJWlg3MEJqbk1sd2ZuL2lSaHhZYUlBZUxENXQ4eDZnQ0VTTkUxMElcbjhlNEhqL3lwQUZvbWh2cElibGl3VVFGbFpLUXpUa0R5Y1JRS2RDbHFOSXdHcDJURFVjdlJsaWJDR2ZoMHZkT2NcbkdVcUY3aDM2b2VPSDNrb0REQ25RV1QzN1N6ZVNKRGd3WnJWRG5wNUYrSkVjQkk3V0doelpZNlF3YUNsZXltWHBcbkR4ZnYyQTgzQWdNQkFBRUNnZ0VBQVlRdTNzRnZqbDNTV0NJbUlEamZIRHZJc2ZXYUxVWGlxQkw4b2loT3UxVWFcbk5PaUpSczMwYVVOMktINTU5anlrcnpBeDhZU0lVS29XKzcvaDI3ZUlEUS9zQ3kyRDdjQ2Z0ZVYzTzZPdFo1Vitcbjd6Y1lyY0F3Zkw2UGtkcVF4Y3ZvM3ZNd3F1WncxUjNjMFVRWWNCY3FKVldJN1R1UU96V0RuZnBOdzI0MWoreDVcbjJ3TjVjN0VJeE55QTN4L2FKb1V5ak95eVBpSEwyWnFaNER3V3BmZGhDQlZMRkFRcStGd1NabDdldUpESmJuak5cbkx3d3QrKzEzTXlHZWVYVFBVMlNNYldCSE5mL1ZnWWFsK3IvbVdxVEw3VXROcHhPYjRvVEM1UTg1SHNTdTE3NWFcbkR4WGpKdFlsOXpoWG94S2VlczJsZmJ3OC9xV3pscU12R2U1azg2NUFZUUtCZ1FEamdSV2hoaTR3eGsvdGNVaEFcbkhka2JHdUI1MkZmNUlYaEJXWlFVR05CRWpucHZ5QkhTeFFBNkNFQ3ZtYUFDTHp6QVpsYnBSTnExakc5MkxaYVVcbnllNnJUckl1ODRBUzVmZ3YxMkIrTll3RmlpMmp3emlHcmhBQXp4bHNLNVkyRnFDQUovSFBqSXVhZzY0QkRkOFdcbmxaelIxay95cWdVVGF1cjJ2bzhZQWRHeVh3S0JnUURTL085RFhnRGZHV284bTJ6cXoxOHQ1RmVpY3FpVE1tUkxcbmxVMEFqRE1wWThqNktMbEVQVjlESnZla0xvcXNDTWszTTRqRFdxS1JobTVWRmtXUkZYYUk0VGl5SGtjT2NNQVZcbkZlMWxwc1ZTVzVLMGVhYzdEeDVCUGcxL3M4bDYvMGppejN5QzFHUzlpeFFNOU9mY0NHWDNRKzZoby85NFV5TXVcbjNtMDM3SHBDS1FLQmdRRFFNV0xnSy9DOVJkNERCblg5NXRLMVVVVTNlOW9WN0tFbC9KbmNRbERsVEJXVGtkMXRcbnFrWm8xUUNOTWVNUjNMU1Z4WkduYXhGU3JxK1owR0pLeXZpVTRER0RjZVkwWlN0WWJKcXJKTWw4a0ZUdjFrazJcblJyZnlaWk40UC9MNGtJQlVoemxzbTh0dG5TOXhXNFphSHBRaUd5T1NpRENZOG5FUFdKZU9lcXV4dFFLQmdHVHNcbmtyTGg0MzdVbEduYld4VlREczlQKzg5OEUwRWVDTFhTL0J0MzlQMG1lenVXZ1ZDd0hzSnJnR2ZyejIrTllGcmtcbmJ0WXJvN29DMlFJZ2ZqUnhWTnNUQ09EQzlQQm1aS3R4YXJhR09MczFqSTZCNXNtc2FLZUN2RWhLd3VUdituaHNcbkViNHZST1VhQXdSVG5oazFkemo1S012dk84UGQyT1dSaGlNTEhreEpBb0dBRlBaYnJYMFVBWU1mK1FzY08vdlNcbmxKN3VXWVJMMUtIS2Vackw2bVIvZFlZRzhqdlJLOG1iT09WTVJlY2g4Nzc3cC9yWk15U2Y3VHhhRjg0cU1XdzFcbmVibmZuUm9hMzk0eHQxZmdNMUdFSkVqeXlwV0VDVGVBRDlzK25nSFkzekI5aW5FS1dUcjVPREJmdnlnWVpCUTRcblBUMkVrbVRKZ091NE0zZzBHa2dHcW9FPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAc3R1ZGlvLTgwNDc1NjU4ODctM2E4ZGEuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMDY2NzQ4NDYzODUzNjg5MzY5MzgiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBzdHVkaW8tODA0NzU2NTg4Ny0zYThkYS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0=';
const cred = JSON.parse(Buffer.from(FALLBACK_B64_CRED, 'base64').toString('utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(cred)
  });
}

const db = admin.firestore();
const messaging = admin.messaging();

let lastDetection = 0;
let subscriptionUrl = `http://${CAMERA_IP}:${CAMERA_PORT}/event_service/0`;

async function createSubscription() {
  const soapCreate = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tev="http://www.onvif.org/ver10/events/wsdl">
  <soap:Body>
    <tev:CreatePullPointSubscription/>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = await fetch(`http://${CAMERA_IP}:${CAMERA_PORT}/onvif/event_service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
      body: soapCreate
    });
    const text = await res.text();
    const match = text.match(/<wsa:Address>[^<]*(\/event_service\/[^<]+)<\/wsa:Address>/);
    if (match && match[1]) {
      subscriptionUrl = `http://${CAMERA_IP}:${CAMERA_PORT}${match[1]}`;
    }
    console.log(`[SENSOR PUERTA] Conectado a la cámara ${CAMERA_IP}:${CAMERA_PORT}. Endpoint: ${subscriptionUrl}`);
    return true;
  } catch (err) {
    console.error('[SENSOR PUERTA] Error conectando a la cámara:', err.message);
    return false;
  }
}

async function notifyDoorEntry() {
  const now = Date.now();
  if (now - lastDetection < COOLDOWN_MS) {
    return;
  }
  lastDetection = now;

  const timeFormatted = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(new Date());

  const today = new Date().toISOString().split('T')[0];

  console.log(`\n🔔 [${timeFormatted}] ¡CLIENTE DETECTADO CRUZANDO LA PUERTA!`);
  console.log(`🚀 Enviando PUSH instantáneo a los dispositivos del dueño...`);

  try {
    // 1. Guardar evento en Firestore (en tiempo real para la caja y estadísticas)
    const trafficRef = db.collection('retailer_traffic_events').doc();
    trafficRef.set({
      id: trafficRef.id,
      retailerId: RETAILER_ID,
      branchName: 'Sucursal Central',
      cameraIp: CAMERA_IP,
      source: 'tomate_sc_y3009w_onvif',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: today,
      time: timeFormatted
    }).catch(e => console.warn('Error guardando tráfico:', e.message));

    // 2. Incrementar contador diario
    const summaryRef = db.collection('retailer_daily_summaries').doc(`${RETAILER_ID}_${today}`);
    summaryRef.set({
      retailerId: RETAILER_ID,
      date: today,
      customerVisits: admin.firestore.FieldValue.increment(1),
      lastVisitAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});

    // 3. Obtener tokens del dueño y enviar PUSH directo vía FCM
    const userDoc = await db.collection('users').doc(RETAILER_ID).get();
    const userData = userDoc.data();
    const fcmTokens = Array.isArray(userData?.fcmTokens) ? userData.fcmTokens : [];
    if (userData?.fcmToken && !fcmTokens.includes(userData.fcmToken)) {
      fcmTokens.push(userData.fcmToken);
    }

    if (fcmTokens.length > 0) {
      const payload = {
        tokens: [...new Set(fcmTokens)],
        notification: {
          title: 'RedEconomiX Negocio • Cliente en Local',
          body: `Nuevo cliente ingresó al local [${timeFormatted} hs]`
        },
        data: {
          url: 'https://redeconomix-negocios-h6p3.vercel.app/redeconomix/dashboard-negocio/control-ventas',
          title: 'RedEconomiX Negocio • Cliente en Local',
          body: `Nuevo cliente ingresó al local [${timeFormatted} hs]`
        },
        webpush: {
          headers: { Urgency: 'high' },
          notification: {
            title: 'RedEconomiX Negocio • Cliente en Local',
            body: `Nuevo cliente ingresó al local [${timeFormatted} hs]`,
            icon: 'https://www.redeconomix.com/icon-192x192.png',
            badge: 'https://www.redeconomix.com/favicon.png',
            tag: 'door-entry',
            requireInteraction: true
          },
          fcmOptions: {
            link: 'https://redeconomix-negocios-h6p3.vercel.app/redeconomix/dashboard-negocio/control-ventas'
          }
        },
        android: {
          priority: 'high',
          notification: {
            title: 'RedEconomiX Negocio • Cliente en Local',
            body: `Nuevo cliente ingresó al local [${timeFormatted} hs]`,
            color: '#C00000',
            sound: 'default'
          }
        }
      };

      const resp = await messaging.sendEachForMulticast(payload);
      console.log(`✅ Push enviado al teléfono: ${resp.successCount} entregados con éxito.`);
    } else {
      console.log('⚠️ No hay tokens FCM registrados para el dueño.');
    }
  } catch (err) {
    console.error(`❌ Error enviando notificación:`, err.message);
  }
}

async function pollEvents() {
  const soapPull = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tev="http://www.onvif.org/ver10/events/wsdl">
  <soap:Body>
    <tev:PullMessages>
      <tev:Timeout>PT1S</tev:Timeout>
      <tev:MessageLimit>5</tev:MessageLimit>
    </tev:PullMessages>
  </soap:Body>
</soap:Envelope>`;

  try {
    const res = await fetch(subscriptionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
      body: soapPull
    });

    if (res.status === 404 || res.status === 500) {
      await createSubscription();
      return;
    }

    const xml = await res.text();

    const isMotion = xml.includes('Name="IsMotion" Value="true"') ||
                     xml.includes('Name="State" Value="true"');

    if (isMotion) {
      await notifyDoorEntry();
    }
  } catch (err) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function start() {
  console.log('====================================================');
  console.log(' RedEconomiX • Monitor de Ingreso Directo a Firebase');
  console.log(` Cámara: TOMATE SC-Y3009W en ${CAMERA_IP}:${CAMERA_PORT}`);
  console.log(` Dueño: ${RETAILER_ID}`);
  console.log('====================================================');

  await createSubscription();

  while (true) {
    await pollEvents();
    await new Promise(r => setTimeout(r, 400));
  }
}

start();
