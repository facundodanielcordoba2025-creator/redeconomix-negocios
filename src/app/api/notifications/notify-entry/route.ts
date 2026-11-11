import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendNativePush } from '@/lib/push-backend';

// Memoria de cooldown para no saturar al dueño si entra un grupo de personas juntas
const lastPushByRetailer = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      retailerId,
      branchName,
      cameraIp,
      source = 'camera_sensor'
    } = body;

    if (!retailerId) {
      return NextResponse.json({ error: 'Falta retailerId' }, { status: 400 });
    }

    const firestore = getAdminFirestore();
    const now = Date.now();
    const nowIso = new Date().toISOString();
    const timeFormatted = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(new Date());

    const title = 'RedEconomiX Negocio • Cliente en Local';
    let description = `Nuevo cliente ingresó al local [${timeFormatted} hs]`;
    if (branchName && branchName !== 'central' && branchName !== 'default') {
      description += ` en Sucursal ${branchName}`;
    }

    // 1. Guardar en registro de tráfico / visitas en Firestore (siempre)
    const trafficRef = firestore.collection('retailer_traffic_events').doc();
    await trafficRef.set({
      id: trafficRef.id,
      retailerId,
      branchName: branchName || 'central',
      cameraIp: cameraIp || '192.168.43.26',
      source,
      timestamp: FieldValue.serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      time: timeFormatted
    });

    // 2. Incrementar contador diario de afluencia
    try {
      const today = new Date().toISOString().split('T')[0];
      const summaryRef = firestore.collection('retailer_daily_summaries').doc(`${retailerId}_${today}`);
      await summaryRef.set({
        retailerId,
        date: today,
        customerVisits: FieldValue.increment(1),
        lastVisitAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (sumErr) {
      console.warn('[NOTIFY-ENTRY] Error actualizando resumen diario:', sumErr);
    }

    // 3. Filtro de Cooldown para Notificación PUSH al dueño (25 segundos)
    const lastSent = lastPushByRetailer.get(retailerId) || 0;
    const isCooldownActive = (now - lastSent) < 25000;

    if (!isCooldownActive) {
      lastPushByRetailer.set(retailerId, now);

      // Guardar en la campanita de notificaciones
      await firestore.collection('notifications').add({
        userId: retailerId,
        title,
        message: description,
        type: 'customer_entry',
        href: '/redeconomix/dashboard-negocio/control-ventas',
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });

      // Enviar PUSH NATIVO al celular del dueño
      await sendNativePush(
        retailerId,
        title,
        description,
        '/redeconomix/dashboard-negocio/control-ventas'
      );

      console.log(`[PUSH ENTRY] Notificación enviada al dueño ${retailerId}: ${description}`);
      return NextResponse.json({
        success: true,
        pushed: true,
        message: 'Cliente registrado y notificación Push enviada al dueño.',
        time: timeFormatted
      });
    }

    console.log(`[TRAFFIC ENTRY] Visita registrada (Push omitido por cooldown de 25s): ${retailerId}`);
    return NextResponse.json({
      success: true,
      pushed: false,
      message: 'Cliente registrado en contador (Push en pausa por grupo reciente).',
      time: timeFormatted
    });
  } catch (error: any) {
    console.error('[NOTIFY-ENTRY ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Error registrando ingreso' }, { status: 500 });
  }
}
