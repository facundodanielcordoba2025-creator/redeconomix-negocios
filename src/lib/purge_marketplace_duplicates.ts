
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCy_6_lNuQS7hawxPXkibNTCVwfQgvlQOc",
  authDomain: "studio-8047565887-3a8da.firebaseapp.com",
  projectId: "studio-8047565887-3a8da",
  storageBucket: "oggie-8529f.firebasestorage.app",
  messagingSenderId: "673509915934",
  appId: "1:673509915934:web:5b3120c431e0492768dd0f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function purgeWholesaleDuplicates() {
    console.log("Iniciando purga de duplicados en Marketplace...");
    const snapshot = await getDocs(collection(db, "wholesale_products"));
    
    // Mapa para agrupar por Wholesaler + SKU
    const groups = new Map();

    snapshot.forEach(d => {
        const data = d.data();
        const wholesalerId = data.wholesalerId;
        const sku = (data.code || data.productId || "").toString().trim();
        
        if (!wholesalerId || !sku) return;

        const key = `${wholesalerId}_${sku}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push({ id: d.id, ...data });
    });

    let deletedCount = 0;

    for (const [key, products] of groups.entries()) {
        if (products.length > 1) {
            console.log(`Duplicados encontrados para ${key}: ${products.length} versiones.`);
            
            // Ordenamos por fecha de actualización (si existe) para dejar la más nueva
            const sorted = products.sort((a: any, b: any) => {
                const dateA = a.updatedAt?.seconds || 0;
                const dateB = b.updatedAt?.seconds || 0;
                return dateB - dateA; // Más nuevo primero
            });

            // Borramos todos excepto el primero (el más nuevo)
            const toDelete = sorted.slice(1);
            for (const item of toDelete) {
                console.log(`Eliminando versión vieja de ${item.name} (ID: ${item.id})`);
                await deleteDoc(doc(db, "wholesale_products", item.id));
                deletedCount++;
            }
        }
    }

    console.log(`Limpieza terminada. Se eliminaron ${deletedCount} productos duplicados.`);
}

purgeWholesaleDuplicates().catch(console.error);
