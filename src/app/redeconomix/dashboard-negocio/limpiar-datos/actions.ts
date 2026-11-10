'use server';

import { adminDb } from '@/lib/firebase-admin';

export async function wipeRetailerData(retailerId: string) {
  if (!retailerId) {
    throw new Error('No retailerId provided');
  }

  const collectionsToWipe = [
    'retailer_inventory',
    'retailer_daily_operations',
    'retailer_daily_summaries',
    'retailer_fiados',
    'retailer_payments',
    'retailer_customers'
  ];

  let totalDeleted = 0;
  const log: string[] = [];

  for (const collectionName of collectionsToWipe) {
    try {
      const snapshot = await adminDb
        .collection(collectionName)
        .where('retailerId', '==', retailerId)
        .get();

      if (snapshot.empty) {
        log.push(`✔️ 0 documentos en ${collectionName}.`);
        continue;
      }

      log.push(`Eliminando ${snapshot.size} de ${collectionName}...`);

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      totalDeleted += snapshot.size;
      log.push(`✔️ ${snapshot.size} eliminados de ${collectionName}.`);
    } catch (e: any) {
      log.push(`❌ Error en ${collectionName}: ${e.message}`);
    }
  }

  log.push(`====================================`);
  log.push(`✨ PROCESO COMPLETADO ÉXITOSAMENTE ✨`);
  log.push(`Se eliminaron un total de ${totalDeleted} registros.`);

  return { success: true, log, totalDeleted };
}
