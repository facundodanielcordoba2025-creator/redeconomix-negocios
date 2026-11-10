import { collection, getDocs, query, limit } from 'firebase/firestore';

export type YieldProfile = 'ganancia_segura' | 'renta_variable';

export interface YieldProfileConfig {
  id: YieldProfile;
  name: string;
  description: string;
  backing: string;
}

export type InvestmentTerm = 'diaria' | 'semanal' | 'quincenal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface TermConfig {
  id: InvestmentTerm;
  label: string;
  days: number;
  isMinimumRate: boolean;
  baseTnaSegura: number; // TNA for Option A (Segura)
  baseTnaVariable: number; // Base TNA for Option B (Variable)
}

export interface UserInvestment {
  id: string;
  profileId: YieldProfile;
  profileName: string;
  amount: number;
  term: InvestmentTerm;
  tna: number;
  baseTna: number;
  variableTna: number;
  startDate: string;
  accruedInterest: number;
  status: 'active' | 'rescue_requested' | 'rescued' | 'pendiente_pago';
  rescueDate?: string;
}

export const YIELD_PROFILES: YieldProfileConfig[] = [
  {
    id: 'ganancia_segura',
    name: 'Opción Segura',
    description: 'Rendimiento 100% asegurado por la empresa. Sabés exactamente cuánto vas a ganar sin ningún tipo de riesgo.',
    backing: 'Respaldo directo con fondos de la empresa.'
  },
  {
    id: 'renta_variable',
    name: 'Opción Variable (Mayor Ganancia)',
    description: 'Ganancia base asegurada, más un extra que dependerá de las ventas de la plataforma. Si a la empresa le va bien, vos ganás más.',
    backing: 'Participación en comisiones de ventas.'
  }
];

export const INVESTMENT_TERMS: TermConfig[] = [
  { id: 'diaria', label: 'Diaria', days: 1, isMinimumRate: true, baseTnaSegura: 0.025, baseTnaVariable: 0.030 },      // 2.5% vs 3.0%
  { id: 'semanal', label: 'Semanal', days: 7, isMinimumRate: true, baseTnaSegura: 0.035, baseTnaVariable: 0.040 },    // 3.5% vs 4.0%
  { id: 'quincenal', label: 'Quincenal', days: 15, isMinimumRate: true, baseTnaSegura: 0.045, baseTnaVariable: 0.050 }, // 4.5% vs 5.0%
  { id: 'mensual', label: 'Mensual', days: 30, isMinimumRate: false, baseTnaSegura: 0.12, baseTnaVariable: 0.14 },     // 12.0% vs 14.0%
  { id: 'trimestral', label: 'Trimestral', days: 90, isMinimumRate: false, baseTnaSegura: 0.135, baseTnaVariable: 0.165 }, // 13.5% vs 16.5%
  { id: 'semestral', label: 'Semestral', days: 180, isMinimumRate: false, baseTnaSegura: 0.15, baseTnaVariable: 0.18 },   // 15.0% vs 18.0%
  { id: 'anual', label: 'Anual', days: 365, isMinimumRate: false, baseTnaSegura: 0.165, baseTnaVariable: 0.22 },     // 16.5% vs 22.0%
];

// Async function to query real volume of products commercialization from both wholesale and general orders in Firestore
export async function getCompanySalesVolume(firestore: any): Promise<number> {
  if (!firestore) return 0;

  try {
    let total = 0;

    // 1. Fetch from wholesale orders
    try {
      const wholesalerCol = collection(firestore, 'orders_wholesaler');
      const wholesalerSnapshot = await getDocs(wholesalerCol);
      wholesalerSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.totalAmount) {
          total += Number(data.totalAmount);
        }
      });
    } catch (e) {
      console.warn("Permission or read issue with orders_wholesaler collection:", e);
    }

    // 2. Fetch from general/retail orders
    try {
      const ordersCol = collection(firestore, 'orders');
      const ordersSnapshot = await getDocs(ordersCol);
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.totalAmount) {
          total += Number(data.totalAmount);
        }
      });
    } catch (e) {
      console.warn("Permission or read issue with general orders collection:", e);
    }

    return total;
  } catch (error) {
    console.warn("Error querying real Firestore orders volume:", error);
    return 0;
  }
}

export interface YieldResult {
  tna: number;
  baseTna: number;
  variableTna: number;
  tea: number;
  days: number;
  accruedReturn: number;
  totalAmount: number;
  backingFormula: string;
}

// TRUE FINANCIAL MATHEMATICAL FUNCTION FOR THE TWO PROFILES
export function calculateTrueYield(
  amount: number,
  termId: InvestmentTerm,
  profileId: YieldProfile,
  salesVolume: number
): YieldResult {
  const term = INVESTMENT_TERMS.find(t => t.id === termId) || INVESTMENT_TERMS[0];
  
  let baseTna = 0;
  let variableTna = 0;
  let backingFormula = '';

  if (profileId === 'ganancia_segura') {
    // Option A: 100% Fixed and Guaranteed
    baseTna = term.baseTnaSegura;
    variableTna = 0;
    backingFormula = `Fórmula Renta Fija Asegurada (Garantía Corporativa del ${(baseTna * 100).toFixed(2)}% TNA)`;
  } else {
    // Option B: Hybrid (Base + Variable)
    baseTna = term.baseTnaVariable;
    
    if (term.isMinimumRate) {
      // Short terms don't get dynamic volume rates, kept at stable minimums
      variableTna = 0;
      backingFormula = `Tasa Mínima Corto Plazo (${(baseTna * 100).toFixed(1)}% TNA base)`;
    } else {
      // Dynamic modifier based on real sales volume of products commercialization (up to +6% to +8% max TNA boost)
      const maxVariableBoost = term.id === 'anual' ? 0.08 : term.id === 'semestral' ? 0.07 : term.id === 'trimestral' ? 0.065 : 0.06;
      // Formula: variable boost increases with sales volume capped at the max boost
      variableTna = Math.min(maxVariableBoost, (salesVolume / 100000000) * 0.05);
      
      backingFormula = `Fórmula Híbrida: ${(baseTna * 100).toFixed(1)}% TNA base + ${(variableTna * 100).toFixed(2)}% Variable por Ventas (Volumen: $${(salesVolume/1000000).toFixed(2)}M ARS)`;
    }
  }

  const tna = baseTna + variableTna;
  const days = term.days;
  
  // 1. Accrued Interest (Interés Simple Real: Capital * TNA * (Días / 365))
  const accruedReturn = amount * tna * (days / 365);
  const totalAmount = amount + accruedReturn;

  // 2. TEA (Tasa Efectiva Anual: TEA = (1 + TNA/m)^m - 1 where m is compound periods in year)
  const m = 365 / days;
  const tea = Math.pow(1 + (tna / m), m) - 1;

  return {
    tna,
    baseTna,
    variableTna,
    tea,
    days,
    accruedReturn,
    totalAmount,
    backingFormula
  };
}
