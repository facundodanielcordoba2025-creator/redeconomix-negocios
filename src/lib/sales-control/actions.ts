import { collection, doc, writeBatch, getDocs, query, where, addDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { HybridSale, SaleProduct } from './types';
import { Firestore } from 'firebase/firestore';

export const registerQuickSale = async (firestore: Firestore, userId: string, amount: number) => {
  const sale: Partial<HybridSale> = {
    total: amount,
    products: [],
    status: 'pending',
    date: new Date().toISOString(),
    retailerId: userId,
  };
  return await addDoc(collection(firestore, 'retailer_hybrid_sales'), sale);
};

export const assignProductsToSale = async (
  firestore: Firestore, 
  saleId: string, 
  products: SaleProduct[]
) => {
  const batch = writeBatch(firestore);
  const saleRef = doc(firestore, 'retailer_hybrid_sales', saleId);

  // Update Sale
  batch.update(saleRef, {
    products,
    status: 'completed',
  });

  // Update Inventory
  for (const product of products) {
    const stockRef = doc(firestore, 'retailer_inventory', product.productId);
    // Note: increment is not available in server SDKs sometimes, but in client it is
    // @ts-ignore
    batch.update(stockRef, { stock: increment(-product.quantity) });
  }

  return await batch.commit();
};

export const fetchDailySales = async (firestore: Firestore, userId: string, dateStr: string) => {
  const startDate = new Date(dateStr);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(dateStr);
  endDate.setHours(23, 59, 59, 999);

  const q = query(
    collection(firestore, 'retailer_hybrid_sales'),
    where('retailerId', '==', userId),
    where('date', '>=', startDate.toISOString()),
    where('date', '<=', endDate.toISOString()),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HybridSale));
};
