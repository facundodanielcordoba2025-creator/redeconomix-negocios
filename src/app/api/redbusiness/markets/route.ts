import { NextResponse } from 'next/server';

// Este es el "Corazón" técnico que conectará con Polymarket API en el futuro
// Por ahora, simulamos la respuesta estructurada para que el frontend cobre vida
export async function GET() {
  try {
    // Aquí es donde haríamos: await fetch('https://clob.polymarket.com/markets/...')
    
    const liveMarkets = [
      {
        id: 'inflation-arg',
        title: "¿Superará la inflación de Abril el 3.0%?",
        category: 'Economía Argentina',
        probYes: 68,
        probNo: 32,
        volume: '$1.2M',
        endDate: '5 días',
        isLocal: true,
      },
      {
        id: 'nba-2026',
        title: "¿Será Oklahoma City Thunder campeón de la NBA 2026?",
        category: 'Deportes',
        probYes: 47,
        probNo: 53,
        volume: '$290M',
        endDate: 'Junio 2026',
        isLocal: false,
      },
      {
        id: 'btc-80k',
        title: "¿Alcanzará Bitcoin los $80,000 en Abril?",
        category: 'Crypto',
        probYes: 37,
        probNo: 63,
        volume: '$31M',
        endDate: '30 Abril',
        isLocal: false,
      },
      {
        id: 'fed-chair',
        title: "¿Será Kevin Warsh confirmado como presidente de la Fed?",
        category: 'Macroeconomía',
        probYes: 95,
        probNo: 5,
        volume: '$32M',
        endDate: '31 Mayo',
        isLocal: false,
      },
      {
        id: 'esports-dota',
        title: "Dota 2: ¿Ganará Tundra Esports a Heroic?",
        category: 'Esports',
        probYes: 45,
        probNo: 55,
        volume: '$937K',
        endDate: 'Hoy 12:45',
        isLocal: false,
      }
    ];


    return NextResponse.json(liveMarkets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch live markets' }, { status: 500 });
  }
}
