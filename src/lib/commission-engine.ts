import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  increment,
  runTransaction
} from 'firebase/firestore';

/* ============================================================
   COMMISSION ENGINE ELITE
   ============================================================ */

export async function processOrderCommission(firestore: any, orderId: string) {
  if (!firestore || !orderId) return;

  try {
    await runTransaction(firestore, async (transaction) => {
      // 1. Fetch Order
      const orderRef = doc(firestore, 'orders_wholesaler', orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) return;
      const order = orderSnap.data();

      // Check if commission already processed
      if (order.commissionProcessed) return;
      
      const preventistaCode = order.preventistaId;
      if (!preventistaCode) return;

      // 2. Fetch Employee (by code)
      const empQuery = query(collection(firestore, 'employees'), where('employeeCode', '==', preventistaCode));
      const empSnap = await getDocs(empQuery); // runTransaction doesn't support getDocs easily, but we can't avoid it if searching by code
      // Note: In high-scale, preventistaId should be the actual doc ID, not the code.
      if (empSnap.empty) return;
      
      const employee = empSnap.docs[0].data();
      const employeeId = empSnap.docs[0].id;
      const wholesalerId = order.wholesalerId;

      // 3. CALCULATION LOGIC
      let commissionAmount = 0;
      const orderTotal = order.totalAmount || 0;

      // Rule A: Standard % (0.5%)
      commissionAmount += orderTotal * 0.005;

      // Rule B: Shipping Type (Bonus)
      // If shipping is delivery, add extra 1% (Standard service delivery)
      if (order.shippingMethod === 'delivery') {
        commissionAmount += orderTotal * 0.01;
      }

      // Rule C: Activation Bonus ($5,000)
      // Check if this is the customer's first completed order
      const pastOrdersQuery = query(
        collection(firestore, 'orders_wholesaler'), 
        where('retailerId', '==', order.retailerId),
        where('status', 'in', ['delivered', 'reception_confirmed'])
      );
      const pastOrdersSnap = await getDocs(pastOrdersQuery);
      
      // If count is 1 (this one) and total >= 50,000
      if (pastOrdersSnap.size <= 1 && orderTotal >= 50000) {
        commissionAmount += 5000;
      }

      // 4. Update Wallet (Pending Balance)
      const walletRef = doc(firestore, 'employee_wallets', employeeId);
      transaction.set(walletRef, {
        balancePending: increment(commissionAmount),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // 5. Log Commission Record
      const commRef = doc(collection(firestore, 'preventistas_comisiones'));
      transaction.set(commRef, {
        employeeId,
        wholesalerId,
        orderId,
        retailerId: order.retailerId,
        amount: commissionAmount,
        type: 'standard_plus_extras',
        status: 'pending', // Pending for 7 days validation typically
        createdAt: serverTimestamp(),
        availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days later
      });

      // 6. Mark Order as Processed
      transaction.update(orderRef, { commissionProcessed: true });
    });

    console.log(`Commission processed for order ${orderId}`);
  } catch (error) {
    console.error("Error processing commission:", error);
  }
}
