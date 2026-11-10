import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        console.log('1. Descargando Catálogo Maestro (Products)...');
        const masterSnap = await adminDb.collection('products').get();
        const masterDict = new Map();
        
        masterSnap.docs.forEach(d => {
            const data = d.data();
            const code = data.code?.toString().trim();
            const imageUrl = data.imageUrl?.trim();
            if (code && imageUrl && !imageUrl.includes('placeholder')) {
                masterDict.set(code, imageUrl);
            }
        });

        console.log(`-> Se encontraron ${masterDict.size} productos maestros con foto.`);

        console.log('2. Comparando con el Marketplace (wholesale_products)...');
        const wholesaleSnap = await adminDb.collection('wholesale_products').get();
        
        let outOfSyncCount = 0;
        let batchCount = 0;
        let totalBatches = 0;
        let currentBatch = adminDb.batch();

        for (const docSnap of wholesaleSnap.docs) {
            const data = docSnap.data();
            const code = data.code?.toString().trim();
            const currentWholesaleImage = data.imageUrl?.trim() || '';

            if (code && masterDict.has(code)) {
                const masterImage = masterDict.get(code);
                
                // Si la imagen en wholesale es diferente a la del maestro
                if (currentWholesaleImage !== masterImage) {
                    console.log(`[DESINCRONIZADO] ${data.name} (Código: ${code}) -> Actualizando imagen...`);
                    currentBatch.update(docSnap.ref, { imageUrl: masterImage });
                    outOfSyncCount++;
                    batchCount++;

                    if (batchCount === 400) {
                        await currentBatch.commit();
                        currentBatch = adminDb.batch();
                        batchCount = 0;
                        totalBatches++;
                    }
                }
            }
        }

        if (batchCount > 0) {
            await currentBatch.commit();
            totalBatches++;
        }

        const summary = `Se arreglaron ${outOfSyncCount} productos desincronizados en ${totalBatches} lotes.`;
        console.log(summary);

        return NextResponse.json({ success: true, message: summary });
    } catch (error: any) {
        console.error('Error fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
