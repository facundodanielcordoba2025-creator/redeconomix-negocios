export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  endDate: string;
  volume: number;
  probYes: number;
  probNo: number;
  image?: string;
  category?: string;
}

// Diccionario de traducciones comunes EN→ES
const translations: Record<string, string> = {
  // Geopolítica
  'Trump': 'Trump',
  'Putin': 'Putin',
  'Macron': 'Macron',
  'Biden': 'Biden',
  'China': 'China',
  'Russia': 'Rusia',
  'Ukraine': 'Ucrania',
  'Israel': 'Israel',
  'Iran': 'Irán',
  'NATO': 'OTAN',
  'United States': 'Estados Unidos',
  'United Kingdom': 'Reino Unido',
  'European Union': 'Unión Europea',
  'World War': 'Guerra Mundial',
  'ceasefire': 'alto el fuego',
  'sanctions': 'sanciones',
  'peace deal': 'acuerdo de paz',
  'invasion': 'invasión',
  'nuclear': 'nuclear',
  'missile': 'misil',
  'war': 'guerra',
  'election': 'elección',
  'president': 'presidente',
  'Prime Minister': 'Primer Ministro',
  // Economía / Finanzas
  'Federal Reserve': 'Reserva Federal',
  'interest rate': 'tasa de interés',
  'rate cut': 'recorte de tasas',
  'rate hike': 'suba de tasas',
  'inflation': 'inflación',
  'recession': 'recesión',
  'GDP': 'PIB',
  'unemployment': 'desempleo',
  'stock market': 'mercado bursátil',
  'Bitcoin': 'Bitcoin',
  'Ethereum': 'Ethereum',
  'crypto': 'cripto',
  'IPO': 'OPI',
  'S&P 500': 'S&P 500',
  'Nasdaq': 'Nasdaq',
  'Dow Jones': 'Dow Jones',
  'oil price': 'precio del petróleo',
  'gold price': 'precio del oro',
  'dollar': 'dólar',
  'tariff': 'arancel',
  'trade war': 'guerra comercial',
  'debt ceiling': 'techo de deuda',
  'default': 'default',
  'bankruptcy': 'bancarrota',
  'merger': 'fusión',
  'acquisition': 'adquisición',
  // Pop Culture
  'Oscar': 'Oscar',
  'Grammy': 'Grammy',
  'Super Bowl': 'Super Bowl',
  'World Cup': 'Copa del Mundo',
  'Olympic': 'Olímpico',
  'champion': 'campeón',
  'winner': 'ganador',
  'movie': 'película',
  'album': 'álbum',
  'concert': 'concierto',
  'Netflix': 'Netflix',
  'Disney': 'Disney',
  'Marvel': 'Marvel',
  'Taylor Swift': 'Taylor Swift',
  'Beyoncé': 'Beyoncé',
  'Drake': 'Drake',
  'Kanye': 'Kanye',
  'Elon Musk': 'Elon Musk',
  // Deportes / Fútbol
  'FIFA': 'FIFA',
  'Champions League': 'Champions League',
  'Premier League': 'Premier League',
  'La Liga': 'La Liga',
  'Serie A': 'Serie A',
  'Bundesliga': 'Bundesliga',
  'Copa America': 'Copa América',
  'Copa Libertadores': 'Copa Libertadores',
  'Messi': 'Messi',
  'goal': 'gol',
  'transfer': 'transferencia',
  'coach': 'director técnico',
  'soccer': 'fútbol',
  'football': 'fútbol',
  // Términos generales
  'Will': '¿',
  'before': 'antes de',
  'after': 'después de',
  'by': 'para',
  'in': 'en',
  'Yes': 'Sí',
  'No': 'No',
  'above': 'por encima de',
  'below': 'por debajo de',
  'more than': 'más de',
  'less than': 'menos de',
  'at least': 'al menos',
  'this year': 'este año',
  'next year': 'el próximo año',
  'this month': 'este mes',
};

function translateTitle(title: string): string {
  return title;
}

function parseEvent(event: any, category?: string): PolymarketEvent {
  let probYes = 50;
  let probNo = 50;

  let outcomePricesStr = event.outcomePrices;
  if (!outcomePricesStr && event.markets && event.markets.length > 0) {
    outcomePricesStr = event.markets[0].outcomePrices;
  }

  if (outcomePricesStr) {
    try {
      const prices = JSON.parse(outcomePricesStr);
      if (prices.length >= 2) {
        probYes = Math.round(parseFloat(prices[0]) * 100);
        probNo = Math.round(parseFloat(prices[1]) * 100);
      }
    } catch (e) { /* default 50/50 */ }
  }

  let volume = 0;
  if (event.volume) volume = parseFloat(event.volume);
  else if (event.volumeNum) volume = event.volumeNum;

  let finalTitle = event.title;
  if (!finalTitle && event.slug) {
    finalTitle = event.slug.replace(/-/g, ' ');
  }

  return {
    id: event.id || Math.random().toString(),
    title: translateTitle(finalTitle || 'Mercado sin título'),
    slug: event.slug || 'market',
    endDate: event.endDateIso || event.endDate || new Date(Date.now() + 86400000).toISOString(),
    volume,
    probYes,
    probNo,
    image: event.image || event.icon || undefined,
    category,
  };
}

