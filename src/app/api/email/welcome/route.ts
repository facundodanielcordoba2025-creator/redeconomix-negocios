import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, name, accountType } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email/name)' }, { status: 400 });
    }

    const html = templates.welcome(name, accountType || 'Socio');

    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX <info@redeconomix.com>',
      to: [email],
      bcc: ['info@redeconomix.com'], // Copia para admin
      subject: `¡Bienvenido a RedEconomiX, ${name}! 👋`,
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
