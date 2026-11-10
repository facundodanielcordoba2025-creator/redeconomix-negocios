export interface ShippingOption {
  id: string;
  label: string;
  cost: number;
  estimatedDays: string;
  isFree?: boolean;
}

export function calculateShipping(postalCode: string, total: number): ShippingOption[] {
  // Common Mercado Libre style threshold for Free Shipping in Argentina 2024/2025
  const FREE_SHIPPING_THRESHOLD = 30000;
  
  if (!postalCode || postalCode.length < 4) {
    return [];
  }

  const cp = parseInt(postalCode.substring(0, 4));
  let baseCost = 8500; // Default for provinces
  let zone = 'Nacional';

  if (cp >= 1000 && cp <= 1499) {
    baseCost = 4200;
    zone = 'CABA';
  } else if (cp >= 1500 && cp <= 1999) {
    baseCost = 5500;
    zone = 'GBA / Buenos Aires';
  } else if (cp >= 9000 && cp <= 9999) {
    baseCost = 12500;
    zone = 'Patagonia / Extremo';
  } else if (cp >= 2000 && cp <= 2999) {
    baseCost = 7500;
    zone = 'Centro (Sta Fe / Cba)';
  }

  const isFree = total >= FREE_SHIPPING_THRESHOLD;

  return [
    {
      id: 'standard',
      label: `Envío Internacional (${zone})`,
      cost: isFree ? 0 : baseCost,
      estimatedDays: 'Demora estimada: 20 días',
      isFree: isFree
    },
    {
      id: 'priority',
      label: `Envío Prioritario (Aéreo)`,
      cost: isFree ? 4500 : baseCost + 6500,
      estimatedDays: 'Demora estimada: 12-15 días',
      isFree: false
    }
  ];
}
