import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Allowlist: proxy from trusted catalog domains
  const allowedHosts = [
    'mlstatic.com',
    'vtexassets.com',
    'vteximg.com.br',
    'firebasestorage.googleapis.com',
    'images.unsplash.com',
    'cloudinary.com',
    'res.cloudinary.com',
    'googleusercontent.com',
    'picsum.photos',
    'fastly.picsum.photos',
    'vtex.com.ar',
    'apple.com',
    'samsung.com',
    'images.samsung.com',
    'fravega.com',
    'images.fravega.com',
    'tcl.com',
    'aws-obg-image-lb-2.tcl.com',
    'playstation.com',
    'gmedia.playstation.com',
    'nintendo.com',
    'assets.nintendo.com',
    'xboxservices.com',
    'assets.xboxservices.com',
    'pravatar.cc',
    'akamaized.net',
    'cdn.shopify.com',
  ];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const isAllowed = allowedHosts.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`));
  if (!isAllowed) {
    return new NextResponse('Domain not allowed', { status: 403 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      redirect: 'follow',
      headers: {
        // No Referer header → bypasses ML hotlink block
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 86400 }, // Cache 24h on the server
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/webp';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Proxy': 'RedEconomiX-ImgProxy',
      },
    });
  } catch (err) {
    console.error('[img-proxy] Fetch error:', err);
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
