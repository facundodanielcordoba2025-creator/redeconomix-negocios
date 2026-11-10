import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const provincia = searchParams.get('provincia');
    
    if (!provincia) {
        return NextResponse.json({ error: "Falta el parámetro provincia" }, { status: 400 });
    }

    try {
        const response = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(provincia)}&max=1000`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}
