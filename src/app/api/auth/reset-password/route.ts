import { NextResponse } from 'next/server';
import { initializeAdmin } from '@/lib/firebase-admin';
import { resend } from '@/lib/resend-client';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const admin = initializeAdmin();
    // 1. Generate Firebase Password Reset Link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: 'https://www.redeconomix.com/login', // Return URL after success
    });

    // 2. Send Premium Email via Resend
    const { data, error } = await resend.emails.send({
      from: 'RedEconomiX <info@redeconomix.com>',
      to: [email],
      subject: 'Restablecer Contraseña - RedEconomiX',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
            .header { background: #FF0000; padding: 40px; text-align: center; }
            .content { padding: 40px; text-align: center; }
            .logo { color: white; font-weight: 900; font-size: 32px; letter-spacing: -2px; font-style: italic; }
            .h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 16px; text-transform: uppercase; }
            .p { color: #64748b; line-height: 1.6; margin-bottom: 32px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .btn { background: #000; color: white !important; padding: 20px 40px; border-radius: 16px; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
            .footer { padding: 40px; text-align: center; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">RE<span style="font-size: 40px; margin-left: -2px;">X</span></div>
            </div>
            <div class="content">
              <div class="h1">Recuperit .</div>
              <div class="p">Has solicitado un enlace para restablecer tu contraseña en RedEconomiX. Haz clic en el siguiente botón para continuar.</div>
              <a href="${resetLink}" class="btn">Cambiar Contraseña</a>
            </div>
            <div class="footer">
              © 2026 REDECONOMIX • SEGURIDAD ELITE
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('System Error:', error);
    return NextResponse.json({ error: 'Usuario no encontrado o error de sistema' }, { status: 500 });
  }
}
