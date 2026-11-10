import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content'],
  }
});

export async function GET(request: Request) {
  try {
    const feed = await parser.parseURL('https://www.clarin.com/rss/lo-ultimo/');

    let itemsProcessed = 0;
    const newsItems = [];

    for (const item of feed.items) {
      if (itemsProcessed >= 30) break; // Traeremos 30 noticias reales

      let imageUrl = item['media:content']?.$?.url || item.enclosure?.url;
      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&auto=format&fit=crop&q=80";
      }

      const PROVINCES = ['Todas', 'Nacionales', 'Salta', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Buenos Aires'];
      // Assign a province based on index to ensure all filters have some data to test with
      const assignedProvince = PROVINCES[(itemsProcessed % (PROVINCES.length - 1)) + 1]; // +1 to skip 'Todas'

      const newsData = {
        id: item.guid || (item.link ? Buffer.from(item.link).toString('base64') : Date.now().toString() + Math.random().toString()),
        title: item.title,
        summary: item.contentSnippet || item.content || 'Para leer la nota completa, hacé clic en Leer más.',
        source: "Clarín",
        sourceLogo: "https://www.clarin.com/favicon.ico",
        province: assignedProvince,
        originalUrl: item.link,
        imageUrl: imageUrl,
        createdAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      };

      newsItems.push(newsData);
      itemsProcessed++;
    }

    return NextResponse.json({ 
      success: true, 
      news: newsItems
    });
  } catch (error: any) {
    console.error('Error in real scraper:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
