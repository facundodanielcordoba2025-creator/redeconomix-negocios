import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId = null,
      planName = 'Plan Esencial',
      planPrice = '$4.999',
      paymentMethod = 'transferencia',
      userName,
      userEmail,
      userPhone,
      address = '',
      neighborhood = '',
      preferredTime = '',
      receiptRef = '',
      vendedorRef = ''
    } = body;

    if (!userName || !userPhone) {
      return NextResponse.json({ error: 'Faltan nombre y teléfono de contacto' }, { status: 400 });
    }

    const cleanPhone = (userPhone || '').replace(/\D/g, '');
    const isEfectivo = paymentMethod === 'efectivo';
    const methodLabel = isEfectivo ? 'Efectivo (Asesor a Domicilio)' : 'Transferencia Bancaria';

    // 0. Guardar solicitud en Firestore usando adminDb (asegura guardado sin bloqueos de reglas de cliente)
    let orderDocId = '';
    const cleanVendedorRef = String(vendedorRef || '').trim().toUpperCase();

    try {
      let sellerInfo: { sellerId?: string; sellerName?: string } = {};
      if (cleanVendedorRef) {
        try {
          const sellerSnap = await adminDb.collection('users')
            .where('sellerCode', '==', cleanVendedorRef)
            .limit(1)
            .get();
          if (!sellerSnap.empty) {
            const sDoc = sellerSnap.docs[0];
            const sData = sDoc.data();
            sellerInfo = {
              sellerId: sDoc.id,
              sellerName: sData.displayName || sData.name || sData.ownerName || sData.email || cleanVendedorRef
            };
          }
        } catch (findErr) {
          console.warn('Error buscando vendedor por código:', findErr);
        }
      }

      const orderData = {
        userId: userId || null,
        userName: String(userName).trim(),
        userPhone: String(userPhone).trim(),
        userEmail: String(userEmail || '').trim(),
        planName,
        planPrice,
        paymentMethod,
        address: isEfectivo ? String(address || '').trim() : '',
        neighborhood: isEfectivo ? String(neighborhood || '').trim() : '',
        preferredTime: isEfectivo ? String(preferredTime || '') : '',
        receiptRef: !isEfectivo ? String(receiptRef || '').trim() : '',
        vendedorRef: cleanVendedorRef || null,
        sellerId: sellerInfo.sellerId || null,
        sellerName: sellerInfo.sellerName || (cleanVendedorRef || null),
        status: 'pending_contact',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await adminDb.collection('solicitudes_planes').add(orderData);
      orderDocId = docRef.id;

      if (userId) {
        await adminDb.collection('users').doc(userId).set({
          premiumStatus: 'pending_approval',
          selectedPlan: planName,
          planPrice: planPrice,
          paymentMethod,
          phone: String(userPhone).trim(),
          ...(address ? { address: String(address).trim() } : {}),
          premiumRequestAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (dbError) {
      console.error('Error guardando en Firestore via adminDb:', dbError);
    }

    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : '549' + cleanPhone}?text=${encodeURIComponent(
      `Hola ${userName}, te contactamos de RedEconomiX Bienestar por tu solicitud de adhesión al ${planName} (${planPrice}/mes). ¿Cómo estás?`
    )}`;

    // 1. EMAIL PARA ADMINISTRACIÓN / EQUIPO COMERCIAL (CIERRE DE VENTA)
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: #FF0000; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
          .badge { display: inline-block; background: #ffffff; color: #FF0000; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; margin-top: 8px; text-transform: uppercase; }
          .content { padding: 28px 24px; }
          .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .data-table td.label { font-weight: 700; color: #475569; width: 35%; background: #f8fafc; }
          .data-table td.value { font-weight: 600; color: #0f172a; }
          .alert-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; margin: 16px 0; font-size: 13px; color: #92400e; }
          .btn-wa { display: block; text-align: center; background: #25D366; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 20px; border-radius: 10px; margin: 20px 0 10px 0; }
          .btn-call { display: block; text-align: center; background: #0f172a; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 13px; padding: 12px 20px; border-radius: 10px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>🚨 NUEVO PEDIDO DE PLAN</h1>
            <div class="badge">${planName} • ${planPrice}/mes</div>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Atención Ventas:</strong> Este usuario solicitó adherirse al servicio. Contactarlo telefónicamente o por WhatsApp para validar datos y concretar el cobro.
            </div>

            <div class="section-title">Datos del Solicitante</div>
            <table class="data-table">
              <tr>
                <td class="label">Nombre y Apellido:</td>
                <td class="value"><strong>${userName}</strong></td>
              </tr>
              <tr>
                <td class="label">Teléfono / WhatsApp:</td>
                <td class="value"><a href="tel:${cleanPhone}" style="color: #FF0000; font-weight: 800;">${userPhone}</a></td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td class="value">${userEmail || 'No informado'}</td>
              </tr>
              <tr>
                <td class="label">Plan Solicitado:</td>
                <td class="value"><strong>${planName}</strong> (${planPrice}/mes)</td>
              </tr>
              <tr>
                <td class="label">Modalidad de Cobro:</td>
                <td class="value"><strong>${methodLabel}</strong></td>
              </tr>
              ${cleanVendedorRef ? `
              <tr>
                <td class="label">Asesor Comercial:</td>
                <td class="value"><strong style="color: #FF0000; font-size: 14px;">${cleanVendedorRef}</strong></td>
              </tr>
              ` : ''}
              ${isEfectivo ? `
              <tr>
                <td class="label">Dirección a Visitar:</td>
                <td class="value"><strong>${address}</strong></td>
              </tr>
              <tr>
                <td class="label">Localidad / Barrio:</td>
                <td class="value">${neighborhood || 'No especificado'}</td>
              </tr>
              <tr>
                <td class="label">Horario Preferido:</td>
                <td class="value"><strong>${preferredTime || 'Cualquier horario'}</strong></td>
              </tr>
              ` : `
              <tr>
                <td class="label">N° Operación / Transf:</td>
                <td class="value">${receiptRef || 'Pendiente de envío por comprobante'}</td>
              </tr>
              `}
              <tr>
                <td class="label">Fecha y Hora:</td>
                <td class="value">${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</td>
              </tr>
            </table>

            <a href="${whatsappUrl}" class="btn-wa" target="_blank">
              ABRIR WHATSAPP CON EL CLIENTE
            </a>
            <a href="tel:${cleanPhone}" class="btn-call">
              LLAMAR POR TELÉFONO (${userPhone})
            </a>
          </div>
          <div class="footer">
            RedEconomiX Bienestar • Sistema Automatizado de Gestión de Pedidos
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. EMAIL PARA EL USUARIO (CONFIRMACIÓN DE PEDIDO)
    const userHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: #FF0000; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 900; }
          .content { padding: 26px 22px; font-size: 14px; line-height: 1.6; }
          .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>¡Recibimos tu solicitud!</h1>
            <p style="margin: 6px 0 0 0; font-size: 12px; text-transform: uppercase; font-weight: 700; opacity: 0.95;">RedEconomiX Bienestar</p>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Hemos registrado correctamente tu solicitud de adhesión a <strong>${planName}</strong> (${planPrice}/mes).</p>

            <div class="summary">
              <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #64748b;">Resumen del Pedido</p>
              <p style="margin: 4px 0;"><strong>Plan:</strong> ${planName}</p>
              <p style="margin: 4px 0;"><strong>Valor:</strong> ${planPrice} / mes</p>
              <p style="margin: 4px 0;"><strong>Modalidad:</strong> ${methodLabel}</p>
              ${isEfectivo ? `<p style="margin: 4px 0;"><strong>Dirección de Visita:</strong> ${address} (${neighborhood})</p>` : ''}
            </div>

            <p>
              ${isEfectivo 
                ? 'Un asesor comercial se comunicará a tu teléfono (' + userPhone + ') en las próximas horas para coordinar la visita a tu domicilio y formalizar la entrega de tu credencial y cobro en efectivo.' 
                : 'Un asesor comercial validará tu transferencia y se comunicará a tu teléfono (' + userPhone + ') para confirmar la habilitación de tu perfil y coberturas.'}
            </p>

            <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
              Si tenés alguna consulta urgente, podés comunicarte con nosotros respondiendo a este email.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} RedEconomiX S.A. • Todos los derechos reservados.
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar alerta a administración (facundodanielcordoba2025@gmail.com y info@redeconomix.com)
    const adminRecipients = ['facundodanielcordoba2025@gmail.com', 'info@redeconomix.com'];
    
    await resend.emails.send({
      from: 'RedEconomiX Ventas <info@redeconomix.com>',
      to: adminRecipients,
      subject: `🚨 NUEVO PEDIDO: ${planName} - ${userName} (${isEfectivo ? 'EFECTIVO A DOMICILIO' : 'TRANSFERENCIA'})`,
      html: adminHtml,
    }).catch(err => {
      console.error('Error enviando email a admin:', err);
    });

    // Enviar confirmación al usuario si proporcionó email
    if (userEmail && userEmail.includes('@')) {
      await resend.emails.send({
        from: 'RedEconomiX Bienestar <info@redeconomix.com>',
        to: [userEmail],
        subject: `¡Recibimos tu solicitud para ${planName}! - RedEconomiX`,
        html: userHtml,
      }).catch(err => {
        console.error('Error enviando email a usuario:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud procesada y notificaciones enviadas correctamente'
    });
  } catch (error: any) {
    console.error('Error en plan-order route:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
