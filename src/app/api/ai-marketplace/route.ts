import { NextResponse } from 'next/server';
import { db } from '@/firebase'; // Asegúrate de la ruta correcta
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const apiKey = request.headers.get('x-api-key');
  const MARKETPLACE_API_KEY = process.env.REX_CHATBOT_KEY;

  // Validación de Seguridad
  if (!MARKETPLACE_API_KEY || apiKey !== MARKETPLACE_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!q) {
    return NextResponse.json({ error: 'Falta parámetro de búsqueda' }, { status: 400 });
  }

  try {
    // Buscamos en el inventario mayorista (o marketplace general)
    const inventoryRef = collection(db, 'retailer_inventory');
    const querySnapshot = await getDocs(inventoryRef);
    
    // Filtro simple por nombre (ya que Firestore no tiene búsqueda por texto parcial nativa sin índices)
    const results = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((item: any) => 
        item.name?.toLowerCase().includes(q.toLowerCase()) || 
        item.category?.toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 5); // Limitamos a los mejores 5 para que el bot no se maree

    return NextResponse.json({
      success: true,
      query: q,
      results: results.map((r: any) => ({
        nombre: r.name,
        precio: r.price,
        stock: r.stock,
        categoria: r.category,
        unidad: r.unit || 'unid.'
      }))
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
