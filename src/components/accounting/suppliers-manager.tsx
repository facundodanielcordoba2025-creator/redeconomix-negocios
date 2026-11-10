'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, Phone, MessageCircle, Mail, MapPin, 
  Trash2, Plus, Edit2, CreditCard, Calendar, ArrowLeft,
  DollarSign, CheckCircle2, FileText, AlertCircle, Loader2
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
import { OwnerRole, SupplierItem } from '@/types/accounting';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SuppliersManagerProps {
  ownerRole: OwnerRole;
  backHref: string;
  title?: string;
  accentColor?: string; // 'red' | 'emerald'
}

export function SuppliersManager({
  ownerRole,
  backHref,
  title = 'Gestión de Proveedores',
  accentColor = 'red'
}: SuppliersManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();
  const targetOwnerId = effectiveRetailerId || user?.uid;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [cuit, setCuit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDays, setCreditDays] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId) return null;
    return query(
      collection(firestore, 'retailer_providers'),
      where('ownerId', '==', targetOwnerId)
    );
  }, [firestore, user, targetOwnerId]);
  const { data: suppliers, isLoading } = useCollection<SupplierItem>(suppliersQuery);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(s => 
      (s.name || '').toLowerCase().includes(q) ||
      (s.cuit || '').includes(q) ||
      (s.phone || '').includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }, [suppliers, searchTerm]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName('');
    setCuit('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCategory('');
    setCreditLimit('');
    setCreditDays('30');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    setName(supplier.name || '');
    setCuit(supplier.cuit || '');
    setPhone(supplier.phone || '');
    setEmail(supplier.email || '');
    setAddress(supplier.address || '');
    setCategory(supplier.category || '');
    setCreditLimit(supplier.creditLimit ? String(supplier.creditLimit) : '');
    setCreditDays(supplier.creditDays ? String(supplier.creditDays) : '30');
    setNotes(supplier.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    if (!name.trim()) {
      toast({ title: 'Nombre requerido', description: 'Ingresa la razón social o nombre del proveedor.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<SupplierItem> = {
        name: name.trim(),
        cuit: cuit.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        category: category.trim(),
        creditLimit: creditLimit ? Number(creditLimit) : 0,
        creditDays: creditDays ? Number(creditDays) : 30,
        notes: notes.trim(),
        ownerId: targetOwnerId,
        ownerRole: ownerRole,
        updatedAt: serverTimestamp(),
      };

      if (editingSupplier) {
        await updateDoc(doc(firestore, 'retailer_providers', editingSupplier.id), payload);
        toast({ title: 'Proveedor Actualizado ✅', description: `${name} fue actualizado exitosamente.` });
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(firestore, 'retailer_providers'), payload);
        toast({ title: 'Proveedor Registrado 🚀', description: `${name} fue agregado a tu catálogo.` });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (supplierId: string, supplierName: string) => {
    if (!firestore) return;
    if (!confirm(`¿Estás seguro de eliminar el proveedor "${supplierName}"?`)) return;

    try {
      await deleteDoc(doc(firestore, 'retailer_providers', supplierId));
      toast({ title: 'Proveedor eliminado 🗑️' });
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
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
                Líneas de crédito y agenda de compras
              </p>
            </div>
          </div>

          <Button 
            onClick={handleOpenCreate}
            className={cn(
              "rounded-2xl font-black uppercase text-xs tracking-wider h-11 px-5 gap-2 text-white shadow-md",
              accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            )}
          >
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </Button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* BUSCADOR */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <Input 
            placeholder="Buscar proveedor por nombre, CUIT, rubro o teléfono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-2xl bg-white border border-slate-200 font-bold text-sm shadow-sm"
          />
        </div>

        {/* LISTADO DE PROVEEDORES */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-black uppercase text-slate-700">No hay proveedores cargados</p>
              <p className="text-xs text-slate-400 mt-1">
                Registra a tus distribuidores o fábricas para asociar facturas de compra y controlar pagos.
              </p>
            </div>
            <Button 
              onClick={handleOpenCreate}
              className={cn("rounded-2xl font-bold uppercase text-xs", accentColor === 'red' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
            >
              <Plus className="w-4 h-4 mr-1" /> Registrar Primer Proveedor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div 
                key={supplier.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-black text-base text-slate-900 uppercase tracking-tight line-clamp-1">
                        {supplier.name}
                      </h3>
                      {supplier.cuit && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          CUIT: {supplier.cuit}
                        </span>
                      )}
                    </div>
                    {supplier.category && (
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-lg px-2 py-0.5">
                        {supplier.category}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-3 font-medium">
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  {/* LÍNEA DE CRÉDITO */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center bg-slate-50/70 p-2.5 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Límite Crédito</p>
                      <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
                        ${(supplier.creditLimit || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plazo Pago</p>
                      <p className="text-xs font-black text-slate-900 mt-0.5">
                        {supplier.creditDays || 30} días
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {supplier.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-9 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                        onClick={() => window.open(`https://wa.me/${supplier.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="rounded-xl h-9 px-3 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                      onClick={() => handleOpenEdit(supplier)}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="rounded-xl h-9 px-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs"
                      onClick={() => handleDelete(supplier.id, supplier.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CREAR / EDITAR PROVEEDOR */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg">
              {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Datos comerciales para la emisión y control de facturas de compra.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold uppercase text-slate-500">Razón Social / Nombre *</Label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Distribuidora Norte S.R.L."
                className="h-12 rounded-xl mt-1 font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">CUIT / DNI</Label>
                <Input 
                  value={cuit}
                  onChange={e => setCuit(e.target.value)}
                  placeholder="30-12345678-9"
                  className="h-12 rounded-xl mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Rubro / Categoría</Label>
                <Input 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ej: Bebidas, Lácteos"
                  className="h-12 rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Teléfono / WhatsApp</Label>
                <Input 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="387-4123456"
                  className="h-12 rounded-xl mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Email</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.com"
                  className="h-12 rounded-xl mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-slate-500">Dirección / Localidad</Label>
              <Input 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Av. Principal 1234, Salta"
                className="h-12 rounded-xl mt-1"
              />
            </div>

            {/* CONDICIONES FINANCIERAS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Condiciones de Crédito y Pago
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">Límite de Crédito ($)</Label>
                  <Input 
                    type="number"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                    placeholder="Ej: 500000"
                    className="h-11 rounded-xl mt-1 bg-white font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">Plazo Habitual (Días)</Label>
                  <Input 
                    type="number"
                    value={creditDays}
                    onChange={e => setCreditDays(e.target.value)}
                    placeholder="30"
                    className="h-11 rounded-xl mt-1 bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase text-slate-500">Notas Adicionales</Label>
              <Input 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Días de entrega: Martes y Jueves"
                className="h-12 rounded-xl mt-1"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
