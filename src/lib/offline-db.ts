// Gestor de Base de Datos Offline (IndexedDB) para Super Velocidad y Modo Sin Conexión
// Este módulo almacena el catálogo directamente en el hardware del celular.

const DB_NAME = 'RedEconomixOfflineDB';
const DB_VERSION = 1;

export const initOfflineDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') return reject("Not in browser");
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            // Almacén para el catálogo de productos pesados
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id' });
            }
            // Almacén para INVENTARIO PROPIO (Retailer)
            if (!db.objectStoreNames.contains('inventory')) {
                db.createObjectStore('inventory', { keyPath: 'id' });
            }
            // Almacén para operaciones de venta cuando no hay WiFi
            if (!db.objectStoreNames.contains('pending_sync_sales')) {
                db.createObjectStore('pending_sync_sales', { keyPath: 'localId', autoIncrement: true });
            }
        };
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveProductsToOfflineCache = async (products: any[]) => {
    try {
        const db = await initOfflineDB();
        const tx = db.transaction(['products', 'inventory'], 'readwrite');
        const prodStore = tx.objectStore('products');
        const invStore = tx.objectStore('inventory');
        
        // Limpiar registros obsoletos o de 0 stock viejos para que la caché local sea un espejo exacto de la nube
        prodStore.clear();
        invStore.clear();

        // Guardamos todo el catálogo en paralelo
        products.forEach(p => {
             // Aseguramos que el id exista y sea un string
             if (p && (p.id || p.productId)) {
                 const item = { ...p, id: p.id || p.productId };
                 prodStore.put(item);
                 invStore.put(item);
             }
        });
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                console.log("📥 [OFFLINE-DB] Catálogo sincronizado en el dispositivo (Modo offline listo)");
                resolve(true);
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Falló la escritura a IndexedDB", e);
    }
};

export const saveInventoryToOfflineCache = async (inventory: any[]) => {
    try {
        const db = await initOfflineDB();
        const tx = db.transaction(['products', 'inventory'], 'readwrite');
        const prodStore = tx.objectStore('products');
        const store = tx.objectStore('inventory');
        
        prodStore.clear();
        store.clear();

        inventory.forEach(item => {
             if (item && item.id) {
                 prodStore.put(item);
                 store.put(item);
             }
        });
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                console.log("🏪 [OFFLINE-DB] Inventario sincronizado localmente.");
                resolve(true);
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Falló la escritura de inventario a IndexedDB", e);
    }
};

/**
 * Función determinística y unificada para calcular el stock de un producto en una sucursal específica.
 * Es utilizada tanto por el módulo de Stock como por el TPV (Control de Ventas) para que NUNCA haya
 * discrepancia entre lo que ve el encargado de stock y lo que consulta el lector de códigos de barras.
 */
export const computeProductBranchStock = (
    product: any,
    branchId: string,
    branches?: any[] | null
): number => {
    if (!product || !branchId) return 0;
    if (branchId === 'ALL') {
        return Math.max(0, Number(product.stock) || 0);
    }

    const centralBranch = branches?.find((b: any) => b.isCentral);
    const centralId = centralBranch ? centralBranch.id : 'central';
    const isCentralQuery = branchId === 'central' || branchId === centralId;

    let res = 0;
    let foundNestedBranchKey = false;
    const hasStockByBranch = product.stockByBranch && typeof product.stockByBranch === 'object' && Object.keys(product.stockByBranch).length > 0;

    if (hasStockByBranch) {
        if (isCentralQuery) {
            if (product.stockByBranch[centralId] !== undefined) {
                res = Number(product.stockByBranch[centralId]) || 0;
                foundNestedBranchKey = true;
            } else if (product.stockByBranch['central'] !== undefined) {
                res = Number(product.stockByBranch['central']) || 0;
                foundNestedBranchKey = true;
            } else {
                res = 0;
            }
        } else {
            if (product.stockByBranch[branchId] !== undefined) {
                res = Number(product.stockByBranch[branchId]) || 0;
                foundNestedBranchKey = true;
            } else {
                res = 0;
            }
        }
    } else if (product.branchId) {
        const isProductAssignedCentral = product.branchId === 'central' || product.branchId === centralId;
        if (isCentralQuery && isProductAssignedCentral) {
            res = Number(product.stock) || 0;
        } else if (product.branchId === branchId) {
            res = Number(product.stock) || 0;
        } else {
            res = 0;
        }
    } else if (isCentralQuery) {
        res = Number(product.stock) || 0;
    }

    if (!foundNestedBranchKey) {
        const targetBId = isCentralQuery ? (centralBranch?.id || 'central') : branchId;
        const flat = Number(product[`stockByBranch.${targetBId}`] || 0);
        res += flat;
    }
    return res;
};

