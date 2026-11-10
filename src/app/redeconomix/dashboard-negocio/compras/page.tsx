'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, ShoppingCart, Package, AlertTriangle, 
  Search, Plus, CheckCircle2, Clock, Truck, Store, X, Check, FileText
} from 'lucide-react';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { RoleGuard } from '@/components/role-guard';
import { useToast } from '@/hooks/use-toast';
import { RedEconomiXHeader } from '@/components/redeconomix-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RetailerProduct {
  id: string;
  name: string;
  category?: string;
  stock?: number;
  minStock?: number;
  provider?: string;      
  lastCost?: number;      
  branchId?: string;
}

export default function ComprasPage() {
  const { effectiveRetailerId, role, employee } = useRole();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'sugerencias' | 'ordenes'>('sugerencias');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState('');

  // Fetch Inventory
  const inventoryQuery = useMemo(() => {
    if (!effectiveRetailerId || !firestore) return null;
    return query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', effectiveRetailerId));
  }, [effectiveRetailerId, firestore]);

  const { data: inventoryData, isLoading: loadingInventory } = useCollection(inventoryQuery);
  const inventory = inventoryData || [];

  // Fetch Branches
  const branchesQuery = useMemo(() => {
    if (!effectiveRetailerId || !firestore) return null;
    return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', effectiveRetailerId));
  }, [effectiveRetailerId, firestore]);

  const { data: branches } = useCollection(branchesQuery);

  const getBranchName = (branchId?: string) => {
    if (!branchId || branchId === 'central') return 'Sede Central';
    const branch = branches?.find((b: any) => b.id === branchId);
    return branch ? branch.name : 'Sede Central';
  };

  // Fetch Purchase Orders
  const ordersQuery = useMemo(() => {
    if (!effectiveRetailerId || !firestore) return null;
    return query(collection(firestore, 'retailer_purchase_orders'), where('retailerId', '==', effectiveRetailerId));
  }, [effectiveRetailerId, firestore]);

  const { data: purchaseOrdersData, isLoading: loadingOrders } = useCollection(ordersQuery);
  const purchaseOrders = useMemo(() => {
    return (purchaseOrdersData || []).sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [purchaseOrdersData]);

  // Sugerencias (Low Stock)
  const sugerencias = useMemo(() => {
    const lowStock = inventory.filter((item: any) => {
      const stock = Number(item.stock) || 0;
      const minStock = Number(item.minStock) || 0;
      return stock <= minStock;
    }) as RetailerProduct[];

    return lowStock.reduce((acc, item) => {
      const cat = item.category || 'Sin Categoría';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, RetailerProduct[]>);
  }, [inventory]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleToggleCategory = (categoryItems: RetailerProduct[]) => {
    const allSelected = categoryItems.every(i => selectedItems.includes(i.id));
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !categoryItems.some(i => i.id === id)));
    } else {
      const newIds = categoryItems.filter(i => !selectedItems.includes(i.id)).map(i => i.id);
      setSelectedItems(prev => [...prev, ...newIds]);
    }
  };

  const openOrderModal = (category: string, items: RetailerProduct[]) => {
    const itemsToOrder = items.filter(i => selectedItems.includes(i.id));
    if (itemsToOrder.length === 0) return;

    const draft = itemsToOrder.map(i => ({
      productId: i.id,
      name: i.name,
      currentStock: i.stock || 0,
      minStock: i.minStock || 0,
      requestedQuantity: Math.max((i.minStock || 0) - (i.stock || 0), 1),
      provider: i.provider || '',
      expectedCost: i.lastCost || 0,
      branchId: i.branchId || 'central',
      branchName: getBranchName(i.branchId)
    }));

    setCurrentCategory(category);
    setOrderDraft(draft);
    setIsModalOpen(true);
  };

  const updateDraftItem = (index: number, field: string, value: any) => {
    setOrderDraft(prev => {
      const newDraft = [...prev];
      newDraft[index] = { ...newDraft[index], [field]: value };
      return newDraft;
    });
  };

  const handleSaveOrder = async () => {
    if (!firestore || !effectiveRetailerId) return;

    try {
      const orderData = {
        retailerId: effectiveRetailerId,
        createdBy: employee?.id || 'admin',
        createdByName: employee?.name || 'Administrador',
        category: currentCategory,
        items: orderDraft,
        // Al crearla queda pendiente de que el dueño la apruebe. Si es admin, puede arrancar como aprobada pero lo dejamos uniforme.
        status: 'Pendiente de Aprobación', 
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'retailer_purchase_orders'), orderData);
      
      toast({ title: "Orden Registrada", description: "La orden fue enviada para su aprobación." });
      
      setSelectedItems(prev => prev.filter(id => !orderDraft.some(d => d.productId === id)));
      setIsModalOpen(false);
      setActiveTab('ordenes');
    } catch (error) {
      console.error("Error creating order:", error);
      toast({ title: "Error", description: "No se pudo generar la orden", variant: "destructive" });
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!firestore || role !== 'admin') return;
    try {
      await updateDoc(doc(firestore, 'retailer_purchase_orders', orderId), {
        status: 'Pendiente de Compra',
        approvedAt: serverTimestamp(),
        approvedBy: 'admin'
      });
      toast({ title: "Orden Aprobada", description: "La orden pasó a estado 'Pendiente de Compra'." });
    } catch (error) {
      console.error("Error approving order:", error);
      toast({ title: "Error", description: "No se pudo aprobar la orden.", variant: "destructive" });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pendiente de Aprobación': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'Pendiente de Compra': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'En Transporte': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Recibido': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <RoleGuard moduleName="Compras y Proveedores" allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 pb-32">
      <RedEconomiXHeader title="Gestión de Compras" />

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Link href="/redeconomix/dashboard-negocio" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Link>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          <button 
            onClick={() => setActiveTab('sugerencias')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'sugerencias' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <AlertTriangle className="w-4 h-4" /> Stock Crítico
          </button>
          <button 
            onClick={() => setActiveTab('ordenes')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ordenes' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingCart className="w-4 h-4" /> Órdenes Generadas
          </button>
        </div>

        {/* SUGERENCIAS */}
        {activeTab === 'sugerencias' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500 bg-blue-50 text-blue-700 p-4 rounded-xl flex items-start gap-3">
              <Package className="w-5 h-5 shrink-0" />
              <span>Seleccioná los productos para generar la orden preliminar. Luego podrás ajustar proveedor, cantidades y costos antes de enviarla.</span>
            </p>

            {loadingInventory ? (
              <div className="text-center py-10 text-slate-400">Cargando inventario...</div>
            ) : Object.keys(sugerencias).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Todo en orden</h3>
                <p className="text-slate-500">No hay productos por debajo del stock mínimo.</p>
              </div>
            ) : (
              Object.entries(sugerencias).map(([category, items]) => {
                const categorySelectedCount = items.filter(i => selectedItems.includes(i.id)).length;
                
                return (
                  <Card key={category} className="overflow-hidden border-0 shadow-sm rounded-2xl">
                    <div className="bg-slate-800 p-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={categorySelectedCount === items.length && items.length > 0} 
                          onCheckedChange={() => handleToggleCategory(items)}
                          className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-slate-800"
                        />
                        <h3 className="font-bold text-lg">{category}</h3>
                        <Badge className="bg-slate-700 border-none">{items.length}</Badge>
                      </div>
                      <Button 
                        onClick={() => openOrderModal(category, items)} 
                        size="sm" 
                        disabled={categorySelectedCount === 0}
                        className="bg-primary hover:bg-red-600 text-white rounded-xl disabled:bg-slate-700 disabled:text-slate-500"
                      >
                        Armar Orden ({categorySelectedCount})
                      </Button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleToggleItem(item.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800 block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Store className="w-3 h-3" /> {getBranchName(item.branchId)}
                            </span>
                          </div>
                          <div className="text-center w-16 shrink-0">
                            <span className="text-red-500 font-bold block">{item.stock || 0}</span>
                            <span className="text-[10px] text-slate-400">Min: {item.minStock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ORDENES */}
        {activeTab === 'ordenes' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="text-center py-10 text-slate-400">Cargando órdenes...</div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Sin órdenes</h3>
                <p className="text-slate-500">No hay órdenes de compra registradas.</p>
              </div>
            ) : (
              purchaseOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden border-slate-200 rounded-2xl">
                  <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {order.category}
                        <Badge variant="outline" className={getStatusBadgeColor(order.status)}>
                          {order.status}
                        </Badge>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-AR') : ''} 
                        <span className="mx-2">•</span> 
                        Creada por: <b>{order.createdByName}</b>
                      </p>
                    </div>
                    {role === 'admin' && order.status === 'Pendiente de Aprobación' && (
                      <Button size="sm" onClick={() => handleApproveOrder(order.id)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl">
                        Aprobar
                      </Button>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4">
                    <div className="space-y-3">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex flex-col min-w-0 flex-1 pr-4">
                            <span className="text-slate-800 font-bold truncate">{item.name}</span>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {item.branchName}</span>
                              {item.provider && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {item.provider}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right shrink-0">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400">Pedir</span>
                              <span className="font-black text-slate-800 text-base">{item.requestedQuantity}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400">Costo Est.</span>
                              <span className="font-bold text-slate-600">${item.expectedCost || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE ORDEN */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-0 overflow-hidden border-0">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <DialogTitle className="text-xl font-black">Detalle Orden: {currentCategory}</DialogTitle>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-slate-50">
            {orderDraft.map((item, idx) => (
              <div key={item.productId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Store className="w-3 h-3"/> {item.branchName}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Stock: {item.currentStock} / Min: {item.minStock}</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad a pedir</Label>
                    <Input 
                      type="number" 
                      value={item.requestedQuantity} 
                      onChange={e => updateDraftItem(idx, 'requestedQuantity', Number(e.target.value))}
                      className="mt-1 h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</Label>
                    <Input 
                      type="text" 
                      value={item.provider} 
                      onChange={e => updateDraftItem(idx, 'provider', e.target.value)}
                      placeholder="Ej: Mayorista A"
                      className="mt-1 h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Unit. Est.</Label>
                    <Input 
                      type="number" 
                      value={item.expectedCost} 
                      onChange={e => updateDraftItem(idx, 'expectedCost', Number(e.target.value))}
                      className="mt-1 h-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveOrder} className="rounded-xl bg-primary hover:bg-red-700 text-white flex-1">
              Enviar a Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </RoleGuard>
  );
}
