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
  const [closureEmployeeFilter, setClosureEmployeeFilter] = useState<string>('');
  const [closureDateFilter, setClosureDateFilter] = useState<string>('');

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
      limit(150)
    );
  }, [firestore, user, effectiveRetailerId]);

  const { data: rawShiftsData } = useCollection(shiftsQuery);

  const rawShifts = useMemo(() => {
    if (!rawShiftsData) return [];
    return [...rawShiftsData].sort((a: any, b: any) => {
      const timeA = a.endTime?.seconds ? a.endTime.seconds * 1000 : (a.endTime ? new Date(a.endTime).getTime() : 0);
      const timeB = b.endTime?.seconds ? b.endTime.seconds * 1000 : (b.endTime ? new Date(b.endTime).getTime() : 0);
      return timeB - timeA;
    });
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

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_employees'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [firestore, user, effectiveRetailerId]);

  const { data: employeesData } = useCollection(employeesQuery);

  // Lista de vendedores / empleados del negocio para los filtros
  const uniqueCashiers = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    if (employeesData && employeesData.length > 0) {
      employeesData.forEach((emp: any) => {
        const name = (emp.name || '').trim();
        if (name && emp.status !== 'inactive' && emp.status !== 'deleted') {
          list.push({ id: emp.id || name, name });
        }
      });
    } else {
      // Fallback únicamente a turnos registrados de este comercio
      const map = new Map<string, string>();
      (rawShifts || []).forEach((shift: any) => {
        const name = (shift.cashierName || '').trim();
        if (name && !map.has(name.toLowerCase())) {
          map.set(name.toLowerCase(), name);
          list.push({ id: name, name });
        }
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [employeesData, rawShifts]);

  // Cierres de caja consultados por llamado (Empleado en el mes o Día específico)
  const queriedClosedShifts = useMemo(() => {
    if (!rawShifts) return [];
    if (!closureEmployeeFilter && !closureDateFilter) {
      return []; // Por defecto no muestra nada (función por llamado a demanda)
    }

    let list = [...rawShifts];

    // Si filtró por empleado: traer todas las operaciones / turnos de ese empleado en el mes / ciclo
    if (closureEmployeeFilter) {
      const target = closureEmployeeFilter.toLowerCase().trim();
      list = list.filter((shift: any) => {
        const empName = (shift.cashierName || '').toLowerCase().trim();
        const empId = (shift.employeeId || '').toLowerCase().trim();
        return empName === target || empId === target;
      });
    }

    // Si filtró por día puntual: traer todos los turnos que se hicieron ese día
    if (closureDateFilter) {
      list = list.filter((shift: any) => {
        const startD = shift.startTime ? new Date(shift.startTime) : null;
        const endD = shift.endTime ? new Date(shift.endTime) : null;
        const targetKey = closureDateFilter; // 'yyyy-MM-dd'

        const startMatch = startD && format(startD, 'yyyy-MM-dd') === targetKey;
        const endMatch = endD && format(endD, 'yyyy-MM-dd') === targetKey;
        return startMatch || endMatch;
      });
    }

    return list;
  }, [rawShifts, closureEmployeeFilter, closureDateFilter]);

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
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const shiftDate = shift.endTime ? new Date(shift.endTime) : (shift.startTime ? new Date(shift.startTime) : new Date());
      const cashierName = shift.cashierName || shift.employeeName || 'Cajero';
      const branchName = getBranchName(shift.branchId);

      // Reconstruir reporte si falta para que nunca falle en turnos antiguos
      const report = shift.report || {};
      const cash = Number(report.cash ?? shift.actualFinalCash ?? 0);
      const transfer = Number(report.transfer ?? 0);
      const qr = Number(report.qr ?? 0);
      const credit = Number(report.credit ?? 0);
      const expenses = Number(report.expenses ?? 0);
      const withdrawals = Number(report.withdrawals ?? 0);
      const initialCash = Number(shift.initialCash ?? 0);
      const totalSold = Number(report.total ?? (cash + transfer + qr + credit));
      const expectedCash = Number(report.expectedCash ?? (initialCash + cash - expenses - withdrawals));
      const declaredActual = Number(shift.actualFinalCash ?? cash);
      const declaredDiff = declaredActual - expectedCash;

      let y = 20;

      // Header Banner RedEconomiX
      doc.setFillColor(192, 0, 0); // #C00000
      doc.rect(15, 12, 180, 18, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("COMPROBANTE DE CIERRE DE CAJA", 105, 21, { align: "center" });
      doc.setFontSize(9);
      doc.text("REDECONOMIX NEGOCIO • CONTROL OFICIAL", 105, 27, { align: "center" });

      y = 38;
      doc.setTextColor(30, 41, 59);

      // Info General
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMACIÓN DEL TURNO", 15, y);
      y += 5;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y, 195, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Sucursal:`, 15, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${branchName}`, 55, y);

      doc.setFont("helvetica", "normal");
      doc.text(`Cajero / Vendedor:`, 115, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${cashierName}`, 160, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Apertura:`, 15, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${shift.startTime ? format(new Date(shift.startTime), 'dd/MM/yyyy HH:mm') : '-'} hs`, 55, y);

      doc.setFont("helvetica", "normal");
      doc.text(`Cierre de Caja:`, 115, y);
      doc.setFont("helvetica", "bold");
      doc.text(`${format(shiftDate, 'dd/MM/yyyy HH:mm')} hs`, 160, y);
      y += 12;

      // Arqueo de Efectivo
      doc.setFont("helvetica", "bold");
      doc.text("ARQUEO DE EFECTIVO EN CAJA", 15, y);
      y += 5;
      doc.line(15, y, 195, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`(+) Caja Inicial de Cambio:`, 15, y);
      doc.text(`$${initialCash.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 6;

      doc.text(`(+) Ventas Cobradas en Efectivo:`, 15, y);
      doc.text(`$${cash.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 6;

      if (expenses > 0) {
        doc.text(`(-) Pagos / Egresos de Caja:`, 15, y);
        doc.text(`-$${expenses.toLocaleString('es-AR')}`, 175, y, { align: "right" });
        y += 6;
      }

      if (withdrawals > 0) {
        doc.text(`(-) Retiros de Efectivo:`, 15, y);
        doc.text(`-$${withdrawals.toLocaleString('es-AR')}`, 175, y, { align: "right" });
        y += 6;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`(=) Total Efectivo Esperado por Sistema:`, 15, y);
      doc.text(`$${expectedCash.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 7;

      doc.text(`Efectivo Real Declarado en Cierre:`, 15, y);
      doc.text(`$${declaredActual.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 7;

      doc.text(`Diferencia de Caja:`, 15, y);
      if (declaredDiff < 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`-$${Math.abs(declaredDiff).toLocaleString('es-AR')} (FALTANTE)`, 175, y, { align: "right" });
      } else if (declaredDiff > 0) {
        doc.setTextColor(16, 185, 129);
        doc.text(`+$${declaredDiff.toLocaleString('es-AR')} (SOBRANTE)`, 175, y, { align: "right" });
      } else {
        doc.setTextColor(16, 185, 129);
        doc.text(`$0 (EXACTO)`, 175, y, { align: "right" });
      }
      doc.setTextColor(30, 41, 59);
      y += 12;

      // Desglose por Medio de Cobro
      doc.setFont("helvetica", "bold");
      doc.text("RECAUDACIÓN POR MEDIO DE COBRO", 15, y);
      y += 5;
      doc.line(15, y, 195, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Efectivo:`, 15, y);
      doc.text(`$${cash.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 6;

      doc.text(`Transferencias Bancarias:`, 15, y);
      doc.text(`$${transfer.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 6;

      doc.text(`QR / MercadoPago / Apps:`, 15, y);
      doc.text(`$${qr.toLocaleString('es-AR')}`, 175, y, { align: "right" });
      y += 6;

      if (credit > 0) {
        doc.text(`Fiados (Cuentas Corrientes):`, 15, y);
        doc.text(`$${credit.toLocaleString('es-AR')}`, 175, y, { align: "right" });
        y += 6;
      }

      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 10, 'F');
      doc.text(`TOTAL VENDIDO EN EL TURNO:`, 20, y + 7);
      doc.setTextColor(192, 0, 0);
      doc.text(`$${totalSold.toLocaleString('es-AR')}`, 190, y + 7, { align: "right" });
      doc.setTextColor(30, 41, 59);

      // Pie del comprobante
      y += 24;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("Auditoría generada desde RedEconomiX Negocio • Sistema Oficial de Gestión", 105, y, { align: "center" });

      // Descarga / apertura 100% compatible con móviles y navegadores
      const fileName = `Cierre_${cashierName.replace(/\s+/g, '_')}_${format(shiftDate, 'dd-MM-yy_HHmm')}.pdf`;
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();

      // En móviles, abrir también directamente la URL blob por si el navegador bloquea la descarga automática
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (_) {}
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.open(blobUrl, '_blank');
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      }, 350);

    } catch (e) {
      console.error("Error generando PDF de cierre:", e);
      alert("Error al generar el PDF de cierre. Por favor intente nuevamente.");
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

      {/* ── CIERRES DE CAJA Y TURNOS (AUDITORÍA A DEMANDA / POR LLAMADO) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
              Cierres de Caja
            </h2>
          </div>
          {(closureEmployeeFilter || closureDateFilter) && (
            <button
              onClick={() => {
                setClosureEmployeeFilter('');
                setClosureDateFilter('');
              }}
              className="text-[9px] font-bold text-red-600 hover:text-red-700 uppercase bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              Limpiar filtros (✕)
            </button>
          )}
        </div>

        {/* Filtros: Empleado (mes) y Día específico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Empleado (Turnos del Mes)
            </label>
            <Select 
              value={closureEmployeeFilter || 'NONE'} 
              onValueChange={(val) => setClosureEmployeeFilter(val === 'NONE' ? '' : val)}
            >
              <SelectTrigger className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold px-2.5 shadow-2xs">
                <SelectValue placeholder="Seleccionar empleado..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-slate-100">
                <SelectItem value="NONE" className="text-xs font-medium text-slate-400">
                  Ninguno (Sin filtro)
                </SelectItem>
                {uniqueCashiers.map((c: any) => (
                  <SelectItem key={c.id} value={c.name} className="text-xs font-bold py-1.5">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Día (Turnos de la Fecha)
            </label>
            <input
              type="date"
              value={closureDateFilter}
              onChange={(e) => setClosureDateFilter(e.target.value)}
              className="h-9 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold px-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600/30"
            />
          </div>
        </div>

        {/* Estado por llamado: sólo se muestra si se accionó algún filtro */}
        {closureEmployeeFilter || closureDateFilter ? (
          queriedClosedShifts.length === 0 ? (
            <div className="py-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
              No se encontraron turnos cerrados con los filtros seleccionados
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Turnos encontrados: <strong className="text-slate-700">{queriedClosedShifts.length}</strong>
                </span>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {queriedClosedShifts.map((shift: any) => {
                  const actual = shift.actualFinalCash || 0;
                  const shiftDate = shift.endTime ? (shift.endTime.toDate ? shift.endTime.toDate() : new Date(shift.endTime.seconds ? shift.endTime.seconds * 1000 : shift.endTime)) : new Date();
                  const branchLabel = shift.branchName || (branches.find(b => b.id === shift.branchId)?.name) || 'Sucursal';
                  const totalSold = shift.report?.total ?? shift.totalSold ?? 0;
                  const expected = shift.report?.expectedFinalCash ?? shift.expectedCash ?? actual;
                  const diff = actual - expected;

                  return (
                    <div
                      key={shift.id}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs font-black text-slate-900 uppercase">
                          {format(shiftDate, 'dd/MM/yyyy HH:mm')} hs • {shift.cashierName || 'Cajero'} • {branchLabel}
                        </div>
                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-500 flex-wrap pt-0.5">
                          <span>Vendido: <strong className="text-slate-900 font-black">${totalSold.toLocaleString('es-AR')}</strong></span>
                          <span>•</span>
                          <span>Declarado Efvo: <strong className="text-slate-900 font-black">${actual.toLocaleString('es-AR')}</strong></span>
                          <span>•</span>
                          <span>
                            Diferencia:{' '}
                            <strong className={cn(
                              "font-black",
                              diff < 0 ? "text-red-600" : "text-slate-800"
                            )}>
                              {diff === 0 ? '$0 (Exacto)' : diff < 0 ? `-$${Math.abs(diff).toLocaleString('es-AR')}` : `+$${diff.toLocaleString('es-AR')}`}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadShiftPdf(shift)}
                        className="h-8 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase transition-colors shrink-0 cursor-pointer"
                        title="Descargar comprobante de cierre en PDF"
                      >
                        Descargar PDF
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : null}
      </div>

      {/* ── VENTAS DIARIAS POR SUCURSAL ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
              Ventas Diarias por Sucursal
            </h2>
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
                    <span className="text-[9px] font-black uppercase text-red-600">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Desglose de Sucursales (Solo importes totales) */}
                <div className="pt-1.5 space-y-1">
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

                {/* Total al pie de la tarjeta sumando ambos importes */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    TOTAL
                  </span>
                  <div className="text-xs sm:text-sm font-black text-red-600 truncate">
                    ${day.dayTotal.toLocaleString('es-AR')}
                  </div>
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
            {/* Header de Sucursales con Selector Desplegable en el Título */}
            <div className="flex items-center justify-between gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 hover:text-red-600 transition-colors cursor-pointer select-none">
                    <span>Sucursales</span>
                    <span className="text-red-600">
                      ({selectedBranchFilter === 'ALL'
                        ? 'TODAS'
                        : (branchBreakdown.find((b: any) => b.id === selectedBranchFilter)?.name || 'SUCURSAL')})
                    </span>
                    <ChevronDown className="w-4 h-4 text-red-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-2xl p-1.5 shadow-xl border-slate-100 bg-white z-50">
                  <DropdownMenuItem
                    onClick={() => setSelectedBranchFilter('ALL')}
                    className={cn(
                      "font-bold text-xs uppercase rounded-xl py-2 px-3 cursor-pointer flex items-center justify-between transition-colors",
                      selectedBranchFilter === 'ALL' ? "bg-red-600 text-white font-black" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>TODAS LAS SUCURSALES</span>
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
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tarjetas de Sucursal (SOLO INFORMACIÓN DEL DÍA) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branchesToDisplay.map((b: any) => (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-4 select-none"
                >
                  {/* Encabezado: Nombre y Estado */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 uppercase text-sm sm:text-base tracking-tight leading-tight">
                        {b.name}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Hoy • {format(new Date(), 'dd/MM/yyyy')}
                      </span>
                    </div>

                    {b.activeShift ? (
                      <span className="text-xs font-black uppercase text-red-600 tracking-wider">
                        CAJA ABIERTA
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        CERRADA
                      </span>
                    )}
                  </div>

                  {/* Acumulado del Día */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        Acumulado del Día (Hoy)
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-red-600 mt-0.5 tracking-tight">
                        ${b.todayTotal.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold uppercase text-slate-500">
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
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Efectivo</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayCash.toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 text-center">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Transf.</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayTransfer.toLocaleString('es-AR')}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 text-center">
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">QR / Apps</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          ${b.todayQr.toLocaleString('es-AR')}
                        </div>
                      </div>
                    </div>

                    {b.todayFiado > 0 && (
                      <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <span className="text-[9px] font-black uppercase text-slate-600">
                          Fiado de Hoy:
                        </span>
                        <span className="font-black text-slate-900">
                          ${b.todayFiado.toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Turnos y Vendedores del Día (Quién vendió en un turno y en el otro) */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Turnos y Vendedores (Hoy)
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
                              <div>
                                <span className="text-xs font-black uppercase text-slate-900 block leading-tight">
                                  {shift.cashierName}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {shift.timeRange}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-black text-red-600 block">
                                  ${shift.total.toLocaleString('es-AR')}
                                </span>
                                <span className={shift.status === 'open' ? "text-[9px] font-black uppercase text-red-600" : "text-[9px] font-bold uppercase text-slate-400"}>
                                  {shift.status === 'open' ? 'En Curso' : 'Cerrado'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[9px] text-slate-600 font-bold flex-wrap gap-1">
                              <div className="flex items-center gap-2">
                                <span>Efvo: <strong className="text-slate-900">${shift.cash.toLocaleString('es-AR')}</strong></span>
                                <span>•</span>
                                <span>Transf: <strong className="text-slate-900">${shift.transfer.toLocaleString('es-AR')}</strong></span>
                                {shift.qr > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>QR: <strong className="text-slate-900">${shift.qr.toLocaleString('es-AR')}</strong></span>
                                  </>
                                )}
                              </div>
                              {shift.status === 'closed' && (
                                <button
                                  onClick={() => handleDownloadShiftPdf(shift.rawShift)}
                                  className="text-[9px] font-black uppercase text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                  Descargar PDF
                                </button>
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
                              <div>
                                <span className="text-xs font-black uppercase text-slate-900 block leading-tight">
                                  {seller.cashierName}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {seller.count} {seller.count === 1 ? 'venta hoy' : 'ventas hoy'}
                                </span>
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

                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50 text-[9px] text-slate-600 font-bold">
                              <span>Efvo: <strong className="text-slate-900">${seller.cash.toLocaleString('es-AR')}</strong></span>
                              <span>•</span>
                              <span>Transf: <strong className="text-slate-900">${seller.transfer.toLocaleString('es-AR')}</strong></span>
                              {seller.qr > 0 && (
                                <>
                                  <span>•</span>
                                  <span>QR: <strong className="text-slate-900">${seller.qr.toLocaleString('es-AR')}</strong></span>
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
          </div>
        );
      })()}

      {/* ── ÚLTIMAS VENTAS Y REPOSICIÓN ── */}
      <div className="grid grid-cols-1 gap-6">
        {/* LISTADO DE ÚLTIMAS VENTAS (A ANCHO COMPLETO Y CON TEXTO LEGIBLE) */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="pb-1 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 leading-tight">
              Últimas Operaciones Registradas
            </h2>
          </div>

          {(() => {
            if (!filteredSales || filteredSales.length === 0) {
              return (
                <div className="py-8 text-center font-bold text-slate-400 text-xs uppercase tracking-widest bg-slate-50 rounded-2xl border border-slate-100">
                  {selectedDateFilter ? 'Sin operaciones para el día seleccionado.' : 'Sin operaciones registradas en el período.'}
                </div>
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

            return (
              <div className="space-y-4">
                {sortedDates.map(dateKey => {
                  const daySales = grouped[dateKey];
                  const displayDate = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(dateKey + 'T12:00:00'));

                  return (
                    <div key={dateKey} className="space-y-2">
                      {/* Divisor de Fecha */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                        <span>{displayDate}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {daySales.length} {daySales.length === 1 ? 'operación' : 'operaciones'}
                        </span>
                      </div>

                      {/* Listado de Tickets en 2 Líneas ocupando todo el ancho */}
                      <div className="space-y-2.5">
                        {daySales.map(({ sale, date: saleDate }: any) => {
                          const isCreditSale = sale.type === 'credit_sale' || sale.paymentMethod === 'credit';
                          const isRefunded = sale.status === 'refunded';
                          const items = Array.isArray(sale.items) && sale.items.length > 0 ? sale.items : [null];

                          const methodText = isRefunded
                            ? 'DEVUELTO'
                            : isCreditSale
                            ? `FIADO ${sale.customerName ? `(${sale.customerName})` : ''}`
                            : sale.paymentMethod === 'transfer'
                            ? 'TRANSF.'
                            : sale.paymentMethod === 'qr'
                            ? 'QR'
                            : sale.paymentMethod === 'mixed'
                            ? 'MIXTO'
                            : 'EFECTIVO';

                          return (
                            <div 
                              key={sale.id}
                              className={cn(
                                "w-full p-3 sm:p-4 rounded-2xl border transition-all space-y-2 select-none",
                                isRefunded
                                  ? "bg-slate-50/70 border-slate-200 opacity-60"
                                  : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                              )}
                            >
                              {/* LÍNEA 1: HORA • SUCURSAL • VENDEDOR | MÉTODO Y TOTAL */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                                  {format(saleDate, 'HH:mm')} hs • {getBranchName(sale.branchId)} • {sale.employeeName || 'Dueño'}
                                </div>

                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-[10px] font-black uppercase text-slate-500">
                                    {methodText}
                                  </span>
                                  <span className={cn(
                                    "text-sm sm:text-base font-black tracking-tight",
                                    isRefunded ? "text-slate-400 line-through" : "text-red-600"
                                  )}>
                                    ${(sale.totalAmount || sale.amount || 0).toLocaleString('es-AR')}
                                  </span>
                                </div>
                              </div>

                              {/* LÍNEA 2: DETALLE DEL TICKET (CANTIDAD / CÓDIGO / PRODUCTO / IMPORTE) */}
                              <div className="w-full bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-100 space-y-1.5">
                                {items.map((i: any, idx: number) => {
                                  const code = i?.code || i?.barcode || inventory?.find((p: any) => p.id === i?.productId)?.code || inventory?.find((p: any) => p.id === i?.productId)?.barcode || null;
                                  const productName = i?.name || sale.concept || 'Venta General';
                                  const qty = i?.qty || i?.quantity || 1;
                                  const unitPrice = i?.price || i?.salePrice || 0;
                                  const itemTotal = unitPrice * qty;

                                  return (
                                    <div key={idx} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="font-black text-slate-900 shrink-0">
                                          {qty}x
                                        </span>
                                        <span className="font-bold text-slate-800 uppercase truncate">
                                          {productName}
                                        </span>
                                        {code && (
                                          <span className="font-mono text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                                            ({code})
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                                          ${(itemTotal > 0 ? itemTotal : (sale.totalAmount || sale.amount || 0)).toLocaleString('es-AR')}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Volumen Despachado</span>
            <span className="text-base sm:text-lg font-black text-slate-900">{stats.unitsSold} <span className="text-xs font-bold text-slate-500 uppercase">Unidades</span></span>
          </div>
          <Button variant="outline" className="mt-2 w-full h-11 rounded-2xl font-black uppercase tracking-wider text-xs border-slate-200" asChild>
            <Link href="/redeconomix/dashboard-negocio/control-ventas">Ir a Caja / Punto de Venta</Link>
          </Button>
        </div>
        
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
