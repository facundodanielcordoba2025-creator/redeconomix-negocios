'use client';

import React, { useMemo, useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  Package,
  Loader2,
  X,
} from 'lucide-react';
import { RoleGuard } from '@/components/role-guard';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRole } from '@/hooks/use-role';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductImageUploader } from '@/components/product-image-uploader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Efectivo y Transferencia (A convenir)' },
  { value: 'cash', label: 'Solo Efectivo' },
  { value: 'transfer', label: 'Solo Transferencia / Alias' },
  { value: 'all_cards', label: 'Efectivo, Transferencia y Tarjeta' },
];

const SHIPPING_OPTIONS = [
  { value: 'both', label: 'Retiro en Local y Delivery' },
  { value: 'pickup', label: 'Solo Retiro en Local' },
  { value: 'delivery', label: 'Solo Envío / Delivery' },
];

interface PromoFormState {
  name: string;
  description: string;
  imageUrl: string;
  salePrice: string;
  originalPrice: string;
  stock: string;
  expirationDate: string;
  paymentMethods: string;
  shippingMethod: string;
  bundleItems: { id: string; name: string; qty: number }[];
}

const INITIAL_FORM: PromoFormState = {
  name: '',
  description: '',
  imageUrl: '',
  salePrice: '',
  originalPrice: '',
  stock: '',
  expirationDate: '',
  paymentMethods: 'all',
  shippingMethod: 'both',
  bundleItems: [],
};

