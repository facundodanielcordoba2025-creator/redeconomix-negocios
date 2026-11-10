import { NextResponse } from 'next/server';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const ordersCol = collection(db, 'orders');
    const ordersSnap = await getDocs(ordersCol);
    let ordersTotal = 0;
    let ordersCount = 0;
    
    ordersSnap.forEach(doc => {
      const data = doc.data();
      ordersCount++;
      if (data && data.totalAmount) {
        ordersTotal += Number(data.totalAmount);
      }
    });

    const wholesalerCol = collection(db, 'orders_wholesaler');
    const wholesalerSnap = await getDocs(wholesalerCol);
    let wholesalerTotal = 0;
    let wholesalerCount = 0;
    
    wholesalerSnap.forEach(doc => {
      const data = doc.data();
      wholesalerCount++;
      if (data && data.totalAmount) {
        wholesalerTotal += Number(data.totalAmount);
      }
    });

    return NextResponse.json({
      orders: {
        count: ordersCount,
        totalAmount: ordersTotal
      },
      orders_wholesaler: {
        count: wholesalerCount,
        totalAmount: wholesalerTotal
      },
      combinedTotal: ordersTotal + wholesalerTotal
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}
