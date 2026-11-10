'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, Calendar, DollarSign, ArrowLeft, 
  CheckCircle2, Clock, AlertTriangle, Building2, Trash2,
  Download, Filter, ChevronRight, Loader2, PackagePlus, Eye,
  CreditCard, BarChart2, TrendingDown
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
import { computeProductBranchStock } from '@/lib/offline-db';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, increment, orderBy, limit, writeBatch } from 'firebase/firestore';
import { 
  OwnerRole, PurchaseInvoice, PurchaseInvoiceItemProduct, InvoiceType, PaymentStatus, PaymentMethod, SupplierItem 
} from '@/types/accounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

// Hook para detectar clics fuera de un elemento (útil para el dropdown)
function useOutsideClick(ref: React.RefObject<any>, handler: () => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string, selectedProduct?: any) => void;
  inventory: any[];
  masterList: any[];
}

function ProductAutocomplete({ value, onChange, inventory, masterList }: ProductAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => setIsOpen(false));

  // Debounce the search input to avoid freezing the browser while typing
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 400); // 400ms delay after typing stops
    return () => clearTimeout(timer);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!debouncedValue || debouncedValue.trim().length < 2) return [];
    const q = debouncedValue.toLowerCase().trim();
    
    const results = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();

    // Buscar en inventario propio primero (prioridad)
    if (inventory) {
      for (const item of inventory) {
        if (item.name?.toLowerCase().includes(q) || item.barcode?.includes(q) || item.code?.includes(q)) {
          results.push({ ...item, source: 'inventory' });
          if (item.barcode) seenCodes.add(item.barcode);
          if (item.code) seenCodes.add(item.code);
          if (item.name) seenNames.add(item.name.toLowerCase());
        }
      }
    }

    // Buscar en maestro
    if (masterList) {
      for (const item of masterList) {
        // Evitar duplicados si ya lo encontramos en el inventario propio
        if (item.code && seenCodes.has(item.code)) continue;
        if (item.barcode && seenCodes.has(item.barcode)) continue;
        if (item.name && seenNames.has(item.name.toLowerCase())) continue;

        if (item.name?.toLowerCase().includes(q) || item.barcode?.includes(q) || item.code?.includes(q)) {
          results.push({ ...item, source: 'master' });
        }
      }
    }

    // Retornar todos los resultados que coincidan (limitado a 150 para evitar crashear el navegador)
    return results.slice(0, 150);
  }, [debouncedValue, inventory, masterList]);

  return (
    <div className="relative flex-1" ref={containerRef}>
      <Input 
        placeholder="Producto (ej: Azúcar Ledesma o Código)"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setDebouncedValue(value);
        }}
        className="h-10 md:h-11 rounded-xl bg-slate-50 md:bg-white w-full font-bold text-sm"
        required
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] max-h-64 overflow-y-auto">
          {filteredOptions.map((opt, i) => (
            <div 
              key={i}
              onClick={() => {
                onChange(opt.name, opt);
                setIsOpen(false);
              }}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{opt.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 py-0", opt.source === 'inventory' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-blue-700 bg-blue-50 border-blue-200')}>
                    {opt.source === 'inventory' ? 'En Mi Stock' : 'Maestro Global'}
                  </Badge>
                  {opt.code && <span className="text-[10px] text-slate-400 font-mono">Cód: {opt.code}</span>}
                  {opt.barcode && <span className="text-[10px] text-slate-400 font-mono">EAN: {opt.barcode}</span>}
                </div>
              </div>
              
              {opt.source === 'inventory' && opt.purchasePrice > 0 && (
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Últ. Costo</span>
                  <span className="text-xs font-mono font-bold text-slate-900">${opt.purchasePrice}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface InvoicesManagerProps {
  ownerRole: OwnerRole;
  backHref: string;
  title?: string;
  accentColor?: string; // 'red' | 'emerald'
}

export function InvoicesManager({
  ownerRole,
  backHref,
  title = 'Facturas de Compra & Contabilidad',
  accentColor = 'red'
}: InvoicesManagerProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { effectiveRetailerId } = useRole();
  const targetOwnerId = effectiveRetailerId || user?.uid;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [quickPaymentAmount, setQuickPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('A');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFERENCIA');
  const [notes, setNotes] = useState('');
  const [updateStockAutomatically, setUpdateStockAutomatically] = useState(true);

  // Items State (Invoice detail rows)
  const [items, setItems] = useState<PurchaseInvoiceItemProduct[]>([]);

  // Efecto para cargar borrador guardado y guardar automáticamente (memoria de guardado)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoice-draft-items');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            return;
          }
        } catch(e) {}
      }
      setItems([{ name: '', quantity: 1, costPrice: 0, subtotal: 0 }]);
    }
  }, []);

  React.useEffect(() => {
    if (items.length > 0 && items[0].name !== '') {
      localStorage.setItem('invoice-draft-items', JSON.stringify(items));
    }
  }, [items]);

  const invoicesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId) return null;
    return query(
      collection(firestore, 'retailer_daily_operations'),
      where('ownerId', '==', targetOwnerId),
      where('recordType', '==', 'PURCHASE_INVOICE')
    );
  }, [firestore, user, targetOwnerId]);
  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<PurchaseInvoice>(invoicesQuery);

  const suppliersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId) return null;
    return query(
      collection(firestore, 'retailer_providers'),
      where('ownerId', '==', targetOwnerId)
    );
  }, [firestore, user, targetOwnerId]);
  const { data: suppliers } = useCollection<SupplierItem>(suppliersQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId || ownerRole !== 'retailer') return null;
    return query(
      collection(firestore, 'retailer_branches'),
      where('retailerId', '==', targetOwnerId)
    );
  }, [firestore, user, targetOwnerId, ownerRole]);
  const { data: branches } = useCollection<any>(branchesQuery);

  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore || !user || !targetOwnerId) return null;
    if (ownerRole === 'wholesaler') {
      return query(
        collection(firestore, 'wholesale_products'),
        where('wholesalerId', '==', targetOwnerId)
      );
    }
    return query(
      collection(firestore, 'retailer_inventory'),
      where('retailerId', '==', targetOwnerId)
    );
  }, [firestore, user, targetOwnerId, ownerRole]);
  const { data: inventoryItems } = useCollection<any>(inventoryQuery);

  const masterProductsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isCreateModalOpen) return null;
    return query(collection(firestore, 'products'), limit(300));
  }, [firestore, user, isCreateModalOpen]);
  const { data: masterProducts } = useCollection<any>(masterProductsQuery);

  const wholesaleProductsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isCreateModalOpen) return null;
    return query(collection(firestore, 'wholesale_products'), limit(300));
  }, [firestore, user, isCreateModalOpen]);
  const { data: wholesaleProducts } = useCollection<any>(wholesaleProductsQuery);

  // Unificamos ambas posibles colecciones de maestro global por las dudas
  const globalCatalog = useMemo(() => {
    return [...(masterProducts || []), ...(wholesaleProducts || [])];
  }, [masterProducts, wholesaleProducts]);

  // Totals of Form Items
  const invoiceSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  }, [items]);

  const invoiceTotalAmount = invoiceSubtotal; // extensible for tax calculation if needed

  // Metrics summary
  const metrics = useMemo(() => {
    if (!invoices) return { totalPaid: 0, totalPending: 0, totalInvoices: 0 };
    return invoices.reduce((acc, inv) => {
      acc.totalInvoices++;
      acc.totalPaid += (inv.amountPaid || 0);
      acc.totalPending += (inv.remainingAmount || 0);
      return acc;
    }, { totalPaid: 0, totalPending: 0, totalInvoices: 0 });
  }, [invoices]);

  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    let list = invoices;
    if (statusFilter !== 'ALL') {
      list = list.filter(i => i.paymentStatus === statusFilter);
    }
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      list = list.filter(i => 
        (i.supplierName || '').toLowerCase().includes(q) ||
        (i.invoiceNumber || '').toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, statusFilter, searchTerm]);

  // Price Comparator Logic (Inteligencia de Compras)
  const priceComparison = useMemo(() => {
    if (!invoices) return [];
    const productMap: Record<string, {
      productName: string;
      suppliers: Record<string, { price: number; date: string; supplierName: string }>;
    }> = {};

    // Recorremos todas las facturas de más viejas a más nuevas
    // para que quede el precio más actualizado.
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());

    sortedInvoices.forEach(inv => {
      inv.items?.forEach(item => {
        if (!item.name || !item.costPrice) return;
        const normalizedName = item.name.trim().toLowerCase();
        
        if (!productMap[normalizedName]) {
          productMap[normalizedName] = {
            productName: item.name.trim(), // nombre original para mostrar
            suppliers: {}
          };
        }

        // Guardamos o actualizamos el precio para este proveedor
        productMap[normalizedName].suppliers[inv.supplierId] = {
          supplierName: inv.supplierName,
          price: Number(item.costPrice),
          date: inv.issueDate
        };
      });
    });

    // Convertimos a array y ordenamos proveedores por precio
    return Object.values(productMap).map(p => {
      const supplierList = Object.values(p.suppliers).sort((a, b) => a.price - b.price);
      return {
        productName: p.productName,
        bestPrice: supplierList[0]?.price || 0,
        bestSupplier: supplierList[0]?.supplierName || '',
        bestDate: supplierList[0]?.date || '',
        allSuppliers: supplierList // [0] is the cheapest, [1] is second, etc.
      };
    }).sort((a, b) => a.productName.localeCompare(b.productName));

  }, [invoices]);

  // Item row operations
  const handleItemChange = (index: number, field: keyof PurchaseInvoiceItemProduct, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };
    
    // Si cambia el nombre, intentamos buscar si el producto ya existe en stock para traer su costo anterior
    if (field === 'name' && inventoryItems) {
      const match = inventoryItems.find((p: any) => p.name && p.name.toLowerCase() === String(value).toLowerCase());
      if (match) {
        if (match.purchasePrice) current.costPrice = Number(match.purchasePrice);
        if (match.salePrice || match.price) {
          current.salePrice = Number(match.salePrice || match.price);
          if (current.costPrice > 0) {
            current.margin = ((current.salePrice - current.costPrice) / current.costPrice) * 100;
          }
        }
      }
    }

    // Auto-calculate margins and prices
    const cost = Number(current.costPrice) || 0;
    if (field === 'costPrice') {
      if (current.margin !== undefined && current.margin > 0) {
        current.salePrice = cost * (1 + current.margin / 100);
      } else if (current.salePrice !== undefined && current.salePrice > 0 && cost > 0) {
        current.margin = ((current.salePrice - cost) / cost) * 100;
      }
    } else if (field === 'margin') {
      const marg = Number(current.margin) || 0;
      if (cost > 0) {
        current.salePrice = cost * (1 + marg / 100);
      }
    } else if (field === 'salePrice') {
      const sp = Number(current.salePrice) || 0;
      if (cost > 0) {
        current.margin = ((sp - cost) / cost) * 100;
      }
    }

    const qty = Number(current.quantity) || 0;
    current.subtotal = qty * cost;
    
    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, costPrice: 0, subtotal: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleOpenCreate = () => {
    setSupplierId('');
    setInvoiceType('A');
    setInvoiceNumber('');
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentStatus('PENDING');
    setAmountPaid('0');
    setPaymentMethod('TRANSFERENCIA');
    setNotes('');
    setUpdateStockAutomatically(true);
    setItems([{ name: '', quantity: 1, costPrice: 0, subtotal: 0 }]);
    setIsCreateModalOpen(true);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    const targetSupplier = suppliers?.find(s => s.id === supplierId);
    if (!targetSupplier) {
      toast({ title: 'Proveedor requerido', description: 'Selecciona o carga un proveedor primero.', variant: 'destructive' });
      return;
    }
    if (!invoiceNumber.trim()) {
      toast({ title: 'Número de factura requerido', description: 'Ingresa el número de comprobante.', variant: 'destructive' });
      return;
    }

    const validItems = items.filter(i => i.name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: 'Items requeridos', description: 'Agrega al menos un producto a la factura.', variant: 'destructive' });
      return;
    }

    const paidVal = Number(amountPaid) || 0;
    const remainingVal = Math.max(0, invoiceTotalAmount - paidVal);
    let finalStatus = paymentStatus;
    if (paidVal >= invoiceTotalAmount) {
      finalStatus = 'PAID';
    } else if (paidVal > 0 && paidVal < invoiceTotalAmount) {
      finalStatus = 'PARTIAL';
    } else {
      finalStatus = 'PENDING';
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<PurchaseInvoice> = {
        ownerId: targetOwnerId,
        ownerRole,
        supplierId: targetSupplier.id,
        supplierName: targetSupplier.name,
        supplierCuit: targetSupplier.cuit,
        invoiceType,
        invoiceNumber: invoiceNumber.trim(),
        issueDate,
        dueDate,
        items: validItems,
        subtotal: invoiceSubtotal,
        totalAmount: invoiceTotalAmount,
        paymentStatus: finalStatus,
        amountPaid: paidVal,
        remainingAmount: remainingVal,
        paymentMethod,
        notes: notes.trim(),
        updatedStock: updateStockAutomatically,
        recordType: 'PURCHASE_INVOICE',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'retailer_daily_operations'), payload);

      // Si actualiza stock, procesar cada producto sincronizando stock según el rol (retailer o wholesaler)
      if (updateStockAutomatically) {
        const batch = writeBatch(firestore);
        const centralBranch = branches?.find((b: any) => b.isCentral);
        const centralId = centralBranch ? centralBranch.id : 'central';
        
        for (const item of validItems) {
          const addedQty = Math.max(0, Number(item.quantity) || 0);
          // Buscamos si el producto ya existe en el stock local usando inventoryItems
          const existingItem = inventoryItems?.find((p: any) => 
            (item.code && (p.code || p.barcode) && String(p.code || p.barcode).trim() === String(item.code).trim()) || 
            (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          );

          if (ownerRole === 'wholesaler') {
            const targetSalePrice = (item.salePrice && Number(item.salePrice) > 0)
              ? Number(item.salePrice)
              : (existingItem?.price || existingItem?.salePrice || Math.round(Number(item.costPrice) * 1.3));

            if (existingItem) {
              const ref = doc(firestore, 'wholesale_products', existingItem.id);
              const newTotalStock = Math.max(0, Number(existingItem.stock) || 0) + addedQty;
              const updateData: any = {
                stock: newTotalStock,
                purchasePrice: Number(item.costPrice),
                updatedAt: serverTimestamp()
              };
              if (item.salePrice && Number(item.salePrice) > 0) {
                updateData.price = Number(item.salePrice);
                updateData.salePrice = Number(item.salePrice);
              }
              batch.update(ref, updateData);
            } else {
              const newRef = doc(collection(firestore, 'wholesale_products'));
              batch.set(newRef, {
                id: newRef.id,
                wholesalerId: targetOwnerId,
                name: item.name,
                code: item.code || "",
                barcode: item.code || "",
                category: 'General',
                purchasePrice: Number(item.costPrice),
                price: targetSalePrice,
                salePrice: targetSalePrice,
                stock: addedQty,
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          } else if (existingItem) {
            const ref = doc(firestore, 'retailer_inventory', existingItem.id);
            const updatedStockByBranch: Record<string, number> = { ...(existingItem.stockByBranch || {}) };
            if (Object.keys(updatedStockByBranch).length === 0 && branches && branches.length > 0) {
              updatedStockByBranch[centralId] = Math.max(0, Number(existingItem.stock) || 0);
            }
            const targetBranchId = existingItem.branchId || centralId;
            const currentBranchStock = branches && branches.length > 0
              ? Math.max(0, computeProductBranchStock(existingItem, targetBranchId, branches))
              : Math.max(0, Number(existingItem.stock) || 0);

            updatedStockByBranch[targetBranchId] = currentBranchStock + addedQty;
            Object.keys(updatedStockByBranch).forEach(k => {
              updatedStockByBranch[k] = Math.max(0, Number(updatedStockByBranch[k]) || 0);
            });
            const newTotalStock = Object.values(updatedStockByBranch).reduce((acc, v) => acc + Math.max(0, Number(v) || 0), 0);

            const updateData: any = {
              stock: newTotalStock,
              stockByBranch: updatedStockByBranch,
              purchasePrice: Number(item.costPrice),
              updatedAt: serverTimestamp()
            };
            if (item.salePrice && Number(item.salePrice) > 0) {
              updateData.salePrice = Number(item.salePrice);
            }
            batch.update(ref, updateData);
          } else {
            // Crear el producto en stock con su mapa stockByBranch inicializado en la sucursal central
            const newRef = doc(collection(firestore, 'retailer_inventory'));
            batch.set(newRef, {
              id: newRef.id,
              retailerId: targetOwnerId,
              name: item.name,
              code: item.code || "",
              purchasePrice: Number(item.costPrice),
              salePrice: (item.salePrice && Number(item.salePrice) > 0) ? Number(item.salePrice) : Math.round(Number(item.costPrice) * 1.3),
              stock: addedQty,
              stockByBranch: { [centralId]: addedQty },
              branchId: centralId,
              active: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
        
        await batch.commit();

        // Enviar log de abastecimiento (usamos retailer_inventory_logs para ambos roles ya que tiene reglas Firestore habilitadas)
        await addDoc(collection(firestore, 'retailer_inventory_logs'), {
          ownerId: targetOwnerId,
          retailerId: targetOwnerId,
          ownerRole,
          action: 'PURCHASE_INVOICE',
          details: `Ingreso por Factura ${invoiceType} ${invoiceNumber} de ${targetSupplier.name}`,
          itemsCount: validItems.length,
          totalAmount: invoiceTotalAmount,
          timestamp: serverTimestamp()
        });
      }

      toast({ title: 'Factura Registrada ✅', description: `Comprobante ${invoiceNumber} cargado correctamente.` });
      setIsCreateModalOpen(false);
      localStorage.removeItem('invoice-draft-items');
      setItems([{ name: '', quantity: 1, costPrice: 0, subtotal: 0 }]);
    } catch (err: any) {
      toast({ title: 'Error al registrar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePayment = async (invoice: PurchaseInvoice, newPaidAmount: number) => {
    if (!firestore) return;
    try {
      const total = invoice.totalAmount;
      const remaining = Math.max(0, total - newPaidAmount);
      let newStatus: PaymentStatus = 'PENDING';
      if (newPaidAmount >= total) newStatus = 'PAID';
      else if (newPaidAmount > 0) newStatus = 'PARTIAL';

      await updateDoc(doc(firestore, 'retailer_daily_operations', invoice.id), {
        amountPaid: newPaidAmount,
        remainingAmount: remaining,
        paymentStatus: newStatus,
        updatedAt: serverTimestamp()
      });

      toast({ title: 'Pago Actualizado 💳', description: `Saldo restante: $${remaining.toLocaleString('es-AR')}` });
      if (selectedInvoice && selectedInvoice.id === invoice.id) {
        setSelectedInvoice({
          ...selectedInvoice,
          amountPaid: newPaidAmount,
          remainingAmount: remaining,
          paymentStatus: newStatus
        });
      }
    } catch (err: any) {
      toast({ title: 'Error al actualizar pago', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (id: string, number: string) => {
    if (!firestore) return;
    if (!confirm(`¿Eliminar la factura ${number}? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteDoc(doc(firestore, 'retailer_daily_operations', id));
      toast({ title: 'Factura eliminada 🗑️' });
      setIsDetailModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' });
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
                <FileText className={cn("w-5 h-5", accentColor === 'red' ? "text-red-600" : "text-emerald-600")} />
                {title}
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Control de Compras a Proveedores y Estados de Pago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsComparatorOpen(true)}
              variant="outline"
              className="rounded-2xl font-black uppercase text-xs tracking-wider h-11 px-5 gap-2 border-slate-200 text-slate-700 bg-white shadow-sm hover:bg-slate-50"
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" /> Comparar Precios
            </Button>
            <Button 
              onClick={handleOpenCreate}
              className={cn(
                "rounded-2xl font-black uppercase text-xs tracking-wider h-11 px-5 gap-2 text-white shadow-md",
                accentColor === 'red' ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              )}
            >
              <Plus className="w-4 h-4" /> Cargar Factura
            </Button>
          </div>
        </div>
      </header>

      {/* METRIC CARDS */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cuentas por Pagar (Pendientes)</p>
            <p className="text-2xl font-black text-rose-600 font-mono mt-1">
              ${metrics.totalPending.toLocaleString('es-AR')}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Deuda comercial con proveedores</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Pagado Histórico</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
              ${metrics.totalPaid.toLocaleString('es-AR')}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Pagos completados / cancelados</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comprobantes Registrados</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {metrics.totalInvoices}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
                Solvencia Comercial
              </Badge>
            </div>
          </div>
        </div>

        {/* FILTROS & SEARCH */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por proveedor, N° de factura o notas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-4 rounded-xl border-slate-200 font-bold text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'PENDING', 'PARTIAL', 'PAID'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all",
                  statusFilter === st 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {st === 'ALL' ? 'Todas' : st === 'PENDING' ? 'Pendientes' : st === 'PARTIAL' ? 'Parciales' : 'Pagadas'}
              </button>
            ))}
          </div>
        </div>

        {/* INVOICES LIST */}
        {isLoadingInvoices ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cargando comprobantes...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-black uppercase text-slate-700">No hay facturas en esta vista</p>
              <p className="text-xs text-slate-400 mt-1">
                Registra tus compras a proveedores para mantener tu estado financiero al día.
              </p>
            </div>
            <Button 
              onClick={handleOpenCreate}
              className={cn("rounded-2xl font-bold uppercase text-xs", accentColor === 'red' ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
            >
              <Plus className="w-4 h-4 mr-1" /> Cargar Primera Factura
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <div 
                key={inv.id}
                onClick={() => { setSelectedInvoice(inv); setQuickPaymentAmount(""); setIsDetailModalOpen(true); }}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border",
                    inv.paymentStatus === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    inv.paymentStatus === 'PARTIAL' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {inv.invoiceType}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                        {inv.supplierName}
                      </h4>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none",
                        inv.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                        inv.paymentStatus === 'PARTIAL' ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {inv.paymentStatus === 'PAID' ? 'PAGADA' : inv.paymentStatus === 'PARTIAL' ? 'PAGO PARCIAL' : 'PENDIENTE'}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-slate-500 font-bold mt-0.5">
                      N° {inv.invoiceNumber} • Emitida: {inv.issueDate} • Vence: {inv.dueDate}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {inv.items?.length || 0} productos incluidos {inv.paymentMethod ? `• Pago: ${inv.paymentMethod}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Total Comprobante</p>
                    <p className="text-base font-black text-slate-900 font-mono">
                      ${inv.totalAmount.toLocaleString('es-AR')}
                    </p>
                    {inv.paymentStatus !== 'PAID' && (
                      <p className="text-[10px] font-bold text-rose-600">
                        Resta: ${(inv.remainingAmount || 0).toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL NUEVA FACTURA */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl rounded-3xl p-6 bg-white max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg md:text-xl">
              Registrar Factura de Compra
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-400">
              Registra los productos adquiridos, precios de costo y condición de pago.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitInvoice} className="space-y-4 md:space-y-6 pt-2">
            {/* SELECCIÓN DE PROVEEDOR Y FACTURA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Proveedor *</Label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  required
                  className="w-full h-12 mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-sm"
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {suppliers?.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.cuit ? `(${s.cuit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">Tipo</Label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as InvoiceType)}
                    className="w-full h-12 mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-sm"
                  >
                    <option value="A">Factura A</option>
                    <option value="B">Factura B</option>
                    <option value="C">Factura C</option>
                    <option value="REMITO">Remito</option>
                    <option value="PRESUPUESTO">Presupuesto</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-slate-500">N° Factura *</Label>
                  <Input 
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="0001-00045231"
                    className="h-12 mt-1 font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* FECHAS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Fecha de Emisión</Label>
                <Input 
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="h-12 mt-1 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-slate-500">Fecha de Vencimiento</Label>
                <Input 
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-12 mt-1 font-bold text-rose-600"
                />
              </div>
            </div>

            {/* DETALLE DE PRODUCTOS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Productos Comprados
                </p>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddItem}
                  className="h-8 rounded-lg text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Sumar Fila
                </Button>
              </div>

              <div className="space-y-4 md:space-y-2 pb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 bg-white p-3 md:p-1 rounded-xl md:rounded-none border md:border-none border-slate-200">
                    <ProductAutocomplete 
                      value={item.name}
                      inventory={inventoryItems || []}
                      masterList={globalCatalog}
                      onChange={(newName, selectedProduct) => {
                        // Primero actualizamos el nombre
                        handleItemChange(idx, 'name', newName);
                        
                        if (selectedProduct) {
                          // Si es seleccionado desde la lista, completamos los campos adicionales
                          const updated = [...items];
                          updated[idx] = { 
                            ...updated[idx], 
                            name: selectedProduct.name,
                            code: selectedProduct.barcode || selectedProduct.code || "",
                            productId: selectedProduct.id || "",
                            costPrice: Number(selectedProduct.purchasePrice || selectedProduct.price || 0),
                            salePrice: selectedProduct.salePrice ? Number(selectedProduct.salePrice) : undefined
                          };
                          
                          // Recalculate subtotal
                          const qty = Number(updated[idx].quantity) || 0;
                          const price = Number(updated[idx].costPrice) || 0;
                          updated[idx].subtotal = qty * price;
                          
                          setItems(updated);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        placeholder="Cant."
                        value={item.quantity || ''}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        className="h-10 md:h-11 w-20 md:w-20 rounded-xl bg-slate-50 md:bg-white text-center font-bold text-sm"
                        min={0}
                        step="any"
                        required
                      />
                      <Input 
                        type="number"
                        placeholder="Costo"
                        value={item.costPrice || ''}
                        onChange={e => handleItemChange(idx, 'costPrice', e.target.value)}
                        className="h-10 md:h-11 w-full md:w-28 rounded-xl bg-slate-50 md:bg-white font-mono font-bold text-sm"
                        min={0}
                        step="any"
                        required
                      />
                      <div className="relative w-full md:w-24">
                        <Input 
                          type="number"
                          placeholder="Margen"
                          value={item.margin !== undefined ? Number(item.margin).toFixed(1) : ''}
                          onChange={e => handleItemChange(idx, 'margin', e.target.value)}
                          className="h-10 md:h-11 w-full rounded-xl bg-slate-50 md:bg-white font-mono font-bold text-sm text-emerald-600 border-emerald-100 pr-6"
                          min={0}
                          step="any"
                          title="Margen de ganancia"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500">%</span>
                      </div>
                      <Input 
                        type="number"
                        placeholder="P. Venta"
                        value={item.salePrice !== undefined ? Number(item.salePrice).toFixed(0) : ''}
                        onChange={e => handleItemChange(idx, 'salePrice', e.target.value)}
                        className="h-10 md:h-11 w-full md:w-32 rounded-xl bg-slate-50 md:bg-white font-mono font-black text-sm border-emerald-200 focus-visible:ring-emerald-500"
                        min={0}
                        step="any"
                        title="Precio de venta sugerido"
                      />
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 mt-1 md:mt-0">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Subtotal:</span>
                      <div className="md:w-32 text-right font-black font-mono text-lg md:text-sm text-slate-800 shrink-0">
                        ${(item.subtotal || 0).toLocaleString('es-AR')}
                      </div>
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="uppercase text-slate-500 text-xs">Total Factura:</span>
                <span className="text-xl font-mono text-slate-900">${invoiceTotalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* CONDICIÓN DE PAGO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Monto Abonado Inicialmente ($)</Label>
                <Input 
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder="0 si está pendiente"
                  className="h-12 mt-1 font-mono font-bold"
                  step="any"
                />
              </div>
              <div>
                <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Forma de Pago</Label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-12 mt-1 rounded-xl bg-slate-50 border border-slate-200 px-3 font-bold text-sm"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO">Efectivo de Caja</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CTA_CTE">Cuenta Corriente / A Plazo</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs md:text-sm font-bold uppercase text-slate-500">Observaciones</Label>
              <Input 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Incluye flete bonificado"
                className="h-11 mt-1"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Factura'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALLE DE FACTURA & REGISTRAR PAGO */}
      {selectedInvoice && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-lg rounded-3xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg">
                  Factura {selectedInvoice.invoiceType} - N° {selectedInvoice.invoiceNumber}
                </DialogTitle>
                <Badge className={cn(
                  "text-[9px] font-black uppercase px-2.5 py-1 rounded-md",
                  selectedInvoice.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-800" :
                  selectedInvoice.paymentStatus === 'PARTIAL' ? "bg-amber-100 text-amber-800" :
                  "bg-rose-100 text-rose-800"
                )}>
                  {selectedInvoice.paymentStatus === 'PAID' ? 'PAGADA' : selectedInvoice.paymentStatus === 'PARTIAL' ? 'PARCIAL' : 'PENDIENTE'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-400">
                Proveedor: <strong className="text-slate-700">{selectedInvoice.supplierName}</strong> {selectedInvoice.supplierCuit ? `(CUIT: ${selectedInvoice.supplierCuit})` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Fecha Emisión</span>
                  <p className="font-black text-slate-800 mt-0.5">{selectedInvoice.issueDate}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Fecha Vencimiento</span>
                  <p className="font-black text-rose-600 mt-0.5">{selectedInvoice.dueDate}</p>
                </div>
              </div>

              {/* LISTA DE ITEMS */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Artículos Comprados</p>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {selectedInvoice.items?.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{it.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {it.quantity} un. × ${it.costPrice.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <span className="font-black font-mono text-slate-900">
                        ${(it.subtotal || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SALDOS */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 font-mono">
                <div className="flex justify-between text-xs text-slate-400 font-sans font-bold uppercase">
                  <span>Total Comprobante:</span>
                  <span>${selectedInvoice.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400 font-sans font-bold uppercase">
                  <span>Monto Pagado:</span>
                  <span>${(selectedInvoice.amountPaid || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-2 border-t border-slate-800">
                  <span className="text-rose-400">Saldo Pendiente:</span>
                  <span className="text-rose-400">${(selectedInvoice.remainingAmount || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* REGISTRAR / REVERTIR PAGO RÁPIDO */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <p className="text-xs font-black uppercase text-amber-900">
                  {selectedInvoice.paymentStatus === 'PAID' ? 'Corrección de Estado' : 'Registrar Pago / Abono'}
                </p>
                <div className="flex flex-col gap-2">
                  {selectedInvoice.paymentStatus !== 'PAID' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                        Para cancelar, ingresa: ${(selectedInvoice.remainingAmount || 0).toLocaleString('es-AR')}
                      </p>
                      <div className="flex gap-2 items-center">
                        <Input 
                          type="number"
                          step="any"
                          placeholder="Ingresar monto..."
                          value={quickPaymentAmount}
                          onChange={(e) => setQuickPaymentAmount(e.target.value)}
                          className="h-11 bg-white rounded-xl font-mono text-sm font-bold flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const val = Number(quickPaymentAmount);
                            if (val > 0) {
                              handleUpdatePayment(selectedInvoice, (selectedInvoice.amountPaid || 0) + val);
                              setQuickPaymentAmount("");
                            }
                          }}
                          disabled={!quickPaymentAmount || Number(quickPaymentAmount) <= 0}
                          className="h-11 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase px-6"
                        >
                          Grabar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdatePayment(selectedInvoice, 0)}
                      className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-xs uppercase rounded-xl h-10"
                    >
                      Deshacer Pago (Marcar como Pendiente)
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="text-rose-500 hover:bg-rose-50 text-xs font-bold"
                  onClick={() => handleDeleteInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Eliminar Factura
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl font-bold text-xs"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL COMPARADOR DE PRECIOS */}
      <Dialog open={isComparatorOpen} onOpenChange={setIsComparatorOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl rounded-3xl p-6 bg-white max-h-[92vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-black uppercase tracking-tight text-slate-900 text-lg md:text-xl flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" /> Comparador Inteligente de Precios
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-slate-500">
              Analizamos tus facturas históricas para encontrar a qué proveedor le compraste más barato cada producto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
            {priceComparison.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold text-sm">
                No hay suficientes datos. Registra facturas con productos para ver la comparativa.
              </div>
            ) : (
              priceComparison.map((prod, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                      {prod.productName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 font-black">
                        Mejor Precio: ${prod.bestPrice.toLocaleString('es-AR')}
                      </Badge>
                      <span className="text-xs font-bold text-slate-500">
                        en <span className="text-slate-700">{prod.bestSupplier}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 border-t border-slate-200 md:border-none pt-3 md:pt-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historial de Proveedores</p>
                    {prod.allSuppliers.map((sup, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center text-xs font-medium">
                        <span className={cn("truncate max-w-[150px]", sIdx === 0 ? "text-emerald-700 font-bold" : "text-slate-600")}>
                          {sup.supplierName}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[10px]">{format(new Date(sup.date), 'dd/MM/yy')}</span>
                          <span className={cn("font-mono font-bold", sIdx === 0 ? "text-emerald-700" : "text-slate-700")}>
                            ${sup.price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="shrink-0 pt-4 mt-2 border-t border-slate-100 flex justify-end">
            <Button onClick={() => setIsComparatorOpen(false)} variant="outline" className="rounded-xl font-bold">
              Cerrar Comparador
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
