import { NextRequest, NextResponse } from 'next/server';

// Caché en memoria para evitar llamadas redundantes a la API de traducción
const translationCache = new Map<string, string>();

async function translateToSpanish(text: string): Promise<string> {
  if (!text) return '';
  
  const queryText = text.trim();
  if (translationCache.has(queryText)) {
    return translationCache.get(queryText)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(queryText)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 86400 } // Cachear la llamada de traducción por 24 horas
    });

    if (!res.ok) throw new Error("Google Translate API error");
    const json = await res.json();
    
    if (json && json[0] && json[0][0] && json[0][0][0]) {
      const translated = json[0][0][0];
      translationCache.set(queryText, translated);
      return translated;
    }
    return text;
  } catch (error) {
    console.error(`Error translating text "${text}":`, error);
    return text;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const keywords = searchParams.get('keywords');

  try {
    // Solicitamos un pool grande de 200 eventos activos para poder filtrar correctamente por categorías reales
    const response = await fetch("https://gamma-api.polymarket.com/events?closed=false&limit=200&active=true", {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cachear la respuesta cruda de Polymarket por 5 minutos
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Polymarket API error' }, { status: response.status });
    }

    let data = await response.json();

    // FILTRADO POR CATEGORÍA (TAG): El endpoint de Polymarket ignora el parámetro "?tag=",
    // por lo que filtramos los eventos en nuestro servidor verificando su array de tags.
    if (tag) {
      data = data.filter((event: any) => {
        if (!event.tags) return false;
        
        const targetTag = tag.toLowerCase().trim();
        
        return event.tags.some((t: any) => {
          const tagSlug = (t.slug || '').toLowerCase();
          const tagLabel = (t.label || '').toLowerCase();
          
          return tagSlug === targetTag || 
                 tagSlug.includes(targetTag) || 
                 tagLabel === targetTag || 
                 tagLabel.includes(targetTag);
        });
      });
    }

    // FILTRADO POR PALABRAS CLAVE: Para casos especiales como Argentina / Fútbol
    if (keywords) {
      const kws = keywords.split(',').map(k => k.trim().toLowerCase());
      data = data.filter((event: any) => {
        const searchText = ((event.title || '') + ' ' + (event.slug || '')).toLowerCase();
        return kws.some(k => searchText.includes(k));
      });
    }

    // Limitar al número solicitado de tarjetas
    const slicedData = data.slice(0, limit);

    // Traducir los títulos del pool filtrado en paralelo
    const translatedEvents = await Promise.all(
      slicedData.map(async (event: any) => {
        // En lugar de usar el título genérico del evento de Polymarket (ej. "Next James Bond"),
        // usamos la pregunta específica del mercado para que tenga sentido el botón "SÍ / NO"
        // (ej. "Will Aaron Taylor-Johnson be the next James Bond?")
        let primaryQuestion = event.title;
        
        if (event.markets && event.markets.length > 0 && event.markets[0].question) {
          primaryQuestion = event.markets[0].question;
        } else if (!primaryQuestion && event.slug) {
          primaryQuestion = event.slug.replace(/-/g, ' ');
        }
        
        // Traducimos la pregunta concreta al español
        event.title = await translateToSpanish(primaryQuestion);
        return event;
      })
    );

    return NextResponse.json(translatedEvents);
  } catch (error) {
    console.error('Polymarket proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Polymarket' }, { status: 500 });
  }
}
