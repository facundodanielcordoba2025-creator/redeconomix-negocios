import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, name, caseId, description, details } = await request.json();

    if (!email || !caseId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // 1. Email para el Usuario (Acuse de recibo)
    const userHtml = templates.reportReceived(name || 'Socio', caseId, description || 'Denuncia');
    
    // 2. Email para el Admin (Alerta de acción)
    const adminHtml = templates.adminAlert(
      'NUEVA DENUNCIA REGISTRADA',
      `Caso #${caseId}\nUsuario: ${name} (${email})\nDescripción: ${description}\n\nDetalles:\n${details}`
    );

    // Enviar a Usuario
    await resend.emails.send({
      from: 'RedEconomiX Legales <info@redeconomix.com>',
      to: [email],
      subject: `Confirmación de Reporte #${caseId.slice(-6).toUpperCase()} 🛡️`,
      html: userHtml,
    });

    // Enviar a Admin
    await resend.emails.send({
      from: 'Sistema RedEconomiX <info@redeconomix.com>',
      to: ['info@redeconomix.com'],
      subject: `🚨 ALERTA: Nuevo Reporte Defensor Online #${caseId.slice(-6).toUpperCase()}`,
      html: adminHtml,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
