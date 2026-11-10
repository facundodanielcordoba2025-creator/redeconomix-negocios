'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, query, where, doc, deleteDoc, setDoc, updateDoc, 
  addDoc, serverTimestamp, getDocs, orderBy, writeBatch 
} from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { 
  Users, Search, Trash2, Plus, ShieldCheck, ArrowLeft, Briefcase, 
  KeyRound, CheckCircle2, Ban, Calendar, Clock, DollarSign, 
  AlertTriangle, FileText, Sparkles, ChevronRight, UserCheck, 
  TrendingDown, TrendingUp, HelpCircle, Loader2, Phone, Eye, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, DialogContent, DialogTitle, DialogFooter, DialogHeader, DialogDescription 
} from '@/components/ui/dialog';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/role-guard';
import { format, differenceInMinutes } from 'date-fns';
import { getCicloContableRange } from '@/lib/ciclo-contable-helper';

export default function RRHHPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { effectiveRetailerId } = useRole();
    const targetRetailerId = effectiveRetailerId || user?.uid;
    const { toast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isClient, setIsClient] = useState(false);
    
    // Tabs: 'employees' (personal) | 'payroll' (liquidaciones)
    const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<any | null>(null);
    const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [advanceEmployee, setAdvanceEmployee] = useState<any | null>(null);
    const [advanceType, setAdvanceType] = useState<'cash' | 'product'>('cash');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceDescription, setAdvanceDescription] = useState('');
    const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);
    const [isSubmittingLiquidation, setIsSubmittingLiquidation] = useState(false);

    // Form Alta Empleado
    const [newName, setNewName] = useState('');
    const [newDni, setNewDni] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newRole, setNewRole] = useState<'cashier' | 'warehouse' | 'accountant' | 'cashier_warehouse' | 'preventista'>('cashier');
    const [newBranchId, setNewBranchId] = useState('');
    const [newBaseSalary, setNewBaseSalary] = useState('');

    // Form Edición Empleado
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDni, setEditDni] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPin, setEditPin] = useState('');
    const [editRole, setEditRole] = useState<'cashier' | 'warehouse' | 'accountant' | 'cashier_warehouse' | 'preventista'>('cashier');
    const [editBranchId, setEditBranchId] = useState('');
    const [editBaseSalary, setEditBaseSalary] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Form Liquidación
    const [liqEmployee, setLiqEmployee] = useState<any | null>(null);
    const [liqBaseSalary, setLiqBaseSalary] = useState('');
    const [liqBonus, setLiqBonus] = useState('');
    const [liqDeductions, setLiqDeductions] = useState('');
    const [liqCashDifferenceDeduction, setLiqCashDifferenceDeduction] = useState(0);
    const [liqNotes, setLiqNotes] = useState('');

    useEffect(() => { setIsClient(true); }, []);

    // Ciclo Contable (Días 1 al 10)
    const cicloRange = useMemo(() => getCicloContableRange(new Date()), []);

    // 1. Fetch Employees
    const employeesQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(collection(firestore, 'retailer_employees'), where('retailerId', '==', targetRetailerId));
    }, [firestore, user, targetRetailerId]);
    const { data: employees, isLoading: isLoadingEmployees } = useCollection<any>(employeesQuery);

    // 2. Fetch Branches
    const branchesQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', targetRetailerId));
    }, [firestore, user, targetRetailerId]);
    const { data: branches } = useCollection<any>(branchesQuery);

    // 3. Fetch Shifts (Turnos de caja abiertos y cerrados de este comercio)
    const shiftsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(
          collection(firestore, 'retailer_shifts'),
          where('retailerId', '==', targetRetailerId)
        );
    }, [firestore, user, targetRetailerId]);
    const { data: allShifts, isLoading: isLoadingShifts } = useCollection<any>(shiftsQuery);

    // 3.1 Fetch Advances & Product withdrawals (Anticipos y Mercadería anotada)
    const advancesQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(
          collection(firestore, 'retailer_employee_advances'),
          where('retailerId', '==', targetRetailerId)
        );
    }, [firestore, user, targetRetailerId]);
    const { data: allAdvances, isLoading: isLoadingAdvances } = useCollection<any>(advancesQuery);

    // 4. Fetch Payroll Settlements (Liquidaciones históricas)
    const payrollQuery = useMemoFirebase(() => {
        if (!firestore || !user || !targetRetailerId) return null;
        return query(
          collection(firestore, 'retailer_daily_operations'),
          where('retailerId', '==', targetRetailerId),
          where('recordType', '==', 'PAYROLL_SETTLEMENT')
        );
    }, [firestore, user, targetRetailerId]);
    const { data: payrollHistory, isLoading: isLoadingPayroll } = useCollection<any>(payrollQuery);

    // Filter Employees
    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        const q = searchTerm.toLowerCase().trim();
        if (!q) return employees;
        return employees.filter(e => 
            e.name?.toLowerCase().includes(q) || 
            e.dni?.includes(q) ||
            e.phone?.includes(q)
        );
    }, [employees, searchTerm]);

    // Estadísticas de turnos por empleado (Legajo)
    const getEmployeeShiftStats = (employee: any) => {
        if (!allShifts) return { 
            totalShifts: 0, 
            totalHours: '0', 
            totalCashShortage: 0, 
            totalCashSurplus: 0, 
            totalCashAdvances: 0,
            totalProductAdvances: 0,
            totalAdvances: 0,
            advances: [],
            pendingAdvances: [],
            shifts: [] 
        };
        
        // Emparejar por employeeId o por cashierName si es antiguo
        const empShifts = allShifts.filter((s: any) => 
            (s.employeeId && s.employeeId === employee.id) ||
            (s.cashierName && s.cashierName.toLowerCase().trim() === employee.name.toLowerCase().trim())
        ).sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        let totalMinutes = 0;
        let totalCashShortage = 0; // Faltantes de caja (diferencia negativa)
        let totalCashSurplus = 0; // Sobrantes de caja

        empShifts.forEach((s: any) => {
            if (s.startTime && s.endTime) {
                const mins = differenceInMinutes(new Date(s.endTime), new Date(s.startTime));
                if (mins > 0 && mins < 1440) totalMinutes += mins;
            }
            if (s.report && typeof s.report.difference === 'number') {
                if (s.report.difference < 0) {
                    totalCashShortage += Math.abs(s.report.difference);
                } else if (s.report.difference > 0) {
                    totalCashSurplus += s.report.difference;
                }
            }
        });

        const totalHours = (totalMinutes / 60).toFixed(1);

        // Anticipos y productos retirados pendientes de liquidar
        const empAdvances = (allAdvances || []).filter((a: any) => 
            (a.employeeId && a.employeeId === employee.id) ||
            (a.employeeDni && a.employeeDni === employee.dni)
        ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const pendingAdvances = empAdvances.filter((a: any) => a.status !== 'SETTLED');
        const totalCashAdvances = pendingAdvances.filter((a: any) => a.type === 'cash').reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const totalProductAdvances = pendingAdvances.filter((a: any) => a.type === 'product').reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const totalAdvances = totalCashAdvances + totalProductAdvances;
        return {
            totalShifts: empShifts.length,
            totalHours,
            totalCashShortage,
            totalCashSurplus,
            totalCashAdvances,
            totalProductAdvances,
            totalAdvances,
            advances: empAdvances,
            pendingAdvances,
            shifts: empShifts
        };
    };

    const handleCreateEmployee = async () => {
        if (!firestore || !user) return;
        if (!newName.trim() || !newDni.trim() || newPin.length !== 4 || !newBranchId) {
            return toast({ title: "Datos incompletos", description: "Nombre, DNI, PIN de 4 dígitos y Sucursal son obligatorios.", variant: 'destructive' });
        }

        const existing = employees?.find(e => e.dni === newDni);
        if (existing) {
            return toast({ title: "DNI Duplicado", description: "Ya existe un empleado con este DNI.", variant: 'destructive' });
        }

        try {
            const empId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
            await setDoc(doc(firestore, 'retailer_employees', empId), {
                id: empId,
                retailerId: targetRetailerId,
                name: newName.trim(),
                dni: newDni.trim(),
                phone: newPhone.trim() || undefined,
                email: newEmail.trim().toLowerCase() || undefined,
                pin: newPin.trim(),
                role: newRole,
                branchId: newBranchId,
                baseSalary: newBaseSalary ? Number(newBaseSalary) : 0,
                status: 'active',
                createdAt: new Date().toISOString()
            });

            toast({ title: "Empleado Registrado 👤", description: `${newName} ya tiene su legajo y acceso creado.` });
            setIsAddModalOpen(false);
            setNewName('');
            setNewDni('');
            setNewPhone('');
            setNewEmail('');
            setNewPin('');
            setNewBaseSalary('');
            setNewRole('cashier');
            setNewBranchId('');
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: 'destructive' });
        }
    };

    const handleOpenEdit = (emp: any) => {
        setEditingEmployee(emp);
        setEditName(emp.name || '');
        setEditDni(emp.dni || '');
        setEditPhone(emp.phone || '');
        setEditEmail(emp.email || '');
        setEditPin(emp.pin || '');
        setEditRole(emp.role || 'cashier');
        setEditBranchId(emp.branchId || 'central');
        setEditBaseSalary(emp.baseSalary ? String(emp.baseSalary) : '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!firestore || !editingEmployee) return;
        if (!editName.trim() || !editDni.trim() || !editPin.trim()) {
            return toast({ 
                title: "Datos incompletos", 
                description: "Nombre, DNI y PIN son obligatorios.", 
                variant: 'destructive' 
            });
        }

        setIsSavingEdit(true);
        try {
            await updateDoc(doc(firestore, 'retailer_employees', editingEmployee.id), {
                name: editName.trim(),
                dni: editDni.trim(),
                phone: editPhone.trim() || undefined,
                email: editEmail.trim().toLowerCase() || undefined,
                pin: editPin.trim(),
                role: editRole,
                branchId: editBranchId,
                baseSalary: editBaseSalary ? Number(editBaseSalary) : 0,
                updatedAt: new Date().toISOString()
            });

            toast({ 
                title: "Legajo Actualizado 👤", 
                description: `Los datos de ${editName} (incluyendo su email de acceso) fueron guardados exitosamente.` 
            });
            setIsEditModalOpen(false);
            setEditingEmployee(null);
        } catch (err: any) {
            toast({ title: "Error al actualizar", description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleOpenLiquidation = (employee: any) => {
        const stats = getEmployeeShiftStats(employee);
        setLiqEmployee(employee);
        setLiqBaseSalary(String(employee.baseSalary || 0));
        setLiqBonus('0');
        // Otras deducciones incluye anticipos + productos retirados
        setLiqDeductions(String(stats.totalAdvances || 0));
        setLiqCashDifferenceDeduction(stats.totalCashShortage);
        setLiqNotes(`Liquidación Período ${cicloRange.label} (Incluye -$${stats.totalAdvances} en adelantos y mercadería)`);
        setIsLiquidationModalOpen(true);
    };

    const handleSaveAdvance = async () => {
        if (!firestore || !user || !targetRetailerId || !advanceEmployee || !advanceAmount) {
            return toast({ title: "Datos incompletos", description: "Ingresa el importe del anticipo.", variant: 'destructive' });
        }
        setIsSubmittingAdvance(true);
        try {
            await addDoc(collection(firestore, 'retailer_employee_advances'), {
                retailerId: targetRetailerId,
                employeeId: advanceEmployee.id,
                employeeName: advanceEmployee.name,
                employeeDni: advanceEmployee.dni,
                type: advanceType,
                amount: Number(advanceAmount) || 0,
                description: advanceDescription.trim() || (advanceType === 'cash' ? 'Anticipo en efectivo' : 'Retiro de mercadería'),
                status: 'PENDING',
                date: new Date().toISOString(),
                createdAt: serverTimestamp()
            });

            // Si es adelanto en efectivo, registrarlo también como salida de dinero operativo
            if (advanceType === 'cash') {
                await addDoc(collection(firestore, 'retailer_daily_operations'), {
                    retailerId: targetRetailerId,
                    type: 'expense',
                    concept: `Anticipo de Sueldo: ${advanceEmployee.name}`,
                    total: Number(advanceAmount) || 0,
                    amount: Number(advanceAmount) || 0,
                    category: 'ANTICIPOS_SUELDOS',
                    date: new Date().toISOString(),
                    createdAt: serverTimestamp(),
                });
            }

            toast({ title: "Registrado con Éxito ✅", description: `${advanceType === 'cash' ? 'Anticipo de $' : 'Mercadería de $'}${advanceAmount} anotado a ${advanceEmployee.name}.` });
            setIsAdvanceModalOpen(false);
            setAdvanceAmount('');
            setAdvanceDescription('');
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: 'destructive' });
        } finally {
            setIsSubmittingAdvance(false);
        }
    };

    const handleSaveLiquidation = async () => {
        if (!firestore || !user || !targetRetailerId || !liqEmployee) return;
        setIsSubmittingLiquidation(true);

        const base = Number(liqBaseSalary) || 0;
        const bonus = Number(liqBonus) || 0;
        const otherDeductions = Number(liqDeductions) || 0;
        const shortage = Number(liqCashDifferenceDeduction) || 0;
        const totalToPay = Math.max(0, base + bonus - otherDeductions - shortage);
        const nowIso = new Date().toISOString();

        try {
            const batch = writeBatch(firestore);

            const settlementRef = doc(collection(firestore, 'retailer_daily_operations'));
            batch.set(settlementRef, {
                id: settlementRef.id,
                retailerId: targetRetailerId,
                employeeId: liqEmployee.id,
                employeeName: liqEmployee.name,
                employeeDni: liqEmployee.dni,
                cycleLabel: cicloRange.label,
                periodMonthYear: format(new Date(), 'yyyy-MM'),
                baseSalary: base,
                bonus,
                otherDeductions,
                cashShortageDeduction: shortage,
                totalNetSalary: totalToPay,
                status: 'LIQUIDATED',
                settledAt: nowIso,
                notes: liqNotes,
                recordType: 'PAYROLL_SETTLEMENT',
                createdAt: serverTimestamp()
            });

            // Registrar también como gasto fijo operativo en el módulo contable
            const expenseRef = doc(collection(firestore, 'retailer_daily_operations'));
            batch.set(expenseRef, {
                id: expenseRef.id,
                retailerId: targetRetailerId,
                type: 'expense',
                concept: `Sueldo Personal: ${liqEmployee.name} (${cicloRange.label})`,
                total: totalToPay,
                amount: totalToPay,
                category: 'SUELDOS_RRHH',
                date: nowIso,
                createdAt: serverTimestamp(),
            });

            // Marcar todos los anticipos y retiros pendientes de este empleado como SETTLED para no volver a descontarlos el próximo mes
            const empStats = getEmployeeShiftStats(liqEmployee);
            if (empStats.pendingAdvances && empStats.pendingAdvances.length > 0) {
                empStats.pendingAdvances.forEach((adv: any) => {
                    if (adv.id) {
                        batch.update(doc(firestore, 'retailer_employee_advances', adv.id), {
                            status: 'SETTLED',
                            settledAt: nowIso,
                            settlementId: settlementRef.id
                        });
                    }
                });
            }

            await batch.commit();

            toast({ title: "Liquidación Generada 💼", description: `Sueldo neto liquidado: $${totalToPay.toLocaleString('es-AR')}` });
            setIsLiquidationModalOpen(false);
        } catch (err: any) {
            toast({ title: "Error al liquidar", description: err.message, variant: 'destructive' });
        } finally {
            setIsSubmittingLiquidation(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        if ('vibrate' in navigator) navigator.vibrate(8);
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'retailer_employees', id), {
                status: currentStatus === 'active' ? 'suspended' : 'active'
            });
            toast({ title: "Estado Actualizado" });
        } catch (e: any) { toast({ title: "Error", description: e.message, variant: 'destructive' }); }
    };

    const handleDelete = async (id: string) => {
        if ('vibrate' in navigator) navigator.vibrate(8);
        if (!firestore || !confirm('¿Eliminar definitivamente a este empleado?')) return;
        try {
            await deleteDoc(doc(firestore, 'retailer_employees', id));
            toast({ title: "Empleado Eliminado 🗑️" });
            setSelectedEmployeeForDetail(null);
        } catch (e: any) { toast({ title: "Error", description: e.message, variant: 'destructive' }); }
    };

    const getRoleName = (role: string) => {
        switch(role) {
            case 'cashier': return 'Cajero / Ventas';
            case 'warehouse': return 'Almacenero / Repositor';
            case 'cashier_warehouse': return 'Cajero & Almacén (Dual)';
            case 'accountant': return 'Contable / Administración';
            default: return role;
        }
    };

    const getBranchName = (branchId: string) => {
        return branches?.find(b => b.id === branchId)?.name || 'Central';
    };

    if (!isClient) return null;

    return (
        <RoleGuard moduleName="Recursos Humanos" allowedRoles={['admin']}>
            <div className="min-h-screen bg-slate-50 -mx-4 md:-mx-8 lg:-mx-12 -mt-4 md:-mt-8 lg:-mt-12 pb-24 font-sans">
                
                {/* 1. HEADER */}
                <div className="bg-white rounded-b-[3rem] px-6 pt-[110px] pb-8 shadow-sm border-b border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/redeconomix/dashboard-negocio" className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-red-600 mb-0.5">
                                <Users className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gestión de Personal & Nómina</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-800">
                                Recursos Humanos & Legajos
                            </h1>
                        </div>
                    </div>

                    {/* BANNER DE LIQUIDACIÓN DÍAS 1 AL 10 INTEGRADO EN RRHH */}
                    {cicloRange.isLiquidationWindow && (
                        <div className="mb-6 p-5 bg-gradient-to-r from-amber-500 to-red-600 rounded-3xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                                        Período de Liquidación Activo (Días 1 al 10)
                                    </span>
                                    <h3 className="text-base font-black uppercase tracking-tight mt-1">
                                        Ciclo Comercial: {cicloRange.label}
                                    </h3>
                                    <p className="text-xs font-bold text-white/90">
                                        Momento de liquidar sueldos con los faltantes/sobrantes de caja y horas computadas de cada empleado.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setActiveTab('payroll')}
                                className="h-11 bg-white text-red-600 hover:bg-red-50 rounded-2xl font-black uppercase tracking-widest text-xs px-5 shadow-md shrink-0 self-end sm:self-auto"
                            >
                                Ir a Liquidaciones
                            </Button>
                        </div>
                    )}

                    {/* TABS SELECTOR */}
                    <div className="flex gap-2 border-b border-slate-100 pb-3">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={cn(
                                "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'employees' 
                                    ? "bg-slate-900 text-white shadow-md" 
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            👥 Empleados & Legajos ({employees?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('payroll')}
                            className={cn(
                                "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                                activeTab === 'payroll' 
                                    ? "bg-red-600 text-white shadow-md shadow-red-600/20" 
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            💼 Liquidación de Sueldos ({payrollHistory?.length || 0})
                        </button>
                    </div>

                    {/* SEARCH & ALTA */}
                    {activeTab === 'employees' && (
                        <div className="flex gap-3 mt-4">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input 
                                    placeholder="Buscar por nombre, DNI o teléfono..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-12 h-14 bg-slate-50 border-transparent focus:bg-white rounded-2xl font-bold text-slate-700 text-sm"
                                />
                            </div>
                            <Button onClick={() => setIsAddModalOpen(true)} className="h-14 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/30 shrink-0">
                                <Plus className="w-5 h-5 mr-2" />
                                Alta Empleado
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. TAB: EMPLEADOS Y LEGAJOS */}
                {activeTab === 'employees' && (
                    <div className="px-6 mt-8 space-y-4">
                        {isLoadingEmployees ? (
                            <div className="text-center py-16 text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
                                Cargando personal y legajos...
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-100 border-dashed">
                                <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Sin Empleados</h3>
                                <p className="text-xs text-slate-400 font-bold max-w-[240px] mx-auto leading-relaxed mb-4">
                                    Da de alta a tu personal para controlar horarios de entrada/salida, arqueos y liquidaciones de sueldo.
                                </p>
                                <Button onClick={() => setIsAddModalOpen(true)} className="rounded-2xl font-bold text-xs uppercase bg-red-600 text-white">
                                    <Plus className="w-4 h-4 mr-1" /> Dar de Alta Empleado
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredEmployees.map(emp => {
                                    const stats = getEmployeeShiftStats(emp);

                                    return (
                                        <div key={emp.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between gap-4 transition-all hover:shadow-md">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0",
                                                            emp.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                        )}>
                                                            {emp.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-base uppercase tracking-tight line-clamp-1">{emp.name}</h3>
                                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                                {getRoleName(emp.role)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleOpenEdit(emp)}
                                                            className="h-7 px-2 rounded-lg font-bold text-[10px] uppercase text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 transition-colors"
                                                            title="Editar datos de legajo, email o teléfono"
                                                        >
                                                            <Pencil className="w-3 h-3 text-slate-400" />
                                                            Editar
                                                        </Button>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] font-black uppercase",
                                                            emp.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                                                        )}>
                                                            {emp.status === 'active' ? 'Activo' : 'Suspendido'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5 text-xs text-slate-500 font-bold mb-4">
                                                    {emp.email && <div className="flex items-center gap-1.5 text-slate-700"><span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">@</span> {emp.email}</div>}
                                                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-400"/> DNI {emp.dni} • PIN: ****</div>
                                                    {emp.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {emp.phone}</div>}
                                                    <div className="flex items-center justify-between gap-1.5 py-1 px-2 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <Briefcase className="w-3.5 h-3.5 text-slate-400"/>
                                                            <span className="text-[11px] font-bold">Sucursal:</span>
                                                        </div>
                                                        <select
                                                            value={emp.branchId || 'central'}
                                                            onChange={async (e) => {
                                                                const newBranch = e.target.value;
                                                                if (!firestore) return;
                                                                try {
                                                                    await updateDoc(doc(firestore, 'retailer_employees', emp.id), {
                                                                        branchId: newBranch
                                                                    });
                                                                    toast({ title: "Sucursal actualizada", description: `Asignado a ${getBranchName(newBranch)}` });
                                                                } catch (err: any) {
                                                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                                                }
                                                            }}
                                                            className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer hover:border-slate-300"
                                                        >
                                                            <option value="central">Casa Central</option>
                                                            {branches?.map((b: any) => (
                                                                <option key={b.id} value={b.id}>{b.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* MÉTRICAS DE LEGAJO (HORAS TRABAJADAS, CAJA Y ADELANTOS) */}
                                                <div className="bg-slate-50 rounded-2xl p-3 grid grid-cols-4 gap-1.5 text-center border border-slate-100">
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Turnos</p>
                                                        <p className="text-xs font-black text-slate-900 mt-0.5">{stats.totalShifts}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Horas</p>
                                                        <p className="text-xs font-black text-slate-900 mt-0.5">{stats.totalHours}h</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Faltante</p>
                                                        <p className={cn("text-xs font-black mt-0.5 font-mono", stats.totalCashShortage > 0 ? "text-rose-600" : "text-emerald-600")}>
                                                            {stats.totalCashShortage > 0 ? `-$${stats.totalCashShortage.toLocaleString('es-AR')}` : '$0'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Adelantos</p>
                                                        <p className={cn("text-xs font-black mt-0.5 font-mono", stats.totalAdvances > 0 ? "text-amber-600" : "text-slate-600")}>
                                                            {stats.totalAdvances > 0 ? `-$${stats.totalAdvances.toLocaleString('es-AR')}` : '$0'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACCIONES DEL LEGAJO */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => setSelectedEmployeeForDetail(emp)}
                                                    className="rounded-xl h-9 font-black text-[10px] uppercase tracking-wider text-slate-700"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Ver Legajo & Turnos
                                                </Button>

                                                <div className="flex items-center gap-1.5">
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setAdvanceEmployee(emp);
                                                            setAdvanceType('cash');
                                                            setAdvanceAmount('');
                                                            setAdvanceDescription('');
                                                            setIsAdvanceModalOpen(true);
                                                        }}
                                                        className="rounded-xl h-9 font-black text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                                                    >
                                                        <DollarSign className="w-3.5 h-3.5 mr-0.5" /> Adelanto / Mercadería
                                                    </Button>
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleOpenLiquidation(emp)}
                                                        className="rounded-xl h-9 font-black text-[10px] uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                                    >
                                                        <DollarSign className="w-3.5 h-3.5 mr-0.5" /> Liquidar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TAB: LIQUIDACIONES DE SUELDOS HISTÓRICAS */}
                {activeTab === 'payroll' && (
                    <div className="px-6 mt-8 space-y-4">
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div>
                                <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">Registro de Liquidaciones de Sueldo</h3>
                                <p className="text-xs text-slate-400 font-bold">Historial de sueldos liquidados y deducidos por faltantes de caja</p>
                            </div>
                            <Badge className="bg-red-50 text-red-600 border-none font-black text-xs uppercase px-3 py-1">
                                Costo Fijo Mensual
                            </Badge>
                        </div>

                        {isLoadingPayroll ? (
                            <div className="text-center py-16 text-slate-400 font-black uppercase text-xs tracking-widest animate-pulse">
                                Cargando liquidaciones...
                            </div>
                        ) : !payrollHistory || payrollHistory.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-100 border-dashed">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-2">Sin Liquidaciones Realizadas</h3>
                                <p className="text-xs text-slate-400 font-bold max-w-[280px] mx-auto leading-relaxed">
                                    En la pestaña de Empleados, pulsá "Liquidar Sueldo" para calcular el haber neto descontando faltantes de caja.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                                {payrollHistory.map((liq: any) => (
                                    <div key={liq.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{liq.employeeName}</h4>
                                                <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase border-none">
                                                    LIQUIDADO
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold">
                                                Ciclo: {liq.cycleLabel} • DNI: {liq.employeeDni} • Fecha: {format(new Date(liq.settledAt), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                            <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-400 font-bold mt-1">
                                                <span>Básico: ${liq.baseSalary?.toLocaleString('es-AR')}</span>
                                                {liq.bonus > 0 && <span className="text-emerald-600">+ Bono: ${liq.bonus?.toLocaleString('es-AR')}</span>}
                                                {liq.cashShortageDeduction > 0 && <span className="text-rose-600">- Faltante Caja: ${liq.cashShortageDeduction?.toLocaleString('es-AR')}</span>}
                                            </div>
                                        </div>

                                        <div className="text-right sm:border-l sm:pl-6 border-slate-100">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Neto Percibido</p>
                                            <p className="text-lg font-black text-slate-900 font-mono">
                                                ${liq.totalNetSalary?.toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL DETALLE DE LEGAJO PERSONAL */}
                {selectedEmployeeForDetail && (() => {
                    const stats = getEmployeeShiftStats(selectedEmployeeForDetail);

                    return (
                        <Dialog open={!!selectedEmployeeForDetail} onOpenChange={() => setSelectedEmployeeForDetail(null)}>
                            <DialogContent className="max-w-2xl rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg flex items-center justify-between">
                                        <span>Legajo de {selectedEmployeeForDetail.name}</span>
                                        <Badge className="bg-slate-100 text-slate-800 text-[10px] font-black">
                                            DNI {selectedEmployeeForDetail.dni}
                                        </Badge>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-400">
                                        Registro de turnos, horarios de entrada/salida y arqueos de caja efectuados.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 pt-2">
                                    {/* RESUMEN DEL LEGAJO */}
                                    <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Total Turnos</p>
                                            <p className="text-lg font-black text-slate-900 mt-0.5">{stats.totalShifts}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Horas Trabajadas</p>
                                            <p className="text-lg font-black text-slate-900 mt-0.5">{stats.totalHours} hs</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-slate-400">Diferencia Neta Caja</p>
                                            <p className={cn("text-lg font-black mt-0.5 font-mono", stats.totalCashShortage > 0 ? "text-rose-600" : "text-emerald-600")}>
                                                {stats.totalCashShortage > 0 ? `-$${stats.totalCashShortage.toLocaleString('es-AR')}` : '+$0'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* HISTORIAL DE ADELANTOS Y MERCADERÍA ANOTADA */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black uppercase text-slate-600 tracking-wider">Adelantos y Mercadería Anotada</p>
                                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                Pendiente: ${stats.totalAdvances.toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                        {stats.advances.length === 0 ? (
                                            <div className="text-center py-4 border border-dashed border-slate-200 rounded-2xl text-[11px] text-slate-400 font-bold">
                                                No tiene adelantos en efectivo ni retiros de mercadería pendientes.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-white">
                                                {stats.advances.map((adv: any) => (
                                                    <div key={adv.id} className="py-2 px-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={cn(
                                                                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                                                                    adv.type === 'cash' ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                                                                )}>
                                                                    {adv.type === 'cash' ? 'Efectivo' : 'Mercadería'}
                                                                </span>
                                                                <span className="font-bold text-slate-800">{adv.description}</span>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                                                {adv.date ? format(new Date(adv.date), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}
                                                            </p>
                                                        </div>
                                                        <span className="font-mono font-black text-rose-600 text-xs">
                                                            -${Number(adv.amount).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* HISTORIAL DE TURNOS */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase text-slate-600 tracking-wider">Historial de Turnos y Arqueos</p>
                                        {stats.shifts.length === 0 ? (
                                            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-bold">
                                                Este empleado aún no ha abierto caja en el sistema.
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-white">
                                                {stats.shifts.map((s: any) => {
                                                    const durationMins = s.startTime && s.endTime ? differenceInMinutes(new Date(s.endTime), new Date(s.startTime)) : 0;
                                                    const diff = s.report?.difference || 0;

                                                    return (
                                                        <div key={s.id} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                                            <div>
                                                                <p className="font-bold text-slate-800">
                                                                    {s.startTime ? format(new Date(s.startTime), 'dd/MM/yyyy HH:mm') : 'Sin fecha'}
                                                                    {s.endTime ? ` → ${format(new Date(s.endTime), 'HH:mm')}` : ' (En curso)'}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 font-medium">
                                                                    Duración: {Math.floor(durationMins / 60)}h {durationMins % 60}m • Caja Inicial: ${s.initialCash || 0}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[9px] font-black font-mono",
                                                                    diff === 0 ? "bg-slate-100 text-slate-600" :
                                                                    diff < 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                                                                )}>
                                                                    {diff === 0 ? 'Exacta' : diff < 0 ? `Faltó $${Math.abs(diff)}` : `Sobró $${diff}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTROLES DE SEGURIDAD DEL EMPLEADO */}
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const emp = selectedEmployeeForDetail;
                                                    setSelectedEmployeeForDetail(null);
                                                    handleOpenEdit(emp);
                                                }}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" /> Editar Datos
                                            </button>

                                            <button 
                                                onClick={() => toggleStatus(selectedEmployeeForDetail.id, selectedEmployeeForDetail.status)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors",
                                                    selectedEmployeeForDetail.status === 'active' ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                )}
                                            >
                                                {selectedEmployeeForDetail.status === 'active' ? 'Suspender Acceso' : 'Habilitar Acceso'}
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => handleDelete(selectedEmployeeForDetail.id)}
                                            className="px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-wider"
                                        >
                                            Eliminar Definitivamente
                                        </button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    );
                })()}

                {/* MODAL LIQUIDACIÓN DE SUELDO CON DEDUCCIÓN DE FALTANTE */}
                {liqEmployee && (
                    <Dialog open={isLiquidationModalOpen} onOpenChange={setIsLiquidationModalOpen}>
                        <DialogContent className="max-w-lg rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg">
                                    Liquidar Sueldo: {liqEmployee.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Cálculo del haber neto con deducción automática de faltantes de arqueo de caja.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-2">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Ciclo Comercial Vigente</span>
                                    <p className="font-black text-slate-900 mt-0.5">{cicloRange.label}</p>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold uppercase text-slate-500">Sueldo Básico Acordado ($) *</Label>
                                    <Input 
                                        type="number"
                                        value={liqBaseSalary}
                                        onChange={e => setLiqBaseSalary(e.target.value)}
                                        placeholder="Ej: 450000"
                                        className="h-12 rounded-xl mt-1 font-mono font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold uppercase text-slate-500">Adicionales / Bonos ($)</Label>
                                        <Input 
                                            type="number"
                                            value={liqBonus}
                                            onChange={e => setLiqBonus(e.target.value)}
                                            placeholder="0"
                                            className="h-12 rounded-xl mt-1 font-mono text-emerald-600 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-bold uppercase text-slate-500">Otras Deducciones ($)</Label>
                                        <Input 
                                            type="number"
                                            value={liqDeductions}
                                            onChange={e => setLiqDeductions(e.target.value)}
                                            placeholder="0"
                                            className="h-12 rounded-xl mt-1 font-mono text-rose-600 font-bold"
                                        />
                                    </div>
                                </div>

                                {/* DESCUENTO AUTOMÁTICO DE FALTANTE DE CAJA */}
                                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-black uppercase text-rose-900 flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                                            Descuento Faltante de Caja ($)
                                        </Label>
                                        <span className="text-[10px] font-bold text-rose-600">Calculado en arqueos</span>
                                    </div>
                                    <Input 
                                        type="number"
                                        value={liqCashDifferenceDeduction}
                                        onChange={e => setLiqCashDifferenceDeduction(Number(e.target.value) || 0)}
                                        className="h-12 rounded-xl bg-white font-mono font-bold text-rose-700 text-base"
                                    />
                                    <p className="text-[10px] text-rose-600/80 font-medium">
                                        Este monto se deduce del básico del empleado para cubrir los desfasajes de caja registrados en sus turnos.
                                    </p>
                                </div>

                                {/* TOTAL A LIQUIDAR */}
                                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">Total Neto a Percibir</span>
                                        <p className="text-xs text-slate-400 mt-0.5">Se registrará en costos fijos de tu negocio</p>
                                    </div>
                                    <div className="text-2xl font-black font-mono text-emerald-400">
                                        ${Math.max(0, (Number(liqBaseSalary) || 0) + (Number(liqBonus) || 0) - (Number(liqDeductions) || 0) - (Number(liqCashDifferenceDeduction) || 0)).toLocaleString('es-AR')}
                                    </div>
                                </div>

                                <DialogFooter className="pt-4 flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsLiquidationModalOpen(false)}
                                        className="h-12 rounded-xl font-bold flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={handleSaveLiquidation}
                                        disabled={isSubmittingLiquidation}
                                        className="h-12 rounded-xl font-black uppercase text-xs flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
                                    >
                                        {isSubmittingLiquidation ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Liquidación'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                                {/* MODAL REGISTRAR ADELANTO O RETIRO DE MERCADERÍA */}
                {advanceEmployee && (
                    <Dialog open={isAdvanceModalOpen} onOpenChange={setIsAdvanceModalOpen}>
                        <DialogContent className="max-w-[420px] rounded-[2rem] p-6 bg-white border-0 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-center font-black uppercase tracking-tight text-slate-800 text-lg">
                                    Anotar a {advanceEmployee.name}
                                </DialogTitle>
                                <DialogDescription className="text-center text-xs text-slate-400">
                                    Registra dinero adelantado o mercadería que se deducirá al liquidar sueldo.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                                {/* TIPO DE ANTICIPO */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdvanceType('cash')}
                                        className={cn(
                                            "h-12 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
                                            advanceType === 'cash' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        )}
                                    >
                                        <DollarSign className="w-4 h-4" /> Adelanto Efectivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdvanceType('product')}
                                        className={cn(
                                            "h-12 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
                                            advanceType === 'product' ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        )}
                                    >
                                        <Briefcase className="w-4 h-4" /> Mercadería
                                    </button>
                                </div>

                                {/* IMPORTE */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Monto a Descontar ($) *</Label>
                                    <Input
                                        type="number"
                                        value={advanceAmount}
                                        onChange={e => setAdvanceAmount(e.target.value)}
                                        placeholder="Ej: 15000"
                                        className="h-14 rounded-2xl bg-slate-50 font-black text-xl font-mono px-4 text-center"
                                        required
                                    />
                                </div>

                                {/* DETALLE / CONCEPTO */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                                        {advanceType === 'cash' ? 'Motivo del Adelanto' : 'Detalle de Productos / Mercadería'}
                                    </Label>
                                    <Input
                                        value={advanceDescription}
                                        onChange={e => setAdvanceDescription(e.target.value)}
                                        placeholder={advanceType === 'cash' ? "Ej: Anticipo para viáticos / emergencia" : "Ej: 2 Aceites Natura 1.5L + 1 Yerba 1kg"}
                                        className="h-12 rounded-xl bg-slate-50 font-bold px-3 text-xs"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-2">
                                <Button
                                    onClick={handleSaveAdvance}
                                    disabled={isSubmittingAdvance || !advanceAmount}
                                    className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                                >
                                    {isSubmittingAdvance ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar y Descontar en Liquidación"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* MODAL ALTA EMPLEADO */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="max-w-[440px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-6 bg-white border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-center font-black uppercase tracking-widest text-slate-800 text-lg">Alta de Empleado & Legajo</DialogTitle>
                            <DialogDescription className="text-center text-xs text-slate-400">
                                Asigna usuario, clave de 4 dígitos y sucursal.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre y Apellido *</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Juan Pérez" className="h-12 rounded-xl bg-slate-50 font-bold" required />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Personal (Google / Gmail) *</Label>
                                <Input 
                                    type="email" 
                                    value={newEmail} 
                                    onChange={e => setNewEmail(e.target.value)} 
                                    placeholder="ejemplo@gmail.com" 
                                    className="h-12 rounded-xl bg-slate-50 font-bold px-3" 
                                />
                                <span className="text-[9px] text-slate-400 font-bold px-2 block">
                                    Con este correo iniciará sesión en su celular para acceder a tu negocio.
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-red-500" /> DNI *
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={newDni} 
                                        onChange={e => setNewDni(e.target.value)} 
                                        placeholder="Sin puntos" 
                                        className="h-12 rounded-xl bg-slate-50 font-bold px-3" 
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 flex items-center gap-1">
                                        <KeyRound className="w-3 h-3 text-red-500" /> PIN (4 núm) *
                                    </Label>
                                    <Input 
                                        type="number" 
                                        maxLength={4} 
                                        value={newPin} 
                                        onChange={e => setNewPin(e.target.value)} 
                                        placeholder="1234" 
                                        className="h-12 rounded-xl bg-slate-50 font-bold px-3 text-center" 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp / Tel</Label>
                                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="387-4123456" className="h-12 rounded-xl bg-slate-50 font-bold px-3" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Sueldo Básico ($)</Label>
                                    <Input type="number" value={newBaseSalary} onChange={e => setNewBaseSalary(e.target.value)} placeholder="450000" className="h-12 rounded-xl bg-slate-50 font-bold px-3 font-mono" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Asignar Sucursal *</Label>
                                {branches?.length === 0 ? (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center">
                                        Primero debes crear al menos una Sucursal.
                                    </div>
                                ) : (
                                    <select 
                                        value={newBranchId} 
                                        onChange={e => setNewBranchId(e.target.value)}
                                        className="w-full h-12 px-3 rounded-xl bg-slate-50 font-bold text-sm border-0"
                                        required
                                    >
                                        <option value="" disabled>Selecciona un local...</option>
                                        {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Rol Operativo</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'cashier', label: 'Cajero' },
                                        { id: 'warehouse', label: 'Almacén' },
                                        { id: 'cashier_warehouse', label: 'Cajero + Almacén' },
                                        { id: 'accountant', label: 'Contable' },
                                        { id: 'preventista', label: 'Preventista' }
                                    ].map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setNewRole(r.id as any)}
                                            className={cn(
                                                "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                newRole === r.id ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            )}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button onClick={handleCreateEmployee} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20">
                                Registrar Empleado & Legajo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL: EDITAR DATOS DEL EMPLEADO (EMAIL, TELÉFONO, PIN, ETC.) */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-red-600" />
                                Modificar Datos del Empleado
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold text-slate-400">
                                Actualizá el correo de inicio de sesión, teléfono, PIN de acceso o datos de legajo de {editingEmployee?.name}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 my-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-black uppercase text-slate-600">Nombre y Apellido</Label>
                                <Input 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="h-11 rounded-xl font-bold text-slate-800"
                                    placeholder="Ej: Yesica Lino"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase text-slate-600">DNI</Label>
                                    <Input 
                                        value={editDni}
                                        onChange={e => setEditDni(e.target.value)}
                                        className="h-11 rounded-xl font-bold text-slate-800"
                                        placeholder="Sin puntos"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase text-slate-600">PIN (4 dígitos)</Label>
                                    <Input 
                                        type="password"
                                        maxLength={4}
                                        value={editPin}
                                        onChange={e => setEditPin(e.target.value)}
                                        className="h-11 rounded-xl font-bold font-mono tracking-widest text-slate-800"
                                        placeholder="****"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black uppercase text-slate-600 flex items-center justify-between">
                                    <span>Correo Electrónico (Login de App)</span>
                                    <span className="text-[10px] text-red-600 font-bold lowercase">para iniciar sesión</span>
                                </Label>
                                <Input 
                                    type="email"
                                    value={editEmail}
                                    onChange={e => setEditEmail(e.target.value)}
                                    className="h-11 rounded-xl font-bold text-slate-800"
                                    placeholder="ejemplo@gmail.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black uppercase text-slate-600">Teléfono / WhatsApp</Label>
                                <Input 
                                    type="tel"
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    className="h-11 rounded-xl font-bold text-slate-800"
                                    placeholder="Ej: 3871234567"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase text-slate-600">Rol / Puesto</Label>
                                    <select 
                                        value={editRole}
                                        onChange={(e: any) => setEditRole(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                                    >
                                        <option value="cashier">Cajero / Vendedor</option>
                                        <option value="warehouse">Repositor / Stock</option>
                                        <option value="accountant">Contable</option>
                                        <option value="cashier_warehouse">Caja y Almacén</option>
                                        <option value="preventista">Preventista</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-black uppercase text-slate-600">Sucursal Asignada</Label>
                                    <select 
                                        value={editBranchId}
                                        onChange={e => setEditBranchId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                                    >
                                        <option value="central">Casa Central</option>
                                        {branches?.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-black uppercase text-slate-600">Sueldo Base ($)</Label>
                                <Input 
                                    type="number"
                                    value={editBaseSalary}
                                    onChange={e => setEditBaseSalary(e.target.value)}
                                    className="h-11 rounded-xl font-bold text-slate-800"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-xl h-11 font-black text-xs uppercase"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit}
                                className="rounded-xl h-11 font-black text-xs uppercase bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
                            >
                                {isSavingEdit ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    "Guardar Cambios"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    );
}
