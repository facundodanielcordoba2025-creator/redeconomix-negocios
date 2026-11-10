import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/ml-img?q=iPhone+16+Pro+Max
 * Searches MercadoLibre public API (no auth required) and returns
 * the first product's thumbnail URL for a given query string.
 * Used as image fallback when catalog URLs are stale/broken.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');

  if (!q || q.trim().length < 3) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const mlUrl = `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=3`;

    const res = await fetch(mlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 }, // Cache 24h
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'ML API error' }, { status: 502 });
    }

    const data = await res.json();
    const results: any[] = data.results || [];

    // Find the first result that has a thumbnail
    const item = results.find(r => r.thumbnail && r.thumbnail.includes('mlstatic'));
    
    if (!item) {
      return NextResponse.json({ error: 'No results' }, { status: 404 });
    }

    // Return the high-quality version: replace -I. with -O. for larger image
    const thumbnail: string = item.thumbnail.replace('-I.', '-O.').replace('http:', 'https:');

    return NextResponse.json({
      url: thumbnail,
      title: item.title,
      id: item.id,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      }
    });

  } catch (err) {
    console.error('[ml-img] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
