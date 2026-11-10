import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for OSRM routing API.
 * Bypasses CORS issues when calling router.project-osrm.org from the browser.
 * Deployed on Vercel: no CORS headers needed since it's a same-origin call.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `https://router.project-osrm.org/${path}${search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'RedEconomiXApp/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache 60s — routes don't change that fast
    });

    if (!response.ok) {
      return new NextResponse(`OSRM upstream error: ${response.status}`, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('[routing-proxy] fetch error:', err);
    return new NextResponse('Routing service unavailable', { status: 502 });
  }
}
