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
  Search,
  Check,
  Layers,
  Box,
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

type PromoKind = 'product' | 'combo';

interface SelectedStockItem {
  id: string;
  name: string;
  code?: string;
  imageUrl?: string;
  purchasePrice: number;
  salePrice: number;
  qty: number;
}

interface PromoFormState {
  promoKind: PromoKind;
  selectedItems: SelectedStockItem[];
  salePrice: string;
  stock: string;
  expirationDate: string;
  paymentMethods: string;
  shippingMethod: string;
}

const INITIAL_FORM: PromoFormState = {
  promoKind: 'product',
  selectedItems: [],
  salePrice: '',
  stock: '',
  expirationDate: '',
  paymentMethods: 'all',
  shippingMethod: 'both',
};

export default function PromocionesPage() {
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormState>(INITIAL_FORM);
  const [stockSearch, setStockSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [inventory]);

  const regularProducts = useMemo(() => {
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

  const filteredStockProducts = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return regularProducts.slice(0, 25);
    return regularProducts
      .filter((p: any) => {
        const name = (p.name || '').toLowerCase();
        const code = String(p.code || p.barcode || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 25);
  }, [regularProducts, stockSearch]);

  const totalPurchaseCost = useMemo(
    () =>
      form.selectedItems.reduce(
        (sum, item) => sum + (Number(item.purchasePrice) || 0) * (item.qty || 1),
        0
      ),
    [form.selectedItems]
  );

  const totalRegularSalePrice = useMemo(
    () =>
      form.selectedItems.reduce(
        (sum, item) => sum + (Number(item.salePrice) || 0) * (item.qty || 1),
        0
      ),
    [form.selectedItems]
  );

  const openCreateModal = () => {
    setEditingPromoId(null);
    setForm(INITIAL_FORM);
    setStockSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (promo: any) => {
    setEditingPromoId(promo.id);
    const items: SelectedStockItem[] = Array.isArray(promo.bundleItems) && promo.bundleItems.length > 0
      ? promo.bundleItems.map((b: any) => ({
          id: b.id,
          name: b.name || promo.name || 'Producto',
          code: b.code || '',
          imageUrl: b.imageUrl || promo.imageUrl || '',
          purchasePrice: Number(b.purchasePrice || 0),
          salePrice: Number(b.salePrice || promo.originalPrice || promo.salePrice || promo.price || 0),
          qty: Number(b.qty || 1),
        }))
      : [
          {
            id: promo.sourceProductId || promo.id,
            name: promo.name || 'Producto',
            code: promo.code || '',
            imageUrl: promo.imageUrl || '',
            purchasePrice: Number(promo.purchasePrice || 0),
            salePrice: Number(promo.originalPrice || promo.salePrice || promo.price || 0),
            qty: 1,
          },
        ];

    const isCombo = promo.promoType === 'combo' || items.length > 1;
    setForm({
      promoKind: isCombo ? 'combo' : 'product',
      selectedItems: items,
      salePrice: promo.salePrice != null ? String(promo.salePrice) : String(promo.price || ''),
      stock: promo.stock != null ? String(promo.stock) : '',
      expirationDate: promo.expirationDate || '',
      paymentMethods: promo.paymentMethods || 'all',
      shippingMethod: promo.shippingMethod || 'both',
    });
    setStockSearch('');
    setIsModalOpen(true);
  };

  const handleSelectKind = (kind: PromoKind) => {
    setForm((prev) => ({
      ...prev,
      promoKind: kind,
      selectedItems: kind === 'product' && prev.selectedItems.length > 1
        ? [prev.selectedItems[0]]
        : prev.selectedItems,
    }));
  };

  const handlePickStockProduct = (prod: any) => {
    const newItem: SelectedStockItem = {
      id: prod.id,
      name: prod.name || 'Producto',
      code: String(prod.code || prod.barcode || ''),
      imageUrl: prod.imageUrl || '',
      purchasePrice: Number(prod.purchasePrice || 0),
      salePrice: Number(prod.salePrice || prod.price || 0),
      qty: 1,
    };

    setForm((prev) => {
      if (prev.promoKind === 'product') {
        return { ...prev, selectedItems: [newItem] };
      }
      const existing = prev.selectedItems.find((item) => item.id === prod.id);
      if (existing) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.map((item) =>
            item.id === prod.id ? { ...item, qty: item.qty + 1 } : item
          ),
        };
      }
      return { ...prev, selectedItems: [...prev.selectedItems, newItem] };
    });
  };

  const handleRemoveSelectedItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateItemQty = (id: string, qty: number) => {
    const safeQty = Math.max(1, qty || 1);
    setForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item) =>
        item.id === id ? { ...item, qty: safeQty } : item
      ),
    }));
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !effectiveRetailerId) return;

    const salePriceNum = Number(form.salePrice);
    const stockNum = Number(form.stock);

    if (form.selectedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Seleccioná al menos un producto',
        description: 'Buscá por código o nombre en tu stock para armar la promoción.',
      });
      return;
    }
    if (form.promoKind === 'combo' && form.selectedItems.length < 2 && form.selectedItems[0].qty < 2) {
      toast({
        variant: 'destructive',
        title: 'Combo incompleto',
        description: 'Agregá al menos 2 artículos (o más de 1 unidad) para el combo.',
      });
      return;
    }
    if (!salePriceNum || salePriceNum <= 0) {
      toast({
        variant: 'destructive',
        title: 'Precio inválido',
        description: 'Ingresá el precio promocional.',
      });
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      toast({
        variant: 'destructive',
        title: 'Cantidad inválida',
        description: 'Ingresá la cantidad para esta promoción.',
      });
      return;
    }
    if (!form.expirationDate) {
      toast({
        variant: 'destructive',
        title: 'Falta vencimiento',
        description: 'Indicá la fecha de vencimiento de la oferta.',
      });
      return;
    }

    const generatedName =
      form.promoKind === 'product'
        ? form.selectedItems[0].name
        : `Combo: ${form.selectedItems
            .map((i) => (i.qty > 1 ? `${i.qty}x ${i.name}` : i.name))
            .join(' + ')}`;

    const primaryImage = form.selectedItems.find((i) => i.imageUrl)?.imageUrl || '';

    setIsSaving(true);
    try {
      const payload: any = {
        retailerId: effectiveRetailerId,
        branchId: 'main',
        sourceProductId: form.promoKind === 'product' ? form.selectedItems[0].id : null,
        code: form.promoKind === 'product' ? form.selectedItems[0].code || null : null,
        name: generatedName,
        imageUrl: primaryImage,
        purchasePrice: totalPurchaseCost,
        salePrice: salePriceNum,
        price: salePriceNum,
        originalPrice: totalRegularSalePrice > salePriceNum ? totalRegularSalePrice : null,
        stock: stockNum,
        expirationDate: form.expirationDate,
        paymentMethods: form.paymentMethods,
        shippingMethod: form.shippingMethod,
        bundleItems: form.selectedItems,
        isBundle: form.promoKind === 'combo',
        isPromo: true,
        promoType: form.promoKind === 'combo' ? 'combo' : 'promo',
        category: 'PROMOCIONES',
        updatedAt: serverTimestamp(),
      };

      if (editingPromoId) {
        await updateDoc(doc(firestore, 'retailer_inventory', editingPromoId), payload);
        toast({
          title: 'Promoción actualizada',
          description: 'Los cambios ya están visibles en el Marketplace.',
        });
      } else {
        await addDoc(collection(firestore, 'retailer_inventory'), {
          ...payload,
          profitMargin: 0,
          createdAt: serverTimestamp(),
        });
        toast({
          title: '¡Promoción publicada!',
          description: 'La oferta ya aparece en Promociones del Marketplace.',
        });
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);
      setEditingPromoId(null);
    } catch (error) {
      console.error('Error guardando promo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la promoción.',
      });
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la promoción.',
      });
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
              Elegí un producto o armá un combo directo desde tu stock
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
                Seleccioná un producto o armá un combo desde tu stock para publicarlo con precio promocional.
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
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-wider shrink-0',
                            isExpired || isOutOfStock ? 'text-slate-400' : 'text-red-600'
                          )}
                        >
                          {isExpired ? 'VENCIDA' : isOutOfStock ? 'SIN STOCK' : 'ACTIVA'}
                        </span>
                      </div>

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
                      <span className="font-bold text-slate-800">{promo.stock ?? 0}</span>
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

            <form onSubmit={handleSavePromo} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* PASO 1: ¿Producto o Combo? */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  1. ¿Qué vas a vender en promoción?
                </Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectKind('product')}
                    className={cn(
                      'h-12 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
                      form.promoKind === 'product'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <Box className="w-4 h-4" /> Producto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectKind('combo')}
                    className={cn(
                      'h-12 rounded-2xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer',
                      form.promoKind === 'combo'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    <Layers className="w-4 h-4" /> Combo
                  </button>
                </div>
              </div>

              {/* PASO 2: Buscador conectado a tu stock */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {form.promoKind === 'combo'
                    ? '2. Buscá por código o nombre para agregar artículos al combo *'
                    : '2. Buscá por código o nombre en tu stock *'}
                </Label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="Ingresá código o parte del nombre..."
                    className="h-11 pl-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {filteredStockProducts.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">
                      No se encontraron artículos en tu stock.
                    </p>
                  ) : (
                    filteredStockProducts.map((prod: any) => {
                      const isSelected = form.selectedItems.some((i) => i.id === prod.id);
                      const prodCode = prod.code || prod.barcode;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handlePickStockProduct(prod)}
                          className={cn(
                            'w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer',
                            isSelected ? 'bg-red-50' : 'hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
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
                              <p className="text-[11px] text-slate-500 truncate">
                                {prodCode ? `Cód: ${prodCode} • ` : ''}
                                Compra: ${Number(prod.purchasePrice || 0).toLocaleString('es-AR')} • Venta: ${Number(prod.salePrice || prod.price || 0).toLocaleString('es-AR')}
                              </p>
                            </div>
                          </div>
                          {isSelected ? (
                            <Check className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Artículos seleccionados + Precios traídos del stock */}
                {form.selectedItems.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {form.selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Compra: ${item.purchasePrice.toLocaleString('es-AR')} • Venta: ${item.salePrice.toLocaleString('es-AR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {form.promoKind === 'combo' && (
                            <Input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value, 10))}
                              className="w-14 h-8 text-center bg-white border-slate-200 text-xs font-black"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedItem(item.id)}
                            className="p-1 text-red-600 hover:text-red-700 cursor-pointer"
                            title="Quitar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Resumen de precios actuales traídos del stock */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">
                          Precio de Compra
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          ${totalPurchaseCost.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">
                          Precio de Venta
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          ${totalRegularSalePrice.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PASO 3: Precio promocional y Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Precio Promocional ($) *
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
                    Cantidad *
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
              </div>

              {/* Vencimiento */}
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
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingPromoId ? (
                    'Guardar Cambios'
                  ) : (
                    'Publicar Promo'
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
