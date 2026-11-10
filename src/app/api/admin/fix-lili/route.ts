import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        // 1. Encontrar a Doña Lili
        const usersRef = adminDb.collection('users');
        const snap = await usersRef.get();
        let donaLiliId: string | null = null;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.businessName?.toLowerCase().includes('lili')) {
                donaLiliId = docSnap.id;
            }
        });

        if (!donaLiliId) {
            return NextResponse.json({ success: false, message: 'Doña Lili no encontrada' });
        }

        const batch = adminDb.batch();
        let count = 0;
        let logs: string[] = [];

        // 2. Buscar sus productos huerfanos en retailer_inventory
        const invRef = adminDb.collection('retailer_inventory');
        const invSnap = await invRef.get();
        
        invSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.businessName?.toLowerCase().includes('lili') || data.wholesaler?.includes('Lili')) {
                if (!data.retailerId || data.retailerId === 'unknown') {
                    batch.update(docSnap.ref, { retailerId: donaLiliId });
                    count++;
                    logs.push(`Retailer Inventory Fix: ${data.name}`);
                }
            }
        });

        // 3. Buscar sus productos huerfanos en wholesale_products
        const wholeRef = adminDb.collection('wholesale_products');
        const wholeSnap = await wholeRef.get();
        wholeSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.businessName?.toLowerCase().includes('lili') || data.wholesaler?.includes('Lili')) {
                if (!data.wholesalerId || data.wholesalerId === 'unknown') {
                    batch.update(docSnap.ref, { wholesalerId: donaLiliId });
                    count++;
                    logs.push(`Wholesale Inventory Fix: ${data.name}`);
                }
            }
        });

        if (count > 0) {
            await batch.commit();
        }

        return NextResponse.json({ success: true, count, donaLiliId, logs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
