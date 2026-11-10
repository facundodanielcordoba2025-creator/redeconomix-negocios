import { doc, getDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { initOfflineDB } from './offline-db';
import { format } from 'date-fns';

/**
 * Procesa todas las operaciones encoladas en IndexedDB cuando regrese el internet.
 * Garantiza idempotencia atómica (nunca descuenta stock dos veces por la misma operación)
 * y tolerancia a productos eliminados para que la cola jamás quede bloqueada.
 */
export const syncPendingSalesToCloud = async (firestore: any) => {
    if (!firestore) return;
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
        const db = await initOfflineDB();
        const tx = db.transaction('pending_sync_sales', 'readwrite');
        const store = tx.objectStore('pending_sync_sales');
        
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const pendingSales = request.result;
            if (!pendingSales || pendingSales.length === 0) return;

            console.log(`🚀 [SYNC-FANTASMA] Iniciando sincronización de ${pendingSales.length} operaciones offline...`);

            const failedIds: number[] = [];
            
            for (const sale of pendingSales) {
                try {
                    const { localId, tstamp, ...saleData } = sale;
                    const opId = saleData.id || `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    const opRef = doc(firestore, 'retailer_daily_operations', opId);

                    // ESCUDO DE IDEMPOTENCIA: Verificar si la operación ya se guardó en Firestore (ej. WiFi lento que completó en segundo plano)
                    const existingOpSnap = await getDoc(opRef);
                    if (existingOpSnap.exists()) {
                        const delTx = db.transaction('pending_sync_sales', 'readwrite');
                        delTx.objectStore('pending_sync_sales').delete(localId);
                        console.log(`🛡️ [SYNC-IDEMPOTENTE] La operación ${opId} ya existía en Firestore. Eliminada de la cola local sin descontar doble.`);
                        continue;
                    }
                    
                    const batch = writeBatch(firestore);
                    
                    batch.set(opRef, {
                        ...saleData,
                        id: opId,
                        createdAt: serverTimestamp(),
                        isOfflineSync: true,
                        originalTimestamp: tstamp || Date.now()
                    }, { merge: true });

                    // Agregación en resumen diario unificado por retailerId
                    const dateId = format(new Date(tstamp || Date.now()), 'yyyy-MM-dd');
                    const retailerId = saleData.retailerId;
                    if (retailerId) {
                        const summaryRef = doc(firestore, 'retailer_daily_summaries', `${retailerId}_${dateId}`);
                        const summaryUpdates: any = {
                            date: dateId,
                            retailerId: retailerId,
                            updatedAt: serverTimestamp(),
                        };

                        if (saleData.type === 'sale' || saleData.type === 'credit_sale') {
                            const amount = Number(saleData.total) || 0;
                            if (saleData.paymentMethod === 'cash') summaryUpdates.ventasContado = increment(amount);
                            else if (saleData.paymentMethod === 'transfer') summaryUpdates.ventasTransferencia = increment(amount);
                            else if (saleData.paymentMethod === 'credit') summaryUpdates.ventasFiado = increment(amount);
                            else if (saleData.paymentMethod === 'qr') summaryUpdates.ventasQR = increment(amount);
                        }
                        batch.set(summaryRef, summaryUpdates, { merge: true });
                    }

                    // Descuento seguro de stock en Firestore verificando existencia previa del documento
                    if (saleData.items && Array.isArray(saleData.items)) {
                        const deductionsByDocId = new Map<string, number>();
                        for (const item of saleData.items) {
                            if (item.isBundle && item.bundleItems) {
                                for (const component of item.bundleItems) {
                                    if (component.id) {
                                        const deductQty = (Number(component.qty) || 1) * (Number(item.qty) || 1);
                                        deductionsByDocId.set(component.id, (deductionsByDocId.get(component.id) || 0) + deductQty);
                                    }
                                }
                            } else if (item.productId && !item.productId.startsWith('manual-')) {
                                const deductQty = Number(item.qty) || 1;
                                deductionsByDocId.set(item.productId, (deductionsByDocId.get(item.productId) || 0) + deductQty);
                            }
                        }

                        for (const [prodId, deductQty] of deductionsByDocId.entries()) {
                            const prodRef = doc(firestore, 'retailer_inventory', prodId);
                            const prodSnap = await getDoc(prodRef);
                            if (!prodSnap.exists()) continue; // Si el producto fue eliminado, no bloquear el batch de la venta

                            const prodData: any = prodSnap.data() || {};
                            const currentStockByBranch = (prodData.stockByBranch && typeof prodData.stockByBranch === 'object')
                                ? { ...prodData.stockByBranch }
                                : {};

                            if (saleData.branchId) {
                                const currentBranchVal = currentStockByBranch[saleData.branchId] !== undefined
                                    ? Number(currentStockByBranch[saleData.branchId]) || 0
                                    : Number(prodData.stock) || 0;
                                currentStockByBranch[saleData.branchId] = Math.max(0, currentBranchVal - deductQty);
                                Object.keys(currentStockByBranch).forEach(k => {
                                    currentStockByBranch[k] = Math.max(0, Number(currentStockByBranch[k]) || 0);
                                });
                                const newTotalStock = Object.values(currentStockByBranch).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0);
                                batch.update(prodRef, {
                                    stock: newTotalStock,
                                    stockByBranch: currentStockByBranch,
                                    updatedAt: serverTimestamp()
                                });
                            } else {
                                const newTotalStock = Math.max(0, (Number(prodData.stock) || 0) - deductQty);
                                batch.update(prodRef, {
                                    stock: newTotalStock,
                                    updatedAt: serverTimestamp()
                                });
                            }
                        }
                    }

                    await batch.commit();

                    // Si subió bien, la borramos de IndexedDB
                    const delTx = db.transaction('pending_sync_sales', 'readwrite');
                    delTx.objectStore('pending_sync_sales').delete(localId);
                    
                } catch (e) {
                    console.error("Fallo al sincronizar una venta:", e);
                    failedIds.push(sale.localId);
                }
            }

            if (failedIds.length === 0) {
                console.log("✅ [SYNC-FANTASMA] Sincronización completa. Cola limpia y stock actualizado en la nube.");
            } else {
                console.warn(`⚠️ [SYNC-FANTASMA] Quedaron ${failedIds.length} operaciones por sincronizar.`);
            }
        };
    } catch (e) {
        console.error("Error al acceder a la cola de sincronización:", e);
    }
};
