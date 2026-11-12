'use client';

import React, { useMemo, useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Edit3,
  Package,
  Loader2,
  Search,
  Check,
  Clock,
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
import { cn } from '@/lib/utils';

type DeliveryMode = 'inmediata' | '7_dias';

const DELIVERY_OPTIONS: { value: DeliveryMode; label: string; shortLabel: string }[] = [
  { value: 'inmediata', label: 'Entrega inmediata (en stock local)', shortLabel: 'Entrega inmediata' },
  { value: '7_dias', label: 'Entrega en 7 días (pedido a Salta Capital)', shortLabel: 'Entrega en 7 días' },
];

interface WholesaleOfferForm {
  sourceProductId: string;
  name: string;
  imageUrl: string;
  code: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: string;
  deliveryMode: DeliveryMode;
  stock: string;
}

const INITIAL_FORM: WholesaleOfferForm = {
  sourceProductId: '',
  name: '',
  imageUrl: '',
  code: '',
  purchasePrice: 0,
  retailPrice: 0,
  wholesalePrice: '',
  deliveryMode: 'inmediata',
  stock: '',
};

export default function VentaMayoristaPage() {
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [form, setForm] = useState<WholesaleOfferForm>(INITIAL_FORM);
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !effectiveRetailerId) return null;
    return query(
      collection(firestore, 'retailer_inventory'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [firestore, effectiveRetailerId]);

  const { data: inventory, isLoading } = useCollection<any>(inventoryQuery);

  const wholesaleOffers = useMemo(() => {
    if (!inventory) return [];
    return inventory
      .filter(
        (p: any) =>
          p.isWholesaleOffer === true ||
          (p.category || '').toUpperCase() === 'OFERTAS MAYORISTAS'
      )
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [inventory]);

  const sourceProducts = useMemo(() => {
    if (!inventory) return [];
    return inventory
      .filter(
        (p: any) =>
          !p.isBundle &&
          !p.isPromo &&
          !p.isWholesaleOffer &&
          (p.category || '').toUpperCase() !== 'PROMOCIONES' &&
          (p.category || '').toUpperCase() !== 'OFERTAS MAYORISTAS'
      )
      .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  }, [inventory]);

  const filteredSourceProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return sourceProducts.slice(0, 25);
    return sourceProducts
      .filter(
        (p: any) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [sourceProducts, productSearch]);

  const openCreateModal = () => {
    setEditingOfferId(null);
    setForm(INITIAL_FORM);
    setProductSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setEditingOfferId(offer.id);
    setForm({
      sourceProductId: offer.sourceProductId || '',
      name: offer.name || '',
      imageUrl: offer.imageUrl || '',
      code: offer.code || '',
      purchasePrice: Number(offer.purchasePrice || 0),
      retailPrice: Number(offer.originalPrice || 0),
      wholesalePrice: String(offer.salePrice || offer.price || ''),
      deliveryMode: offer.deliveryMode === '7_dias' ? '7_dias' : 'inmediata',
      stock: offer.stock != null ? String(offer.stock) : '',
    });
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleSelectProduct = (prod: any) => {
    setForm((prev) => ({
      ...prev,
      sourceProductId: prod.id,
      name: prod.name || '',
      imageUrl: prod.imageUrl || '',
      code: String(prod.code || prod.barcode || ''),
      purchasePrice: Number(prod.purchasePrice || 0),
      retailPrice: Number(prod.salePrice || prod.price || 0),
      stock: prev.stock || (prod.stock != null ? String(prod.stock) : ''),
    }));
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !effectiveRetailerId) return;

    const priceNum = Number(form.wholesalePrice);
    const stockNum = Number(form.stock);

    if (!form.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Seleccioná un artículo',
        description: 'Buscá y elegí un producto de tu stock para publicar.',
      });
      return;
    }
    if (!priceNum || priceNum <= 0) {
      toast({
        variant: 'destructive',
        title: 'Precio inválido',
        description: 'Ingresá el precio mayorista del artículo.',
      });
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast({
        variant: 'destructive',
        title: 'Cantidad inválida',
        description: 'Ingresá las unidades disponibles para venta mayorista.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        retailerId: effectiveRetailerId,
        branchId: 'main',
        sourceProductId: form.sourceProductId || null,
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim(),
        code: form.code.trim() || null,
        price: priceNum,
        salePrice: priceNum,
        purchasePrice: form.purchasePrice || 0,
        originalPrice: form.retailPrice > priceNum ? form.retailPrice : null,
        stock: stockNum,
        deliveryMode: form.deliveryMode,
        isWholesaleOffer: true,
        category: 'OFERTAS MAYORISTAS',
        updatedAt: serverTimestamp(),
      };

      if (editingOfferId) {
        await updateDoc(doc(firestore, 'retailer_inventory', editingOfferId), payload);
        toast({
          title: 'Oferta mayorista actualizada',
          description: 'Los cambios ya están visibles en Ofertas Mayoristas.',
        });
      } else {
        await addDoc(collection(firestore, 'retailer_inventory'), {
          ...payload,
          profitMargin: 0,
          createdAt: serverTimestamp(),
        });
        toast({
          title: '¡Artículo publicado!',
          description: 'Ya aparece en el Marketplace dentro de Ofertas Mayoristas.',
        });
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setEditingOfferId(null);
    } catch (error) {
      console.error('Error guardando oferta mayorista:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la publicación mayorista.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOffer = async (offerId: string, offerName: string) => {
    if (!firestore) return;
    if (!confirm(`¿Quitar "${offerName}" de Venta Mayorista?`)) return;
    try {
      await deleteDoc(doc(firestore, 'retailer_inventory', offerId));
      toast({ title: 'Publicación eliminada' });
    } catch (error) {
      console.error('Error eliminando oferta mayorista:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la publicación.',
      });
    }
  };

  const totalUnits = wholesaleOffers.reduce((acc: number, o: any) => acc + (Number(o.stock) || 0), 0);
  const delayedCount = wholesaleOffers.filter((o: any) => o.deliveryMode === '7_dias').length;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-[88px] md:pt-6 pb-36 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600">
              <Truck className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-widest">
                Módulo Comercial
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Venta Mayorista
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Seleccioná artículos de tu stock, definí su precio mayorista, entrega inmediata o a 7 días y publicalos en <span className="font-bold text-slate-700">Ofertas Mayoristas</span>.
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publicar Artículo Mayorista
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Artículos Publicados
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{wholesaleOffers.length}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Unidades Disponibles
            </p>
            <p className="text-3xl font-black text-red-600 mt-1">{totalUnits}</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Con Entrega a 7 Días
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">{delayedCount}</p>
          </div>
        </div>

        {/* Published Offers */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          </div>
        ) : wholesaleOffers.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-lg font-black text-slate-900">
                Todavía no tenés artículos en Venta Mayorista
              </h2>
              <p className="text-xs text-slate-500">
                Elegí cualquier producto de tu stock, fijale un precio mayorista y definí si tiene entrega inmediata o en 7 días desde Salta Capital.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider"
            >
              Publicar Primer Artículo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wholesaleOffers.map((offer: any) => {
              const deliveryLabel =
                offer.deliveryMode === '7_dias' ? 'Entrega en 7 días' : 'Entrega inmediata';

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:border-red-100 transition-colors"
                >
                  <div>
                    <div className="relative h-44 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      {offer.imageUrl ? (
                        <img
                          src={offer.imageUrl}
                          alt={offer.name}
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                        Mayorista
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">
                        {offer.name}
                      </h3>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-red-600 tracking-tight">
                          ${Number(offer.salePrice || offer.price || 0).toLocaleString('es-AR')}
                        </span>
                        {offer.originalPrice && offer.originalPrice > (offer.salePrice || offer.price || 0) && (
                          <span className="text-xs font-bold text-slate-400 line-through">
                            ${Number(offer.originalPrice).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600 pt-1">
                        <span>Disponibles: {offer.stock ?? 0} un.</span>
                        <span className="text-slate-300">•</span>
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-red-600" />
                          {deliveryLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(offer)}
                      className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-white font-bold text-xs gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteOffer(offer.id, offer.name)}
                      className="h-9 rounded-xl border-red-100 text-red-600 hover:bg-red-50 font-bold text-xs gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Quitar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg w-[95vw] rounded-[2rem] p-0 overflow-hidden bg-white border-none shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="px-6 py-5 border-b border-slate-100">
              <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-red-600" />
                {editingOfferId ? 'Editar Oferta Mayorista' : 'Publicar Artículo Mayorista'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveOffer} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {!editingOfferId && (
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Seleccionar artículo *
                  </Label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar por código o nombre..."
                      className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 divide-y divide-slate-100">
                    {filteredSourceProducts.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">
                        No se encontraron artículos en tu cuenta.
                      </p>
                    ) : (
                      filteredSourceProducts.map((prod: any) => {
                        const isSelected = form.sourceProductId === prod.id;
                        const prodCode = prod.code || prod.barcode;
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleSelectProduct(prod)}
                            className={cn(
                              'w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors',
                              isSelected ? 'bg-red-50' : 'hover:bg-slate-50'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {prodCode ? `Cód: ${prodCode} • ` : ''}Público: ${Number(prod.salePrice || prod.price || 0).toLocaleString('es-AR')} • Stock: {prod.stock ?? 0}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {form.name && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {form.imageUrl ? (
                        <img
                          src={form.imageUrl}
                          alt={form.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                        Artículo seleccionado
                      </p>
                      <p className="text-sm font-black text-slate-900 truncate">{form.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Precio de Compra
                      </span>
                      <span className="text-base font-black text-slate-800">
                        ${Number(form.purchasePrice || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Precio Venta al Público
                      </span>
                      <span className="text-base font-black text-slate-800">
                        ${Number(form.retailPrice || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Precio Venta Mayorista ($) *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={form.wholesalePrice}
                    onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })}
                    placeholder="Ej: 1850"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-black text-red-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cantidad *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="Ej: 24"
                    className="h-11 rounded-xl bg-slate-50 border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Modalidad de Entrega *
                </Label>
                <Select
                  value={form.deliveryMode}
                  onValueChange={(v) => setForm({ ...form, deliveryMode: v as DeliveryMode })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingOfferId ? (
                    'Guardar Cambios'
                  ) : (
                    'Aceptar y Publicar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
