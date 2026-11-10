import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, name, status } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Por ahora solo manejamos aprobación Gold, pero es extensible
    const html = templates.premiumApproval(name);

    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX Élite <info@redeconomix.com>',
      to: [email],
      subject: '✨¡Tu Membresía Premium GOLD ha sido aprobada!✨',
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
