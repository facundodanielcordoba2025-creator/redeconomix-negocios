'use server';

import { resend } from '@/lib/resend-client';
import { adminDb, admin } from '@/lib/firebase-admin';
import { createNotification } from '@/lib/notifications';
import { sendNativePush } from '@/lib/push-backend';

const FieldValue = admin.firestore.FieldValue;

/**
 * BÓVEDA SEGURA: Envío de PIN de Seguridad
 */
export async function sendSecurityPinEmail(email: string, pin: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX <seguridad@redeconomix.com>',
      to: [email],
      subject: '🔐 Tu PIN de Seguridad RedEconomiX',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
          <h1 style="color: #FF0000; text-transform: uppercase; letter-spacing: 2px;">BÓVEDA SEGURA</h1>
          <p style="font-size: 16px; color: #555;">Has solicitado un código para realizar acciones sensibles en tu panel de negocio.</p>
          <div style="background: #f9f9f9; padding: 30px; text-align: center; border-radius: 15px; margin: 30px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #000;">${pin}</span>
          </div>
          <p style="font-size: 12px; color: #999;">Este código expirará en 10 minutos. Si no solicitaste este código, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 10px; color: #ccc; text-align: center; text-transform: uppercase;">RedEconomiX Ecosystem - Seguridad Centralizada</p>
        </div>
      `,
    });
    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * MARKETPLACE: Crear Pedido Mayorista
 */
export async function createWholesalerOrder(orderData: any) {
  try {
    // 0. BLOQUEO DE SEGURIDAD: Rechazar compras sin dueño real
    if (!orderData.wholesalerId || orderData.wholesalerId === 'unknown') {
      return { success: false, error: "Pedido rechazado por seguridad: El producto seleccionado es inválido o no pertenece a ningún comercio asociado." };
    }

    // 1. Create the order
    const docRef = await adminDb.collection('orders_wholesaler').add({
      ...orderData,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      estimatedDeliveryDate: orderData.wholesalerId === 'inaki_oran' 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        : new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const orderId = docRef.id;

    // 1.5 DISCOUNT STOCK (Reservation with stockByBranch support)
    if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
            const qty = Math.max(0, Number(item.quantity) || 0);
            if (qty <= 0) continue;
            const collectionName = item.isRetailerProduct ? 'retailer_inventory' : 'wholesale_products';
            const targetDocId = item.wholesaleProductId || item.id || item.productId;
            if (!targetDocId || targetDocId === 'unknown') continue;

            try {
                const prodRef = adminDb.collection(collectionName).doc(targetDocId);
                const prodSnap = await prodRef.get();
                if (!prodSnap.exists) {
                    // Fallback por si targetDocId era productId y existe otro ID
                    if (item.productId && item.productId !== targetDocId) {
                        await adminDb.collection(collectionName).doc(item.productId).update({
                            stock: FieldValue.increment(-qty)
                        }).catch(() => {});
                    }
                    continue;
                }

                if (item.isRetailerProduct) {
                    const prodData = prodSnap.data() || {};
                    const currentMap = prodData.stockByBranch && typeof prodData.stockByBranch === 'object'
                        ? { ...prodData.stockByBranch }
                        : {};
                    const mapKeys = Object.keys(currentMap);
                    if (mapKeys.length > 0) {
                        const targetBranch = (item.branchId && currentMap[item.branchId] !== undefined)
                            ? item.branchId
                            : (mapKeys.find(k => Number(currentMap[k]) > 0) || mapKeys[0]);
                        currentMap[targetBranch] = Math.max(0, (Number(currentMap[targetBranch]) || 0) - qty);
                        const newTotal = Object.values(currentMap).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0);
                        await prodRef.update({
                            stock: newTotal,
                            stockByBranch: currentMap,
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    } else {
                        const currentStock = Math.max(0, Number(prodData.stock) || 0);
                        await prodRef.update({
                            stock: Math.max(0, currentStock - qty),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }
                } else {
                    await prodRef.update({
                        stock: FieldValue.increment(-qty),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                }
            } catch (e) {
                console.error(`Error reserving stock in ${collectionName}:`, e);
            }
        }
    }

    // 2. CHECK FOR FIRST ORDER COMMISSION RELEASE
    const retailerId = orderData.retailerId;
    const previousOrdersSnap = await adminDb.collection('orders_wholesaler').where('retailerId', '==', retailerId).get();

    if (previousOrdersSnap.size === 1) {
        const pendingCommissionsSnap = await adminDb.collection('commissions')
            .where('referredUserId', '==', retailerId)
            .where('status', '==', 'pending_purchase')
            .get();

        for (const commissionDoc of pendingCommissionsSnap.docs) {
            const data = commissionDoc.data();
            const referrerId = data.referrerId;
            const amount = data.amount || 0;

            await adminDb.collection('commissions').doc(commissionDoc.id).update({
                status: 'paid',
                paidAt: FieldValue.serverTimestamp(),
                orderId: orderId,
                description: `${data.description} (Válidado por Compra #${orderId.slice(-6)})`
            });

            const userSnap = await adminDb.collection('users').where('uid', '==', referrerId).get();
            if (!userSnap.empty) {
                await adminDb.collection('users').doc(referrerId).update({
                    walletBalance: FieldValue.increment(amount)
                });
            } else {
                const empSnap = await adminDb.collection('employees').where('employeeCode', '==', referrerId).get();
                if (!empSnap.empty) {
                     await adminDb.collection('employees').doc(empSnap.docs[0].id).update({
                        walletBalance: FieldValue.increment(amount)
                    });
                } else {
                    await adminDb.collection('employees').doc(referrerId).update({
                        walletBalance: FieldValue.increment(amount)
                    }).catch(() => console.log("Not an employee by UID either"));
                }
            }
        }
    }

    // 2.5 AWARD POINTS (Buyer & Referrer)
    try {
        const orderTotal = orderData.totalAmount || 0;
        const buyerPoints = Math.floor(orderTotal / 200); 
        const referrerPoints = Math.floor(orderTotal / 1000); 

        await adminDb.collection('users').doc(orderData.retailerId).update({
            totalPoints: FieldValue.increment(buyerPoints)
        }).catch(() => console.log("User doc not found for points"));

        const buyerSnap = await adminDb.collection('users').where('uid', '==', orderData.retailerId).get();
        if (!buyerSnap.empty) {
            const referrerId = buyerSnap.docs[0].data().referredBy;
            if (referrerId) {
                await adminDb.collection('users').doc(referrerId).update({
                    totalPoints: FieldValue.increment(referrerPoints)
                }).catch(() => console.log("Referrer doc not found for points"));
            }
        }
    } catch (pointsErr) {
        console.error('Error rewarding points:', pointsErr);
    }
    
    // 3. NOTIFY THE WHOLESALER
    try {
        await createNotification(
            orderData.wholesalerId,
            '🚀 Nuevo Pedido Recibido',
            `Has recibido un nuevo pedido por $${orderData.totalAmount.toLocaleString('es-AR')}. ¡Empezá a prepararlo ahora!`,
            'order_update',
            `/redeconomix/dashboard-mayorista/pedidos?openOrder=${orderId}`
        );
        
        // PUSH NOTIFICATION NATIVA
        await sendNativePush(
            orderData.wholesalerId,
            '🚀 ¡Nuevo Pedido Online!',
            `Has recibido una compra por $${orderData.totalAmount.toLocaleString('es-AR')}.`,
            '/redeconomix/dashboard-negocio/pedidos'
        );
        
    } catch (notifErr) {
        console.error('Error enviando notificación al mayorista:', notifErr);
    }

    // 4. SEND EMAILS (Buyer & Seller)
    try {
        const wholesalerSnap = await adminDb.collection('users').where('uid', '==', orderData.wholesalerId).get();
        const wholesalerEmail = !wholesalerSnap.empty ? wholesalerSnap.docs[0].data().email : null;
        
        const retailerSnap = await adminDb.collection('users').where('uid', '==', orderData.retailerId).get();
        const retailerData = !retailerSnap.empty ? retailerSnap.docs[0].data() : null;
        const retailerEmail = retailerData?.email;

        const itemsHtml = orderData.items.map((i: any) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${i.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${i.priceAtPurchase.toLocaleString('es-AR')}</td>
            </tr>
        `).join('');

        const emailContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 20px;">
                <h2 style="color: #FF0000;">REDECONOMIX | COMPROBANTE</h2>
                <p>Orden <strong>#${orderId.slice(-8).toUpperCase()}</strong> confirmada con éxito.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f9f9f9;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
                    TOTAL: $${orderData.totalAmount.toLocaleString('es-AR')}
                </div>
                <p style="font-size: 12px; color: #777; margin-top: 30px;">Gracias por confiar en la red inteligente de RedEconomiX.</p>
            </div>
        `;

        if (retailerEmail) {
            await resend.emails.send({
                from: 'RedEconomiX <pedidos@redeconomix.com>',
                to: [retailerEmail],
                subject: `🛒 Confirmación de Compra #${orderId.slice(-8).toUpperCase()}`,
                html: emailContent
            });
        }

        if (wholesalerEmail) {
            await resend.emails.send({
                from: 'RedEconomiX <ventas@redeconomix.com>',
                to: [wholesalerEmail],
                subject: `💰 Nueva Venta Realizada #${orderId.slice(-8).toUpperCase()}`,
                html: emailContent
            });
        }
    } catch (emailErr) {
        console.error('Error enviando emails:', emailErr);
    }

    return { success: true, orderId };
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return { success: false, error: error.message };
  }
}

