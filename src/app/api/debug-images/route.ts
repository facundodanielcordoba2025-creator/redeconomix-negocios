import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snap = await adminDb.collection('wholesale_products').limit(50).get();
    const products = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name, imageUrl: doc.data().imageUrl, imageIds: doc.data().imageIds }));
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
