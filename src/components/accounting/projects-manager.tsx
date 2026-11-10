'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, Plus, ArrowLeft, Loader2, Trash2, ChevronRight, DollarSign, MapPin, 
  Target, AlertTriangle, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  OwnerRole, ExpansionProject, ProjectExpense, ProjectStatus, ExpenseCategory 
} from '@/types/accounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface ProjectsManagerProps {
  ownerRole: OwnerRole;
  backHref: string;
  title?: string;
  accentColor?: string; // 'red' | 'emerald'
}

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'ALQUILER_DEPOSITO', label: 'Alquiler / Depósito' },
  { id: 'OBRAS_REMODELACION', label: 'Obras y Remodelación' },
  { id: 'EQUIPAMIENTO', label: 'Equipamiento (Góndolas, Heladeras, Cajas)' },
  { id: 'STOCK_INICIAL', label: 'Stock Inicial' },
  { id: 'HABILITACIONES_LEGALES', label: 'Habilitaciones y Tasas' },
  { id: 'MARKETING_CARTELERIA', label: 'Cartelería y Publicidad' },
  { id: 'OTROS', label: 'Otros Gastos' },
];

export function ProjectsManager({
  ownerRole,
  backHref,
  title = 'Proyectos de Expansión & Nuevas Sucursales',
  accentColor = 'red'
}: ProjectsManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();
  const targetOwnerId = effectiveRetailerId || user?.uid;
  const { toast } = useToast();

  const [selectedProject, setSelectedProject] = useState<ExpansionProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Form
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectOpeningDate, setProjectOpeningDate] = useState('');
  const [projectMonthlyProfit, setProjectMonthlyProfit] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Expense Form
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('OBRAS_REMODELACION');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [expenseInvoice, setExpenseInvoice] = useState('');
  const [expensePaid, setExpensePaid] = useState(true);

  // Queries
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId) return null;
    return query(
      collection(firestore, 'retailer_daily_operations'),
      where('ownerId', '==', targetOwnerId),
      where('recordType', '==', 'EXPANSION_PROJECT')
    );
  }, [firestore, user, targetOwnerId]);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<ExpansionProject>(projectsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !selectedProject) return null;
    return query(
      collection(firestore, 'retailer_daily_operations'),
      where('projectId', '==', selectedProject.id),
      where('recordType', '==', 'PROJECT_EXPENSE')
    );
  }, [firestore, user, selectedProject]);
  const { data: projectExpenses, isLoading: isLoadingExpenses } = useCollection<ProjectExpense>(expensesQuery);

  // Total spent in selected project
  const currentTotalSpent = useMemo(() => {
    if (!projectExpenses) return 0;
    return projectExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [projectExpenses]);

  // Payback metrics for selected project
  const paybackMonths = useMemo(() => {
    if (!selectedProject || !selectedProject.projectedMonthlyProfit || selectedProject.projectedMonthlyProfit <= 0) return null;
    const spent = currentTotalSpent > 0 ? currentTotalSpent : (selectedProject.budgetTotal || 0);
    const months = spent / selectedProject.projectedMonthlyProfit;
    return months.toFixed(1);
  }, [selectedProject, currentTotalSpent]);

  const handleOpenCreateProject = () => {
    setProjectName('');
    setProjectLocation('');
    setProjectBudget('');
    setProjectOpeningDate('');
    setProjectMonthlyProfit('');
    setProjectDescription('');
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    if (!projectName.trim()) {
      toast({ title: 'Nombre requerido', description: 'Ingresa el nombre del proyecto o sucursal.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ownerId: targetOwnerId,
        ownerRole,
        name: projectName.trim(),
        location: projectLocation.trim() || undefined,
        targetOpeningDate: projectOpeningDate || undefined,
        budgetTotal: Number(projectBudget) || 0,
        totalSpent: 0,
        projectedMonthlyProfit: Number(projectMonthlyProfit) || 0,
        status: 'PLANNING',
        sharedNotes: "📌 **CHECKLIST DE APERTURA (Borrador)**\n\n[ ] Buscar local y firmar contrato\n[ ] Habilitación Municipal y Bomberos\n[ ] Instalación de Iluminación y Electricidad\n[ ] Instalación de Cámaras de Seguridad\n[ ] Compra de Estanterías y Góndolas\n[ ] Compra de Heladeras Exhibidoras\n[ ] Pintura y Cartelería\n[ ] Compra de Stock Inicial\n\n📝 **Notas compartidas con mi socio:**\n- ",
        recordType: 'EXPANSION_PROJECT',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'retailer_daily_operations'), payload);
      toast({ title: 'Proyecto Creado 🚀', description: `Iniciaste el proyecto "${projectName}".` });
      setIsProjectModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al crear', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseConcept('');
    setExpenseCategory('OBRAS_REMODELACION');
    setExpenseAmount('');
    setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
    setExpenseSupplier('');
    setExpenseInvoice('');
    setExpensePaid(false); // Default a no pagado / presupuesto
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: ProjectExpense) => {
    setEditingExpenseId(expense.id);
    setExpenseConcept(expense.concept);
    setExpenseCategory(expense.category);
    setExpenseAmount(expense.amount.toString());
    setExpenseDate(expense.date);
    setExpenseSupplier(expense.supplierName || '');
    setExpenseInvoice(expense.invoiceNumber || '');
    setExpensePaid(expense.paid);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedProject) return;
    if (!expenseConcept.trim()) {
      toast({ title: 'Datos incompletos', description: 'Ingresa el concepto del gasto.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = Number(expenseAmount) || 0;
      
      if (editingExpenseId) {
        // Edit mode
        const oldExpense = projectExpenses?.find(e => e.id === editingExpenseId);
        const diffAmount = amount - (oldExpense?.amount || 0);

        await updateDoc(doc(firestore, 'retailer_daily_operations', editingExpenseId), {
          concept: expenseConcept.trim(),
          category: expenseCategory,
          amount,
          date: expenseDate,
          supplierName: expenseSupplier.trim() || null,
          invoiceNumber: expenseInvoice.trim() || null,
          paid: expensePaid,
          updatedAt: serverTimestamp(),
        });

        if (diffAmount !== 0) {
          await updateDoc(doc(firestore, 'retailer_daily_operations', selectedProject.id), {
            totalSpent: Math.max(0, (selectedProject.totalSpent || 0) + diffAmount),
            updatedAt: serverTimestamp()
          });
        }
        toast({ title: 'Gasto Actualizado ✅' });
      } else {
        // Create mode
        const payload = {
          projectId: selectedProject.id,
          ownerId: targetOwnerId,
          ownerRole,
          concept: expenseConcept.trim(),
          category: expenseCategory,
          amount,
          date: expenseDate,
          supplierName: expenseSupplier.trim() || null,
          invoiceNumber: expenseInvoice.trim() || null,
          paid: expensePaid,
          recordType: 'PROJECT_EXPENSE',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'retailer_daily_operations'), payload);
        
        await updateDoc(doc(firestore, 'retailer_daily_operations', selectedProject.id), {
          totalSpent: (selectedProject.totalSpent || 0) + amount,
          updatedAt: serverTimestamp()
        });

        toast({ title: 'Gasto Registrado 💸', description: `Se sumaron $${amount.toLocaleString('es-AR')} al proyecto.` });
      }
      
      setIsExpenseModalOpen(false);
      setEditingExpenseId(null);
    } catch (err: any) {
      toast({ title: 'Error al guardar gasto', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expId: string, amount: number) => {
    if (!firestore || !selectedProject) return;
    if (!confirm('¿Eliminar este gasto del proyecto?')) return;

    try {
      await deleteDoc(doc(firestore, 'retailer_daily_operations', expId));
      await updateDoc(doc(firestore, 'retailer_daily_operations', selectedProject.id), {
        totalSpent: Math.max(0, (selectedProject.totalSpent || 0) - amount),
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Gasto eliminado 🗑️' });
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteProject = async (projId: string, projName: string) => {
    if (!firestore) return;
    if (!confirm(`¿Eliminar el proyecto "${projName}"? Todos sus gastos serán removidos.`)) return;

    try {
      await deleteDoc(doc(firestore, 'retailer_daily_operations', projId));
      setSelectedProject(null);
      toast({ title: 'Proyecto eliminado 🗑️' });
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!firestore || !selectedProject) return;
    try {
      await updateDoc(doc(firestore, 'retailer_daily_operations', selectedProject.id), {
        sharedNotes: notes,
        updatedAt: serverTimestamp()
      });
      setSelectedProject({ ...selectedProject, sharedNotes: notes });
      toast({ title: 'Notas guardadas 📝', description: 'El bloc de notas ha sido actualizado.' });
    } catch (err: any) {
      toast({ title: 'Error al guardar notas', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href={backHref}
              className="w-10 h-10 rounded-2xl bg-slate-50 active:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <Building2 className={cn("w-5 h-5", accentColor === 'red' ? "text-red-600" : "text-emerald-600")} />
                {title}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Inversión, Gastos de Apertura y Tiempo de Recupero (Payback)
              </p>
            </div>
          </div>

          <Button 
            onClick={handleOpenCreateProject}
            className={cn(
              "rounded-2xl font-black uppercase text-xs tracking-wider h-11 px-5 gap-2 text-white shadow-md",
              accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            )}
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* LISTADO DE PROYECTOS O VISTA DETALLE */}
        {!selectedProject ? (
          <div>
            {isLoadingProjects ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando proyectos...</p>
              </div>
            ) : !projects || projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
                <Target className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <p className="text-sm font-black uppercase text-slate-700">No hay proyectos de expansión iniciados</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Crea un proyecto para registrar las inversiones de una nueva sucursal o galpón y calcular cuándo recuperarás la inversión.
                  </p>
                </div>
                <Button 
                  onClick={handleOpenCreateProject}
                  className={cn("rounded-2xl font-bold uppercase text-xs", accentColor === 'red' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                >
                  <Plus className="w-4 h-4 mr-1" /> Iniciar Proyecto de Sucursal
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const budget = proj.budgetTotal || 0;
                  const spent = proj.totalSpent || 0;
                  const progressPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-black text-base text-slate-900 uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {proj.name}
                          </h3>
                          <Badge className="bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-lg border-none">
                            {proj.status === 'IN_PROGRESS' ? 'En Marcha' : proj.status}
                          </Badge>
                        </div>

                        {proj.location && (
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-3">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {proj.location}
                          </p>
                        )}

                        {/* PROGRESS BAR GASTOS */}
                        <div className="space-y-1.5 my-3">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400 text-[10px] uppercase">Ejecutado:</span>
                            <span className="text-slate-900 font-mono">${spent.toLocaleString('es-AR')}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", spent > budget && budget > 0 ? "bg-rose-500" : "bg-emerald-500")}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Presupuesto: ${budget.toLocaleString('es-AR')}</span>
                            <span>{progressPct}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-black text-slate-700">
                        <span>Ver Gastos y Retorno</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* DETALLE DEL PROYECTO SELECCIONADO */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedProject(null)}
                className="font-bold text-xs text-slate-600 gap-1 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" /> Volver a Todos los Proyectos
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteProject(selectedProject.id, selectedProject.name)}
                className="text-rose-500 hover:bg-rose-50 text-xs font-bold rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar Proyecto
              </Button>
            </div>

            {/* TARJETA PRINCIPAL DEL PROYECTO & RETORNO */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    {selectedProject.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                    {selectedProject.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedProject.location} •</span>
                    )}
                    <span>Apertura Estimada: {selectedProject.targetOpeningDate || 'A definir'}</span>
                  </p>
                </div>

                <Button 
                  onClick={handleOpenAddExpense}
                  className={cn(
                    "rounded-2xl font-black uppercase text-xs tracking-wider h-11 px-5 gap-2 text-white shadow-md self-start sm:self-auto",
                    accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  )}
                >
                  <Plus className="w-4 h-4" /> Cargar Gasto
                </Button>
              </div>

              {/* METRIC CARDS DEL PROYECTO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Invertido (Gastos)</p>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    ${currentTotalSpent.toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Presupuesto: ${(selectedProject.budgetTotal || 0).toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ganancia Mensual Proyectada</p>
                  <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                    ${(selectedProject.projectedMonthlyProfit || 0).toLocaleString('es-AR')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Estimación neta de la nueva sucursal</p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tiempo de Recupero (Payback)</p>
                  <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {paybackMonths ? `${paybackMonths} Meses` : 'Sin estimar'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {paybackMonths ? 'Meses de venta neta para recuperar la inversión' : 'Fija la ganancia mensual proyectada'}
                  </p>
                </div>
              </div>
            </div>
            {/* BLOC DE NOTAS / ACTIVIDADES */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Notas y Checklist del Proyecto
              </h3>
              <p className="text-xs text-slate-400 font-medium">Usa este espacio como un bloc de notas compartido con tu equipo (ej. pendientes, tareas, contactos).</p>
              <textarea 
                className="w-full h-32 md:h-40 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Escribe aquí las tareas o recordatorios..."
                defaultValue={selectedProject.sharedNotes || ''}
                onBlur={(e) => {
                  if (e.target.value !== selectedProject.sharedNotes) {
                    handleSaveNotes(e.target.value);
                  }
                }}
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Se guarda automáticamente al salir del cuadro</span>
              </div>
            </div>

            {/* TABLA DE GASTOS DEL PROYECTO */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Gastos Ejecutados en la Sucursal
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {projectExpenses?.length || 0} movimientos
                </span>
              </div>

              {isLoadingExpenses ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </div>
              ) : !projectExpenses || projectExpenses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <p className="text-xs font-bold uppercase text-slate-400">Aún no hay gastos registrados</p>
                  <Button size="sm" onClick={handleOpenAddExpense} className="rounded-xl text-xs font-bold">
                    Cargar Primer Gasto
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projectExpenses.map((exp) => (
                    <div key={exp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-2">
                          {exp.concept}
                          {(exp.amount === 0 || !exp.paid) && (
                            <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] uppercase font-black px-1.5 py-0">Presupuesto</Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-slate-200 font-bold uppercase">
                            {exp.category?.replace(/_/g, ' ')}
                          </Badge>
                          <span>{exp.date}</span>
                          {exp.supplierName && <span>• Prov: {exp.supplierName}</span>}
                          {exp.invoiceNumber && <span>• Fac: {exp.invoiceNumber}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4">
                        <span className={cn("font-black font-mono text-sm", exp.amount === 0 ? "text-slate-400" : "text-slate-900")}>
                          ${(exp.amount || 0).toLocaleString('es-AR')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id, exp.amount)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUEVO PROYECTO */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-3xl rounded-3xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg md:text-xl">
              Nuevo Proyecto de Expansión
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-400">
              Registra una nueva sucursal, salón comercial o galpón para controlar su inversión y recupero.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProject} className="space-y-4 md:space-y-6 pt-2">
            <div>
              <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Nombre del Proyecto / Sucursal *</Label>
              <Input 
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Ej: Sucursal 2 - Centro o Depósito Norte"
                className="h-12 rounded-xl mt-1 font-bold text-sm md:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Ubicación / Dirección</Label>
                <Input 
                  value={projectLocation}
                  onChange={e => setProjectLocation(e.target.value)}
                  placeholder="Ej: Calle Mitre 450"
                  className="h-12 rounded-xl mt-1 text-sm md:text-base"
                />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Fecha Estimada Apertura</Label>
                <Input 
                  type="date"
                  value={projectOpeningDate}
                  onChange={e => setProjectOpeningDate(e.target.value)}
                  className="h-12 rounded-xl mt-1 font-bold text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Presupuesto Estimado ($)</Label>
                <Input 
                  type="number"
                  value={projectBudget}
                  onChange={e => setProjectBudget(e.target.value)}
                  placeholder="Ej: 8500000"
                  className="h-12 rounded-xl mt-1 font-mono font-bold text-sm md:text-base"
                />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Ganancia Mensual Proyectada ($)</Label>
                <Input 
                  type="number"
                  value={projectMonthlyProfit}
                  onChange={e => setProjectMonthlyProfit(e.target.value)}
                  placeholder="Ej: 1200000"
                  className="h-12 rounded-xl mt-1 font-mono font-bold text-emerald-600 text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-slate-500">Descripción / Objetivos</Label>
              <Input 
                value={projectDescription}
                onChange={e => setProjectDescription(e.target.value)}
                placeholder="Ej: Contrato de alquiler a 3 años con opción de compra de estanterías"
                className="h-12 rounded-xl mt-1"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsProjectModalOpen(false)}
                className="h-12 rounded-xl font-bold flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "h-12 rounded-xl font-black uppercase text-xs flex-1 text-white shadow-md",
                  accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Proyecto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REGISTRAR GASTO DE PROYECTO */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl rounded-3xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg md:text-xl">
              Cargar Gasto al Proyecto
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-400">
              Imputa costos de habilitación, remodelación, alquiler o equipamiento. Puedes dejar en 0 si es solo un presupuesto estimado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExpense} className="space-y-4 md:space-y-6 pt-2">
            <div>
              <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Concepto / Descripción *</Label>
              <Input 
                value={expenseConcept}
                onChange={e => setExpenseConcept(e.target.value)}
                placeholder="Ej: Instalación de cámaras de seguridad"
                className="h-12 rounded-xl mt-1 font-bold text-sm md:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Rubro del Gasto</Label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full h-12 mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-sm"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Monto Real ($) <span className="font-normal lowercase text-slate-400">(0 si es presupuesto)</span></Label>
                <Input 
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="Ej: 350000 o dejar en 0"
                  className="h-12 mt-1 font-mono font-bold text-slate-900 text-sm md:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Fecha del Gasto</Label>
                <Input 
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="h-12 mt-1 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Proveedor / Comercio</Label>
                <Input 
                  value={expenseSupplier}
                  onChange={e => setExpenseSupplier(e.target.value)}
                  placeholder="Ej: Inmobiliaria Norte"
                  className="h-12 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-slate-500">N° Factura / Recibo</Label>
              <Input 
                value={expenseInvoice}
                onChange={e => setExpenseInvoice(e.target.value)}
                placeholder="Recibo N° 0045"
                className="h-12 mt-1 font-mono"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsExpenseModalOpen(false)}
                className="h-12 rounded-xl font-bold flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={cn(
                  "h-12 rounded-xl font-black uppercase text-xs flex-1 text-white shadow-md",
                  accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Gasto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