export default function PromocionesPage() {
  const firestore = useFirestore();
  const { effectiveRetailerId, activeBranchId } = useRole();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormState>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  // Cargar inventario del comercio (promos + productos disponibles para armar combos)
  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_inventory'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [firestore, effectiveRetailerId]);

  const { data: inventory, isLoading } = useCollection<any>(inventoryQuery);

  const promos = useMemo(() => {
    if (!inventory) return [];
    return inventory
      .filter((p: any) => p.isBundle || p.isPromo || (p.promoType && p.promoType !== 'none'))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
  }, [inventory]);

  const regularProducts = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((p: any) => !p.isBundle && !p.isPromo);
  }, [inventory]);

  const openCreateModal = () => {
    setEditingPromoId(null);
    setForm(INITIAL_FORM);
    setSelectedProductToAdd('');
    setIsModalOpen(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromoId(promo.id);
    setForm({
      name: promo.name || '',
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      salePrice: promo.salePrice != null ? String(promo.salePrice) : String(promo.price || ''),
      originalPrice: promo.originalPrice ? String(promo.originalPrice) : '',
      stock: promo.stock != null ? String(promo.stock) : '',
      expirationDate: promo.expirationDate || '',
      paymentMethods: promo.paymentMethods || 'all',
      shippingMethod: promo.shippingMethod || 'both',
      bundleItems: Array.isArray(promo.bundleItems) ? promo.bundleItems : [],
    });
    setSelectedProductToAdd('');
    setIsModalOpen(true);
  };

  const handleAddBundleProduct = (productId: string) => {
    if (!productId) return;
    const prod = regularProducts.find((p: any) => p.id === productId);
    if (!prod) return;
    setForm((prev) => {
      const exists = prev.bundleItems.some((item) => item.id === prod.id);
      if (exists) return prev;
      return {
        ...prev,
        bundleItems: [...prev.bundleItems, { id: prod.id, name: prod.name, qty: 1 }],
      };
    });
    setSelectedProductToAdd('');
  };

  const handleRemoveBundleProduct = (id: string) => {
    setForm((prev) => ({
      ...prev,
      bundleItems: prev.bundleItems.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateBundleQty = (id: string, qty: number) => {
    const safeQty = Math.max(1, qty || 1);
    setForm((prev) => ({
      ...prev,
      bundleItems: prev.bundleItems.map((item) =>
        item.id === id ? { ...item, qty: safeQty } : item
      ),
    }));
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !effectiveRetailerId) return;

    const salePriceNum = Number(form.salePrice);
    const stockNum = Number(form.stock);
    const originalPriceNum = form.originalPrice ? Number(form.originalPrice) : null;

    if (!form.name.trim()) {
      toast({ variant: 'destructive', title: 'Falta el nombre', description: 'Ingresá un nombre para la promoción.' });
      return;
    }
    if (!salePriceNum || salePriceNum <= 0) {
      toast({ variant: 'destructive', title: 'Precio inválido', description: 'Ingresá el precio promocional de la oferta.' });
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast({ variant: 'destructive', title: 'Cantidad inválida', description: 'Ingresá la cantidad disponible para la promo.' });
      return;
    }
    if (!form.expirationDate) {
      toast({ variant: 'destructive', title: 'Falta vencimiento', description: 'Indicá la fecha de vencimiento de la oferta.' });
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        retailerId: effectiveRetailerId,
        branchId: activeBranchId || 'main',
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        salePrice: salePriceNum,
        price: salePriceNum,
        originalPrice: originalPriceNum && originalPriceNum > salePriceNum ? originalPriceNum : null,
        stock: stockNum,
        expirationDate: form.expirationDate,
        paymentMethods: form.paymentMethods,
        shippingMethod: form.shippingMethod,
        bundleItems: form.bundleItems,
        isBundle: true,
        isPromo: true,
        promoType: 'promo',
        category: 'PROMOCIONES',
        updatedAt: serverTimestamp(),
      };

      if (editingPromoId) {
        await updateDoc(doc(firestore, 'retailer_inventory', editingPromoId), payload);
        toast({ title: 'Promoción actualizada', description: 'Los cambios ya están visibles en el Marketplace.' });
      } else {
        await addDoc(collection(firestore, 'retailer_inventory'), {
          ...payload,
          purchasePrice: 0,
          profitMargin: 0,
          createdAt: serverTimestamp(),
        });
        toast({ title: '¡Promoción publicada!', description: 'La oferta ya aparece en Liquidación Flash y Ofertas Imperdibles.' });
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setEditingPromoId(null);
    } catch (error: any) {
      console.error('Error guardando promo:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la promoción.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromo = async (promoId: string, promoName: string) => {
    if (!firestore) return;
    if (!confirm(`¿Eliminar la promoción "${promoName}"?`)) return;
    try {
      await deleteDoc(doc(firestore, 'retailer_inventory', promoId));
      toast({ title: 'Promoción eliminada' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la promoción.' });
    }
  };

  const getPaymentLabel = (val?: string) =>
    PAYMENT_OPTIONS.find((o) => o.value === val)?.label || 'Efectivo y Transferencia';

  const getShippingLabel = (val?: string) =>
    SHIPPING_OPTIONS.find((o) => o.value === val)?.label || 'Retiro en Local y Delivery';

  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return format(new Date(y, m - 1, d), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <RoleGuard moduleName="Promociones" allowedRoles={['admin']}>
      <div className="space-y-6 pt-[80px] md:pt-0 pb-36 px-2 sm:px-4 md:px-0 max-w-5xl mx-auto">
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-red-600" /> Promociones
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Creá combos y ofertas especiales visibles en Liquidación Flash
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="h-11 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear Promo
          </Button>
        </div>

        {/* LISTADO DE PROMOCIONES */}
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
          </div>
        ) : promos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-4">
            <Tag className="w-10 h-10 text-red-600 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-base font-black uppercase text-slate-900">
                Todavía no tenés promociones publicadas
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Publicá combos o productos con descuento por tiempo limitado para que aparezcan en el Marketplace y en Ofertas Imperdibles.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="h-11 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-wider gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Crear Primera Promo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((promo: any) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isExpired = promo.expirationDate && promo.expirationDate < todayStr;
              const isOutOfStock = Number(promo.stock || 0) <= 0;
              const displayPrice = Number(promo.salePrice || promo.price || 0);

              return (
                <div
                  key={promo.id}
                  className={cn(
                    'bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-5 flex flex-col justify-between gap-4',
                    (isExpired || isOutOfStock) && 'opacity-70'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {promo.imageUrl ? (
                        <img
                          src={promo.imageUrl}
                          alt={promo.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 leading-tight line-clamp-2">
                          {promo.name}
                        </h3>
                        <span className={cn(
                          'text-[10px] font-black uppercase tracking-wider shrink-0',
                          isExpired || isOutOfStock ? 'text-slate-400' : 'text-red-600'
                        )}>
                          {isExpired ? 'VENCIDA' : isOutOfStock ? 'SIN STOCK' : 'ACTIVA'}
                        </span>
                      </div>

                      {promo.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                          {promo.description}
                        </p>
                      )}

                      {Array.isArray(promo.bundleItems) && promo.bundleItems.length > 0 && (
                        <p className="text-[11px] font-bold text-slate-500 truncate">
                          Incluye: {promo.bundleItems.map((b: any) => `${b.qty}x ${b.name}`).join(', ')}
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-black text-red-600">
                          ${displayPrice.toLocaleString('es-AR')}
                        </span>
                        {promo.originalPrice && Number(promo.originalPrice) > displayPrice && (
                          <span className="text-xs font-bold text-slate-400 line-through">
                            ${Number(promo.originalPrice).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalles operativos */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Cantidad</span>
                      <span className="font-bold text-slate-800">{promo.stock ?? 0} disponibles</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Vence el</span>
                      <span className="font-bold text-slate-800">{formatExpiry(promo.expirationDate)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Pago</span>
                      <span className="font-bold text-slate-700">{getPaymentLabel(promo.paymentMethods)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">Envío</span>
                      <span className="font-bold text-slate-700">{getShippingLabel(promo.shippingMethod)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-4 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openEditModal(promo)}
                      className="text-xs font-black uppercase text-slate-700 hover:text-red-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.id, promo.name)}
                      className="text-xs font-black uppercase text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL CREAR / EDITAR PROMO */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white border border-slate-200 rounded-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-slate-100 shrink-0">
              <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-900">
                {editingPromoId ? 'Editar Promoción' : 'Crear Promo / Combo'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSavePromo} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Imagen */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Imagen de la Promoción
                </Label>
                <ProductImageUploader
                  currentImageUrl={form.imageUrl}
                  onUploadComplete={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                />
                <Input
                  type="url"
                  placeholder="O pegá el link de la imagen (https://...)"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs"
                />
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nombre de la Promo / Combo *
                </Label>
                <Input
                  placeholder="Ej: Combo Desayuno Familiar o Pack Gaseosas x6"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold"
                  required
                />
              </div>

              {/* Detalle / Descripción */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Detalle de los Productos en Promoción
                </Label>
                <textarea
                  rows={3}
                  placeholder="Ej: Incluye 2 Coca-Cola 2.25L + 1 paquete de galletitas surtidas..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600/30"
                />
              </div>

              {/* Vincular productos del stock (opcional) */}
              {regularProducts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Vincular Productos de tu Stock (Opcional)
                  </Label>
                  <Select value={selectedProductToAdd} onValueChange={handleAddBundleProduct}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Agregar producto del inventario al combo..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {regularProducts.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                          {p.name} (${Number(p.salePrice || p.price || 0).toLocaleString('es-AR')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {form.bundleItems.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {form.bundleItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          <span className="text-xs font-bold text-slate-800 truncate flex-1">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => handleUpdateBundleQty(item.id, parseInt(e.target.value, 10))}
                              className="w-14 h-8 text-center bg-white border-slate-200 text-xs font-black"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBundleProduct(item.id)}
                              className="p-1 text-red-600 hover:text-red-700 cursor-pointer"
                              title="Quitar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Precios */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Precio Promo ($) *
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="Ej: 4500"
                    value={form.salePrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, salePrice: e.target.value }))}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-black text-red-600"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Precio Anterior ($)
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="Opcional"
                    value={form.originalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Cantidad y Fecha de vencimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Cantidad Disponible *
                  </Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Ej: 15"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Vencimiento Oferta *
                  </Label>
                  <Input
                    type="date"
                    value={form.expirationDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, expirationDate: e.target.value }))}
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              {/* Modalidad de Pago y Envío */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Modalidad de Pago
                  </Label>
                  <Select
                    value={form.paymentMethods}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, paymentMethods: val }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Modalidad de Envío
                  </Label>
                  <Select
                    value={form.shippingMethod}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, shippingMethod: val }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-slate-100 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-xl border-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPromoId ? 'Guardar Cambios' : 'Publicar Promo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
