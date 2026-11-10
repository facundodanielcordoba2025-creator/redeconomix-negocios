import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, name, groupName, fee } = await request.json();

    if (!email || !groupName || !fee) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email/group/fee)' }, { status: 400 });
    }

    const html = templates.pasanakuJoin(name, groupName, fee);

    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX Pasanaku <info@redeconomix.com>',
      to: [email],
      bcc: ['info@redeconomix.com'], // Alerta para administración
      subject: `Confirmación de Ingreso: ${groupName} 🤝`,
      html: html,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
