'use client';

import * as XLSX from 'xlsx';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, DollarSign, Package, TrendingUp, AlertCircle, 
  Calendar, Store, CalendarRange, Sparkles, CheckCircle2, 
  Receipt, ArrowUpRight, ShoppingCart, FileText, FileDown, Clock, UserCheck, Star, Users
} from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { startOfDay, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const COLORS = ['#FF0000', '#10B981', '#3B82F6', '#F59E0B'];
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  getCicloContableRange, 
  analyzeConsumptionHabitsByDay 
} from '@/lib/ciclo-contable-helper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/use-role';
import { RoleGuard } from '@/components/role-guard';
import { computeProductBranchStock } from '@/lib/offline-db';

export default function RetailerDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();

  const [periodFilter, setPeriodFilter] = useState<'CYCLE' | 'TODAY' | 'CUSTOM' | 'LAST_7_DAYS'>('CYCLE');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string | null>(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('ALL');

  // Dates
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const cicloRange = useMemo(() => getCicloContableRange(new Date()), []);

  // Branches Query
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', effectiveRetailerId));
  }, [firestore, user]);
  const { data: branches } = useCollection(branchesQuery);

  // Daily Operations Query (POS / Fiado)
  const opsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const dateFrom = periodFilter === 'TODAY' ? todayStart : cicloRange.startDate;
    const dateTo = periodFilter === 'TODAY' ? new Date() : cicloRange.endDate;

    return query(collection(firestore, "retailer_daily_operations"), where("retailerId", "==", effectiveRetailerId));
  }, [firestore, user, periodFilter, todayStart, cicloRange]);

  const { data: rawOpsUnfiltered, isLoading: isLoadingOps } = useCollection(opsQuery);
  const rawOps = React.useMemo(() => {
    if (!rawOpsUnfiltered) return null;
    const df = periodFilter === "TODAY" ? todayStart.getTime() : periodFilter === "LAST_7_DAYS" ? new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000).getTime() : periodFilter === "CUSTOM" && customDate ? new Date(customDate + "T00:00:00").getTime() : cicloRange.startDate.getTime();
    const dt = periodFilter === "TODAY" ? new Date().getTime() : periodFilter === "LAST_7_DAYS" ? new Date().getTime() : periodFilter === "CUSTOM" && customDate ? new Date(customDate + "T23:59:59").getTime() : cicloRange.endDate.getTime();
    return rawOpsUnfiltered.filter(o => {
      const time = o.createdAt?.toMillis() || new Date(o.date).getTime();
      return time >= df && time <= dt;
    });
  }, [rawOpsUnfiltered, periodFilter, todayStart, cicloRange, customDate]);

  // Online Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    // orders_wholesaler tiene reglas restringidas al UID dueño (wholesalerId == request.auth.uid).
    if (user.uid !== effectiveRetailerId) return null;
    const dateFrom = periodFilter === 'TODAY' ? todayStart : cicloRange.startDate;
    const dateTo = periodFilter === 'TODAY' ? new Date() : cicloRange.endDate;

    return query(collection(firestore, "orders_wholesaler"), where("wholesalerId", "==", effectiveRetailerId));
  }, [firestore, user, periodFilter, todayStart, cicloRange, effectiveRetailerId]);

  const { data: rawOrdersUnfiltered, isLoading: isLoadingOrders } = useCollection(ordersQuery);
  const rawOrders = React.useMemo(() => {
    if (!rawOrdersUnfiltered) return null;
    const df = periodFilter === "TODAY" ? todayStart.getTime() : periodFilter === "LAST_7_DAYS" ? new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000).getTime() : periodFilter === "CUSTOM" && customDate ? new Date(customDate + "T00:00:00").getTime() : cicloRange.startDate.getTime();
    const dt = periodFilter === "TODAY" ? new Date().getTime() : periodFilter === "LAST_7_DAYS" ? new Date().getTime() : periodFilter === "CUSTOM" && customDate ? new Date(customDate + "T23:59:59").getTime() : cicloRange.endDate.getTime();
    return rawOrdersUnfiltered.filter(o => {
      const time = o.createdAt?.toMillis() || new Date(o.date).getTime();
      return time >= df && time <= dt;
    });
  }, [rawOrdersUnfiltered, periodFilter, todayStart, cicloRange, customDate]);

  // Combine and normalize both streams
  const rawSales = useMemo(() => {
    if (!rawOps && !rawOrders) return null;
    
    // Normalize POS operations (we only want active sales and credit_sales, excluding voided/refunded or expenses)
    const posSales = (rawOps || [])
      .filter((op: any) => (op.type === 'sale' || op.type === 'credit_sale') && op.status !== 'voided' && op.status !== 'refunded')
      .map((op: any) => ({
        ...op,
        source: 'pos',
        soldAt: op.createdAt, // Para que habitsByDay funcione igual
        normalizedDate: op.createdAt?.toDate ? op.createdAt.toDate() : new Date(op.createdAt || op.date),
        totalAmount: op.total || op.amount || 0,
      }));

    // Normalize Online Orders
    const onlineSales = (rawOrders || [])
      .filter((o: any) => ['delivered', 'reception_confirmed', 'paid'].includes(o.status))
      .map((o: any) => ({
        ...o,
        source: 'online',
        soldAt: o.createdAt, // Para que habitsByDay funcione igual
        normalizedDate: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt),
        totalAmount: o.totalAmount || 0,
      }));

    return [...posSales, ...onlineSales].sort((a, b) => b.normalizedDate.getTime() - a.normalizedDate.getTime());
  }, [rawOps, rawOrders]);

  const isLoadingSales = isLoadingOps || isLoadingOrders;

  // Filter Sales by Branch if selected
  const sales = useMemo(() => {
    if (!rawSales) return [];
    if (selectedBranchFilter === 'ALL') return rawSales;
    return rawSales.filter((s: any) => {
      if (s.branchId) return s.branchId === selectedBranchFilter;
      const centralBranch = branches?.find((b: any) => b.isCentral);
      return selectedBranchFilter === 'central' || (centralBranch && selectedBranchFilter === centralBranch.id);
    });
  }, [rawSales, selectedBranchFilter, branches]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    if (!selectedDayOfWeek) return sales;
    return sales.filter((s: any) => {
      const d = s.soldAt?.toDate ? s.soldAt.toDate() : new Date(s.soldAt || s.date || Date.now());
      const dayName = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(d);
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return capitalizedDay === selectedDayOfWeek || 
             (capitalizedDay === 'Miercoles' && selectedDayOfWeek === 'Miércoles') ||
             (capitalizedDay === 'Sabado' && selectedDayOfWeek === 'Sábado');
    });
  }, [sales, selectedDayOfWeek]);

  // Inventory Query for Low Stock & Replenishment
  
  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_shifts'),
      where('retailerId', '==', effectiveRetailerId),
      where('status', '==', 'closed'),
      limit(50)
    );
  }, [firestore, user, effectiveRetailerId]);

  const { data: rawShiftsData } = useCollection(shiftsQuery);

  const rawShifts = useMemo(() => {
    if (!rawShiftsData) return null;
    return [...rawShiftsData].sort((a: any, b: any) => {
      const timeA = a.endTime?.seconds || (a.endTime ? new Date(a.endTime).getTime() / 1000 : 0);
      const timeB = b.endTime?.seconds || (b.endTime ? new Date(b.endTime).getTime() / 1000 : 0);
      return timeB - timeA;
    }).slice(0, 20);
  }, [rawShiftsData]);

  const activeShiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_shifts'),
      where('retailerId', '==', effectiveRetailerId),
      where('status', '==', 'open')
    );
  }, [firestore, user, effectiveRetailerId]);
  
  const { data: activeShifts } = useCollection(activeShiftsQuery);


