import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Radio Browser API recommends setting a User-Agent
        const res = await fetch('https://de1.api.radio-browser.info/json/stations/bycountry/argentina?limit=100&order=clickcount&reverse=true', {
            headers: {
                'User-Agent': 'RedEconomiX/1.0 (contact@redeconomix.com)'
            },
            next: { revalidate: 3600 } // Cache for 1 hour to prevent spamming the API
        });
        
        if (!res.ok) {
            throw new Error(`API responded with status ${res.status}`);
        }
        
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Radio API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch radios' }, { status: 500 });
    }
}
