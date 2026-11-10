'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Minus, CheckCircle2, User, MapPin, Phone, ShoppingCart, Trash2,
  FileText, Calendar, BadgeDollarSign
} from 'lucide-react';
import { collection, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { useRole } from '@/hooks/use-role';
import { useToast } from '@/hooks/use-toast';
import { RedEconomiXHeader } from '@/components/redeconomix-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function PreventaPage() {
  const { effectiveRetailerId, role, employee } = useRole();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'nueva' | 'ordenes'>('nueva');

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number; barcode?: string }[]>([]);

  // Fetch Inventory for selection
  const inventoryQuery = useMemo(() => {
    if (!effectiveRetailerId || !firestore) return null;
    return query(
      collection(firestore, 'retailer_inventory'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [effectiveRetailerId, firestore]);

  const { data: inventoryData, isLoading: loadingInventory } = useCollection(inventoryQuery);
  const inventory = inventoryData || [];

  // Fetch Presales Orders
  const presalesQuery = useMemo(() => {
    if (!effectiveRetailerId || !firestore) return null;
    if (role === 'preventista' && employee?.id) {
      return query(
        collection(firestore, 'retailer_presales'),
        where('retailerId', '==', effectiveRetailerId),
        where('preventistaId', '==', employee.id)
      );
    }
    return query(
      collection(firestore, 'retailer_presales'),
      where('retailerId', '==', effectiveRetailerId)
    );
  }, [effectiveRetailerId, firestore, role, employee?.id]);

  const { data: presalesData, isLoading: loadingPresales } = useCollection(presalesQuery);
  // Sort them by date descending locally since we don't know if there's an index
  const presales = useMemo(() => {
    if (!presalesData) return [];
    return [...presalesData].sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [presalesData]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const q = searchTerm.toLowerCase();
    return inventory.filter((p: any) => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q));
  }, [searchTerm, inventory]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.salePrice || product.price) || 0, quantity: 1, barcode: product.barcode }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalCart = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  const handleSaveOrder = async () => {
    if (!firestore || !effectiveRetailerId) return;
    if (!customerName || cart.length === 0) {
      toast({ title: "Datos incompletos", description: "Ingresa el nombre del cliente y agrega productos.", variant: "destructive" });
      return;
    }

    try {
      const orderData = {
        retailerId: effectiveRetailerId,
        preventistaId: employee?.id || 'admin', 
        preventistaName: employee?.name || 'Administrador',
        customerInfo: {
          name: customerName,
          address: customerAddress,
          phone: customerPhone
        },
        items: cart,
        total: totalCart,
        status: 'Pendiente de Entrega',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'retailer_presales'), orderData);
      
      toast({ title: "Preventa Registrada", description: "El pedido fue guardado exitosamente." });
      
      // Reset form
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCart([]);
      setSearchTerm('');
      setActiveTab('ordenes');
    } catch (error) {
      console.error("Error saving presale:", error);
      toast({ title: "Error", description: "No se pudo registrar la preventa.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <RedEconomiXHeader title="Módulo Preventista" />

      <div className="max-w-xl mx-auto px-4 mt-6">
        <Link href="/redeconomix/dashboard-negocio" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </Link>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          <button 
            onClick={() => setActiveTab('nueva')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'nueva' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            Tomar Pedido
          </button>
          <button 
            onClick={() => setActiveTab('ordenes')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ordenes' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4" />
            Órdenes Generadas
          </button>
        </div>

        {activeTab === 'nueva' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Formulario Cliente */}
            <Card className="p-5 mb-6 rounded-3xl border-0 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" /> Datos del Cliente
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Negocio / Cliente</Label>
                  <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej: Kiosco Carlitos" className="h-12 bg-slate-50 border-none rounded-xl mt-1 focus-visible:ring-red-500" />
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Ej: San Martin 123" className="h-12 pl-10 bg-slate-50 border-none rounded-xl mt-1 focus-visible:ring-red-500" />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Ej: 387-4123456" className="h-12 pl-10 bg-slate-50 border-none rounded-xl mt-1 focus-visible:ring-red-500" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Buscador de Productos */}
            <Card className="p-5 mb-6 rounded-3xl border-0 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-500" /> Buscar Productos
              </h3>
              <Input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Buscar por nombre o código..." 
                className="h-12 bg-slate-50 border-none rounded-xl mb-4 focus-visible:ring-red-500" 
              />
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {searchTerm && filteredProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-bold text-sm text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        ${p.salePrice || p.price || 0}
                        {p.barcode && <span className="text-slate-400 ml-2 font-mono">#{p.barcode}</span>}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => addToCart(p)} className="bg-red-50 text-red-600 hover:bg-red-100 rounded-xl px-4 shrink-0">
                      Agregar
                    </Button>
                  </div>
                ))}
                {searchTerm && filteredProducts.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-4">No se encontraron productos.</p>
                )}
              </div>
            </Card>

            {/* Resumen del Pedido */}
            {cart.length > 0 && (
              <Card className="p-5 mb-6 rounded-3xl border-0 shadow-sm bg-slate-900 text-white">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-red-400" /> Resumen del Pedido
                </h3>
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          ${item.price} x {item.quantity}
                          {item.barcode && <span className="ml-2 opacity-50 font-mono">#{item.barcode}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <span className="font-bold text-slate-400">Total</span>
                  <span className="text-2xl font-black text-red-400">${totalCart.toLocaleString('es-AR')}</span>
                </div>
              </Card>
            )}

            {/* Botón Guardar */}
            <Button 
              onClick={handleSaveOrder} 
              disabled={cart.length === 0 || !customerName}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-red-700 text-white font-bold text-lg disabled:opacity-50 disabled:bg-slate-300"
            >
              Guardar Preventa
            </Button>
          </div>
        )}

        {activeTab === 'ordenes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {loadingPresales ? (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 animate-pulse text-slate-300 mb-2" />
                Cargando órdenes...
              </div>
            ) : presales.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Sin órdenes</h3>
                <p className="text-slate-500">Todavía no hay preventas registradas.</p>
              </div>
            ) : (
              presales.map((order: any) => (
                <Card key={order.id} className="overflow-hidden border-slate-200 rounded-2xl shadow-sm">
                  <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        {order.customerInfo?.name || 'Sin Nombre'}
                        <Badge variant="outline" className={
                          order.status === 'Entregado' ? 'bg-green-50 text-green-600 border-green-200' :
                          'bg-orange-50 text-orange-600 border-orange-200'
                        }>
                          {order.status}
                        </Badge>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-AR') + ' ' + order.createdAt.toDate().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'}) : 'Reciente'}
                        <span className="mx-1">•</span>
                        <User className="w-3 h-3" />
                        {order.preventistaName || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {order.customerInfo?.address || 'Sin dirección'}
                    </div>
                    {order.customerInfo?.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {order.customerInfo.phone}
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Productos solicitados</p>
                    <ul className="space-y-2 mb-4">
                      {order.items?.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600 truncate pr-2">{item.name}</span>
                          <span className="font-semibold text-slate-800 shrink-0">{item.quantity} un.</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 text-sm font-medium">Total</span>
                      <span className="text-lg font-black text-slate-800 flex items-center gap-1">
                        <BadgeDollarSign className="w-5 h-5 text-green-600" />
                        {order.total?.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