const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_inventory'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [firestore, user, effectiveRetailerId]);

  const { data: inventory, isLoading: isLoadingInventory } = useCollection(inventoryQuery);

  // Filter active and closed shifts by selected branch
  const filteredActiveShifts = useMemo(() => {
    if (!activeShifts) return [];
    if (selectedBranchFilter === 'ALL') return activeShifts;
    const centralBranch = branches?.find((b: any) => b.isCentral);
    const isCentralFilter = selectedBranchFilter === 'central' || (centralBranch && selectedBranchFilter === centralBranch.id);
    return activeShifts.filter((s: any) => {
      if (isCentralFilter) return !s.branchId || s.branchId === 'central' || (centralBranch && s.branchId === centralBranch.id);
      return s.branchId === selectedBranchFilter;
    });
  }, [activeShifts, selectedBranchFilter, branches]);

  const filteredClosedShifts = useMemo(() => {
    if (!rawShifts) return [];
    if (selectedBranchFilter === 'ALL') return rawShifts;
    const centralBranch = branches?.find((b: any) => b.isCentral);
    const isCentralFilter = selectedBranchFilter === 'central' || (centralBranch && selectedBranchFilter === centralBranch.id);
    return rawShifts.filter((s: any) => {
      if (isCentralFilter) return !s.branchId || s.branchId === 'central' || (centralBranch && s.branchId === centralBranch.id);
      return s.branchId === selectedBranchFilter;
    });
  }, [rawShifts, selectedBranchFilter, branches]);

  // Lista de cajeros/empleados únicos para el menú desplegable
  const uniqueCashiers = useMemo(() => {
    if (!filteredClosedShifts) return [];
    const map = new Map<string, { id: string; name: string }>();
    filteredClosedShifts.forEach((shift: any) => {
      const key = shift.employeeId || shift.cashierName || 'admin';
      const name = shift.cashierName || (key === 'admin' ? 'Dueño (Admin)' : 'Cajero');
      if (!map.has(key)) {
        map.set(key, { id: key, name });
      }
    });
    return Array.from(map.values());
  }, [filteredClosedShifts]);

  // Cierres filtrados según el empleado seleccionado en el menú desplegable
  const displayedClosedShifts = useMemo(() => {
    if (!filteredClosedShifts) return [];
    if (selectedCashierFilter === 'ALL') return filteredClosedShifts;
    return filteredClosedShifts.filter((shift: any) => {
      const key = shift.employeeId || shift.cashierName || 'admin';
      return key === selectedCashierFilter || shift.cashierName === selectedCashierFilter;
    });
  }, [filteredClosedShifts, selectedCashierFilter]);

  // Helper to obtain friendly branch name
  const getBranchName = (branchId?: string) => {
    if (!branchId || branchId === 'central') {
      const centralBranch = branches?.find((b: any) => b.isCentral);
      return centralBranch?.name || 'Casa Central';
    }
    const found = branches?.find((b: any) => b.id === branchId);
    return found?.name || 'Sucursal';
  };

  // Branch Performance & Seller Breakdown
  const branchBreakdown = useMemo(() => {
    const allBranchesList: any[] = branches && branches.length > 0 ? [...branches] : [];
    if (!allBranchesList.some((b: any) => b.id === 'central' || b.isCentral)) {
      allBranchesList.unshift({
        id: 'central',
        name: 'Casa Central',
        isCentral: true
      });
    }

    const totalAllSales = (rawSales || []).reduce((acc: number, s: any) => acc + (s.totalAmount || s.amount || 0), 0);

    return allBranchesList.map((branch: any) => {
      const isThisCentral = branch.id === 'central' || branch.isCentral;
      
      const branchSales = (rawSales || []).filter((s: any) => {
        if (isThisCentral) {
          return !s.branchId || s.branchId === 'central' || s.branchId === branch.id;
        }
        return s.branchId === branch.id;
      });

      const totalFacturado = branchSales.reduce((acc: number, s: any) => acc + (s.totalAmount || s.amount || 0), 0);
      const ticketsCount = branchSales.length;

      // Ganancia estimada de esta sucursal
      const branchCost = branchSales.reduce((sum: number, sale: any) => sum + (Array.isArray(sale.items) ? sale.items.reduce((itemSum: number, item: any) => {
        const qty = item.quantity || item.qty || 1;
        let cost = item.purchasePrice || item.costPrice || 0;
        if (!cost && item.productId && inventory) {
          const invItem = inventory.find((p: any) => p.id === item.productId);
          if (invItem) cost = invItem.purchasePrice || invItem.costPrice || 0;
        }
        if (!cost && (item.price || item.salePrice)) {
          cost = (item.price || item.salePrice || 0) * 0.70;
        }
        return itemSum + (cost * qty);
      }, 0) : 0), 0);
      const potentialProfit = Math.round(totalFacturado - branchCost);

      // Find if this branch has an active shift
      const activeShift = (activeShifts || []).find((s: any) => {
        if (isThisCentral) {
          return !s.branchId || s.branchId === 'central' || s.branchId === branch.id;
        }
        return s.branchId === branch.id;
      });

      const percentage = totalAllSales > 0 ? Math.round((totalFacturado / totalAllSales) * 100) : 0;

      return {
        id: branch.id,
        name: branch.name,
        isCentral: isThisCentral,
        address: branch.address || '',
        totalFacturado,
        ticketsCount,
        potentialProfit,
        activeShift,
        percentage
      };
    });
  }, [branches, rawSales, activeShifts, inventory]);

  // Helper unificado para obtener el stock físico de una sucursal específica (idéntico a Stock y TPV)
  const getProductStockForBranch = (product: any, branchId: string) => {
    if (!product) return 0;
    return Math.max(0, computeProductBranchStock(product, branchId, branches));
  };

  // Métricas de Stock e Inversión (centralizadas desde Gestión de Stock)
  const stockSummary = useMemo(() => {
    const allProds = inventory || [];
    const isSpecificBranch = selectedBranchFilter !== 'ALL';

    let totalUnits = 0;
    let totalCost = 0;
    let totalSale = 0;

    allProds.forEach((p: any) => {
      const qty = isSpecificBranch 
        ? getProductStockForBranch(p, selectedBranchFilter) 
        : (Number(p.stock) || 0);
      const purchasePrice = Number(p.purchasePrice || p.costPrice || 0);
      const salePrice = Number(p.salePrice || p.price || 0);

      totalUnits += qty;
      totalCost += purchasePrice * qty;
      totalSale += salePrice * qty;
    });

    const potentialProfit = totalSale - totalCost;

    // Desglose de stock dividido por cada sucursal
    const byBranch: Record<string, { units: number; cost: number; sale: number; profit: number }> = {};
    (branchBreakdown || []).forEach((b: any) => {
      let bUnits = 0;
      let bCost = 0;
      let bSale = 0;
      allProds.forEach((p: any) => {
        const qty = getProductStockForBranch(p, b.id);
        const purchasePrice = Number(p.purchasePrice || p.costPrice || 0);
        const salePrice = Number(p.salePrice || p.price || 0);
        bUnits += qty;
        bCost += purchasePrice * qty;
        bSale += salePrice * qty;
      });
      byBranch[b.id] = {
        units: bUnits,
        cost: bCost,
        sale: bSale,
        profit: bSale - bCost
      };
    });

    return {
      totalUnits,
      totalCost,
      totalSale,
      potentialProfit,
      byBranch
    };
  }, [inventory, selectedBranchFilter, branchBreakdown, branches]);

  // Compute real-time collections for an open cashier session
  const getShiftMetrics = (shift: any) => {
    if (!rawOpsUnfiltered || !shift) {
      return {
        totalRecaudado: 0,
        cash: 0,
        transfer: 0,
        qr: 0,
        credit: 0,
        expenses: 0,
        salesCount: 0,
        expectedCash: shift?.initialCash || 0
      };
    }

    const shiftStart = shift.startTime ? new Date(shift.startTime).getTime() : 0;
    const centralBranch = branches?.find((b: any) => b.isCentral);
    const isShiftCentral = !shift.branchId || shift.branchId === 'central' || (centralBranch && shift.branchId === centralBranch.id);

    const shiftOps = (rawOpsUnfiltered as any[]).filter((op: any) => {
      if (op.status === 'refunded' || op.status === 'voided') return false;

      const opTime = op.createdAt?.toMillis 
        ? op.createdAt.toMillis() 
        : (op.date ? new Date(op.date).getTime() : 0);
      
      // Allow 1 min margin before shift start
      if (shiftStart && opTime < (shiftStart - 60000)) return false;

      // Match branch
      const isOpCentral = !op.branchId || op.branchId === 'central' || (centralBranch && op.branchId === centralBranch.id);
      const branchMatches = isShiftCentral ? isOpCentral : op.branchId === shift.branchId;

      // Match employee
      let employeeMatches = true;
      if (shift.employeeId && shift.employeeId !== 'admin') {
        const opEmpId = op.employeeId;
        const opEmpName = (op.employeeName || op.cashierName || '').toLowerCase().trim();
        const shiftEmpName = (shift.cashierName || '').toLowerCase().trim();
        employeeMatches = opEmpId === shift.employeeId || (shiftEmpName !== '' && opEmpName === shiftEmpName);
      }

      return branchMatches && employeeMatches;
    });

    let cash = 0;
    let transfer = 0;
    let qr = 0;
    let credit = 0;
    let expenses = 0;
    let salesCount = 0;

    shiftOps.forEach((op: any) => {
      const amount = Number(op.total || op.amount || op.totalAmount || 0);
      if (op.type === 'expense') {
        expenses += amount;
      } else if (op.type === 'sale' || op.type === 'credit_sale' || op.type === 'checkout') {
        salesCount += 1;
        if (op.paymentMethod === 'mixed' && op.splitDetails) {
          cash += Number(op.splitDetails.cash || 0);
          transfer += Number(op.splitDetails.transfer || 0);
          credit += Number(op.splitDetails.credit || 0);
        } else if (op.paymentMethod === 'cash') {
          cash += amount;
        } else if (op.paymentMethod === 'transfer') {
          transfer += amount;
        } else if (op.paymentMethod === 'qr') {
          qr += amount;
        } else if (op.paymentMethod === 'credit') {
          credit += amount;
        } else {
          cash += amount;
        }
      }
    });

    const totalRecaudado = cash + transfer + qr + credit;
    const expectedCash = (shift.initialCash || 0) + cash - expenses;

    return {
      totalRecaudado,
      cash,
      transfer,
      qr,
      credit,
      expenses,
      salesCount,
      expectedCash
    };
  };



  // KPIs & Stats
  const stats = useMemo(() => {
    if (!filteredSales) {
      return { totalSales: 0, unitsSold: 0, potentialProfit: 0, transactionsCount: 0 };
    }
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.amount || 0), 0);
    const unitsSold = filteredSales.reduce((sum, sale) => sum + (Array.isArray(sale.items) ? sale.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || item.qty || 1), 0) : 0), 0);
    const totalCost = filteredSales.reduce((sum, sale) => sum + (Array.isArray(sale.items) ? sale.items.reduce((itemSum: number, item: any) => {
      const qty = item.quantity || item.qty || 1;
      let cost = item.purchasePrice || item.costPrice || 0;
      
      // Fallback a inventario para ventas viejas o sin costo guardado
      if (!cost && item.productId && inventory) {
        const invItem = inventory.find((p: any) => p.id === item.productId);
        if (invItem) cost = invItem.purchasePrice || invItem.costPrice || 0;
      }

      // Si aún no hay costo (por ej. carga manual en caja), estimamos un margen conservador del 30% de ganancia (70% de costo)
      if (!cost && (item.price || item.salePrice)) {
        cost = (item.price || item.salePrice || 0) * 0.70; 
      }

      return itemSum + (cost * qty);
    }, 0) : 0), 0);
    
    return {
      totalSales,
      unitsSold,
      potentialProfit: totalSales - totalCost,
      transactionsCount: sales.length
    };
  }, [sales]);

  // Consumption Habits by Day of Week
  const habitsByDay = useMemo(() => {
    return analyzeConsumptionHabitsByDay(sales);
  }, [sales]); 
 
  
  const topProducts = useMemo(() => {
    if (!sales) return [];
    const productMap: Record<string, { name: string, qty: number, total: number }> = {};
    sales.forEach((sale: any) => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
                const name = item.name || item.productName || 'Producto';
                if (!productMap[name]) productMap[name] = { name, qty: 0, total: 0 };
                const q = Number(item.quantity || item.qty || 1);
                productMap[name].qty += q;
                productMap[name].total += q * Number(item.price || item.salePrice || 0);
            });
        }
    });
    return Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [sales]);

  const chartData = useMemo(() => {
    if (!rawOps) return { flowData: [], methodData: [], topProducts: [] };
    const daily: Record<string, { day: string, ventas: number, gastos: number }> = {};
    const methods: Record<string, number> = {};

    rawOps.forEach((op: any) => {
      const dayKey = format(new Date(op.date || op.createdAt?.toMillis() || Date.now()), 'dd/MM');
      if (!daily[dayKey]) daily[dayKey] = { day: dayKey, ventas: 0, gastos: 0 };
      
      if (op.type === 'sale' || op.type === 'credit_sale') {
        const amount = op.total || op.amount || op.totalAmount || 0;
        daily[dayKey].ventas += amount;
        methods[op.paymentMethod || 'cash'] = (methods[op.paymentMethod || 'cash'] || 0) + amount;
      } else if (op.type === 'expense') {
        const amount = op.total || op.amount || op.totalAmount || 0;
        daily[dayKey].gastos += amount;
      }
    });

    // Add empty days for the current filtered range to make the chart look continuous?
    // Actually, sorting the keys is enough
    const sortedFlow = Object.values(daily).sort((a, b) => {
        const [da, ma] = a.day.split('/');
        const [db, mb] = b.day.split('/');
        return (parseInt(ma) - parseInt(mb)) || (parseInt(da) - parseInt(db));
    });

    const methodDataArray = Object.entries(methods).map(([name, value]) => ({ name: name.toUpperCase(), value }));

    return { flowData: sortedFlow, methodData: methodDataArray };
  }, [rawOps]);


  const lowStockItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item: any) => (item.stock ?? 0) >= 0 && (item.stock ?? 0) <= 5).sort((a: any, b: any) => (a.stock ?? 0) - (b.stock ?? 0));
  }, [inventory]);

  if (isUserLoading || isLoadingSales || isLoadingInventory) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  }

  

  const handleDownloadShiftPdf = async (shift: any) => {
    if (!shift.report) { alert("Este turno antiguo no tiene reporte guardado."); return; }
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      let y = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("RESUMEN DE TURNO - REDECONOMIX", 105, y, { align: "center" });
      y += 15;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Cajero: ${shift.cashierName || 'No definido'}`, 20, y);
      const shiftDate = shift.endTime ? new Date(shift.endTime) : new Date();
      doc.text(`Cierre: ${format(shiftDate, 'dd/MM/yyyy HH:mm')}`, 120, y);
      y += 15;
      
      doc.setFont("helvetica", "bold");
      doc.text("ARQUEO DE CAJA", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Caja Inicial: ${shift.initialCash || 0}`, 20, y); y += 8;
      doc.text(`Ventas en Efectivo: ${shift.report.cash || 0}`, 20, y); y += 8;
      doc.text(`Egresos / Proveedores: ${shift.report.expenses || 0}`, 20, y); y += 8;
      doc.text(`Retiros de Caja: ${shift.report.withdrawals || 0}`, 20, y); y += 8;
      doc.setFont("helvetica", "bold");
      doc.text(`Total Esperado (Sistema): ${shift.report.expectedCash || 0}`, 20, y); y += 10;
      
      const declaredActual = shift.actualFinalCash || 0;
      const declaredDiff = declaredActual - (shift.report.expectedCash || 0);
      doc.text(`Efectivo Real (Declarado): ${declaredActual}`, 20, y); y += 8;
      
      doc.setTextColor(declaredDiff < 0 ? 255 : 0, declaredDiff < 0 ? 0 : (declaredDiff > 0 ? 150 : 0), 0);
      doc.text(`DIFERENCIA: ${declaredDiff > 0 ? '+' : ''}${declaredDiff}`, 20, y);
      doc.setTextColor(0, 0, 0);
      y += 15;

      doc.setFont("helvetica", "bold");
      doc.text("OTROS MEDIOS DE COBRO", 20, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Transferencias: ${shift.report.transfer || 0}`, 20, y); y += 8;
      doc.text(`QR / MercadoPago: ${shift.report.qr || 0}`, 20, y); y += 8;
      doc.text(`Fiados (Cuentas Corrientes): ${shift.report.credit || 0}`, 20, y); y += 15;

      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL VENDIDO EN TURNO: ${shift.report.total || 0}`, 20, y);
      
      doc.save(`Cierre_${shift.cashierName || 'Caja'}_${format(shiftDate, 'dd-MM-yy_HHmm')}.pdf`);
    } catch (e) {
      alert("Error al generar PDF.");
    }
  };

  const handleExportBranchExcel = () => {
    // Si no seleccionó sucursal no ejecuta ninguna acción (requisito del usuario)
    if (selectedBranchFilter === 'ALL') {
      return;
    }

    const currentBranch = branches?.find((b: any) => b.id === selectedBranchFilter);
    const branchName = currentBranch?.name || (selectedBranchFilter === 'central' ? 'Casa Central' : 'Sucursal');
    const isCentral = currentBranch?.isCentral || selectedBranchFilter === 'central';

    const workbook = XLSX.utils.book_new();

    const periodLabel = periodFilter === 'TODAY' 
      ? 'Hoy' 
      : periodFilter === 'LAST_7_DAYS' 
      ? 'Últimos 7 Días' 
      : periodFilter === 'CUSTOM' 
      ? `Día ${customDate || ''}` 
      : 'Ciclo Contable (10 al 10)';

    // Ventas de esta sucursal en el período seleccionado
    const branchSales = sales || [];
    const branchTotalSales = branchSales.reduce((sum: number, s: any) => sum + (s.totalAmount || s.amount || 0), 0);
    const branchTicketsCount = branchSales.length;

    // Métodos de cobro
    const methods: Record<string, number> = {};
    branchSales.forEach((s: any) => {
      const m = (s.paymentMethod || 'Efectivo').toUpperCase();
      methods[m] = (methods[m] || 0) + (s.totalAmount || s.amount || 0);
    });

    // Sesión de caja en curso
    const activeShift = (activeShifts || []).find((s: any) => {
      if (isCentral) return !s.branchId || s.branchId === 'central' || s.branchId === currentBranch?.id;
      return s.branchId === selectedBranchFilter;
    });

    // 1. Hoja: Resumen de Sucursal
    const summaryData = [
      ["INFORME DETALLADO DE SUCURSAL - REDECONOMIX"],
      ["Sucursal", `${branchName} ${isCentral ? '(Central)' : ''}`],
      ["Período Auditado", periodLabel],
      ["Fecha de Emisión", format(new Date(), 'dd/MM/yyyy HH:mm')],
      [],
      ["ESTADO DE CAJA EN VIVO", "DETALLE"],
      ["Estado de Caja", activeShift ? "ABIERTA" : "CERRADA"],
      ["Cajero / Vendedor Asignado", activeShift?.cashierName || "Sin turno activo"],
      ["Hora de Apertura", activeShift?.startTime ? format(new Date(activeShift.startTime), 'dd/MM/yyyy HH:mm') : "-"],
      ["Efectivo Inicial en Caja", activeShift?.initialCash ? `$${activeShift.initialCash.toLocaleString('es-AR')}` : "-"],
      [],
      ["FACTURACIÓN Y MÉTRICAS DEL PERÍODO", "VALOR"],
      ["Total Facturado ($)", branchTotalSales],
      ["Cantidad de Tickets / Ventas", branchTicketsCount],
      ["Ticket Promedio ($)", branchTicketsCount > 0 ? Math.round(branchTotalSales / branchTicketsCount) : 0],
      [],
      ["RECAUDACIÓN POR MÉTODO DE PAGO", "MONTO ($)"],
      ...Object.entries(methods).map(([k, v]) => [k, v])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, "Resumen Sucursal");

    // 2. Hoja: Inventario y Stock de esta Sucursal (únicamente productos con stock real > 0)
    const stockData = (inventory || [])
      .map((item: any) => {
        const currentStock = getProductStockForBranch(item, selectedBranchFilter);
        const cost = Number(item.purchasePrice || item.costPrice || 0);
        const price = Number(item.salePrice || item.price || 0);
        const valuation = currentStock * cost;
        const minStock = Number(item.minStock ?? 5);

        return {
          'Código': item.code || item.barcode || '-',
          'Producto': item.name || 'Sin Nombre',
          'Categoría': item.category || 'General',
          'Stock Actual (Sucursal)': currentStock,
          'Stock Mínimo': minStock,
          'Estado de Stock': currentStock <= minStock ? 'STOCK CRÍTICO' : 'NORMAL',
          'Precio Costo ($)': cost,
          'Precio Venta ($)': price,
          'Valorización en Stock ($)': valuation
        };
      })
      .filter((item: any) => item['Stock Actual (Sucursal)'] > 0);

    // Ordenar alfabéticamente por nombre de producto
    stockData.sort((a, b) => a['Producto'].localeCompare(b['Producto']));
    const wsStock = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(workbook, wsStock, "Stock Sucursal");

    // 3. Hoja: Detalle de Operaciones y Ventas
    const salesDetailData = branchSales.map((sale: any) => {
      const d = sale.normalizedDate || (sale.soldAt?.toDate ? sale.soldAt.toDate() : new Date(sale.soldAt || sale.date || Date.now()));
      const itemsList = Array.isArray(sale.items) ? sale.items.map((i: any) => `${i.name || i.productName} (x${i.quantity || i.qty || 1})`).join(', ') : 'Venta directa';
      
      return {
        'Fecha y Hora': format(d, 'dd/MM/yyyy HH:mm'),
        'Tipo': sale.type === 'credit_sale' ? 'Fiado (Cta Cte)' : 'Venta',
        'Método de Pago': (sale.paymentMethod || 'Efectivo').toUpperCase(),
        'Cajero / Vendedor': sale.employeeName || sale.cashierName || sale.userName || 'Dueño',
        'Cliente': sale.customerName || 'Consumidor Final',
        'Artículos': itemsList,
        'Total ($)': sale.totalAmount || sale.total || sale.amount || 0
      };
    });
    const wsSales = XLSX.utils.json_to_sheet(salesDetailData);
    XLSX.utils.book_append_sheet(workbook, wsSales, "Ventas Sucursal");

    // 4. Hoja: Ranking Top Productos de la Sucursal
    const topProductsData = (topProducts || []).map((p: any, idx: number) => ({
      'Ranking': idx + 1,
      'Producto': p.name,
      'Unidades Vendidas': p.qty,
      'Total Facturado Estimado ($)': p.total
    }));
    const wsTop = XLSX.utils.json_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(workbook, wsTop, "Top Productos");

    // Descarga del Archivo con nombre específico de la sucursal
    const fileName = `Informe_${branchName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yy_HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <RoleGuard moduleName="Resumen Financiero" allowedRoles={['admin']}>
      <div className="space-y-6 pt-[80px] md:pt-0 pb-36 px-2 sm:px-4 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-600" /> Control del Propietario
        </h1>
      </div>

      {/* ── VALORIZACIÓN Y RENDIMIENTO DE STOCK (MOVIDO DESDE GESTIÓN DE STOCK) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">
              Valorización de Stock {selectedBranchFilter === 'ALL' ? '• Todas las Sucursales' : `• ${branchBreakdown.find((b: any) => b.id === selectedBranchFilter)?.name || 'Sucursal'}`}
            </h2>
          </div>
          {selectedBranchFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedBranchFilter('ALL')}
              className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 underline tracking-wider"
            >
              Ver Consolidado
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. Stock Total */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-white hover:border-slate-300 transition-colors">
            <CardHeader className="pb-1 p-3.5 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Stock Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                {stockSummary.totalUnits.toLocaleString('es-AR')}
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 font-bold truncate uppercase tracking-wider">
                UNIDADES DISPONIBLES
              </p>
            </CardContent>
          </Card>

          {/* 2. Inversión */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-white hover:border-slate-300 transition-colors">
            <CardHeader className="pb-1 p-3.5 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Inversión
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-slate-900 truncate">
                ${stockSummary.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 font-bold truncate uppercase tracking-wider">
                COSTO TOTAL DEL STOCK
              </p>
            </CardContent>
          </Card>

          {/* 3. Venta Esperada */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-white hover:border-slate-300 transition-colors">
            <CardHeader className="pb-1 p-3.5 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Venta Esperada
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-emerald-600 truncate">
                ${stockSummary.totalSale.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[8px] sm:text-[9px] text-emerald-600/80 mt-0.5 font-bold truncate uppercase tracking-wider">
                VALOR ESTIMADO MKT
              </p>
            </CardContent>
          </Card>

          {/* 4. Ganancia Potencial */}
          <Card className="rounded-2xl border border-slate-200/80 shadow-xs bg-white hover:border-slate-300 transition-colors">
            <CardHeader className="pb-1 p-3.5 sm:p-4">
              <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Ganancia Pot.
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-black text-red-600 truncate">
                ${stockSummary.potentialProfit.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 font-bold truncate uppercase tracking-wider">
                RÉDITO ESTIMADO FINAL
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── SUCURSALES Y CAJAS EN VIVO (LIMPIO Y COMPACTO) ── */}
      {branchBreakdown && branchBreakdown.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                Sucursales
              </h2>
            </div>
            
            {/* Controles de Sucursal, Período y Exportar (Compactos y Elegantes) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Selector de Sucursal */}
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger className="h-7 rounded-lg bg-slate-50 border-slate-200 font-bold uppercase text-[9px] tracking-wider px-2 w-auto">
                  <Store className="w-3 h-3 mr-1 text-red-600 shrink-0" />
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="ALL" className="font-bold text-xs uppercase">
                    Todas las Sucursales ({branchBreakdown.length})
                  </SelectItem>
                  {branchBreakdown.map((b: any) => (
                    <SelectItem key={b.id} value={b.id} className="font-bold text-xs uppercase">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selector de Período */}
              <Select 
                value={periodFilter} 
                onValueChange={(val: any) => {
                  setPeriodFilter(val);
                  if (val === 'CUSTOM' && !customDate) {
                    setCustomDate(format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
              >
                <SelectTrigger className="h-7 rounded-lg bg-slate-50 border-slate-200 font-bold uppercase text-[9px] tracking-wider px-2 w-auto">
                  <Calendar className="w-3 h-3 mr-1 text-red-600 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg border-slate-100">
                  <SelectItem value="CYCLE" className="font-bold text-xs uppercase">
                    Ciclo Contable (10 al 10)
                  </SelectItem>
                  <SelectItem value="TODAY" className="font-bold text-xs uppercase">
                    Hoy (Corte 00:00 hs)
                  </SelectItem>
                  <SelectItem value="LAST_7_DAYS" className="font-bold text-xs uppercase">
                    Últimos 7 Días
                  </SelectItem>
                  <SelectItem value="CUSTOM" className="font-bold text-xs uppercase">
                    Día Específico
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Fecha personalizada si se selecciona Día Específico */}
              {periodFilter === 'CUSTOM' && (
                <input 
                  type="date" 
                  value={customDate || ''}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-7 text-[9px] font-bold uppercase text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 outline-none focus:border-red-400 transition-colors"
                />
              )}

              {/* Botón Exportar Informe y Stock de Sucursal */}
              <Button
                size="sm"
                onClick={handleExportBranchExcel}
                className={cn(
                  "h-7 rounded-lg font-bold uppercase text-[9px] tracking-wider px-2.5 flex items-center gap-1 transition-all select-none",
                  selectedBranchFilter === 'ALL'
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default shadow-none hover:bg-slate-100"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                )}
                title={selectedBranchFilter === 'ALL' ? "Seleccioná una sucursal para exportar su informe" : "Exportar informe completo y stock de la sucursal seleccionada"}
              >
                <FileDown className="w-3 h-3" />
                <span>
                  {selectedBranchFilter === 'ALL' 
                    ? "Exportar" 
                    : `Exportar ${branchBreakdown.find((b: any) => b.id === selectedBranchFilter)?.name || 'Sucursal'}`}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {branchBreakdown.map((b: any) => {
              const isSelected = selectedBranchFilter === b.id;
              const shiftMetrics = b.activeShift ? getShiftMetrics(b.activeShift) : null;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranchFilter(selectedBranchFilter === b.id ? 'ALL' : b.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 select-none",
                    isSelected 
                      ? "bg-red-50/40 border-red-300 ring-2 ring-red-600/20 shadow-xs" 
                      : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/70"
                  )}
                >
                  {/* Fila 1: Nombre de Sucursal y Estado de Caja */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Store className="w-4 h-4 text-red-600 shrink-0" />
                      <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">
                        {b.name}
                      </h3>
                    </div>

                    {b.activeShift ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                        Caja Abierta
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-200 text-slate-400 bg-white">
                        Cerrada
                      </span>
                    )}
                  </div>

                  {/* Fila 2: Total Facturado y Ganancia Est. de la Sucursal */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/70 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                        Facturado
                      </span>
                      <div className="text-lg font-black text-slate-900 mt-0.5">
                        ${b.totalFacturado.toLocaleString('es-AR')}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">
                        {b.ticketsCount} ventas
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                        Ganancia Est.
                      </span>
                      <div className="text-lg font-black text-emerald-600 mt-0.5">
                        ${b.potentialProfit.toLocaleString('es-AR')}
                      </div>
                      <span className="text-[9px] font-black text-red-600 mt-0.5 block">
                        {b.percentage}% del total
                      </span>
                    </div>
                  </div>

                  {/* Fila Stock e Inversión de la Sucursal */}
                  {stockSummary.byBranch[b.id] && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                          Stock Góndola
                        </span>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          {stockSummary.byBranch[b.id].units.toLocaleString('es-AR')} u.
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">
                          En existencia
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">
                          Inversión Stock
                        </span>
                        <div className="text-base font-black text-slate-900 mt-0.5">
                          ${stockSummary.byBranch[b.id].cost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5 block">
                          Venta Est: ${stockSummary.byBranch[b.id].sale.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fila 3: Turno en Vivo si está abierto */}
                  {b.activeShift && shiftMetrics && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-slate-900 truncate">
                          {b.activeShift.cashierName || 'Vendedor'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {b.activeShift.startTime ? format(new Date(b.activeShift.startTime), 'HH:mm') : ''} hs
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100">
                        <div>
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">Recaudado</span>
                          <span className="text-sm font-black text-red-600">${shiftMetrics.totalRecaudado.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block">En Caja</span>
                          <span className="text-sm font-black text-slate-900">${shiftMetrics.expectedCash.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── TARJETA: CIERRES DE CAJA (INTEGRADA JUNTO A SUCURSALES) ── */}
            {filteredClosedShifts && filteredClosedShifts.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/70 transition-all flex flex-col justify-between gap-2.5 select-none">
                {/* Encabezado: Título y Selector Desplegable de Empleado */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FileText className="w-4 h-4 text-red-600 shrink-0" />
                    <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">
                      Cierres de Caja
                    </h3>
                  </div>

                  {/* Dropdown compacto según el perfil del empleado */}
                  <div className="w-32 sm:w-36">
                    <Select value={selectedCashierFilter} onValueChange={setSelectedCashierFilter}>
                      <SelectTrigger className="h-6 rounded-lg bg-white border-slate-200 text-[9px] font-bold px-1.5 py-0 shadow-2xs">
                        <div className="flex items-center gap-1 truncate">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <SelectValue placeholder="Empleado" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-lg border-slate-100">
                        <SelectItem value="ALL" className="text-xs font-bold py-1.5">
                          👥 Todos ({filteredClosedShifts.length})
                        </SelectItem>
                        {uniqueCashiers.map((c: any) => {
                          const count = filteredClosedShifts.filter((s: any) => 
                            (s.employeeId || s.cashierName || 'admin') === c.id || s.cashierName === c.id
                          ).length;
                          return (
                            <SelectItem key={c.id} value={c.id} className="text-xs font-bold py-1.5">
                              👤 {c.name} ({count})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lista scrollable de Cierres de Caja */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex-1 flex flex-col justify-between min-h-[140px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 mb-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                      Historial Reciente
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {displayedClosedShifts.length} {displayedClosedShifts.length === 1 ? 'cierre' : 'cierres'}
                    </span>
                  </div>

                  {displayedClosedShifts.length === 0 ? (
                    <div className="py-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-1 flex items-center justify-center">
                      Sin cierres para este perfil
                    </div>
                  ) : (
                    <div className="max-h-[155px] overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
                      {displayedClosedShifts.map((shift: any) => {
                        const actual = shift.actualFinalCash || 0;
                        const shiftDate = shift.endTime ? new Date(shift.endTime) : new Date();

                        return (
                          <div 
                            key={shift.id}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-100 flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black text-slate-800 uppercase">
                                  {format(shiftDate, 'dd/MM HH:mm')}
                                </span>
                                <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200 truncate max-w-[85px]">
                                  {shift.cashierName || 'Dueño'}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 block mt-0.5">
                                Declarado: <strong className="text-emerald-600 font-black">${actual.toLocaleString('es-AR')}</strong>
                              </span>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadShiftPdf(shift)}
                              className="h-6 w-6 p-0 rounded-md hover:bg-red-50 hover:text-red-600 shrink-0 text-slate-400 transition-colors"
                              title="Descargar PDF de Cierre"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HÁBITOS DE CONSUMO POR DÍA DE LA SEMANA ── */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-6 bg-white">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600" /> Hábitos de Consumo por Día de la Semana
          </CardTitle>
          
        </CardHeader>
        <CardContent className="px-0 pb-0 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {Object.values(habitsByDay).map(dayData => {
              // Find top product for this day
              const topProductsList = Object.values(dayData.topProducts).sort((a, b) => b.qty - a.qty);
              const topProduct = topProductsList[0];

              return (
                <div 
                  key={dayData.dayName} 
                  onClick={() => setSelectedDayOfWeek(prev => prev === dayData.dayName ? null : dayData.dayName)}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 cursor-pointer transition-all ${selectedDayOfWeek === dayData.dayName ? 'bg-red-50 border-red-200 ring-2 ring-red-600/20 scale-105' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dayData.dayName}</span>
                    <div className="text-base font-black text-slate-900 mt-1">${dayData.totalAmount.toLocaleString('es-AR')}</div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{dayData.totalUnits} u. vendidas</span>
                  </div>

                  
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── GRÁFICOS MOVIDOS DESDE REPORTES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-6">
          {/* Flujo Diario */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Flujo Diario (Ventas vs Gastos)</h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.flowData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                          <YAxis hide />
                          <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                          />
                          <Bar dataKey="ventas" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gastos" fill="#FF0000" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Reparto de Cobros */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Reparto de Cobros</h3>
              <div className="h-64 w-full flex items-center">
                  <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie 
                                  data={chartData.methodData} 
                                  innerRadius={35} 
                                  outerRadius={60} 
                                  paddingAngle={5} 
                                  dataKey="value"
                              >
                                  {chartData.methodData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-3 pl-4">
                       {chartData.methodData.map((entry, index) => (
                           <div key={entry.name} className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 truncate max-w-[80px]">{entry.name}</span>
                               <span className="text-[11px] font-bold text-slate-400 ml-auto">${entry.value.toLocaleString()}</span>
                           </div>
                       ))}
                       {chartData.methodData.length === 0 && (
                          <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-10">Sin cobros registrados</div>
                       )}
                  </div>
              </div>
          </div>
          
          {/* Top 10 Productos */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Top 10 Más Vendidos</h3>
              <div className="h-64 w-full overflow-y-auto no-scrollbar space-y-2 pr-1">
                  {topProducts.map((p, idx) => {
                      const maxQty = topProducts[0]?.qty || 1;
                      const percent = Math.min(100, Math.max(8, Math.round((p.qty / maxQty) * 100)));
                      return (
                          <div key={idx} className="flex flex-col gap-1 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/50">
                              <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-700 truncate max-w-[140px]" title={p.name}>
                                      {idx + 1}. {p.name}
                                  </span>
                                  <span className="font-black text-slate-900 shrink-0 tabular-nums">{p.qty} u.</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                  <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                          width: `${percent}%`, 
                                          backgroundColor: idx === 0 ? '#EF4444' : idx < 3 ? '#F87171' : '#FCA5A5' 
                                      }} 
                                  />
                              </div>
                          </div>
                      );
                  })}
                  {topProducts.length === 0 && (
                      <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mt-20">Sin ventas registradas</div>
                  )}
              </div>
          </div>
      </div>
      
      {/* ── ÚLTIMAS VENTAS Y REPOSICIÓN ── */}
      <div className="grid grid-cols-1 gap-6">
        {/* TABLA ÚLTIMAS VENTAS */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-6 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-600" /> Últimas Operaciones Registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest w-[60px]">Hora</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest w-[110px]">Sucursal</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest w-[100px]">Vendedor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-center w-[50px]">Cant.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest w-[90px]">Código</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Producto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right w-[90px]">P. Unit.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (!filteredSales || filteredSales.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 font-bold text-slate-400 text-xs uppercase tracking-widest">
                          {selectedDayOfWeek ? `Sin operaciones para el día ${selectedDayOfWeek}.` : 'Sin operaciones registradas en el período.'}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Group by date
                  const grouped: Record<string, any[]> = {};
                  filteredSales.forEach((sale: any) => {
                    const d = sale.soldAt?.toDate ? sale.soldAt.toDate() : new Date(sale.soldAt || sale.date || Date.now());
                    const dateKey = format(d, 'yyyy-MM-dd');
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    grouped[dateKey].push({ sale, date: d });
                  });

                  // Sort dates descending
                  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

                  return sortedDates.map(dateKey => {
                    const daySales = grouped[dateKey];
                    // Formato: Lunes 5 de Octubre
                    const displayDate = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateKey + 'T12:00:00'));
                    
                    return (
                      <React.Fragment key={dateKey}>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                          <TableCell colSpan={8} className="py-2 border-y border-slate-200">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {displayDate}
                            </span>
                          </TableCell>
                        </TableRow>
                        {daySales.map(({ sale, date: saleDate }: any) => {
                          const isCreditSale = sale.type === 'credit_sale' || sale.paymentMethod === 'credit';
                          const isRefunded = sale.status === 'refunded';
                          const isPartiallyRefunded = sale.status === 'partially_refunded';
                          const items = Array.isArray(sale.items) && sale.items.length > 0 ? sale.items : [null];
                          
                          return items.map((i: any, idx: number) => (
                            <TableRow 
                              key={sale.id + '-' + idx} 
                              className={cn(
                                isRefunded
                                  ? 'bg-rose-50/60 opacity-65'
                                  : isPartiallyRefunded
                                    ? 'bg-amber-50/50 border-l-4 border-l-amber-400'
                                    : isCreditSale 
                                      ? 'bg-amber-100/80 hover:bg-amber-200/70 border-l-4 border-l-amber-500 font-medium' 
                                      : 'hover:bg-slate-50/50',
                                idx === items.length - 1 ? 'border-b border-slate-200' : 'border-b border-slate-100/50 border-dashed'
                              )}
                            >
                              <TableCell className={cn("align-top font-bold text-xs whitespace-nowrap pt-4", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-950 font-black" : "text-slate-700")}>
                                {idx === 0 ? format(saleDate, 'HH:mm') : ''}
                              </TableCell>
                              <TableCell className="align-top py-4">
                                {idx === 0 ? (
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-bold text-[11px] text-slate-700 uppercase tracking-tight truncate max-w-[120px]">
                                      {getBranchName(sale.branchId)}
                                    </span>
                                  </div>
                                ) : ''}
                              </TableCell>
                              <TableCell className="align-top py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest truncate max-w-[110px]">
                                {idx === 0 ? (
                                  <div className="flex flex-col gap-1">
                                    <span className={cn("truncate", isRefunded ? "line-through text-slate-400" : isCreditSale ? "text-amber-950 font-black" : "")}>
                                      {sale.employeeName || (sale.source === 'online' ? 'Online' : 'Dueño')}
                                    </span>
                                    {isRefunded ? (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300 max-w-max flex items-center gap-0.5">
                                        ↩️ DEVUELTO
                                      </span>
                                    ) : isPartiallyRefunded ? (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 max-w-max flex items-center gap-0.5">
                                        ↩️ DEV. PARCIAL
                                      </span>
                                    ) : isCreditSale ? (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 border border-amber-500 shadow-sm max-w-max flex items-center gap-1 tracking-wider animate-pulse">
                                        ⚡ FIADO
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 max-w-max">
                                        {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transfer.' : sale.paymentMethod === 'qr' ? 'QR' : sale.paymentMethod === 'mixed' ? 'Mixto' : 'Efectivo'}
                                      </span>
                                    )}
                                    {sale.customerName && isCreditSale && !isRefunded && (
                                      <span className="text-[9px] font-black text-amber-900 truncate flex items-center gap-0.5">
                                        👤 {sale.customerName}
                                      </span>
                                    )}
                                  </div>
                                ) : ''}
                              </TableCell>
                              
                              {i ? (
                                <>
                                  <TableCell className="align-top py-4 text-center">
                                    <span className={cn("font-black text-[11px] uppercase", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-950 font-black" : "text-slate-800")}>{i.qty}</span>
                                  </TableCell>
                                  <TableCell className="align-top py-4">
                                    <span className={cn("font-bold text-[10px] font-mono", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-800 font-bold" : "text-slate-400")}>
                                      {i.code || i.barcode || inventory?.find((p: any) => p.id === i.productId)?.code || inventory?.find((p: any) => p.id === i.productId)?.barcode || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="align-top py-4">
                                    <span className={cn("font-black text-xs uppercase leading-snug truncate max-w-[200px]", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-950 font-black" : "text-slate-800")}>{i.name}</span>
                                  </TableCell>
                                  <TableCell className="align-top py-4 text-right">
                                    <span className={cn("font-bold text-[11px]", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-900 font-bold" : "text-slate-500")}>
                                      ${(i.price || i.salePrice || 0).toLocaleString('es-AR')}
                                    </span>
                                  </TableCell>
                                </>
                              ) : (
                                <TableCell colSpan={4} className="align-top py-4">
                                  <span className={cn("font-black text-xs uppercase leading-snug", isRefunded ? "text-slate-400 line-through" : isCreditSale ? "text-amber-950 font-black" : "text-slate-800")}>{sale.concept || 'Venta General'}</span>
                                </TableCell>
                              )}

                              <TableCell className={cn("align-top text-right font-black text-sm whitespace-nowrap pt-4", isRefunded ? "line-through text-slate-400" : isCreditSale ? "text-amber-950 font-black text-base" : "text-slate-900")}>
                                {idx === 0 ? `$${(sale.totalAmount || sale.amount || 0).toLocaleString('es-AR')}` : ''}
                              </TableCell>
                            </TableRow>
                          ));
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4" /> Volumen Despachado</span>
              <span className="text-lg font-black text-slate-900">{stats.unitsSold} <span className="text-xs font-bold text-slate-500 uppercase">Unidades Totales</span></span>
            </div>
            <Button variant="outline" className="mt-4 w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200" asChild>
              <Link href="/redeconomix/dashboard-negocio/control-ventas">Ir a Caja / Punto de Venta</Link>
            </Button>
          </CardContent>
        </Card>
        
        {/* TABLA REPOSICIÓN E INVENTARIO */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-6 bg-white">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Alerta de Stock Bajo (Reposición)
            </CardTitle>
            
          </CardHeader>
          <CardContent className="px-0 pb-0 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Producto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems && lowStockItems.length > 0 ? lowStockItems.slice(0, 6).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-slate-800 text-xs">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="font-black rounded-lg px-2.5 py-0.5 text-xs">
                        {item.stock ?? 0} u.
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-24 font-bold text-slate-400 text-xs uppercase tracking-widest">
                      ¡Excelente! Todo el stock está abastecido.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4" /> Volumen Despachado</span>
              <span className="text-lg font-black text-slate-900">{stats.unitsSold} <span className="text-xs font-bold text-slate-500 uppercase">Unidades Totales</span></span>
            </div>
            <Button variant="outline" className="mt-4 w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200" asChild>
              <Link href="/redeconomix/dashboard-negocio/stock">Gestionar Mi Inventario Completo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </RoleGuard>
  );
}
