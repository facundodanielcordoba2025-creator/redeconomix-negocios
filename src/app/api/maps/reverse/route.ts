import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    
    if (!lat || !lon) {
        return NextResponse.json({ error: 'Lat and lon are required' }, { status: 400 });
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyDwhYnY-E6cCMAKJz78dD1pQTLAdmgtif8';
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
