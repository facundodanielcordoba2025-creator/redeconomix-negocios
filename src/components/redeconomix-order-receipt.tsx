'use client';

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FileUp, Printer, ShoppingCart, FileText, Trash2, Store, User, Copy, Pencil, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function OrderReceiptDialog({ order, isOpen, onClose, canEdit = false, onUpdateOrder }: { order: any | null, isOpen: boolean, onClose: () => void, canEdit?: boolean, onUpdateOrder?: (updatedOrder: any) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const printableRef = useRef<HTMLDivElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  
  if (!order) return null;

  const handleDeleteItem = async (index: number) => {
    if (!firestore || isUpdating) return;
    const newItems = [...order.items];
    const removedItem = newItems.splice(index, 1)[0];
    const newTotal = order.totalAmount - (removedItem.priceAtPurchase * removedItem.quantity);
    setIsUpdating(true);
    toast({ title: "Actualizando pedido...", description: `Eliminando ${removedItem.name}` });
    try {
        const orderRef = doc(firestore, 'orders_wholesaler', order.id);
        const updatedData: any = {
            items: newItems,
            totalAmount: newTotal,
            updatedAt: serverTimestamp(),
            lastModification: `Eliminado: ${removedItem.name}`
        };
        await updateDoc(orderRef, updatedData);
        if (onUpdateOrder) onUpdateOrder({ ...order, ...updatedData });
        toast({ title: "Pedido actualizado", description: "Se ha notificado al cliente sobre el cambio." });
    } catch (error) {
        toast({ title: "Error", variant: "destructive", description: "No se pudo actualizar el pedido." });
    } finally { setIsUpdating(false); }
  };


  const handleUpdateQuantity = async () => {
    if (editingItemIndex === null || !firestore || isUpdating) return;
    const qty = parseInt(editingQuantity);
    if (isNaN(qty) || qty <= 0) {
        toast({ title: "Cantidad inválida", variant: "destructive" });
        return;
    }
    
    const newItems = [...order.items];
    newItems[editingItemIndex].quantity = qty;
    
    // Recalculate total
    const newTotal = newItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
    
    setIsUpdating(true);
    toast({ title: "Actualizando cantidad...", description: `Modificando ${newItems[editingItemIndex].name}` });
    try {
        const orderRef = doc(firestore, 'orders_wholesaler', order.id);
        const updatedData: any = {
            items: newItems,
            totalAmount: newTotal,
            updatedAt: serverTimestamp(),
            lastModification: `Modificado: ${newItems[editingItemIndex].name} a ${qty} u.`
        };
        await updateDoc(orderRef, updatedData);
        if (onUpdateOrder) onUpdateOrder({ ...order, ...updatedData });
        toast({ title: "Pedido actualizado", description: "Se ha guardado la nueva cantidad." });
        setEditingItemIndex(null);
    } catch (error) {
        toast({ title: "Error", variant: "destructive", description: "No se pudo actualizar el pedido." });
    } finally { setIsUpdating(false); }
  };

  const handleExportPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    const displayId = order.displayId || `#${order.id.slice(-6).toUpperCase()}`;
    
    // Header
    doc.setFillColor(227, 6, 19);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setFontSize(22); 
    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "bold"); 
    doc.text("RedEconomiX", 14, 17);
    
    // Title
    doc.setFontSize(16); 
    doc.setTextColor(0, 0, 0); 
    doc.text(`Remito de pedido ${displayId}`, 14, 35);
    
    // Meta data
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${order.createdAt?.toDate().toLocaleDateString('es-AR') || 'N/A'}`, 14, 45);
    doc.text(`Cliente: ${order.retailerBusinessName || order.retailerName}`, 14, 52);
    doc.text(`CUIT: ${order.retailerCuit || 'No especificado'}`, 14, 59);
    doc.text(`Modalidad: ${order.paymentMethod}`, 14, 66);
    
    // Items table
    const tableData = order.items.map((item: any) => [
        item.name,
        item.quantity.toString(),
        `${item.priceAtPurchase.toLocaleString('es-AR')}`,
        `${(item.priceAtPurchase * item.quantity).toLocaleString('es-AR')}`
    ]);
    
    (doc as any).autoTable({
        startY: 75,
        head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [227, 6, 19] },
        styles: { font: 'helvetica', fontSize: 9 }
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 75;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Neto: $${order.totalAmount.toLocaleString('es-AR')}`, 14, finalY + 15);
    
    const fileName = `remito-${displayId.replace('#', '')}.pdf`;
    
    // Solución directa: Descargar archivo
    try {
        toast({ title: "Preparando PDF...", description: "El remito se está descargando." });
        doc.save(fileName);
    } catch (error) {
        console.error("Fallo general al exportar PDF:", error);
        toast({ title: "Error crítico", variant: "destructive", description: "No se pudo generar el PDF." });
    }
  };
  
  const isBusiness = order.retailerAccountType === 'retailer';
  const CustomerIcon = isBusiness ? Store : User;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[2.5rem] border-none font-sans max-h-[96vh] pb-safe flex flex-col overflow-hidden">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #printable-receipt, #printable-receipt * { visibility: visible; }
            #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; height: auto; padding: 0; margin: 0; }
            @page { size: A4; margin: 0; }
          }
        `}</style>
        <div className="p-6 pb-4 border-b shrink-0 bg-slate-50/50 flex flex-col items-center relative">
          <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-3" />
          <DrawerTitle className="text-xl font-black tracking-tight text-slate-900 text-center">Remito <span className="text-primary font-black font-sans">#{order.displayId || order.id.slice(-6).toUpperCase()}</span></DrawerTitle>
          <p className="text-xs font-bold text-slate-500 mt-1">FECHA: {order.createdAt?.toDate().toLocaleDateString('es-AR') || 'N/A'}</p>
          <DrawerDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Detalle técnico de la operación comercial</DrawerDescription>
        </div>
        <div ref={printableRef} id="printable-receipt" className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {/* Redundant header removed */}
            
            <div className="grid md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-1"><CustomerIcon className="h-4 w-4" /> Cliente receptor</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-tight">{order.retailerBusinessName || order.retailerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CUIT: {order.retailerCuit || 'No especificado'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">Dirección: {order.retailerAddress || 'No especificada'}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-1"><FileText className="h-4 w-4" /> Modalidad</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-tight capitalize">{order.paymentMethod}</p>
                      {order.paymentMethod === 'transferencia' && order.transferHolder && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titular: {order.transferHolder}</p>
                      )}
                      {order.paymentMethod === 'transferencia' && order.paymentAlias && (
                        <div className="mt-2 p-3 bg-white rounded-xl border border-primary/20 flex flex-col gap-1 shadow-sm">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-primary">👉 Alias para transferencia</p>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-[11px] font-bold text-slate-900 tracking-tight uppercase truncate">{order.paymentAlias}</code>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/5 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(order.paymentAlias); toast({ title: "Alias copiado", description: "Pegalo en tu app bancaria." }); }}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                      )}
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2"><ShoppingCart className="h-4 w-4 text-primary"/> Lista de artículos</h4>
                <div className="space-y-3">
                    {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 group hover:border-primary/20 transition-all">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm font-bold text-slate-900 leading-tight truncate">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cant: {item.quantity} | Unit: ${item.priceAtPurchase.toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Subtotal</span>
                                    <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">${(item.priceAtPurchase * item.quantity).toLocaleString('es-AR')}</p>
                                </div>
                                {canEdit && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5" disabled={isUpdating}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast({ title: "Artículo aceptado", description: "Marcado visualmente." })}>
                                                <Check className="h-4 w-4 text-emerald-500" /> Aceptar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { setEditingQuantity(item.quantity.toString()); setEditingItemIndex(index); }}>
                                                <Pencil className="h-4 w-4 text-amber-500" /> Modificar cantidad
                                            </DropdownMenuItem>
                                            {order.items.length > 1 && (
                                                <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleDeleteItem(index)}>
                                                    <Trash2 className="h-4 w-4" /> Rechazar / Quitar
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
               <div className="flex flex-col items-end space-y-2">
                   <div className="flex items-baseline gap-4">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total neto:</span>
                       <span className="text-4xl font-bold tracking-tight text-primary">${order.totalAmount.toLocaleString('es-AR')}</span>
                   </div>
                   
               </div>
            </div>
            
        </div>
        <div className="p-6 pt-3 border-t shrink-0 flex items-center justify-between bg-slate-50/50 print:hidden">
            <button 
              onClick={onClose} 
              className="h-12 px-6 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all touch-manipulation select-none"
            >
              Cerrar
            </button>
            <div className="flex gap-2">
                <button 
                  onClick={handleExportPDF} 
                  className="h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all touch-manipulation select-none flex items-center gap-2"
                >
                  <FileUp className="h-4 w-4" /> Exportar PDF
                </button>
            </div>
        </div>

        <Dialog open={editingItemIndex !== null} onOpenChange={(open) => !open && setEditingItemIndex(null)}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Modificar cantidad</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Cantidad para {editingItemIndex !== null ? order.items[editingItemIndex]?.name : ''}</Label>
                        <Input 
                            type="number" 
                            min="1"
                            value={editingQuantity} 
                            onChange={(e) => setEditingQuantity(e.target.value)}
                            className="h-12 rounded-xl"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingItemIndex(null)} className="rounded-xl h-12">Cancelar</Button>
                    <Button onClick={handleUpdateQuantity} disabled={isUpdating} className="rounded-xl h-12">Guardar cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </DrawerContent>
    </Drawer>
  );
}