/**
 * Limpia y normaliza códigos de barras:
 * - Elimina prefijos AIM de pistolas de código de barras (ej: ]E0, ]C1, ]e0, etc.)
 * - Elimina caracteres no imprimibles, tabulaciones y saltos de línea (\r, \n)
 * - Quita espacios en blanco en los extremos
 */
export const cleanBarcode = (raw: string): string => {
    if (!raw) return '';
    return String(raw)
        .replace(/^\][a-zA-Z0-9]{2}/, '')
        .replace(/[\r\n\t]/g, '')
        .trim();
};

/**
 * Comparador universal y estricto de códigos de barras (UPC-A, EAN-13, EAN-8, GTIN-14, balanzas y variaciones de ceros).
 * IMPORTANTE: Un código de barras NUNCA debe compararse con similitud difusa (Levenshtein / porcentaje de coincidencia)
 * porque productos de una misma empresa (ej. Coca-Cola / Cepita / Benedictino o Quilmes / Stella)
 * comparten el 85% de los números (prefijo GS1 de fabricante), lo que causaría que escanear un jugo venda agua.
 * 
 * Reglas de coincidencia exactas permitidas:
 * 1. Coincidencia exacta de caracteres (100%)
 * 2. Normalización de ceros a la izquierda (EAN-13 de 13 dígitos vs UPC-A de 12 dígitos, ej: '0779...' vs '779...')
 * 3. Códigos de balanza / productos pesables (empiezan con 20, 28, 29 y 13 dígitos con código interno en dígitos 2-7)
 */
export const matchesBarcodeSmart = (p: any, rawBarcode: string): boolean => {
    if (!p || !rawBarcode) return false;
    const cleanScanned = cleanBarcode(rawBarcode);
    if (!cleanScanned) return false;
    const normScanned = cleanScanned.replace(/^0+/, '');

    // Reunir los identificadores válidos de código de barras del producto (NO incluir IDs arbitrarios de Firebase)
    const candidates: string[] = [];
    if (p.code) candidates.push(cleanBarcode(p.code));
    if (p.barcode) candidates.push(cleanBarcode(p.barcode));
    if (p.productId && typeof p.productId === 'string' && /^\d+$/.test(p.productId)) {
        candidates.push(cleanBarcode(p.productId));
    }
    if (Array.isArray(p.altBarcodes)) {
        for (const b of p.altBarcodes) {
            if (b) candidates.push(cleanBarcode(b));
        }
    }

    for (const cand of candidates) {
        if (!cand) continue;

        // 1. Coincidencia exacta directa
        if (cand === cleanScanned) return true;

        const normCand = cand.replace(/^0+/, '');

        // 2. Coincidencia normalizada sin ceros iniciales (UPC-A 12 dígitos vs EAN-13 con cero adelante)
        if (normScanned.length >= 6 && normCand.length >= 6 && normCand === normScanned) {
            return true;
        }

        // 3. Códigos de balanza / pesables (empiezan con 20, 28, 29 y tienen 13 dígitos)
        // Estructura EAN-13 balanza: 20 + 5 dígitos código producto + 5 dígitos peso/precio + 1 dígito verificador
        if ((cleanScanned.startsWith('20') || cleanScanned.startsWith('28') || cleanScanned.startsWith('29')) && cleanScanned.length === 13) {
            const productPart = cleanScanned.substring(2, 7);
            if (cand === productPart || (normCand.length >= 3 && normCand === productPart.replace(/^0+/, ''))) {
                return true;
            }
        }
    }

    return false;
};

