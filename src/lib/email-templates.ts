/**
 * RedEconomiX EMAIL TEMPLATE ENGINE - L100
 * Centralized HTML generation for premium transactional emails.
 */

const REX_BRAND_COLOR = '#FF0000';
const REX_DARK_COLOR = '#0f172a';
const REX_LOGO_SVG = `RE<span style="font-size: 40px; margin-left: -2px;">X</span>`;

const getBaseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
    .header { background: ${REX_BRAND_COLOR}; padding: 60px 40px; text-align: center; }
    .logo { color: white; font-weight: 900; font-size: 32px; letter-spacing: -2px; font-style: italic; }
    .content { padding: 60px 50px; text-align: center; }
    .h1 { font-size: 28px; font-weight: 900; color: ${REX_DARK_COLOR}; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -1px; }
    .p { color: #64748b; line-height: 1.8; margin-bottom: 32px; font-size: 15px; font-weight: 500; }
    .btn { background: ${REX_DARK_COLOR}; color: white !important; padding: 22px 42px; border-radius: 20px; text-decoration: none; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; font-size: 13px; }
    .footer { padding: 40px; text-align: center; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; border-top: 1px solid #f1f5f9; }
    .legal-badge { display: inline-block; padding: 8px 16px; background: #fef2f2; color: ${REX_BRAND_COLOR}; border-radius: 10px; font-size: 10px; font-weight: 900; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${REX_LOGO_SVG}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      © 2026 REDECONOMIX • INFRAESTRUCTURA DE ELITE
    </div>
  </div>
</body>
</html>
`;

export const templates = {
  // 1. WELCOME EMAIL
  welcome: (name: string, type: string) => getBaseLayout(`
    <div class="legal-badge">BIENVENIDO SOCIO</div>
    <div class="h1">Hola, ${name} .</div>
    <div class="p">
      Gracias por unirte a **RedEconomiX**. Tu cuenta como **${type.toUpperCase()}** ha sido creada con éxito. 
      Ya puedes acceder a nuestra red de beneficios y herramientas exclusivas.
    </div>
    <a href="https://www.redeconomix.com/login" class="btn">Entrar a mi Panel</a>
  `),

  // 2. ANTI-FRAUD REPORT CONFIRMATION
  reportReceived: (name: string, caseId: string, description: string) => getBaseLayout(`
    <div class="legal-badge" style="background: #fff7ed; color: #c2410c;">REPORTE RECIBIDO</div>
    <div class="h1">Caso en Análisis .</div>
    <div class="p">
      Hola ${name}. Hemos recibido tu reporte sobre "**${description}**". 
      Nuestro equipo legal ha iniciado la investigación bajo el ID: <br>
      <strong style="color: ${REX_DARK_COLOR}; font-size: 18px;">#${caseId.slice(-6).toUpperCase()}</strong>
    </div>
    <div class="p" style="font-size: 12px; font-style: italic;">
      Mantente atento a tu casilla de correo. Te contactaremos en un máximo de 48hs hábiles.
    </div>
    <a href="https://www.redeconomix.com/defensor-online" class="btn">Ver estado de caso</a>
  `),

  // 3. ORDER RECEIPT
  orderReceipt: (name: string, orderId: string, amount: string, items: string) => getBaseLayout(`
    <div class="legal-badge" style="background: #ecfdf5; color: #059669;">COMPROBANTE DIGITAL</div>
    <div class="h1">Confirmación de Pedido .</div>
    <div class="p">Hola ${name}. Tu pedido <strong>#${orderId.slice(-6).toUpperCase()}</strong> ha sido procesado con éxito.</div>
    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
      <div style="font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 12px; text-transform: uppercase;">Resumen del Pedido</div>
      <div style="color: #475569; font-size: 14px; line-height: 1.6;">${items}</div>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 16px; pt: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; color: ${REX_DARK_COLOR};">TOTAL COBRADO</span>
        <span style="font-size: 20px; font-weight: 900; color: ${REX_BRAND_COLOR};">$${amount}</span>
      </div>
    </div>
    <a href="https://www.redeconomix.com/mis-compras" class="btn">Ver mis pedidos</a>
  `),

  // 4. PREMIUM APPROVAL
  premiumApproval: (name: string) => getBaseLayout(`
    <div class="legal-badge" style="background: #fefce8; color: #a16207;">ESTATUS: MIEMBRO GOLD</div>
    <div class="h1" style="color: #a16207;">¡Bienvenido a la Élite! .</div>
    <div class="p">
      Hola ${name}. Tenemos el placer de informarte que tu membresía **PREMIUM GOLD** ha sido aprobada. 
      Ahora tus beneficios, estrellas y prioridad están activos en toda la red.
    </div>
    <div style="margin-bottom: 32px;">
      <span style="font-size: 24px;">⭐ ⭐ ⭐</span>
    </div>
    <a href="https://www.redeconomix.com/billetera" class="btn" style="background: #a16207;">Descubrir beneficios</a>
  `),

  // 5. PASANAKU JOIN CONFIRMATION
  pasanakuJoin: (name: string, groupName: string, fee: string) => getBaseLayout(`
    <div class="legal-badge" style="background: #eef2ff; color: #4f46e5;">SISTEMA PASANAKU DIGITAL</div>
    <div class="h1">Confirmación de Ingreso .</div>
    <div class="p">
      Hola ${name}. Tu solicitud para unirte al grupo <strong>"${groupName}"</strong> ha sido registrada con éxito.
    </div>
    <div style="background: #f1f5f9; border-radius: 20px; padding: 30px; margin-bottom: 32px;">
      <div style="font-size: 11px; font-weight: 800; color: #64748b; margin-bottom: 15px; text-transform: uppercase;">Detalle de Compromiso</div>
      <div style="font-size: 18px; font-weight: 900; color: ${REX_DARK_COLOR}; margin-bottom: 5px;">CUOTA: ${fee}</div>
      <div style="font-size: 12px; color: #94a3b8;">Aporte mensual obligatorio y solidario.</div>
    </div>
    <div class="p" style="font-size: 12px; font-style: italic;">
      Recuerda que el Pasanaku se basa en la confianza. El equipo administrativo validará tu perfil en las próximas 24hs.
    </div>
    <a href="https://www.redeconomix.com/pasanaku" class="btn" style="background: #4f46e5;">Mi estado en el pozo</a>
  `),

  // 6. ADMIN ALERTS
  adminAlert: (event: string, detail: string) => getBaseLayout(`
    <div class="legal-badge" style="background: #000; color: #fff;">NOTIFICACIÓN ADMIN</div>
    <div class="h1">Alerta de Sistema .</div>
    <div class="p">Se ha registrado un nuevo evento: <strong>${event}</strong></div>
    <div class="p" style="text-align: left; background: #f1f5f9; padding: 20px; border-radius: 12px; font-family: monospace; font-size: 12px;">
      ${detail}
    </div>
    <a href="https://www.redeconomix.com/admin" class="btn">Abrir Consola</a>
  `),

  // 7. VERIFICATION CODE (OTP)
  verificationCode: (code: string) => getBaseLayout(`
    <div class="legal-badge">VERIFICACIÓN DE SEGURIDAD</div>
    <div class="h1">Tu Código de Acceso .</div>
    <div class="p">
      Para completar tu registro en **RedEconomiX**, ingresa el siguiente código de 6 dígitos:
    </div>
    <div style="background: #f1f5f9; padding: 40px; border-radius: 24px; margin-bottom: 32px;">
      <div style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: ${REX_BRAND_COLOR}; text-align: center;">
        ${code}
      </div>
    </div>
    <div class="p" style="font-size: 12px; font-style: italic;">
      Este código expirará en 10 minutos. No compartas este código con nadie.
    </div>
  `),
};
