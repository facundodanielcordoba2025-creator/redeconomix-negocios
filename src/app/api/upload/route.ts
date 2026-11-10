import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const bucket = formData.get('bucket') as string;
    const idToken = formData.get('idToken') as string;

    if (!file || !path || !bucket) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // El servidor (Edge/Node) no tiene restricciones de CORS para hablar con Google
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodeURIComponent(path)}`;
    
    console.log(`[API PROXY] Subiendo a Firebase: ${path}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': file.type || 'image/jpeg'
      },
      body: file
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error(`[API PROXY] Error Google:`, errorData);
        return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[API PROXY] Error Crítico:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
