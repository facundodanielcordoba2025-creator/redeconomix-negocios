import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-otp-12345';

export async function POST(request: Request) {
  try {
    const { email, code, token } = await request.json();
    
    if (!email || !code || !token) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Split token into payload and signature
    const lastDotIndex = token.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const payload = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'El código ha sido alterado o es inválido' }, { status: 400 });
    }

    // Parse payload
    const [tokenEmail, tokenCode, tokenExpiresAt] = payload.split(':');

    if (Date.now() > parseInt(tokenExpiresAt)) {
      return NextResponse.json({ error: 'El código ha expirado' }, { status: 400 });
    }

    if (email !== tokenEmail) {
      return NextResponse.json({ error: 'El email no coincide' }, { status: 400 });
    }

    if (code !== tokenCode) {
      return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Verify API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