/**
 * MARKETPLACE: Actualizar Estado y Notificar Cierre
 */
export async function updateWholesalerOrderStatus(orderId: string, newStatus: string, reason?: string) {
    try {
        const orderRef = adminDb.collection('orders_wholesaler').doc(orderId);
        const orderSnap = await orderRef.get();
        
        if (!orderSnap.exists) return { success: false, error: 'Pedido no encontrado' };
        const orderData = orderSnap.data() as any;

        const updatePayload: Record<string, any> = {
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp()
        };
        if (reason) updatePayload.statusReason = reason;
        if (newStatus === 'delivered' || newStatus === 'reception_confirmed') {
            updatePayload.deliveryConfirmedAt = FieldValue.serverTimestamp();
        }

        await orderRef.update(updatePayload);

        if (newStatus === 'cancelled' && orderData.status !== 'cancelled' && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
                const qty = Math.max(0, Number(item.quantity) || 0);
                if (qty <= 0) continue;
                const collectionName = item.isRetailerProduct ? 'retailer_inventory' : 'wholesale_products';
                const targetDocId = item.wholesaleProductId || item.id || item.productId;
                if (!targetDocId || targetDocId === 'unknown') continue;

                try {
                    const prodRef = adminDb.collection(collectionName).doc(targetDocId);
                    const prodSnap = await prodRef.get();
                    if (!prodSnap.exists) continue;

                    if (item.isRetailerProduct) {
                        const prodData = prodSnap.data() || {};
                        const currentMap = prodData.stockByBranch && typeof prodData.stockByBranch === 'object'
                            ? { ...prodData.stockByBranch }
                            : {};
                        const mapKeys = Object.keys(currentMap);
                        if (mapKeys.length > 0) {
                            const targetBranch = (item.branchId && currentMap[item.branchId] !== undefined)
                                ? item.branchId
                                : mapKeys[0];
                            currentMap[targetBranch] = Math.max(0, Number(currentMap[targetBranch]) || 0) + qty;
                            const newTotal = Object.values(currentMap).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0);
                            await prodRef.update({
                                stock: newTotal,
                                stockByBranch: currentMap,
                                updatedAt: FieldValue.serverTimestamp()
                            });
                        } else {
                            await prodRef.update({
                                stock: FieldValue.increment(qty),
                                updatedAt: FieldValue.serverTimestamp()
                            });
                        }
                    } else {
                        await prodRef.update({
                            stock: FieldValue.increment(qty),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }
                } catch (e) {
                    console.error("Error restoring stock on cancel:", e);
                }
            }
        }

        // Si el pedido fue entregado o confirmado, registrar ingreso en Caja Mayorista y sumar stock al Comercio Comprador (si corresponde)
        if ((newStatus === 'delivered' || newStatus === 'reception_confirmed') && !orderData.stockSyncedToBuyer) {
            try {
                // 1. Registrar venta en wholesaler_daily_operations (idempotente por ID)
                if (orderData.wholesalerId) {
                    await adminDb.collection('wholesaler_daily_operations').doc(`order_sale_${orderId}`).set({
                        wholesalerId: orderData.wholesalerId,
                        type: 'sale',
                        paymentMethod: orderData.paymentMethod || 'efectivo',
                        total: Number(orderData.totalAmount) || 0,
                        amount: Number(orderData.totalAmount) || 0,
                        clientId: orderData.retailerId || '',
                        clientName: orderData.retailerName || orderData.buyerName || 'Cliente Marketplace',
                        items: orderData.items || [],
                        sourceOrderId: orderId,
                        createdAt: FieldValue.serverTimestamp()
                    }, { merge: true });
                }

                // 2. Si el comprador es un comercio minorista y compró mercadería mayorista, ingresar a su retailer_inventory y stockByBranch
                const buyerId = orderData.retailerId;
                const isWholesaleRestock = Array.isArray(orderData.items) && orderData.items.some((i: any) => !i.isRetailerProduct);
                if (buyerId && isWholesaleRestock) {
                    const buyerDoc = await adminDb.collection('users').doc(buyerId).get();
                    const buyerData = buyerDoc.exists ? buyerDoc.data() : null;
                    const isRetailerBuyer = buyerData?.accountType === 'retailer' || buyerData?.role === 'retailer';

                    if (isRetailerBuyer) {
                        const branchesSnap = await adminDb.collection('retailer_branches').where('retailerId', '==', buyerId).get();
                        let centralBranchId = 'central';
                        if (!branchesSnap.empty) {
                            const centralDoc = branchesSnap.docs.find(d => d.data().isCentral) || branchesSnap.docs[0];
                            centralBranchId = centralDoc.id;
                        }
                        const targetBranchId = orderData.branchId || centralBranchId;

                        const existingInvSnap = await adminDb.collection('retailer_inventory').where('retailerId', '==', buyerId).get();
                        const existingDocs = existingInvSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

                        for (const item of orderData.items) {
                            if (item.isRetailerProduct) continue;
                            const addedQty = Math.max(0, Number(item.quantity) || 0);
                            if (addedQty <= 0) continue;

                            const itemCode = String(item.code || item.barcode || '').trim();
                            const itemName = String(item.name || '').trim().toLowerCase();
                            const match = existingDocs.find(p =>
                                (itemCode && (String(p.code || '').trim() === itemCode || String(p.barcode || '').trim() === itemCode)) ||
                                (itemName && String(p.name || '').trim().toLowerCase() === itemName)
                            );

                            if (match) {
                                const currentMap = match.stockByBranch && typeof match.stockByBranch === 'object'
                                    ? { ...match.stockByBranch }
                                    : {};
                                if (Object.keys(currentMap).length === 0) {
                                    currentMap[centralBranchId] = Math.max(0, Number(match.stock) || 0);
                                }
                                currentMap[targetBranchId] = Math.max(0, Number(currentMap[targetBranchId]) || 0) + addedQty;
                                const newTotal = Object.values(currentMap).reduce((acc: number, v: any) => acc + Math.max(0, Number(v) || 0), 0);

                                await adminDb.collection('retailer_inventory').doc(match.id).update({
                                    stock: newTotal,
                                    stockByBranch: currentMap,
                                    purchasePrice: Number(item.priceAtPurchase) || match.purchasePrice || 0,
                                    updatedAt: FieldValue.serverTimestamp()
                                });
                            } else {
                                const costPrice = Number(item.priceAtPurchase) || 0;
                                const newInvRef = adminDb.collection('retailer_inventory').doc();
                                await newInvRef.set({
                                    id: newInvRef.id,
                                    retailerId: buyerId,
                                    businessName: buyerData?.businessName || 'Comercio Local',
                                    name: item.name || 'Producto Mayorista',
                                    code: itemCode || `MAY-${Date.now()}`,
                                    purchasePrice: costPrice,
                                    salePrice: Math.round(costPrice * 1.3),
                                    stock: addedQty,
                                    stockByBranch: { [targetBranchId]: addedQty },
                                    branchId: targetBranchId,
                                    category: item.category || 'Almacén',
                                    imageUrl: item.imageUrl || item.image || '',
                                    active: true,
                                    createdAt: FieldValue.serverTimestamp(),
                                    updatedAt: FieldValue.serverTimestamp()
                                });
                            }
                        }
                    }
                }

                await orderRef.update({ stockSyncedToBuyer: true });
            } catch (syncErr) {
                console.error("Error syncing delivered wholesale order to retailer inventory:", syncErr);
            }
        }

        try {
            const statusLabels: any = {
                'processing': 'está siendo procesado',
                'listo_para_despacho': 'está listo para retiro/despacho',
                'shipping': 'está en camino a tu domicilio',
                'delivered': 'ha sido entregado con éxito'
            };
            
            await createNotification(
                orderData.retailerId,
                '📦 Actualización de Pedido',
                `Tu pedido #${orderId.slice(-8).toUpperCase()} ${statusLabels[newStatus] || 'ha actualizado su estado'}.`,
                'order_update',
                '/redeconomix/mis-compras'
            );
        } catch (err) {
            console.error("Push notification error:", err);
        }

        if (newStatus === 'delivered' || newStatus === 'reception_confirmed') {
            const retailerSnap = await adminDb.collection('users').where('uid', '==', orderData.retailerId).get();
            const retailerEmail = !retailerSnap.empty ? retailerSnap.docs[0].data().email : null;

            if (retailerEmail) {
                await resend.emails.send({
                    from: 'RedEconomiX <exito@redeconomix.com>',
                    to: [retailerEmail],
                    subject: `✅ ¡Pedido Entregado con Éxito! #${orderId.slice(-8).toUpperCase()}`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; text-align: center; border: 1px solid #eee; border-radius: 20px;">
                            <div style="font-size: 50px;">📦 ✅</div>
                            <h2 style="color: #FF0000; margin-top: 20px;">¡TU PEDIDO HA LLEGADO!</h2>
                            <p style="font-size: 16px; color: #555;">La orden #${orderId.slice(-8).toUpperCase()} se ha entregado satisfactoriamente.</p>
                            <p style="font-size: 14px; color: #777;">Esperamos que disfrutes de tu mercadería. Recordá que podés ver el recibo final en tu panel de "Mis Compras".</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="font-size: 12px; color: #999;">RedEconomiX Ecosystem - Proceso de Venta Cerrado</p>
                        </div>
                    `
                });
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error actualizando estado:', error);
        return { success: false, error: error.message };
    }
}

/**
 * SERVICIOS: Finalizar Pedido de Servicio y Notificar
 */
export async function completeServiceRequest(serviceId: string, ratingData: { stars: number, comment?: string }) {
    try {
        const serviceSnap = await adminDb.collection('serviceRequests').doc(serviceId).get();
        
        if (!serviceSnap.exists) return { success: false, error: 'Servicio no encontrado' };
        const serviceData = serviceSnap.data() as any;

        await adminDb.collection('serviceRequests').doc(serviceId).update({
            status: 'completed',
            receptionConfirmed: true,
            isRated: true,
            rating: ratingData.stars,
            comment: ratingData.comment || '',
            clientFeedback: ratingData.comment || '',
            completedAt: FieldValue.serverTimestamp()
        });

        try {
            await createNotification(
                serviceData.providerId,
                '✨ Nueva Calificación Recibida',
                `El socio te calificó con ${ratingData.stars} estrellas por el servicio de ${serviceData.serviceType}.`,
                'chat',
                '/redeconomix/prestadores/historial'
            );
        } catch (err) {
            console.error("Push error:", err);
        }

        const clientSnap = await adminDb.collection('users').where('uid', '==', serviceData.clientId).get();
        const clientEmail = !clientSnap.empty ? clientSnap.docs[0].data().email : null;
        
        const providerSnap = await adminDb.collection('users').where('uid', '==', serviceData.providerId).get();
        const providerEmail = !providerSnap.empty ? providerSnap.docs[0].data().email : null;

        if (clientEmail) {
            await resend.emails.send({
                from: 'RedEconomiX <servicios@redeconomix.com>',
                to: [clientEmail],
                subject: '📄 Recibo de Servicio: ' + serviceData.serviceType,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
                        <h2 style="color: #10B981;">REDECONOMIX | RECIBO DE SERVICIO</h2>
                        <p>El servicio ha sido completado y calificado con éxito.</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 15px; margin: 20px 0;">
                            <p><strong>Servicio:</strong> ${serviceData.serviceType}</p>
                            <p><strong>Prestador:</strong> ${serviceData.providerName}</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
                            <h3 style="margin-top: 15px;">TOTAL PAGADO: $${serviceData.agreedPrice?.toLocaleString('es-AR')}</h3>
                        </div>
                        <p style="font-size: 14px; color: #777;">Gracias por calificar el servicio con ${ratingData.stars} estrellas. ¡Tu opinión nos ayuda a crecer!</p>
                    </div>
                `
            });
        }

        if (providerEmail) {
            const stars = '⭐'.repeat(ratingData.stars);
            await resend.emails.send({
                from: 'RedEconomiX <talento@redeconomix.com>',
                to: [providerEmail],
                subject: '✨ Nueva Calificación Recibida: ' + stars,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px; background: #020617; color: white;">
                        <h2 style="color: #10B981;">¡TRABAJO COMPLETADO!</h2>
                        <p>El socio ha confirmado la recepción del servicio y te ha calificado.</p>
                        <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0;">
                            <div style="font-size: 40px; margin-bottom: 10px;">${stars}</div>
                            <p style="font-size: 20px; font-weight: bold;">${ratingData.stars} / 5 Estrellas</p>
                            ${ratingData.comment ? `<p style="font-style: italic; color: #ccc; margin-top: 15px;">"${ratingData.comment}"</p>` : ''}
                        </div>
                        <p style="font-size: 12px; color: #555;">Este registro queda guardado en tu historial de reputación en RedEconomiX.</p>
                    </div>
                `
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error al completar servicio:', error);
        return { success: false, error: error.message };
    }
}

/**
 * POINTS: Convert Points to Wallet Balance (1 pt = $1)
 */
export async function convertPointsToCash(userId: string, pointsToConvert: number) {
    try {
        await adminDb.collection('users').doc(userId).update({
            totalPoints: FieldValue.increment(-pointsToConvert),
            walletBalance: FieldValue.increment(pointsToConvert)
        });

        await adminDb.collection('point_transactions').add({
            userId,
            type: 'conversion_to_cash',
            points: pointsToConvert,
            amount: pointsToConvert,
            status: 'completed',
            createdAt: FieldValue.serverTimestamp()
        });

        try {
            await createNotification(
                userId,
                '💸 Puntos Convertidos a Dinero',
                `Se han convertido ${pointsToConvert.toLocaleString('es-AR')} puntos en $${pointsToConvert.toLocaleString('es-AR')} para tu Billetera.`,
                'order_update',
                '/redeconomix/billetera'
            );
        } catch (err) {
            console.error("Push error:", err);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error converting points:', error);
        return { success: false, error: error.message };
    }
}

/**
 * POINTS: Redeem Product with Points
 */
export async function redeemProductWithPoints(userId: string, prize: any) {
    try {
        await adminDb.collection('users').doc(userId).update({
            totalPoints: FieldValue.increment(-prize.points)
        });

        const docRef = await adminDb.collection('orders_wholesaler').add({
            retailerId: userId,
            items: [{
                name: prize.title,
                quantity: 1,
                priceAtPurchase: 0,
                pointsCost: prize.points,
                isRedemption: true
            }],
            totalAmount: 0,
            pointsRedeemed: prize.points,
            status: 'pending',
            type: 'point_redemption',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        await adminDb.collection('point_transactions').add({
            userId,
            type: 'product_redemption',
            points: prize.points,
            productId: prize.id,
            productName: prize.title,
            orderId: docRef.id,
            status: 'completed',
            createdAt: FieldValue.serverTimestamp()
        });

        try {
            await createNotification(
                userId,
                '🎁 Canje Exitoso',
                `Has canjeado ${prize.points.toLocaleString('es-AR')} puntos por "${prize.title}". ¡Que lo disfrutes!`,
                'order_update',
                '/redeconomix/mis-compras'
            );
        } catch (err) {
            console.error("Push error:", err);
        }

        return { success: true, orderId: docRef.id };
    } catch (error: any) {
        console.error('Error redeeming product:', error);
        return { success: false, error: error.message };
    }
}

/**
 * SERVICIOS: Crear Nueva Solicitud de Servicio
 */
export async function createServiceRequest(requestData: any) {
    try {
        const docRef = await adminDb.collection('serviceRequests').add({
            ...requestData,
            status: 'sent',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        if (requestData.clientId) {
            try {
                await createNotification(
                    requestData.clientId,
                    '🔍 Buscando Prestador',
                    `Tu solicitud de "${requestData.serviceType || 'servicio'}" ha sido publicada. Te notificaremos cuando un prestador acepte.`,
                    'order_update',
                    '/redeconomix/mis-servicios'
                );
            } catch (err) {
                console.error("Push error:", err);
            }
        }

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error('Error creating service request:', error);
        return { success: false, error: error.message };
    }
}

