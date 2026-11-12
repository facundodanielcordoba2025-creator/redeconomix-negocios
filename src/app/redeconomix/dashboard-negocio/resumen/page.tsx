'use client';

import * as XLSX from 'xlsx';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, DollarSign, Package, TrendingUp, AlertCircle, 
  Calendar, Store, CalendarRange, Sparkles, CheckCircle2, 
  Receipt, ArrowUpRight, ShoppingCart, FileText, FileDown, Clock, UserCheck, Star, Users,
  ChevronDown, Menu, Banknote, ArrowRightLeft, QrCode
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [selectedCashierFilter, setSelectedCashierFilter] = useState<string>('ALL');

  // Dates
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const cicloRange = useMemo(() => getCicloContableRange(new Date()), []);

  // Branches Query
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', effectiveRetailerId));
  }, [firestore, user, effectiveRetailerId]);
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
    if (!selectedDateFilter) return sales;
    return sales.filter((s: any) => {
      const d = s.soldAt?.toDate ? s.soldAt.toDate() : new Date(s.soldAt || s.date || Date.now());
      return format(d, 'yyyy-MM-dd') === selectedDateFilter;
    });
  }, [sales, selectedDateFilter]);

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

  // Compute real-time collections for a cashier session
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
        } else if (op.paymentMethod === 'cash' || op.paymentMethod === 'efectivo') {
          cash += amount;
        } else if (op.paymentMethod === 'transfer' || op.paymentMethod === 'transferencia') {
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

  // Branch Performance & Today Breakdown
  const branchBreakdown = useMemo(() => {
    const allBranchesList: any[] = branches && branches.length > 0 ? [...branches] : [];
    if (!allBranchesList.some((b: any) => b.id === 'central' || b.isCentral)) {
      allBranchesList.unshift({
        id: 'central',
        name: 'Casa Central',
        isCentral: true
      });
    }

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    return allBranchesList.map((branch: any) => {
      const isThisCentral = branch.id === 'central' || branch.isCentral;

      const matchBranch = (itemBranchId?: string) => {
        if (isThisCentral) {
          return !itemBranchId || itemBranchId === 'central' || itemBranchId === branch.id;
        }
        return itemBranchId === branch.id;
      };

      // Operaciones de HOY para esta sucursal
      const todayBranchOps = (rawOpsUnfiltered || []).filter((op: any) => {
        if (op.status === 'refunded' || op.status === 'voided') return false;
        if (op.type !== 'sale' && op.type !== 'credit_sale' && op.type !== 'checkout') return false;

        const opTime = op.createdAt?.toDate 
          ? op.createdAt.toDate() 
          : (op.createdAt?.seconds ? new Date(op.createdAt.seconds * 1000) : new Date(op.date || 0));

        if (
          opTime.getFullYear() !== todayYear ||
          opTime.getMonth() !== todayMonth ||
          opTime.getDate() !== todayDate
        ) {
          return false;
        }

        return matchBranch(op.branchId);
      });

      let todayTotal = 0;
      let todayCash = 0;
      let todayTransfer = 0;
      let todayQr = 0;
      let todayFiado = 0;

      todayBranchOps.forEach((op: any) => {
        const amount = Number(op.total || op.amount || op.totalAmount || 0);
        todayTotal += amount;

        if (op.type === 'credit_sale') {
          todayFiado += amount;
        } else if (op.paymentMethod === 'mixed' && op.splitDetails) {
          todayCash += Number(op.splitDetails.cash || 0);
          todayTransfer += Number(op.splitDetails.transfer || 0);
          todayQr += Number(op.splitDetails.qr || 0);
          if (op.splitDetails.credit) todayFiado += Number(op.splitDetails.credit || 0);
        } else if (op.paymentMethod === 'transfer' || op.paymentMethod === 'transferencia') {
          todayTransfer += amount;
        } else if (op.paymentMethod === 'qr') {
          todayQr += amount;
        } else if (op.paymentMethod === 'credit') {
          todayFiado += amount;
        } else {
          todayCash += amount;
        }
      });

      // Find if this branch has an active shift
      const activeShift = (activeShifts || []).find((s: any) => matchBranch(s.branchId));

      // Turnos de HOY para esta sucursal
      const todayShifts: any[] = [];

      // 1. Turnos cerrados hoy
      (rawShifts || []).forEach((s: any) => {
        if (!matchBranch(s.branchId)) return;

        const startD = s.startTime ? new Date(s.startTime) : null;
        const endD = s.endTime ? new Date(s.endTime) : null;
        const isShiftFromToday = (d: Date | null) => d &&
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate;

        if (isShiftFromToday(startD) || isShiftFromToday(endD)) {
          const shiftTotal = Number(s.report?.total ?? s.actualFinalCash ?? 0);
          const shiftCash = Number(s.report?.cash ?? s.actualFinalCash ?? 0);
          const shiftTransfer = Number(s.report?.transfer ?? 0);
          const shiftQr = Number(s.report?.qr ?? 0);
          const timeRange = `${startD ? format(startD, 'HH:mm') : ''} a ${endD ? format(endD, 'HH:mm') : ''} hs`;

          todayShifts.push({
            id: s.id,
            cashierName: s.cashierName || 'Vendedor',
            status: 'closed',
            statusLabel: 'Cerrado',
            timeRange,
            total: shiftTotal,
            cash: shiftCash,
            transfer: shiftTransfer,
            qr: shiftQr,
            rawShift: s,
          });
        }
      });

      // 2. Turno en vivo si está abierto
      if (activeShift) {
        const shiftMetrics = getShiftMetrics(activeShift);
        const startD = activeShift.startTime ? new Date(activeShift.startTime) : new Date();
        const timeRange = `${format(startD, 'HH:mm')} hs - En curso`;

        todayShifts.push({
          id: activeShift.id,
          cashierName: activeShift.cashierName || 'Vendedor',
          status: 'open',
          statusLabel: 'En Vivo',
          timeRange,
          total: shiftMetrics.totalRecaudado,
          cash: shiftMetrics.cash,
          transfer: shiftMetrics.transfer,
          qr: shiftMetrics.qr,
          rawShift: activeShift,
        });
      }

      // 3. Fallback: Si no hay turnos formalmente registrados en retailer_shifts hoy, agrupar las operaciones de hoy por vendedor
      const sellersMap: Record<string, { cashierName: string; total: number; cash: number; transfer: number; qr: number; count: number }> = {};
      todayBranchOps.forEach((op: any) => {
        const name = op.employeeName || op.cashierName || 'Dueño / Vendedor';
        if (!sellersMap[name]) {
          sellersMap[name] = { cashierName: name, total: 0, cash: 0, transfer: 0, qr: 0, count: 0 };
        }
        const amt = Number(op.total || op.amount || op.totalAmount || 0);
        sellersMap[name].total += amt;
        sellersMap[name].count += 1;
        if (op.paymentMethod === 'transfer' || op.paymentMethod === 'transferencia') sellersMap[name].transfer += amt;
        else if (op.paymentMethod === 'qr') sellersMap[name].qr += amt;
        else sellersMap[name].cash += amt;
      });
      const todaySellers = Object.values(sellersMap);

      return {
        id: branch.id,
        name: branch.name,
        isCentral: isThisCentral,
        address: branch.address || '',
        activeShift,
        todayTotal,
        todaySalesCount: todayBranchOps.length,
        todayCash,
        todayTransfer,
        todayQr,
        todayFiado,
        todayShifts,
        todaySellers,
      };
    });
  }, [branches, rawOpsUnfiltered, rawShifts, activeShifts]);

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

  // Ventas Diarias por Sucursal (Día por Día: Lunes 10/11, Martes 11/11, etc. con sumas de ambos turnos)
  const dailyBranchSales = useMemo(() => {
    const days: any[] = [];
    const today = new Date();
    
    // Lista de sucursales disponibles
    const allBranchesList = branches && branches.length > 0 ? [...branches] : [];
    if (!allBranchesList.some((b: any) => b.id === 'central' || b.isCentral)) {
      allBranchesList.unshift({ id: 'central', name: 'Casa Central', isCentral: true });
    }

    // Últimos 7 días terminando en hoy (cronológico)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dateKey = format(d, 'yyyy-MM-dd');
      const dayNameRaw = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(d);
      const dayName = dayNameRaw.charAt(0).toUpperCase() + dayNameRaw.slice(1);
      const dayMonth = format(d, 'dd/MM');
      const isToday = i === 0;

      // Operaciones de ese día (desde rawOpsUnfiltered)
      const dayOps = (rawOpsUnfiltered || []).filter((op: any) => {
        if (op.status === 'voided' || op.status === 'refunded') return false;
        if (op.type !== 'sale' && op.type !== 'credit_sale' && op.type !== 'checkout') return false;

        const opTime = op.createdAt?.toDate 
          ? op.createdAt.toDate() 
          : (op.createdAt?.seconds ? new Date(op.createdAt.seconds * 1000) : new Date(op.date || 0));

        return (
          opTime.getFullYear() === d.getFullYear() &&
          opTime.getMonth() === d.getMonth() &&
          opTime.getDate() === d.getDate()
        );
      });

      let dayTotal = 0;
      dayOps.forEach((op: any) => {
        dayTotal += Number(op.total || op.amount || op.totalAmount || 0);
      });

      const branchTotals = allBranchesList.map((b: any) => {
        const isCentral = b.id === 'central' || b.isCentral;
        const bOps = dayOps.filter((op: any) => {
          if (isCentral) {
            return !op.branchId || op.branchId === 'central' || op.branchId === b.id;
          }
          return op.branchId === b.id;
        });

        const bTotal = bOps.reduce((sum: number, op: any) => sum + Number(op.total || op.amount || op.totalAmount || 0), 0);
        return {
          id: b.id,
          name: b.name,
          total: bTotal,
          count: bOps.length
        };
      });

      days.push({
        date: d,
        dateKey,
        dayName,
        dayMonth,
        label: `${dayName} ${dayMonth}`,
        isToday,
        dayTotal,
        branchTotals,
        totalSalesCount: dayOps.length
      });
    }

    return days;
  }, [rawOpsUnfiltered, branches]); 
 
  
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
    const isAll = selectedBranchFilter === 'ALL';
    const workbook = XLSX.utils.book_new();

    const periodLabel = periodFilter === 'TODAY' 
      ? 'Hoy' 
      : periodFilter === 'LAST_7_DAYS' 
      ? 'Últimos 7 Días' 
      : periodFilter === 'CUSTOM' 
      ? `Día ${customDate || ''}` 
      : 'Ciclo Contable (10 al 10)';

    if (isAll) {
      // ── INFORME CONSOLIDADO (TODAS LAS SUCURSALES) ──
      // Hoja 1: Resumen General de Sucursales
      const summaryRows: any[][] = [
        ["REDECONOMIX - INFORME CONSOLIDADO DE SUCURSALES"],
        ["Período Auditado", periodLabel],
        ["Fecha de Emisión", format(new Date(), 'dd/MM/yyyy HH:mm')],
        [],
        ["SUCURSAL", "ESTADO CAJA", "TOTAL HOY ($)", "VENTAS HOY", "EFECTIVO HOY ($)", "TRANSFERENCIA HOY ($)", "QR HOY ($)", "FIADO HOY ($)", "CAJERO EN TURNO"],
      ];

      (branchBreakdown || []).forEach((b: any) => {
        summaryRows.push([
          b.name,
          b.activeShift ? "ABIERTA" : "CERRADA",
          b.todayTotal,
          b.todaySalesCount,
          b.todayCash,
          b.todayTransfer,
          b.todayQr,
          b.todayFiado,
          b.activeShift?.cashierName || "Sin turno activo"
        ]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "Resumen General");

      // Hoja 2: Stock Consolidado y por Sucursal
      const stockData = (inventory || []).map((item: any) => {
        const cost = Number(item.purchasePrice || item.costPrice || 0);
        const price = Number(item.salePrice || item.price || 0);
        const totalStock = Number(item.stock) || 0;
        
        const row: any = {
          'Código': item.code || item.barcode || '-',
          'Producto': item.name || 'Sin Nombre',
          'Categoría': item.category || 'General',
          'Stock Total': totalStock,
        };

        // Desglose de stock por cada sucursal
        (branchBreakdown || []).forEach((b: any) => {
          row[`Stock ${b.name}`] = getProductStockForBranch(item, b.id);
        });

        row['Precio Costo ($)'] = cost;
        row['Precio Venta ($)'] = price;
        row['Valorización ($)'] = totalStock * cost;

        return row;
      }).filter((item: any) => item['Stock Total'] > 0);

      stockData.sort((a: any, b: any) => a['Producto'].localeCompare(b['Producto']));
      const wsStock = XLSX.utils.json_to_sheet(stockData);
      XLSX.utils.book_append_sheet(workbook, wsStock, "Stock Consolidado");

      // Hoja 3: Detalle de Ventas del Período
      const salesDetailData = (rawSales || []).map((sale: any) => {
        const d = sale.normalizedDate || (sale.soldAt?.toDate ? sale.soldAt.toDate() : new Date(sale.soldAt || sale.date || Date.now()));
        const itemsList = Array.isArray(sale.items) ? sale.items.map((i: any) => `${i.name || i.productName} (x${i.quantity || i.qty || 1})`).join(', ') : 'Venta directa';
        
        return {
          'Fecha y Hora': format(d, 'dd/MM/yyyy HH:mm'),
          'Sucursal': getBranchName(sale.branchId),
          'Tipo': sale.type === 'credit_sale' ? 'Fiado (Cta Cte)' : 'Venta',
          'Método de Pago': (sale.paymentMethod || 'Efectivo').toUpperCase(),
          'Cajero / Vendedor': sale.employeeName || sale.cashierName || sale.userName || 'Dueño',
          'Cliente': sale.customerName || 'Consumidor Final',
          'Artículos': itemsList,
          'Total ($)': sale.totalAmount || sale.total || sale.amount || 0
        };
      });
      const wsSales = XLSX.utils.json_to_sheet(salesDetailData);
      XLSX.utils.book_append_sheet(workbook, wsSales, "Ventas Totales");

      // Hoja 4: Top Productos
      const topProductsData = (topProducts || []).map((p: any, idx: number) => ({
        'Ranking': idx + 1,
        'Producto': p.name,
        'Unidades Vendidas': p.qty,
        'Total Facturado Estimado ($)': p.total
      }));
      const wsTop = XLSX.utils.json_to_sheet(topProductsData);
      XLSX.utils.book_append_sheet(workbook, wsTop, "Top Productos");

      const fileName = `Informe_General_Sucursales_${periodLabel.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yy_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      // ── INFORME DE SUCURSAL ESPECÍFICA ──
      const currentBranch = branches?.find((b: any) => b.id === selectedBranchFilter);
      const branchName = currentBranch?.name || (selectedBranchFilter === 'central' ? 'Casa Central' : 'Sucursal');
      const isCentral = currentBranch?.isCentral || selectedBranchFilter === 'central';

      const branchSales = sales || [];
      const branchTotalSales = branchSales.reduce((sum: number, s: any) => sum + (s.totalAmount || s.amount || 0), 0);
      const branchTicketsCount = branchSales.length;

      const methods: Record<string, number> = {};
      branchSales.forEach((s: any) => {
        const m = (s.paymentMethod || 'Efectivo').toUpperCase();
        methods[m] = (methods[m] || 0) + (s.totalAmount || s.amount || 0);
      });

      const activeShift = (activeShifts || []).find((s: any) => {
        if (isCentral) return !s.branchId || s.branchId === 'central' || s.branchId === currentBranch?.id;
        return s.branchId === selectedBranchFilter;
      });

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

      stockData.sort((a: any, b: any) => a['Producto'].localeCompare(b['Producto']));
      const wsStock = XLSX.utils.json_to_sheet(stockData);
      XLSX.utils.book_append_sheet(workbook, wsStock, "Stock Sucursal");

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

      const topProductsData = (topProducts || []).map((p: any, idx: number) => ({
        'Ranking': idx + 1,
        'Producto': p.name,
        'Unidades Vendidas': p.qty,
        'Total Facturado Estimado ($)': p.total
      }));
      const wsTop = XLSX.utils.json_to_sheet(topProductsData);
      XLSX.utils.book_append_sheet(workbook, wsTop, "Top Productos");

      const fileName = `Informe_${branchName.replace(/\s+/g, '_')}_${periodLabel.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yy_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
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

      {/* ── VENTAS DIARIAS POR SUCURSAL (DÍA POR DÍA: LUNES 10/11, MARTES 11/11...) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
                Ventas Diarias por Sucursal
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block">
                Totales por día y consolidado de ambos turnos
              </span>
            </div>
          </div>
          {selectedDateFilter && (
            <button
              onClick={() => setSelectedDateFilter(null)}
              className="text-[9px] font-bold text-red-600 hover:text-red-700 uppercase bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              Ver todos (✕)
            </button>
          )}
        </div>

        {/* Carrusel de días horizontal en móviles y grilla en pantallas grandes */}
        <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto no-scrollbar pb-1">
          {dailyBranchSales.map(day => {
            const isSelected = selectedDateFilter === day.dateKey;

            return (
              <div
                key={day.dateKey}
                onClick={() => setSelectedDateFilter(prev => prev === day.dateKey ? null : day.dateKey)}
                className={cn(
                  "min-w-[150px] sm:min-w-0 flex-1 p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none",
                  isSelected
                    ? "bg-red-50/70 border-red-300 ring-2 ring-red-600/30 shadow-xs"
                    : day.isToday
                    ? "bg-white border-red-200 shadow-2xs hover:border-red-300"
                    : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
                )}
              >
                {/* Encabezado: Día y Fecha (ej: Lunes 10/11) */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-slate-800 truncate">
                    {day.label}
                  </span>
                  {day.isToday && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-red-600 text-white shadow-2xs shrink-0">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Importe Total del Día (Suma de ambos turnos / todas las sucursales) */}
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">
                    Total Facturado
                  </span>
                  <div className="text-sm sm:text-base font-black text-red-600 mt-0.5 truncate">
                    ${day.dayTotal.toLocaleString('es-AR')}
                  </div>
                </div>

                {/* Desglose de Sucursales (Solo importes totales) */}
                <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
                  {day.branchTotals.map((bt: any) => (
                    <div key={bt.id} className="flex items-center justify-between text-[10px] gap-1">
                      <span className="font-bold text-slate-500 uppercase truncate max-w-[70px] sm:max-w-[80px]">
                        {bt.name}
                      </span>
                      <span className="font-black text-slate-900 truncate">
                        ${bt.total.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SUCURSALES Y CAJAS EN VIVO (COMPACTO Y CON SELECTOR SANDWICH) ── */}
      {branchBreakdown && branchBreakdown.length > 0 && (() => {
        const branchesToDisplay = selectedBranchFilter === 'ALL'
          ? branchBreakdown
          : branchBreakdown.filter((b: any) => b.id === selectedBranchFilter);

        return (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
            {/* Header de Sucursales con Menú Sandwich Integrado */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Selector Desplegable Tipo Sandwich en el Título */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 hover:border-red-300 shadow-2xs transition-all cursor-pointer group focus:outline-none select-none">
                      <Menu className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
                        Sucursales
                      </span>
                      <span className="text-[10px] sm:text-xs font-black uppercase text-red-600 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        {selectedBranchFilter === 'ALL'
                          ? `TODAS (${branchBreakdown.length})`
                          : (branchBreakdown.find((b: any) => b.id === selectedBranchFilter)?.name || 'Sucursal')}
                        <ChevronDown className="w-3 h-3 text-red-600" />
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 rounded-2xl p-1.5 shadow-xl border-slate-100 bg-white z-50">
                    <DropdownMenuItem
                      onClick={() => setSelectedBranchFilter('ALL')}
                      className={cn(
                        "font-bold text-xs uppercase rounded-xl py-2 px-3 cursor-pointer flex items-center justify-between transition-colors",
                        selectedBranchFilter === 'ALL' ? "bg-red-600 text-white font-black" : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <span>TODAS LAS SUCURSALES</span>
                      <span className="text-[10px] opacity-80">({branchBreakdown.length})</span>
                    </DropdownMenuItem>
                    {branchBreakdown.map((b: any) => (
                      <DropdownMenuItem
                        key={b.id}
                        onClick={() => setSelectedBranchFilter(b.id)}
                        className={cn(
                          "font-bold text-xs uppercase rounded-xl py-2 px-3 cursor-pointer mt-1 flex items-center justify-between transition-colors",
                          selectedBranchFilter === b.id ? "bg-red-600 text-white font-black" : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span>{b.name}</span>
                        {b.activeShift ? (
                          <span className={cn(
                            "text-[9px] font-black px-1.5 py-0.5 rounded",
                            selectedBranchFilter === b.id ? "bg-white text-red-600" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          )}>
                            Abierta
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Controles de la Derecha: Período y Botón Exportar (100% Funcional) */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                <Select 
                  value={periodFilter} 
                  onValueChange={(val: any) => {
                    setPeriodFilter(val);
                    if (val === 'CUSTOM' && !customDate) {
                      setCustomDate(format(new Date(), 'yyyy-MM-dd'));
                    }
                  }}
                >
                  <SelectTrigger className="h-7 sm:h-8 rounded-xl bg-slate-50 border-slate-200 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider px-2 sm:px-2.5 w-auto">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-red-600 shrink-0" />
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

                {periodFilter === 'CUSTOM' && (
                  <input 
                    type="date" 
                    value={customDate || ''}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="h-7 sm:h-8 text-[9px] sm:text-[10px] font-bold uppercase text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2 outline-none focus:border-red-400"
                  />
                )}

                <Button
                  size="sm"
                  onClick={handleExportBranchExcel}
                  className="h-7 sm:h-8 rounded-xl font-bold uppercase text-[9px] sm:text-[10px] tracking-wider px-2.5 sm:px-3 bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center gap-1 select-none transition-transform active:scale-95"
                  title="Exportar informe detallado en Excel"
                >
                  <FileDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>
                    {selectedBranchFilter === 'ALL' 
                      ? "Exportar Todo" 
                      : `Exportar ${branchBreakdown.find((b: any) => b.id === selectedBranchFilter)?.name || 'Sucursal'}`}
                  </span>
                </Button>
              </div>
            </div>

            {/* Tarjetas de Sucursal (SOLO INFORMACIÓN DEL DÍA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchesToDisplay.map((b: any) => (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4 select-none"
                >
                  {/* Encabezado: Nombre y Estado en Vivo */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 uppercase text-sm sm:text-base tracking-tight leading-tight">
                          {b.name}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Hoy • {format(new Date(), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>

                    {b.activeShift ? (
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> Caja Abierta
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-slate-200 text-slate-400 bg-slate-50">
                        Cerrada
                      </span>
                    )}
                  </div>

                  {/* Acumulado del Día */}
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        Acumulado del Día (Hoy)
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-red-600 mt-0.5 tracking-tight">
                        ${b.todayTotal.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-white text-slate-700 border border-red-100 shadow-2xs">
                        {b.todaySalesCount} {b.todaySalesCount === 1 ? 'venta' : 'ventas'}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de Cobros de Hoy (Efectivo, Transferencia, QR) */}
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Cobros de Hoy por Método
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[8px] font-black uppercase tracking-wider">Efectivo</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayCash.toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[8px] font-black uppercase tracking-wider">Transf.</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayTransfer.toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <QrCode className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-[8px] font-black uppercase tracking-wider">QR / Apps</span>
                        </div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayQr.toLocaleString('es-AR')}
                        </div>
                      </div>
                    </div>

                    {b.todayFiado > 0 && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
                        <span className="text-[9px] font-black uppercase text-amber-900 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-amber-600" /> Fiado de Hoy:
                        </span>
                        <span className="font-black text-amber-950">
                          ${b.todayFiado.toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Turnos y Vendedores del Día (Quién vendió en un turno y en el otro) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-600" /> Turnos y Vendedores (Hoy)
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {b.todayShifts.length > 0 
                          ? `${b.todayShifts.length} turnos` 
                          : b.todaySellers.length > 0 
                          ? `${b.todaySellers.length} vendedores` 
                          : '0 turnos'}
                      </span>
                    </div>

                    {b.todayShifts.length > 0 ? (
                      <div className="space-y-2">
                        {b.todayShifts.map((shift: any, idx: number) => (
                          <div key={shift.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 font-black text-xs flex items-center justify-center shrink-0">
                                  {shift.cashierName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-xs font-black uppercase text-slate-900 block leading-tight">
                                    {shift.cashierName}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {shift.timeRange}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-black text-red-600 block">
                                  ${shift.total.toLocaleString('es-AR')}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-1.5 py-0.2 rounded",
                                  shift.status === 'open' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                )}>
                                  {shift.statusLabel}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[9px] text-slate-500 font-bold flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <span>Efvo: <strong className="text-slate-800">${shift.cash.toLocaleString('es-AR')}</strong></span>
                                <span>•</span>
                                <span>Transf: <strong className="text-slate-800">${shift.transfer.toLocaleString('es-AR')}</strong></span>
                                {shift.qr > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>QR: <strong className="text-slate-800">${shift.qr.toLocaleString('es-AR')}</strong></span>
                                  </>
                                )}
                              </div>
                              {shift.status === 'closed' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadShiftPdf(shift.rawShift)}
                                  className="h-5 px-1.5 text-[8px] font-black uppercase text-slate-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                                  title="Descargar comprobante de cierre en PDF"
                                >
                                  <FileDown className="w-3 h-3 mr-0.5" /> PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : b.todaySellers.length > 0 ? (
                      <div className="space-y-2">
                        {b.todaySellers.map((seller: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 font-black text-xs flex items-center justify-center shrink-0">
                                  {seller.cashierName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-xs font-black uppercase text-slate-900 block leading-tight">
                                    {seller.cashierName}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {seller.count} {seller.count === 1 ? 'venta hoy' : 'ventas hoy'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-black text-red-600 block">
                                  ${seller.total.toLocaleString('es-AR')}
                                </span>
                                <span className="text-[8px] font-bold uppercase text-slate-400">
                                  Hoy
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 text-[9px] text-slate-500 font-bold">
                              <span>Efvo: <strong className="text-slate-800">${seller.cash.toLocaleString('es-AR')}</strong></span>
                              <span>•</span>
                              <span>Transf: <strong className="text-slate-800">${seller.transfer.toLocaleString('es-AR')}</strong></span>
                              {seller.qr > 0 && (
                                <>
                                  <span>•</span>
                                  <span>QR: <strong className="text-slate-800">${seller.qr.toLocaleString('es-AR')}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-3.5 text-center rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Sin turnos ni ventas registradas hoy
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── HISTORIAL DE CIERRES DE CAJA (COMPACTO Y ACCESIBLE) ── */}
            {filteredClosedShifts && filteredClosedShifts.length > 0 && (
              <div className="p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50/70 transition-all select-none mt-2">
                <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-200/70 mb-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FileText className="w-4 h-4 text-red-600 shrink-0" />
                    <h3 className="font-black text-slate-900 uppercase text-xs sm:text-sm tracking-tight">
                      Historial de Cierres de Caja
                    </h3>
                  </div>

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

                {displayedClosedShifts.length === 0 ? (
                  <div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sin cierres para este perfil
                  </div>
                ) : (
                  <div className="max-h-[140px] overflow-y-auto no-scrollbar space-y-1.5 pr-0.5">
                    {displayedClosedShifts.map((shift: any) => {
                      const actual = shift.actualFinalCash || 0;
                      const shiftDate = shift.endTime ? new Date(shift.endTime) : new Date();

                      return (
                        <div 
                          key={shift.id}
                          className="p-2 rounded-xl bg-white hover:bg-slate-100/90 border border-slate-200/80 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black text-slate-800 uppercase">
                                {format(shiftDate, 'dd/MM HH:mm')} hs
                              </span>
                              <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-slate-50 text-slate-600 border border-slate-200 truncate max-w-[95px]">
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
            )}
          </div>
        );
      })()}

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
                          {selectedDateFilter ? 'Sin operaciones para el día seleccionado.' : 'Sin operaciones registradas en el período.'}
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