export type CategorySlug = 'pop-culture' | 'economy' | 'finance' | 'geopolitics' | 'argentina' | 'futbol-ar';

export interface CategoryConfig {
  slug: CategorySlug;
  label: string;
  tag?: string; // Tag de la API de Polymarket
  keywords?: string[]; // Keywords para filtrar por título
  fallbackData?: PolymarketEvent[]; // Datos fallback si no hay resultados
}

export const CATEGORIES: CategoryConfig[] = [
  { slug: 'pop-culture', label: 'Cultura Pop', tag: 'pop-culture' },
  { slug: 'economy', label: 'Economía', tag: 'economy' },
  { slug: 'finance', label: 'Finanzas', tag: 'finance' },
  { slug: 'geopolitics', label: 'Geopolítica', tag: 'geopolitics' },
  {
    slug: 'argentina',
    label: 'Argentina',
    keywords: ['argentina', 'milei', 'buenos aires', 'peso argentino', 'bcra', 'kirchner', 'peronist', 'latam', 'south america', 'latin america', 'mercosur'],
    fallbackData: [
      { id: 'ar1', title: '¿El BCRA bajará la tasa de interés en Junio 2026?', slug: 'bcra-tasa', endDate: new Date(Date.now() + 86400000 * 15).toISOString(), volume: 320000, probYes: 62, probNo: 38 },
      { id: 'ar2', title: '¿Inflación de Mayo menor al 2%?', slug: 'inflacion-mayo', endDate: new Date(Date.now() + 86400000 * 10).toISOString(), volume: 450000, probYes: 35, probNo: 65 },
      { id: 'ar3', title: '¿Milei gana las legislativas 2025?', slug: 'milei-legislativas', endDate: new Date(Date.now() + 86400000 * 90).toISOString(), volume: 890000, probYes: 55, probNo: 45 },
      { id: 'ar4', title: '¿Dólar blue supera los $1.500 en Junio?', slug: 'dolar-blue', endDate: new Date(Date.now() + 86400000 * 30).toISOString(), volume: 720000, probYes: 40, probNo: 60 },
      { id: 'ar5', title: '¿Riesgo país baja de 600 puntos en 2026?', slug: 'riesgo-pais', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 280000, probYes: 70, probNo: 30 },
      { id: 'ar6', title: '¿Argentina acuerda nuevo programa con el FMI?', slug: 'fmi-argentina', endDate: new Date(Date.now() + 86400000 * 45).toISOString(), volume: 560000, probYes: 78, probNo: 22 },
      { id: 'ar7', title: '¿Levantamiento total del cepo cambiario en 2026?', slug: 'cepo-2026', endDate: new Date(Date.now() + 86400000 * 120).toISOString(), volume: 1200000, probYes: 48, probNo: 52 },
      { id: 'ar8', title: '¿YPF supera los $40 USD por acción?', slug: 'ypf-accion', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 340000, probYes: 55, probNo: 45 },
      { id: 'ar9', title: '¿Vaca Muerta supera 1M barriles/día en 2026?', slug: 'vaca-muerta', endDate: new Date(Date.now() + 86400000 * 180).toISOString(), volume: 670000, probYes: 42, probNo: 58 },
      { id: 'ar10', title: '¿Massa se presenta como candidato en 2027?', slug: 'massa-2027', endDate: new Date(Date.now() + 86400000 * 365).toISOString(), volume: 190000, probYes: 60, probNo: 40 },
      { id: 'ar11', title: '¿Aerolíneas Argentinas se privatiza en 2026?', slug: 'aerolineas-privatiza', endDate: new Date(Date.now() + 86400000 * 200).toISOString(), volume: 410000, probYes: 30, probNo: 70 },
      { id: 'ar12', title: '¿Banco Nación lanza crédito hipotecario UVA mejorado?', slug: 'credito-uva', endDate: new Date(Date.now() + 86400000 * 30).toISOString(), volume: 150000, probYes: 65, probNo: 35 },
      { id: 'ar13', title: '¿Exportaciones agrícolas superan $45B USD en 2026?', slug: 'agro-export', endDate: new Date(Date.now() + 86400000 * 150).toISOString(), volume: 230000, probYes: 50, probNo: 50 },
      { id: 'ar14', title: '¿Argentina entra al BRICS oficialmente?', slug: 'argentina-brics', endDate: new Date(Date.now() + 86400000 * 90).toISOString(), volume: 380000, probYes: 25, probNo: 75 },
      { id: 'ar15', title: '¿Salario mínimo supera los $500.000 ARS?', slug: 'salario-minimo', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 290000, probYes: 80, probNo: 20 },
      { id: 'ar16', title: '¿La pobreza baja del 40% según INDEC?', slug: 'pobreza-indec', endDate: new Date(Date.now() + 86400000 * 120).toISOString(), volume: 510000, probYes: 45, probNo: 55 },
      { id: 'ar17', title: '¿Se aprueba la reforma laboral completa?', slug: 'reforma-laboral', endDate: new Date(Date.now() + 86400000 * 90).toISOString(), volume: 420000, probYes: 35, probNo: 65 },
      { id: 'ar18', title: '¿Litio argentino supera $20B en exportaciones?', slug: 'litio-export', endDate: new Date(Date.now() + 86400000 * 240).toISOString(), volume: 180000, probYes: 30, probNo: 70 },
      { id: 'ar19', title: '¿Se reactiva el tren Buenos Aires - Rosario?', slug: 'tren-ba-rosario', endDate: new Date(Date.now() + 86400000 * 365).toISOString(), volume: 95000, probYes: 20, probNo: 80 },
      { id: 'ar20', title: '¿Mendoza legaliza la minería a cielo abierto?', slug: 'mineria-mendoza', endDate: new Date(Date.now() + 86400000 * 180).toISOString(), volume: 110000, probYes: 40, probNo: 60 },
    ]
  },
  {
    slug: 'futbol-ar',
    label: 'Fútbol AR',
    keywords: ['soccer', 'football', 'fifa', 'copa', 'messi', 'boca', 'river', 'argentina soccer', 'world cup', 'champions league', 'premier league', 'la liga'],
    fallbackData: [
      { id: 'fa1', title: '¿Argentina retiene la Copa del Mundo 2026?', slug: 'arg-mundial-2026', endDate: '2026-07-19T00:00:00Z', volume: 5200000, probYes: 18, probNo: 82 },
      { id: 'fa2', title: '¿Messi juega el Mundial 2026?', slug: 'messi-mundial', endDate: '2026-06-11T00:00:00Z', volume: 3800000, probYes: 72, probNo: 28 },
      { id: 'fa3', title: '¿Boca Juniors gana la Copa Libertadores 2026?', slug: 'boca-libertadores', endDate: new Date(Date.now() + 86400000 * 180).toISOString(), volume: 1200000, probYes: 12, probNo: 88 },
      { id: 'fa4', title: '¿River Plate gana la Copa Libertadores 2026?', slug: 'river-libertadores', endDate: new Date(Date.now() + 86400000 * 180).toISOString(), volume: 1100000, probYes: 15, probNo: 85 },
      { id: 'fa5', title: '¿Racing gana la Liga Profesional 2026?', slug: 'racing-liga', endDate: new Date(Date.now() + 86400000 * 120).toISOString(), volume: 450000, probYes: 10, probNo: 90 },
      { id: 'fa6', title: '¿Garnacho es transferido a un club top europeo?', slug: 'garnacho-transfer', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 890000, probYes: 65, probNo: 35 },
      { id: 'fa7', title: '¿Enzo Fernández gana Balón de Oro 2026?', slug: 'enzo-balon-oro', endDate: new Date(Date.now() + 86400000 * 200).toISOString(), volume: 680000, probYes: 8, probNo: 92 },
      { id: 'fa8', title: '¿Julián Álvarez supera 30 goles en 2026?', slug: 'julian-goles', endDate: new Date(Date.now() + 86400000 * 200).toISOString(), volume: 520000, probYes: 35, probNo: 65 },
      { id: 'fa9', title: '¿Superclásico: Boca gana el próximo vs River?', slug: 'superclasico', endDate: new Date(Date.now() + 86400000 * 45).toISOString(), volume: 2100000, probYes: 42, probNo: 58 },
      { id: 'fa10', title: '¿La AFA implementa el VAR en todas las canchas?', slug: 'var-afa', endDate: new Date(Date.now() + 86400000 * 90).toISOString(), volume: 310000, probYes: 55, probNo: 45 },
      { id: 'fa11', title: '¿Estudiantes de La Plata clasifica a Libertadores 2027?', slug: 'edlp-libertadores', endDate: new Date(Date.now() + 86400000 * 150).toISOString(), volume: 190000, probYes: 30, probNo: 70 },
      { id: 'fa12', title: '¿Independiente vuelve a Primera División?', slug: 'independiente-primera', endDate: new Date(Date.now() + 86400000 * 90).toISOString(), volume: 760000, probYes: 75, probNo: 25 },
      { id: 'fa13', title: '¿San Lorenzo gana algún título en 2026?', slug: 'san-lorenzo-titulo', endDate: new Date(Date.now() + 86400000 * 200).toISOString(), volume: 220000, probYes: 15, probNo: 85 },
      { id: 'fa14', title: '¿Scaloni renueva contrato hasta 2030?', slug: 'scaloni-contrato', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 480000, probYes: 60, probNo: 40 },
      { id: 'fa15', title: '¿Argentina llega a la final del Mundial 2026?', slug: 'arg-final-mundial', endDate: '2026-07-19T00:00:00Z', volume: 4100000, probYes: 32, probNo: 68 },
      { id: 'fa16', title: '¿Talleres de Córdoba gana la Copa Argentina?', slug: 'talleres-copa', endDate: new Date(Date.now() + 86400000 * 120).toISOString(), volume: 170000, probYes: 18, probNo: 82 },
      { id: 'fa17', title: '¿El fútbol femenino argentino llega a TV abierta?', slug: 'futfem-tv', endDate: new Date(Date.now() + 86400000 * 180).toISOString(), volume: 95000, probYes: 40, probNo: 60 },
      { id: 'fa18', title: '¿Vélez Sarsfield gana la Recopa Sudamericana?', slug: 'velez-recopa', endDate: new Date(Date.now() + 86400000 * 60).toISOString(), volume: 280000, probYes: 45, probNo: 55 },
      { id: 'fa19', title: '¿Di María vuelve a Rosario Central?', slug: 'dimaria-central', endDate: new Date(Date.now() + 86400000 * 30).toISOString(), volume: 620000, probYes: 25, probNo: 75 },
      { id: 'fa20', title: '¿Lautaro Martínez es máximo goleador de Serie A?', slug: 'lautaro-goleador', endDate: new Date(Date.now() + 86400000 * 30).toISOString(), volume: 410000, probYes: 20, probNo: 80 },
    ]
  }
];

