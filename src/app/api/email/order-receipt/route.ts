import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    const { email, name, orderId, amount, items } = await request.json();

    if (!email || !orderId || !amount) {
      return NextResponse.json({ error: 'Faltan datos requeridos para el comprobante' }, { status: 400 });
    }

    const html = templates.orderReceipt(name, orderId, amount, items);

    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX Ventas <info@redeconomix.com>',
      to: [email],
      bcc: ['info@redeconomix.com'], // Copia para admin/ventas
      subject: `Comprobante de Compra #${orderId.slice(-6).toUpperCase()} 🧾`,
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
