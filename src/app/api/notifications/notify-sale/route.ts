import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/firebase-admin';
import { sendNativePush } from '@/lib/push-backend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      retailerId,
      cashierName,
      amount,
      paymentMethod,
      itemsSummary,
      branchName
    } = body;

    if (!retailerId) {
      return NextResponse.json({ error: 'Falta retailerId' }, { status: 400 });
    }

    const admin = initializeAdmin();
    const firestore = admin.firestore();

    const formattedAmount = `$${Math.round(amount || 0).toLocaleString('es-AR')}`;
    const methodLabel = paymentMethod === 'cash' ? 'Efectivo' :
                        paymentMethod === 'transfer' ? 'Transferencia' :
                        paymentMethod === 'credit_line' ? 'Fiado / Cta Corriente' :
                        paymentMethod === 'card' ? 'Tarjeta' : (paymentMethod || 'Efectivo');

    const name = cashierName || 'Cajero';
    const title = `💰 ¡Venta en Caja: ${formattedAmount}!`;
    
    let description = `${name} cobró ${formattedAmount} (${methodLabel})`;
    if (itemsSummary) {
      description += ` • ${itemsSummary}`;
    }
    if (branchName && branchName !== 'central' && branchName !== 'default') {
      description += ` [Sucursal: ${branchName}]`;
    }

    // 1. Guardar en la colección 'notifications' de Firestore para la campanita del dueño
    await firestore.collection('notifications').add({
      userId: retailerId,
      title,
      message: description,
      type: 'sale',
      href: '/redeconomix/dashboard-negocio/resumen',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Enviar PUSH NATIVO al celular del dueño (a través de FCM)
    await sendNativePush(
      retailerId,
      title,
      description,
      '/redeconomix/dashboard-negocio/resumen'
    );

    console.log(`[PUSH SALE] Notificación enviada al dueño ${retailerId}: ${title}`);
    return NextResponse.json({ success: true, message: 'Notificación enviada con éxito' });
  } catch (error: any) {
    console.error('Error enviando notificación de venta al dueño:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
