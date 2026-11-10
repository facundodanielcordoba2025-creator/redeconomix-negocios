'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Sparkles as SparklesIcon } from 'lucide-react';

interface Rates {
  oficial: number;
  blue: number;
  redMayorista: number;
  lastUpdated: string;
}

// Simple cache helper
const getCachedRates = (): Rates | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem('dollarRates');
  if (cached) {
    const data = JSON.parse(cached);
    // Check if cache is older than 24 hours
    if (new Date().getTime() - new Date(data.lastUpdated).getTime() > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('dollarRates');
      return null;
    }
    return data;
  }
  return null;
};

const setCachedRates = (rates: Rates) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dollarRates', JSON.stringify(rates));
  } catch (error) {
    console.error("Could not set cache for dollar rates:", error);
  }
};

export function DollarPromoBar() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedRates();
    if (cached) {
        setRates(cached);
        setIsLoading(false);
    }

    const fetchRates = async () => {
      try {
        const [oficialRes, blueRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://dolarapi.com/v1/dolares/blue')
        ]);

        if (!oficialRes.ok || !blueRes.ok) {
          throw new Error('Failed to fetch dollar rates');
        }

        const oficialData = await oficialRes.json();
        const blueData = await blueRes.json();

        const newRates: Rates = {
          oficial: oficialData.venta,
          blue: blueData.venta,
          redMayorista: oficialData.venta * 1.15,
          lastUpdated: new Date().toISOString()
        };

        setRates(newRates);
        setCachedRates(newRates);
      } catch (error) {
        console.error("Dollar API Error:", error);
        // If fetch fails, the component will try to use cached rates if available.
        if (!rates) { // only set to null if there's no data at all
          setRates(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const renderContent = () => {
    if (isLoading && !rates) {
      return <span className="px-4">Cargando cotizaciones...</span>;
    }
    if (!rates) {
      return <span className="px-4">Cotizaciones no disponibles.</span>;
    }
    
    const promoText = "PROMOCIÓN ESPECIAL – Si compras en dólares en Mayorista Punta, TUS DÓLARES VALEN MÁS.";
    const oficialText = `Dólar Oficial (B.Nación): $${rates.oficial.toFixed(2)}`;
    const blueText = `Dólar Blue: $${rates.blue.toFixed(2)}`;
    const redMayoristaText = `Dólar RedEconomiX: $${rates.redMayorista.toFixed(2)} (+15%)`;
    const acceptText = "Aceptamos todo tipo de dólares.";
    
    return (
      <>
        <SparklesIcon className="mr-2 h-4 w-4 shrink-0 text-yellow-300" />
        <span className="shrink-0">{promoText}</span>
        <span className="mx-4 shrink-0 text-muted-foreground/50">|</span>
        <DollarSign className="mr-2 h-4 w-4 shrink-0 text-green-400" />
        <span className="shrink-0">{oficialText}</span>
        <span className="mx-4 shrink-0 text-muted-foreground/50">|</span>
        <TrendingUp className="mr-2 h-4 w-4 shrink-0 text-blue-400" />
        <span className="shrink-0">{blueText}</span>
        <span className="mx-4 shrink-0 text-muted-foreground/50">|</span>
        <strong className="flex items-center shrink-0 text-primary-foreground">
          <SparklesIcon className="mr-2 h-4 w-4 shrink-0 text-yellow-300" />
          {redMayoristaText}
        </strong>
        <span className="mx-4 shrink-0 text-muted-foreground/50">|</span>
        <span className="shrink-0">{acceptText}</span>
        <span className="inline-block w-16 shrink-0" />
      </>
    );
  };
  
  const textContent = renderContent();

  return (
    <div className="bg-primary text-primary-foreground text-sm font-semibold w-full overflow-hidden">
      <div className="flex py-2">
        <div className="flex animate-marquee min-w-full flex-shrink-0 items-center">
            {textContent}
        </div>
        <div className="flex animate-marquee min-w-full flex-shrink-0 items-center" aria-hidden="true">
            {textContent}
        </div>
      </div>
    </div>
  );
}