export const searchProductOffline = async (barcode: string): Promise<any> => {
    try {
        const db = await initOfflineDB();
        const cleanCode = String(barcode || '').trim();
        if (!cleanCode) return null;

        // Buscamos primero en el inventario propio (más rápido)
        const inv = await new Promise<any>((resolve) => {
            const tx = db.transaction('inventory', 'readonly');
            const store = tx.objectStore('inventory');
            const req = store.getAll();
            req.onsuccess = () => {
                const results = req.result || [];
                resolve(results.find((p: any) => matchesBarcodeSmart(p, cleanCode)));
            };
            req.onerror = () => resolve(null);
        });

        if (inv) return inv;

        // Si no está en inventario, buscamos en catálogo maestro
        return new Promise((resolve, reject) => {
            const tx = db.transaction('products', 'readonly');
            const store = tx.objectStore('products');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const allProducts = request.result || [];
                const found = allProducts.find((p: any) => matchesBarcodeSmart(p, cleanCode));
                resolve(found || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        return null;
    }
};

// Usaremos esto para registrar ventas sin internet (Blindaje idempotente)
export const queueSaleForSync = async (saleData: any) => {
    try {
        const db = await initOfflineDB();
        const tx = db.transaction('pending_sync_sales', 'readwrite');
        const store = tx.objectStore('pending_sync_sales');
        
        return new Promise((resolve, reject) => {
            const allReq = store.getAll();
            allReq.onsuccess = () => {
                const existing = allReq.result || [];
                const alreadyQueued = existing.some((s: any) => s.id && s.id === saleData.id);
                if (!alreadyQueued) {
                    store.add({ ...saleData, tstamp: Date.now() });
                }
            };
            tx.oncomplete = () => {
                console.log("📦 [OFFLINE-DB] Venta asegurada en cola local para sincronización.");
                resolve(true);
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Falló al encolar la venta", e);
    }
};

/**
 * Elimina una operación de la cola local si el commit en segundo plano terminó completándose en la nube.
 */
export const removeSaleFromSyncQueue = async (opId: string) => {
    if (!opId) return;
    try {
        const db = await initOfflineDB();
        const tx = db.transaction('pending_sync_sales', 'readwrite');
        const store = tx.objectStore('pending_sync_sales');
        const allReq = store.getAll();
        allReq.onsuccess = () => {
            const existing = allReq.result || [];
            existing.forEach((s: any) => {
                if (s.id === opId && s.localId !== undefined) {
                    store.delete(s.localId);
                }
            });
        };
    } catch (_) {}
};

/**
 * Descuenta inmediatamente el stock de los productos vendidos en el almacenamiento IndexedDB del dispositivo.
 * Garantiza que con o sin internet, el inventario del negocio refleje la venta en tiempo real.
 */
export const deductStockFromOfflineCache = async (soldItems: any[], branchId?: string) => {
    try {
        const db = await initOfflineDB();
        const tx = db.transaction(['products', 'inventory'], 'readwrite');
        const prodStore = tx.objectStore('products');
        const invStore = tx.objectStore('inventory');

        for (const item of soldItems) {
            const targets: { id: string; qty: number }[] = [];
            if (item.isBundle && item.bundleItems) {
                item.bundleItems.forEach((comp: any) => {
                    if (comp.id) {
                        targets.push({ id: comp.id, qty: (Number(comp.qty) || 1) * (Number(item.qty) || 1) });
                    }
                });
            } else if (item.productId && !item.productId.startsWith('manual-')) {
                targets.push({ id: item.productId, qty: Number(item.qty) || 1 });
            }

            for (const target of targets) {
                const req = invStore.get(target.id);
                req.onsuccess = () => {
                    const prod = req.result;
                    if (prod) {
                        const currentStock = Number(prod.stock) || 0;
                        const newStock = Math.max(0, currentStock - target.qty);
                        prod.stock = newStock;
                        if (branchId) {
                            if (!prod.stockByBranch) prod.stockByBranch = {};
                            const currentBranchStock = Number(prod.stockByBranch[branchId]) || 0;
                            prod.stockByBranch[branchId] = Math.max(0, currentBranchStock - target.qty);
                        }
                        invStore.put(prod);
                        prodStore.put(prod);
                    }
                };
            }
        }

        return new Promise((resolve) => {
            tx.oncomplete = () => {
                console.log("📉 [OFFLINE-DB] Stock descontado exitosamente en cache local del dispositivo.");
                resolve(true);
            };
            tx.onerror = () => resolve(false);
        });
    } catch (e) {
        console.error("Error al descontar stock offline:", e);
    }
};
