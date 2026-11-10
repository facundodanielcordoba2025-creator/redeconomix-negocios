import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const snap = await adminDb.collection('orders_wholesaler').orderBy('createdAt', 'desc').limit(5).get();
        const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ success: true, count: orders.length, orders });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
