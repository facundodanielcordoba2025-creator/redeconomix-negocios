import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, limit, orderBy, serverTimestamp } from 'firebase/firestore';

const CHATBOT_API_KEY = process.env.REX_CHATBOT_KEY;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const qStr = searchParams.get('query')?.toLowerCase().trim() || '';
    const customerPhone = searchParams.get('phone') || '';
    const apiKey = req.headers.get('x-api-key');

    if (!CHATBOT_API_KEY || apiKey !== CHATBOT_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { firestore } = initializeFirebase();
        if (!firestore) throw new Error('Firestore not initialized');
        
        // NORMALIZACIÓN FORZADA DEL TELÉFONO (ID ÚNICO)
        const cleanPhone = customerPhone.replace(/whatsapp:/g, '').replace(/\+/g, '').replace(/\D/g, '');
        const sessionRef = doc(firestore, 'chatbot_sessions', cleanPhone);
        const sessionSnap = await getDoc(sessionRef);
        let sessionData = sessionSnap.exists() ? sessionSnap.data() : { cart: [], lastResults: [] };

        // 0. RECONOCIMIENTO DE SOCIO COMERCIAL
        const userSnap = await getDocs(query(collection(firestore, 'users'), where('phone', 'in', [cleanPhone, `+${cleanPhone}`]), limit(1)));
        const user = userSnap.empty ? null : userSnap.docs[0].data();

        // 1. GESTIÓN DE CARRITO (Limpieza / Revisión)
        if (/\b(vaciar|borrar|limpiar|eliminar)\b/.test(qStr)) {
            await setDoc(sessionRef, { cart: [], pendingSelection: null }, { merge: true });
            return NextResponse.json({ type: 'cart_action', action: 'cart_cleared', userStatus: user ? 'registered' : 'new' });
        }

        // CIERRE O REVISIÓN (Keywords extendidas: comprar, pedí, listo, confirmar, cerrar, etc)
        if (/\b(cerrar|terminar|pagar|finalizar|total|pedido|carrito|compras|confirmar|ver|listo|pedi|pedí|comprar|venta|concluir|listo)\b/.test(qStr)) {
            const cart = sessionData.cart || [];
            const total = cart.reduce((acc: number, it: any) => acc + (it.price * (it.quantity || 1)), 0);
            return NextResponse.json({ 
                type: 'cart_review', 
                cart, 
                total, 
                userStatus: user ? 'registered' : 'new',
                userName: user?.businessName || user?.displayName || null,
                cartCount: cart.length
            });
        }

        // 2. RUTEO DE MULTIVERSO Y BÚSQUEDA (Solo si NO es un número puro)
        if (qStr && !/^\d+$/.test(qStr)) {
            let department = 'Marketplace';
            if (/\b(celular|tv|lavarropa|aire|tecnologia|cuotas)\b/.test(qStr)) department = 'RedElectrónica';
            if (/\b(albañil|plomero|flete|pintor|tecnico|instalar|mecanico|remis|taxi|transporte|flete|envio|delivery)\b/.test(qStr)) department = 'RedServicios';
            if (/\b(oferta|barato|liquidacion|outlet)\b/.test(qStr)) department = 'RedLiquidación';

            const keywords = qStr.split(' ').filter(k => k.length >= 3);
            const colName = (department === 'RedServicios' || department === 'RedLogística') ? 'wholesale_services' : 'wholesale_products';
            const snap = await getDocs(query(collection(firestore, colName), limit(500)));
            
            const results = snap.docs.map(d => ({ id: d.id, ...d.data() as any }))
                .filter(p => {
                    const zone = `${p.name || p.title || ''} ${p.category || ''} ${p.brand || ''}`.toLowerCase();
                    return keywords.length > 0 ? keywords.some(k => zone.includes(k)) : zone.includes(qStr);
                }).slice(0, 5);

            await setDoc(sessionRef, { lastResults: results, pendingSelection: null }, { merge: true });
            return NextResponse.json({ 
                type: 'search_results', 
                data: results, 
                department, 
                userStatus: user ? 'registered' : 'new',
                currentCartCount: (sessionData.cart || []).length
            });
        }

        // 3. LÓGICA TRANSACCIONAL DE NÚMEROS
        if (/^\d+$/.test(qStr)) {
            const pending = sessionData.pendingSelection;
            const results = sessionData.lastResults || [];
            const idx = parseInt(qStr) - 1;

            if (pending) {
                const quantity = parseInt(qStr);
                const cart = sessionData.cart || [];
                const updatedCart = [...cart, { ...pending, quantity, addedAt: new Date().toISOString() }];
                await setDoc(sessionRef, { cart: updatedCart, pendingSelection: null }, { merge: true });
                return NextResponse.json({ 
                    type: 'action_result', 
                    action: 'product_added', 
                    product: pending.name || pending.title, 
                    quantity,
                    totalActual: updatedCart.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0),
                    cartCount: updatedCart.length
                });
            }

            if (idx >= 0 && idx < results.length) {
                await setDoc(sessionRef, { pendingSelection: results[idx] }, { merge: true });
                return NextResponse.json({ type: 'selection_confirmed', product: results[idx], cartCount: (sessionData.cart || []).length });
            }
        }

        // 4. FALLBACK: ESTADO ACTUAL
        const cart = sessionData.cart || [];
        return NextResponse.json({ 
            type: 'status', 
            cart, 
            total: cart.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) 
        });

    } catch (e: any) {
        console.error('[CHATBOT-API] Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { type, phone, data } = await req.json();
    const apiKey = req.headers.get('x-api-key');
    if (!CHATBOT_API_KEY || apiKey !== CHATBOT_API_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { firestore } = initializeFirebase();
        if (type === 'register') {
            const userRef = doc(collection(firestore, 'users'));
            await setDoc(userRef, { ...data, phone, createdAt: serverTimestamp(), accountType: 'retailer', status: 'pending_approval' });
            return NextResponse.json({ success: true, userId: userRef.id });
        }
        if (type === 'checkout') {
            const sessionRef = doc(firestore, 'chatbot_sessions', phone);
            const sessionSnap = await getDoc(sessionRef);
            const cart = sessionSnap.data()?.cart || [];
            if (cart.length === 0) throw new Error('Cart empty');
            
            const orderRef = doc(collection(firestore, 'orders_wholesaler'));
            await setDoc(orderRef, {
                items: cart,
                totalAmount: cart.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0),
                retailerPhone: phone,
                status: 'pending',
                deliveryAddress: data.address || 'Pendiente',
                createdAt: serverTimestamp(),
                orderSource: 'whatsapp_bot_L100_PRO'
            });
            await setDoc(sessionRef, { cart: [], pendingSelection: null }, { merge: true });
            return NextResponse.json({ success: true, orderId: orderRef.id.slice(-6).toUpperCase() });
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