async function fetchByTag(tag: string, limit: number = 25): Promise<PolymarketEvent[]> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const baseUrl = isBrowser ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/polymarket?tag=${tag}&limit=${limit}`);
    if (!response.ok) throw new Error(`API error for tag ${tag}`);
    const data = await response.json();
    return data
      .map((event: any) => parseEvent(event, tag))
      .filter((e: PolymarketEvent) => e.volume > 0 && e.title.length > 3);
  } catch (error) {
    console.error(`Error fetching tag "${tag}":`, error);
    return [];
  }
}

async function fetchByKeywords(keywords: string[], limit: number = 25): Promise<PolymarketEvent[]> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const baseUrl = isBrowser ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/polymarket?limit=200&keywords=${encodeURIComponent(keywords.join(','))}`);
    if (!response.ok) throw new Error('API error for keyword search');
    const data = await response.json();
    const allEvents = data.map((event: any) => parseEvent(event));
    
    return allEvents
      .filter((e: PolymarketEvent) => e.volume > 0)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching by keywords:', error);
    return [];
  }
}

export async function fetchAllCategories(): Promise<Record<CategorySlug, PolymarketEvent[]>> {
  const results: Record<string, PolymarketEvent[]> = {};

  const promises = CATEGORIES.map(async (cat) => {
    let events: PolymarketEvent[] = [];

    if (cat.tag) {
      events = await fetchByTag(cat.tag, 25);
    } else if (cat.keywords) {
      events = await fetchByKeywords(cat.keywords, 25);
    }

    // Si no hay suficientes eventos, usar datos fallback
    if (events.length < 5 && cat.fallbackData) {
      events = [...events, ...cat.fallbackData].slice(0, 25);
    }

    results[cat.slug] = events;
  });

  await Promise.all(promises);
  return results as Record<CategorySlug, PolymarketEvent[]>;
}

// Mantener compatibilidad con la función original
export async function fetchLiveMarkets(): Promise<PolymarketEvent[]> {
  try {
    const isBrowser = typeof window !== 'undefined';
    const baseUrl = isBrowser ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const response = await fetch(`${baseUrl}/api/polymarket?limit=100`);
    if (!response.ok) throw new Error("Failed to fetch Polymarket API");
    const data = await response.json();
    return data
      .map((event: any) => parseEvent(event))
      .filter((e: PolymarketEvent) => e.volume > 0 && e.title.length > 3);
  } catch (error) {
    console.error("Polymarket fetch error:", error);
    return [];
  }
}
