'use server';

import { db } from '@/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { reportSystemError } from '@/lib/telegram-reporter';

// Cache in memory for 5 minutes to avoid excessive Firestore reads
let productsCache: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchMasterProductsServer(searchQuery: string) {
  try {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return { success: true, products: [] };
    }

    const safeSearch = searchQuery.trim().toLowerCase();

    // REAL-TIME BYPASS FOR BARCODES (WITH PREFIX MATCHING FOR VARIANTS):
    if (/^\d{6,20}$/.test(safeSearch)) {
        const noZeros = safeSearch.replace(/^0+/, '');
        const withZero = '0' + noZeros;
        const asNumber = Number(noZeros);
        
        // Remove duplicates in case safeSearch is already noZeros, etc.
        const variants = Array.from(new Set([safeSearch, noZeros, withZero, asNumber]));

        try {
            const [snap1, snap2, snapExact1, snapExact2] = await Promise.all([
                getDocs(query(collection(db, 'products'), where('barcode', '>=', safeSearch), where('barcode', '<=', safeSearch + '\uf8ff'), limit(10))),
                getDocs(query(collection(db, 'products'), where('code', '>=', safeSearch), where('code', '<=', safeSearch + '\uf8ff'), limit(10))),
                getDocs(query(collection(db, 'products'), where('barcode', 'in', variants), limit(10))),
                getDocs(query(collection(db, 'products'), where('code', 'in', variants), limit(10)))
            ]);

            const allDocs = [...snap1.docs, ...snap2.docs, ...snapExact1.docs, ...snapExact2.docs];
            
            if (allDocs.length > 0) {
                const uniqueMap = new Map();
                allDocs.forEach(doc => uniqueMap.set(doc.id, { id: doc.id, ...doc.data() }));
                return { 
                    success: true, 
                    products: Array.from(uniqueMap.values()) 
                };
            }
        } catch (e) {
            console.error("Error in realtime barcode lookup:", e);
            // Fallback to cache if realtime query fails
        }
    }

    const now = Date.now();
    
    // Refresh cache if empty or expired
    if (!productsCache || now - lastFetchTime > CACHE_TTL) {
      const snapshot = await getDocs(collection(db, 'products'));
      productsCache = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      lastFetchTime = now;
      console.log(`[Product Search Cache] Refreshed with ${productsCache.length} products.`);
    }
    
    // Filter in memory (extremely fast)
    const filtered = productsCache.filter(p => {
      const n = String(p.name || '').toLowerCase();
      const c = String(p.code || '').toLowerCase();
      const b = String(p.barcode || '').toLowerCase();
      return n.includes(safeSearch) || c.includes(safeSearch) || b.includes(safeSearch);
    });

    // Return only top 20 to keep payload small
    const results = filtered.slice(0, 20);

    return { 
      success: true, 
      products: results 
    };

  } catch (error) {
    console.error("Error searching master products:", error);
    await reportSystemError("searchMasterProductsServer", error, { searchQuery });
    return { success: false, error: "Error searching products" };
  }
}

// Direct, real-time lookup for POS scanner (costs 1 read, no cache)
export async function findMasterProductByCode(code: string) {
  try {
    const cleanCode = code.trim();
    if (!cleanCode) return { success: false };

    const q1 = query(collection(db, 'products'), where('barcode', '==', cleanCode), limit(1));
    const snapshot1 = await getDocs(q1);
    if (!snapshot1.empty) {
        return { success: true, product: { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } };
    }
    
    const q2 = query(collection(db, 'products'), where('code', '==', cleanCode), limit(1));
    const snapshot2 = await getDocs(q2);
    if (!snapshot2.empty) {
        return { success: true, product: { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error finding master product by code:", error);
    await reportSystemError("findMasterProductByCode", error, { code });
    return { success: false };
  }
}
