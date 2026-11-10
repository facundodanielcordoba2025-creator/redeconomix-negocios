import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
    try {
        const uid = 'HvnrCjJjK7armD1qs0ISB7yG1nj1';
        
        let snap = await adminDb.collection('retailer_daily_operations').where('retailerId', '==', uid).get();
        let ops = snap.docs.map(doc => doc.data());
        
        let snapShifts = await adminDb.collection('retailer_cash_shifts').where('retailerId', '==', uid).get();
        let shifts = snapShifts.docs.map(doc => doc.data());

        return NextResponse.json({ success: true, ops: ops.length, shifts: shifts.length, opDetails: ops.map(o => ({date: o.date, type: o.type, amount: o.amount})) });
    } catch(e: any) {
        return NextResponse.json({ error: e.message });
    }
}
