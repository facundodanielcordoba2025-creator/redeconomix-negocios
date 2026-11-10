import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const snap = await adminDb.collection('products')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const results = snap.docs.map(d => ({
            id: d.id,
            barcode: d.data().barcode,
            barcodeType: typeof d.data().barcode,
            code: d.data().code,
            codeType: typeof d.data().code,
            name: d.data().name
        }));
            
        return NextResponse.json({ results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
