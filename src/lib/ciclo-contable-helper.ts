import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface CicloContableRange {
  startDate: Date;
  endDate: Date;
  label: string;
  isLiquidationWindow: boolean;
}

/**
 * Calculates the 10-to-10 accounting cycle for any given date.
 * If current day is between 1 and 10, the cycle runs from the 10th of previous month to 10th of current month.
 * If current day is after 10, the cycle runs from the 10th of current month to 10th of next month.
 */
export function getCicloContableRange(referenceDate: Date = new Date()): CicloContableRange {
  const day = referenceDate.getDate();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let startDate: Date;
  let endDate: Date;

  if (day < 10) {
    // e.g. July 5 -> Cycle: June 10 to July 10
    startDate = new Date(year, month - 1, 10, 0, 0, 0, 0);
    endDate = new Date(year, month, 10, 23, 59, 59, 999);
  } else {
    // e.g. July 25 -> Cycle: July 10 to August 10
    startDate = new Date(year, month, 10, 0, 0, 0, 0);
    endDate = new Date(year, month + 1, 10, 23, 59, 59, 999);
  }

  // The 10 days window right after the 10th (1st to 10th before cycle close is for payroll/taxes)
  const isLiquidationWindow = day >= 1 && day <= 10;

  const startFmt = format(startDate, "d 'de' MMMM", { locale: es });
  const endFmt = format(endDate, "d 'de' MMMM yyyy", { locale: es });

  return {
    startDate,
    endDate,
    label: `${startFmt} - ${endFmt}`,
    isLiquidationWindow
  };
}

/**
 * Returns Spanish day name for a given date
 */
export function getNombreDiaSemana(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Groups sales items by day of the week to analyze consumption habits.
 */
export function analyzeConsumptionHabitsByDay(sales: any[]) {
  const daysMap: Record<string, { dayName: string; totalAmount: number; totalUnits: number; topProducts: Record<string, { name: string; qty: number; total: number }> }> = {
    'Lunes': { dayName: 'Lunes', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Martes': { dayName: 'Martes', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Miércoles': { dayName: 'Miércoles', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Jueves': { dayName: 'Jueves', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Viernes': { dayName: 'Viernes', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Sábado': { dayName: 'Sábado', totalAmount: 0, totalUnits: 0, topProducts: {} },
    'Domingo': { dayName: 'Domingo', totalAmount: 0, totalUnits: 0, topProducts: {} },
  };

  if (!sales) return daysMap;

  sales.forEach(sale => {
    const saleDate = sale.soldAt?.toDate ? sale.soldAt.toDate() : new Date(sale.soldAt || sale.transferredAt || Date.now());
    const dayName = getNombreDiaSemana(saleDate);

    if (daysMap[dayName]) {
      daysMap[dayName].totalAmount += sale.totalAmount || sale.amount || 0;

      if (Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const qty = item.quantity || item.qty || 1;
          daysMap[dayName].totalUnits += qty;

          const pName = item.name || 'Producto';
          if (!daysMap[dayName].topProducts[pName]) {
            daysMap[dayName].topProducts[pName] = { name: pName, qty: 0, total: 0 };
          }
          daysMap[dayName].topProducts[pName].qty += qty;
          daysMap[dayName].topProducts[pName].total += (item.price || 0) * qty;
        });
      }
    }
  });

  return daysMap;
}
