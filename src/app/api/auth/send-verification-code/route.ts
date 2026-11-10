import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend-client';
import { templates } from '@/lib/email-templates';
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-otp-12345';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create a stateless verification token
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const payload = `${email}:${code}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    const token = `${payload}.${signature}`;

    // Enviar el correo con branding RedEconomiX
    const { error } = await resend.emails.send({
      from: 'RedEconomiX <info@redeconomix.com>',
      to: [email],
      subject: `Tu código de verificación RedEconomiX: ${code}`,
      html: templates.verificationCode(code),
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: 'Error enviando el correo' }, { status: 500 });
    }

    // Devolvemos el token firmado al cliente
    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error('OTP API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
