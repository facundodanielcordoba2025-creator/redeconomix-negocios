/**
 * RedEconomiX - Sensor de Puerta ONVIF para Cámara Tomate SC-Y3009W (iCSee)
 * Escucha eventos de cruce de puerta y notifica a RedEconomiX Negocio
 */

const CAMERA_IP = process.env.CAMERA_IP || '192.168.43.26';
const CAMERA_PORT = process.env.CAMERA_PORT || '8899';
const RETAILER_ID = process.env.RETAILER_ID || 'HvnrCjJjK7armD1qs0ISB7yG1nj1';
const API_URL = process.env.NOTIFY_API_URL || 'https://redeconomix-negocios-h6p3.vercel.app/api/notifications/notify-entry';
const COOLDOWN_MS = 10000; // 10 segundos entre detecciones de puerta

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
    // Extraer endpoint relativo si viene con otra IP interna
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

  console.log(`\n🔔 [${new Date().toLocaleTimeString('es-AR')}] ¡CLIENTE DETECTADO CRUZANDO LA PUERTA!`);
  console.log(`🚀 Enviando notificación Push a RedEconomiX para el dueño...`);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        retailerId: RETAILER_ID,
        branchName: 'Sucursal Central',
        cameraIp: CAMERA_IP,
        source: 'tomate_sc_y3009w_onvif'
      })
    });
    const data = await res.json();
    console.log(`✅ [RESPUESTA SERVIDOR]:`, data.message || data);
  } catch (err) {
    console.error(`❌ Error notificando al servidor:`, err.message);
  }
}

async function pollEvents() {
  const soapPull = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tev="http://www.onvif.org/ver10/events/wsdl">
  <soap:Body>
    <tev:PullMessages>
      <tev:Timeout>PT2S</tev:Timeout>
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
      console.log('[SENSOR PUERTA] Renovando suscripción con la cámara...');
      await createSubscription();
      return;
    }

    const xml = await res.text();

    // Comprobar si hay evento de movimiento o detección humana activa
    const isMotion = xml.includes('Name="IsMotion" Value="true"') ||
                     xml.includes('Name="State" Value="true"') ||
                     xml.includes('Value="true"');

    if (isMotion) {
      await notifyDoorEntry();
    }
  } catch (err) {
    // Si la cámara se reinicia o desconecta, reintentar
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function start() {
  console.log('====================================================');
  console.log(' RedEconomiX • Monitor de Ingreso de Clientes (ONVIF)');
  console.log(` Cámara: TOMATE SC-Y3009W en ${CAMERA_IP}:${CAMERA_PORT}`);
  console.log(` Dueño: ${RETAILER_ID}`);
  console.log('====================================================');

  await createSubscription();

  while (true) {
    await pollEvents();
    await new Promise(r => setTimeout(r, 800));
  }
}

start();
