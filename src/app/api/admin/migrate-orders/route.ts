import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'rex-migrate-2026';

function normalizeItems(items: any[]): any[] {
  return (items || []).map((i: any) => ({
    productId: i.productId || '',
    name: i.name || '',
    quantity: i.qty ?? i.quantity ?? 1,
    priceAtPurchase: i.price ?? i.priceAtPurchase ?? 0,
    imageUrl: i.imageUrl || null,
    code: i.code || null,
  }));
}

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sourceCol = adminDb.collection('store_cart_orders');
    const targetCol = adminDb.collection('orders_wholesaler');
    const snapshot = await sourceCol.get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, migrated: 0, message: 'No hay pedidos para migrar.' });
    }

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const docs = snapshot.docs;
    const BATCH_SIZE = 400;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);

      for (const docSnap of chunk) {
        try {
          const data = docSnap.data();

          // Saltar si ya fue migrado
          if (data._migrated) { skipped++; continue; }

          const newDoc: Record<string, any> = {
            ...data,
            // En store_cart_orders: customerId=comprador, retailerId=el negocio
            retailerId: data.customerId || data.retailerId || null,
            retailerName: data.customerName || data.retailerName || 'Cliente',
            wholesalerId: data.retailerId || null,
            wholesalerName: data.storeName || null,
            items: normalizeItems(data.items || []),
            orderSource: data.orderSource || 'tienda_fisica',
            _migratedFrom: 'store_cart_orders',
            _originalId: docSnap.id,
            _migratedAt: FieldValue.serverTimestamp(),
          };

          // Mismo ID para no romper referencias
          batch.set(targetCol.doc(docSnap.id), newDoc, { merge: false });
          // Marcar original como migrado (no se elimina por seguridad)
          batch.update(sourceCol.doc(docSnap.id), {
            _migrated: true,
            _migratedAt: FieldValue.serverTimestamp(),
          });
          migrated++;
        } catch (err: any) {
          errors.push(`[${docSnap.id}]: ${err.message}`);
        }
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      total: docs.length,
      migrated,
      skipped,
      errors,
      message: `Migración completada. ${migrated} pedidos migrados, ${skipped} ya migrados, ${errors.length} errores.`,
    });

  } catch (error: any) {
    console.error('Error en migración:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
