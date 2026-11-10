'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Package, PlusCircle, Loader2, AlertCircle, Camera as CameraIcon, DollarSign, TrendingUp, Truck, List, Search as SearchIcon, Edit, MoreHorizontal, Eye, FileUp, FileDown, CheckCircle, Briefcase, Star, XCircle, Sparkles as SparklesIcon, QrCode, ShoppingCart, ShieldAlert, ArrowLeft, Printer, Trash2, Filter, Store, Tag, HelpCircle, User, Clock, Lock } from 'lucide-react';
import { Camera, CameraResultType } from '@capacitor/camera';

import { saveInventoryToOfflineCache, matchesBarcodeSmart, cleanBarcode, computeProductBranchStock } from '@/lib/offline-db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, setDoc, query, where, serverTimestamp, increment, writeBatch, getDocs, addDoc, Timestamp, orderBy, getDoc, deleteDoc, updateDoc, limit, runTransaction } from 'firebase/firestore';

import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { startOfDay } from 'date-fns';
import * as XLSX from 'xlsx';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { createNotification } from '@/lib/notifications';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { RoleGuard } from '@/components/role-guard';
// Unstable features removed to optimize render loop
import dynamic from 'next/dynamic';
const BarcodeScanner = dynamic(() => import('@/components/barcode-scanner').then(mod => mod.BarcodeScanner), { 
    ssr: false,
    loading: () => <div className="h-64 flex items-center justify-center bg-black/5 rounded-[2.5rem]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
});

// MOTOR DE UNIFICACIÓN DE CATEGORÍAS
const normalizeCategory = (category: string): string => {
  if (!category) return 'OTROS';
  const cat = category.toUpperCase().trim();
  
  // UNIFICACIÓN CABELLO / PERFUMERÍA
  if (cat.includes('ACONDICIONADOR') || cat.includes('SHAMPOO') || cat.includes('PELO') || cat.includes('CAPILAR') || cat.includes('CREMA CORPORAL')) {
    return 'PERFUMERÍA';
  }
  
  // UNIFICACIÓN BEBIDAS (Aguas, Jugos, Alcohol, Amargos)
  if (cat.includes('AGUA') || cat.includes('JUGO') || cat.includes('BEBIDA') || cat.includes('GASEOSA') || 
      cat.includes('VINO') || cat.includes('CERVEZA') || cat.includes('VERMOUTH') || cat.includes('RON') || 
      cat.includes('VODKA') || cat.includes('AMARGO') || cat.includes('APERITIVO') || cat.includes('ISOTÓNICA')) {
    return 'BEBIDAS';
  }
  
  // UNIFICACIÓN ALMACÉN
  if (cat.includes('HARINA') || cat.includes('FIDEO') || cat.includes('ARROZ') || cat.includes('ACEITE') || 
      cat.includes('LATA') || cat.includes('CONSERVA') || cat.includes('ALMACEN') || cat.includes('LEGUMBRE') || cat.includes('SAL')) {
    return 'ALMACÉN';
  }
  
  // UNIFICACIÓN LIMPIEZA
  if (cat.includes('LIMPIEZA') || cat.includes('LAVANDINA') || cat.includes('DETERGENTE') || cat.includes('JABON EN POLVO') || cat.includes('DESINFECTANTE')) {
    return 'LIMPIEZA';
  }

  // UNIFICACIÓN SNACKS Y DULCES Y ALFAJORES
  if (cat.includes('ALFAJOR')) {
    return 'ALFAJORES';
  }
  
  if (cat.includes('GALLET') || cat.includes('SNACK') || cat.includes('GOLOSINA') || cat.includes('CHOCOLATE')) {
    return 'SNACKS Y DULCES';
  }
  
  // UNIFICACIÓN LÁCTEOS
  if (cat.includes('LACTEO') || cat.includes('YOGUR') || cat.includes('QUESO') || cat.includes('MANTECA') || cat.includes('LECHE')) {
    return 'LÁCTEOS';
  }

  return cat;
};


const productFormSchema = z.object({
  name: z.string().min(1, "El nombre del producto es obligatorio."),
  purchasePrice: z.coerce.number().min(0, "El costo no puede ser negativo."),
  profitMargin: z.coerce.number().min(0, "La ganancia no puede ser negativa.").max(999.99, "Máximo 999.99%").optional(),
  salePrice: z.coerce.number().min(0, "El precio de venta no puede ser negativo."),
  stock: z.coerce.number().min(0, { message: "El stock no puede ser negativo." }),
  minStock: z.coerce.number().min(0).default(5).optional(),
  expirationDate: z.string().min(1, "La fecha de vencimiento es OBLIGATORIA para prevenir pérdidas."),
  branchId: z.string().optional(),
  stockUpdateMode: z.enum(['add', 'set']).default('add').optional(),
  hasVolumePromo: z.boolean().default(false).optional(),
  volumePromoQty: z.coerce.number().min(2, "La cantidad mínima para promo debe ser 2").optional().or(z.literal("").transform(() => undefined)),
  volumePromoPrice: z.coerce.number().min(0, "El precio promo no puede ser negativo").optional().or(z.literal("").transform(() => undefined)),
}).superRefine((data, ctx) => {
    if (data.salePrice > 0 && data.salePrice < data.purchasePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El precio de venta no puede ser menor al costo ($${data.purchasePrice.toLocaleString('es-AR')}).`,
        path: ["salePrice"],
      });
    }
});
type ProductFormValues = z.infer<typeof productFormSchema>;


const promoFormSchema = z.object({
  name: z.string().min(1, "El nombre de la promo es obligatorio."),
  salePrice: z.coerce.number().min(1, "El precio de venta no puede ser cero o negativo."),
  stock: z.coerce.number().min(1, { message: "El stock de combos disponibles debe ser mayor a 0." }),
  expirationDate: z.string().min(1, "La fecha de vencimiento es obligatoria para la promo."),
  bundleItems: z.array(z.object({
      id: z.string(),
      name: z.string(),
      qty: z.coerce.number().min(1)
  })).min(1, "Debe agregar al menos un producto a la promo."),
});
type PromoFormValues = z.infer<typeof promoFormSchema>;


function RetailerAccessWall() {
    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-lg mx-auto mt-8 text-center">
                <CardHeader>
                    <Briefcase className="mx-auto h-12 w-12 text-primary" />
                    <CardTitle className="font-headline text-2xl">Función Exclusiva para Negocios</CardTitle>
                    <CardDescription>Para vender y gestionar tu inventario, necesitás un perfil de negocio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Convertite en un Emprendedor para desbloquear estas herramientas y empezar a vender. Es un negocio con cero inversión en stock.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/emprendedores">Conocer el Plan Emprendedor</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

import { searchMasterProductsServer } from '@/app/actions/product-actions';

function SearchMasterProductDialog({ open, onOpenChange, onSelectProduct }: { open: boolean, onOpenChange: (open: boolean) => void, onSelectProduct: (product: any) => void }) {
    const [search, setSearch] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!search || search.trim().length < 3) {
            setResults([]);
            return;
        }
        
        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            const res = await searchMasterProductsServer(search);
            if (res.success && res.products) {
                setResults(res.products);
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    useEffect(() => {
        const root = document.getElementById('main-content-wrapper');
        if (root) {
            root.style.opacity = isScanning ? '0' : '1';
            root.style.pointerEvents = isScanning ? 'none' : 'auto';
        }
    }, [isScanning]);

    return (
        <>
        <Drawer open={open} onOpenChange={(val) => {
            if (!val) setIsScanning(false);
            onOpenChange(val);
        }}>
            <DrawerContent className={cn("bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden", isScanning ? "opacity-0 pointer-events-none" : "opacity-100")}>
                <DrawerTitle className="sr-only">Buscar Producto Maestro</DrawerTitle>
                <DrawerDescription className="sr-only">Escaneá el código o buscá por nombre.</DrawerDescription>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    <div className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg">Buscar Producto Maestro</div>
                    <div className="text-xs text-center text-slate-400 font-medium">Escaneá el código o buscá por nombre para agregarlo o editarlo.</div>
                    
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Escaneá o buscá por nombre..." 
                                className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-slate-900 font-medium" 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                        <button 
                            type="button"
                            className="rounded-2xl h-14 w-14 border border-slate-100 shadow-sm flex items-center justify-center bg-white text-slate-700 active:bg-slate-50 active:scale-95 transition-all touch-manipulation select-none shrink-0"
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(6);
                                setIsScanning(!isScanning);
                            }}
                        >
                            {isScanning ? <XCircle className="text-red-500" /> : <CameraIcon className="h-6 w-6" />}
                        </button>
                    </div>

                    <div className="w-full mt-2">
                        <div className="space-y-2">
                            {isSearching ? (
                                <div className="text-center p-8 text-slate-400 w-full">
                                    <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Buscando en Servidor...</p>
                                </div>
                            ) : results.length > 0 ? results.map(product => (
                                <div 
                                    key={product.id} 
                                    className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer active:scale-[0.99] gap-2 w-full" 
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        onSelectProduct(product);
                                    }}
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                         <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                                            {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={56} height={56} className="object-cover" /> : <Package className="h-6 w-6 text-slate-400" />}
                                         </div>
                                         <div className="min-w-0 flex-1 flex flex-col justify-center">
                                            <p className="font-bold text-[13px] tracking-tight text-slate-800 line-clamp-2 leading-snug mb-1">{product.name}</p>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="bg-slate-200/50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-full">{product.code || 'S/C'}</span>
                                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider truncate max-w-full px-1 mt-0.5">{normalizeCategory(product.category)}</span>
                                            </div>
                                         </div>
                                    </div>
                                    <div className="text-[10px] h-8 font-black text-red-600 uppercase tracking-widest px-4 flex items-center justify-center bg-slate-100 hover:bg-red-600 hover:text-white rounded-xl shrink-0 transition-colors">Elegir</div>
                                </div>
                            )) : (
                                <div className="text-center p-8 text-slate-400 w-full flex flex-col items-center">
                                    <SearchIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-wider">No se encontraron productos en el catálogo maestro</p>
                                </div>
                            )}


                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>

        {isScanning && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 pointer-events-none">
                <div className="w-full max-w-sm h-[60vh] flex flex-col items-center justify-center relative pointer-events-auto bg-transparent shadow-[0_0_0_4000px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden border-2 border-slate-700">
                    <BarcodeScanner 
                        onScanSuccess={(code: string) => {
                            const clean = cleanBarcode(code);
                            setSearch(clean);
                            setIsScanning(false);
                            toast({ title: "¡Escanéo Exitoso!", description: `Buscando: ${clean}` });
                        }} 
                        onClose={() => setIsScanning(false)}
                        continuous={true}
                        holePunchColor="rgba(0,0,0,0.95)"
                    />
                    <button 
                         type="button"
                         onClick={(e) => {
                             e.stopPropagation();
                             setIsScanning(false);
                         }}
                         className="absolute top-3 right-3 z-[10000] bg-red-600 active:bg-red-700 text-white px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xl active:scale-95 transition-all touch-manipulation"
                     >
                         <XCircle size={16} /> Cerrar
                     </button>
                </div>
            </div>
        )}
        </>
    );
}


function RetailerProductPreviewCard({ product }: { product: any }) {
    if (!product) return null;

    const purchasePrice = product.purchasePrice || 0;
    const salePrice = product.salePrice || 0;
    const stock = product.stock || 0;
    const profitability = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice) * 100 : 0;
    const profitPerUnit = salePrice - purchasePrice;

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="line-clamp-2">{product.name || 'Nombre del Producto'}</CardTitle>
                <CardDescription>Cód: {product.code || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Stock:</span>
                    <span>{stock}</span>
                </div>
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">P. Compra:</span>
                        <span className="font-semibold">${purchasePrice.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">P. Venta:</span>
                        <span className="font-semibold">${salePrice.toLocaleString('es-AR')}</span>
                    </div>
                    {product.hasVolumePromo && product.volumePromoQty && product.volumePromoPrice && (
                        <div className="flex justify-between text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 font-bold">
                            <span>x{product.volumePromoQty} o más:</span>
                            <span>${product.volumePromoPrice.toLocaleString('es-AR')} c/u</span>
                        </div>
                    )}
                    {product.isBundle && product.bundleItems?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <span className="text-xs font-black uppercase text-slate-500">Incluye:</span>
                            <ul className="text-xs mt-1 space-y-1">
                                {product.bundleItems.map((item: any) => (
                                    <li key={item.id} className="flex justify-between">
                                        <span className="truncate pr-2">{item.name}</span>
                                        <span className="font-bold">x{item.qty}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                 <Badge variant={profitability >= 0 ? 'default' : 'destructive'} className={cn("w-full justify-center text-base", profitability >= 0 && "bg-green-600 hover:bg-green-700")}>
                    Rentabilidad: {profitability === Infinity ? "N/A" : `${profitability.toFixed(1)}%`}
                    <span className="font-normal text-xs ml-2">(${profitPerUnit.toLocaleString('es-AR')} p/u)</span>
                </Badge>
            </CardFooter>
        </Card>
    );
}

function checkCanModifyPricesAndStock(role?: string, employee?: any): boolean {
    if (role === 'admin' || role === 'cashier_warehouse' || role === 'warehouse') return true;
    if (employee?.role === 'cashier_warehouse' || employee?.role === 'warehouse' || employee?.role === 'admin') return true;
    if (typeof window !== 'undefined') {
        try {
            const rawSession = localStorage.getItem('rex_employee_session');
            if (rawSession) {
                const sessionObj = JSON.parse(rawSession);
                if (sessionObj?.role === 'cashier_warehouse' || sessionObj?.role === 'warehouse' || sessionObj?.role === 'admin') {
                    return true;
                }
            }
        } catch (_) {}
    }
    return false;
}

function EditRetailerProductDialog({ 
    open, 
    onOpenChange, 
    product, 
    onSave, 
    existingProducts,
    branches,
    defaultBranchId
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    product: any | null, 
    onSave: (data: ProductFormValues) => void, 
    existingProducts: any[],
    branches?: any[],
    defaultBranchId?: string
}) {
    const { role, employee } = useRole();
    const { user } = useUser();
    const canModifyPricesAndStock = checkCanModifyPricesAndStock(role, employee);
    if (!canModifyPricesAndStock && open) {
        onOpenChange(false);
        return null;
    }

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
    });
    
    const { watch, setValue, getValues } = form;
    
    // Eliminado el useEffect watch para evitar problemas de sincronización de RHF.
    // El cálculo se hará directamente en los eventos onChange de los inputs.

    const isEditing = product && typeof product.stock !== 'undefined';
    const currentBranchId = watch('branchId');
    const stockUpdateMode = watch('stockUpdateMode') || 'add';
    const inputStockValue = Number(watch('stock') || 0);

    const getBranchStock = (branchId?: string) => {
        if (!product) return 0;
        const bId = branchId || defaultBranchId || branches?.find(b => b.isCentral)?.id || 'central';
        return Math.max(0, computeProductBranchStock(product, bId, branches));
    };

    const currentBranchStock = isEditing ? getBranchStock(currentBranchId) : 0;
    const isExplicitZero = Number(watch('stock')) === 0;
    const computedNewBranchStock = isEditing
        ? (isExplicitZero ? 0 : (stockUpdateMode === 'add' ? currentBranchStock + inputStockValue : inputStockValue))
        : inputStockValue;

    const currentBranchName = branches?.find((b: any) => b.id === (currentBranchId || defaultBranchId))?.name || 'Central';

    useEffect(() => {
        if (product) {
            const purchasePrice = product?.purchasePrice || 0;
            const salePrice = product?.salePrice || 0;
            const isNewProduct = typeof product.stock === 'undefined';
            
            const initialBranchId = defaultBranchId || branches?.find(b => b.isCentral)?.id || branches?.[0]?.id || 'central';

            let profitMargin = isNewProduct ? 30 : 0; // Default to 30% for new products
            
            if (purchasePrice > 0 && salePrice > 0) {
                profitMargin = parseFloat((((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2));
            } else if (purchasePrice > 0 && isNewProduct) {
                // Initial calculation for a new product if cost is somehow present
                const initialSalePrice = parseFloat((purchasePrice * 1.30).toFixed(2));
                form.reset({
                    name: product.name || '',
                    purchasePrice: purchasePrice || ("" as any),
                    salePrice: initialSalePrice || ("" as any),
                    stock: "" as any,
                    stockUpdateMode: 'add',
                    profitMargin: 30,
                    expirationDate: '',
                    branchId: initialBranchId,
                    hasVolumePromo: false,
                    volumePromoQty: undefined,
                    volumePromoPrice: undefined,
                });
                return;
            }

            form.reset({
                name: product.name || '',
                purchasePrice: purchasePrice || ("" as any),
                salePrice: salePrice || ("" as any),
                // Cuando editamos o ingresamos reposición, iniciamos en vacío para que cargue la cantidad a sumar
                stock: "" as any,
                stockUpdateMode: 'add',
                profitMargin: profitMargin || ("" as any),
                expirationDate: product?.expirationDate || '',
                branchId: initialBranchId,
                hasVolumePromo: product?.hasVolumePromo || false,
                volumePromoQty: product?.volumePromoQty || undefined,
                volumePromoPrice: product?.volumePromoPrice || undefined,
            });
        }
    }, [product, form, defaultBranchId, branches]);

    if (!product) return null;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                <DrawerTitle className="sr-only">{isEditing ? 'Editar Producto / Reponer Stock' : 'Agregar Producto al Inventario'}</DrawerTitle>
                <DrawerDescription className="sr-only">Formulario para configurar el costo, precio de venta, stock y vencimiento</DrawerDescription>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    <div className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg mb-1">
                        {isEditing ? 'Actualizar / Reponer Stock' : 'Nuevo Producto'}
                    </div>
                    <div className="text-xs text-center text-slate-400 font-medium mb-4">
                        {isEditing 
                            ? `Gestioná el ingreso o ajuste de stock para "${product.name}".`
                            : `Estás agregando "${product.name}" a tu inventario. Definí los precios y el stock inicial.`
                        }
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 pt-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Producto / Promo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Promo Cerveza x6" {...field} className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="purchasePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>P. de Compra ($)</FormLabel>
                                            <FormControl><Input type="number" inputMode="decimal" step="0.01" placeholder="0" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => {
                                                field.onChange(e);
                                                const newPurchase = Number(e.target.value) || 0;
                                                const currentMargin = Number(form.getValues('profitMargin')) || 0;
                                                if (newPurchase >= 0) {
                                                    const newSale = parseFloat((newPurchase * (1 + currentMargin / 100)).toFixed(2));
                                                    form.setValue('salePrice', newSale, { shouldValidate: true });
                                                }
                                            }} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="profitMargin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Margen Gcia. (%)</FormLabel>
                                            <FormControl><Input type="number" inputMode="decimal" step="any" placeholder="30" {...field} value={field.value === 0 ? '' : field.value} onChange={(e) => {
                                                field.onChange(e);
                                                const newMargin = Number(e.target.value) || 0;
                                                const currentPurchase = Number(form.getValues('purchasePrice')) || 0;
                                                if (currentPurchase >= 0) {
                                                    const newSale = parseFloat((currentPurchase * (1 + newMargin / 100)).toFixed(2));
                                                    form.setValue('salePrice', newSale, { shouldValidate: true });
                                                }
                                            }} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="salePrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>P. de Venta ($)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                inputMode="decimal" 
                                                step="0.01" 
                                                placeholder="0" 
                                                {...field} 
                                                value={field.value === 0 ? '' : field.value} 
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    const newSale = Number(e.target.value) || 0;
                                                    const currentPurchase = Number(form.getValues('purchasePrice')) || 0;
                                                    if (currentPurchase > 0 && newSale >= currentPurchase) {
                                                        const newMargin = parseFloat((((newSale - currentPurchase) / currentPurchase) * 100).toFixed(2));
                                                        form.setValue('profitMargin', newMargin, { shouldValidate: true });
                                                    } else if (newSale < currentPurchase) {
                                                        form.setValue('profitMargin', 0, { shouldValidate: true });
                                                    }
                                                }} 
                                                className="h-12 rounded-xl bg-green-50 border-green-200 text-green-700 font-bold" 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {branches && branches.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="branchId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
                                                <Store className="w-3.5 h-3.5 text-red-600" />
                                                Sucursal / Depósito de Destino
                                            </FormLabel>
                                            <FormControl>
                                                <select 
                                                    value={field.value || ''} 
                                                    onChange={field.onChange}
                                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-200"
                                                >
                                                    {branches.map((b: any) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name} {b.isCentral ? '(Central)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormDescription className="text-[10px] text-slate-400 font-medium">
                                                El stock ingresado se asignará a este depósito.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* MODO DE STOCK SI ES PRODUCTO EXISTENTE */}
                            {isEditing && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-200/60">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                Stock Total (Todas las sucursales)
                                            </span>
                                            <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                {product?.stock ?? 0} u.
                                            </span>
                                        </div>
                                        {branches && branches.length > 1 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {branches.map((b: any) => {
                                                    const bStock = getBranchStock(b.id);
                                                    const isCurrent = b.id === (currentBranchId || defaultBranchId);
                                                    return (
                                                        <span 
                                                            key={b.id} 
                                                            className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                                                isCurrent 
                                                                    ? "bg-red-50 text-red-700 border-red-200" 
                                                                    : "bg-white text-slate-500 border-slate-200"
                                                            )}
                                                        >
                                                            {b.name}: {bStock} u.
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-0.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                                            Stock en {currentBranchName}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-600">
                                            Actual: <strong className="text-slate-900 font-black">{currentBranchStock} u.</strong>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setValue('stockUpdateMode', 'add');
                                                form.setValue('stock', '' as any);
                                            }}
                                            className={cn(
                                                "py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border",
                                                stockUpdateMode === 'add'
                                                    ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-200"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            )}
                                        >
                                            <PlusCircle className="w-3.5 h-3.5" />
                                            <span>Sumar Ingreso</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setValue('stockUpdateMode', 'set');
                                                form.setValue('stock', currentBranchStock as any);
                                            }}
                                            className={cn(
                                                "py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border",
                                                stockUpdateMode === 'set'
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            )}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                            <span>Ajuste Total</span>
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium px-1">
                                        {stockUpdateMode === 'add' 
                                            ? "💡 Suma la cantidad que ingresó hoy al stock de este depósito y registra el movimiento diario."
                                            : "⚠️ Sobrescribe directamente el stock total de este depósito con el valor ingresado."}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {isEditing 
                                                    ? (stockUpdateMode === 'add' ? 'Cantidad a Sumar' : 'Nuevo Stock Total')
                                                    : 'Stock Inicial'}
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    inputMode="numeric" 
                                                    placeholder={isEditing && stockUpdateMode === 'add' ? "Ej: 10" : "0"} 
                                                    {...field} 
                                                    value={field.value === undefined ? '' : field.value} 
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-base" 
                                                />
                                            </FormControl>
                                            {isEditing && (
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    {stockUpdateMode === 'add' ? (
                                                        <>En {currentBranchName}: <strong className="text-red-600 font-bold">{computedNewBranchStock} u.</strong></>
                                                    ) : (
                                                        <>En {currentBranchName}: <strong className="text-slate-900 font-bold">{computedNewBranchStock} u.</strong></>
                                                    )}
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="minStock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Umbral Alerta</FormLabel>
                                            <FormControl><Input type="number" inputMode="numeric" {...field} value={field.value === 0 ? '' : field.value} placeholder="Ej: 5" className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="expirationDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vto. (OBLIGATORIO)</FormLabel>
                                        <FormControl><Input type="date" {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <FormField
                                    control={form.control}
                                    name="hasVolumePromo"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-black italic uppercase tracking-tight">¿Tiene promoción por cantidad?</FormLabel>
                                                <FormDescription className="text-[10px] font-bold uppercase">Ofrecé descuento llevando varias unidades</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {form.watch('hasVolumePromo') && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <FormField
                                        control={form.control}
                                        name="volumePromoQty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>A partir de (Cant.)</FormLabel>
                                                <FormControl><Input type="number" inputMode="numeric" placeholder="Ej: 3" {...field} value={field.value === undefined ? '' : field.value} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="volumePromoPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>P. Promo c/u ($)</FormLabel>
                                                <FormControl><Input type="number" inputMode="decimal" step="0.01" placeholder="Ej: 1200" {...field} value={field.value === undefined ? '' : field.value} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                <button 
                                    type="button" 
                                    className="flex-1 h-14 bg-slate-50 active:bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center border-none"
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        onOpenChange(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={form.formState.isSubmitting} 
                                    className="flex-grow flex-1 h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center shadow-lg disabled:bg-slate-200 disabled:text-slate-400 border-none"
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(8);
                                    }}
                                >
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                                    {isEditing ? 'Guardar' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function CreatePromoDialog({ open, onOpenChange, onSave, existingProducts }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (data: any) => void, existingProducts: any[] }) {
    const form = useForm<PromoFormValues>({
        resolver: zodResolver(promoFormSchema),
        defaultValues: {
            name: '',
            salePrice: undefined,
            stock: undefined,
            expirationDate: '',
            bundleItems: []
        }
    });

    const onSubmit = (data: PromoFormValues) => {
        onSave({
            ...data,
            isBundle: true,
            purchasePrice: 0, // promos don't have a direct cost, they deduct from child products
            profitMargin: 0,
            hasVolumePromo: false,
            id: `custom_promo_${Date.now()}`
        });
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                <DrawerTitle className="sr-only">Crear Promo</DrawerTitle>
                <DrawerDescription className="sr-only">Armá un combo seleccionando productos de tu inventario.</DrawerDescription>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    <div className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg mb-1">
                        Crear Combo / Promo
                    </div>
                    <div className="text-xs text-center text-slate-400 font-medium mb-4">
                        Agrupá productos y fijales un precio promocional.
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Promo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Promo Fin de Semana" {...field} className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="salePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>P. Venta Combo ($)</FormLabel>
                                            <FormControl><Input type="number" inputMode="decimal" step="0.01" placeholder="Ej: 5000" {...field} value={field.value || ''} className="h-12 rounded-xl bg-green-50 border-green-200 text-green-700 font-bold" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cant. Combos Disponibles</FormLabel>
                                            <FormControl><Input type="number" inputMode="numeric" placeholder="Ej: 10" {...field} value={field.value || ''} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="expirationDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Válido Hasta (Vto.)</FormLabel>
                                        <FormControl><Input type="date" {...field} value={field.value || ""} className="h-12 rounded-xl bg-slate-50 border-slate-200" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000]">Productos que integran el Combo:</Label>
                                <div className="space-y-2 mt-2">
                                    {(form.watch('bundleItems') || []).map((item, idx) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-bold uppercase truncate">{item.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600 active:scale-95 transition-all"
                                                    onClick={() => {
                                                        const newItems = [...(form.getValues('bundleItems') || [])];
                                                        if (newItems[idx].qty > 1) {
                                                            newItems[idx].qty -= 1;
                                                            form.setValue('bundleItems', newItems);
                                                        }
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="number" 
                                                    className="w-12 h-8 text-center bg-slate-50 border-slate-200 border rounded-lg text-xs font-black" 
                                                    value={item.qty} 
                                                    onChange={(e) => {
                                                        const newItems = [...(form.getValues('bundleItems') || [])];
                                                        newItems[idx].qty = parseInt(e.target.value) || 1;
                                                        form.setValue('bundleItems', newItems);
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600 active:scale-95 transition-all"
                                                    onClick={() => {
                                                        const newItems = [...(form.getValues('bundleItems') || [])];
                                                        newItems[idx].qty += 1;
                                                        form.setValue('bundleItems', newItems);
                                                    }}
                                                >
                                                    +
                                                </button>
                                                <button 
                                                    type="button"
                                                    className="p-2 text-slate-400 hover:text-red-600 active:scale-90 transition-all touch-manipulation select-none shrink-0"
                                                    onClick={() => {
                                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                                        form.setValue('bundleItems', (form.getValues('bundleItems') || []).filter((_, i) => i !== idx));
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="relative">
                                        <UISelect onValueChange={(val) => {
                                            const prod = existingProducts?.find((p: any) => p.id === val);
                                            if (prod) {
                                                const currentItems = form.getValues('bundleItems') || [];
                                                if (!currentItems.find(i => i.id === val)) {
                                                    form.setValue('bundleItems', [...currentItems, { id: val, name: prod.name, qty: 1 }]);
                                                }
                                            }
                                        }}>
                                            <SelectTrigger className="h-12 rounded-xl border-dashed border-2 border-slate-200">
                                                <SelectValue placeholder="Sumar producto al combo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {existingProducts?.filter((p: any) => !p.isBundle).map((p: any) => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </UISelect>
                                    </div>
                                    <FormMessage className="mt-2 text-xs" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                                <button 
                                    type="button" 
                                    className="flex-1 h-14 bg-slate-50 active:bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center border-none"
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        onOpenChange(false);
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={form.formState.isSubmitting} 
                                    className="flex-grow flex-1 h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center shadow-lg disabled:bg-slate-200 disabled:text-slate-400 border-none"
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(8);
                                    }}
                                >
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                                    Crear Promo
                                </button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function ConfirmationDialog({ open, onOpenChange, product, onConfirm, isSaving }: { open: boolean, onOpenChange: (open: boolean) => void, product: any | null, onConfirm: () => void, isSaving: boolean }) {
    if (!product) return null;
    
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] pb-safe font-sans max-h-[95vh] flex flex-col overflow-hidden">
                <DrawerTitle className="sr-only">Confirmar Datos del Producto</DrawerTitle>
                <DrawerDescription className="sr-only">Revisá que la información sea correcta antes de guardar.</DrawerDescription>
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    <div className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg">Confirmar Producto</div>
                    <p className="text-xs text-center text-slate-400 font-medium">Revisá que la información sea correcta antes de guardar.</p>
                    <div className="flex justify-center py-2 shrink-0">
                        <RetailerProductPreviewCard product={product} />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button 
                            type="button" 
                            className="flex-1 h-14 bg-slate-50 active:bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center border-none"
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(6);
                                onOpenChange(false);
                            }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            disabled={isSaving}
                            className="flex-grow flex-1 h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center shadow-lg disabled:bg-slate-200 disabled:text-slate-400 border-none"
                            onClick={() => {
                                if ('vibrate' in navigator) navigator.vibrate(8);
                                onConfirm();
                            }}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                            Confirmar
                        </button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function ProductDetailDialog({ 
    product, 
    isOpen, 
    onClose, 
    onEdit, 
    onDelete, 
    displayStock, 
    displayBranchName, 
    branches,
    getStockForBranch
}: { 
    product: any, 
    isOpen: boolean, 
    onClose: () => void, 
    onEdit: (product: any) => void, 
    onDelete: (product: any) => void, 
    displayStock?: number, 
    displayBranchName?: string, 
    branches?: any[],
    getStockForBranch?: (product: any, branchId: string) => number
}) {
    const { role, employee } = useRole();
    const { user } = useUser();
    const canModifyPricesAndStock = checkCanModifyPricesAndStock(role, employee);

    if (!product) return null;

    const purchasePrice = product.purchasePrice || 0;
    const salePrice = product.salePrice || 0;
    const stock = displayStock !== undefined ? displayStock : (product.stock || 0);
    const profitability = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice) * 100 : 0;
    const profitPerUnit = salePrice - purchasePrice;

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] pb-8 sm:pb-safe font-sans max-h-[92vh] flex flex-col overflow-hidden">
                <DrawerTitle className="sr-only">Detalles del Producto</DrawerTitle>
                <DrawerDescription className="sr-only">Detalles del producto e información de stock y rentabilidad</DrawerDescription>
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 pb-8 space-y-3.5">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-center font-black text-slate-800 uppercase italic tracking-widest text-lg line-clamp-2">{product.name}</div>
                    </div>
                    <div className="text-xs text-center text-slate-400 font-medium mb-2">Cód: {product.code || 'N/A'}</div>

                    <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock {displayBranchName ? `(${displayBranchName})` : 'Total'}</p>
                            <p className="text-xl font-black text-slate-900">{stock} <span className="text-xs font-bold text-slate-500">u.</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoría</p>
                            <p className="text-sm font-black text-slate-900 truncate mt-0.5">{normalizeCategory(product.category)}</p>
                        </div>
                    </div>

                    {/* Botones de Stock por Sucursal: Rojo Sólido propio de la App y Letras Blancas */}
                    {branches && branches.length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                            <div className="flex items-center justify-between px-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Store className="w-3 h-3 text-red-600" /> Stock por Sucursal
                                </span>
                                <span className="text-[10px] font-black text-slate-600 font-mono">
                                    Total: {product.stock || 0} u.
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {branches.map((b: any) => {
                                    const bStock = getStockForBranch ? getStockForBranch(product, b.id) : (product.stockByBranch?.[b.id] ?? 0);
                                    return (
                                        <div 
                                            key={b.id} 
                                            className="p-3.5 rounded-2xl bg-red-600 text-white shadow-md flex flex-col justify-between gap-1 select-none border border-red-700"
                                        >
                                            <div className="flex items-center justify-between text-white">
                                                <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 truncate">
                                                    <Store className="w-3.5 h-3.5 text-white shrink-0" />
                                                    <span className="truncate">{b.name}</span>
                                                </span>
                                                {b.isCentral && (
                                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-white/20 text-white shrink-0">
                                                        Central
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-2xl font-black font-mono text-white leading-none">
                                                    {bStock}
                                                </span>
                                                <span className="text-[11px] font-bold text-white/90">unidades</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {(role === 'admin' || canModifyPricesAndStock) && (
                        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-slate-50/50">
                            <CardContent className="p-3.5 space-y-2">
                                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-semibold">P. Compra:</span> <span className="font-bold text-sm text-slate-800">${purchasePrice.toLocaleString('es-AR')}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-semibold">P. Venta:</span> <span className="font-bold text-sm text-slate-800">${salePrice.toLocaleString('es-AR')}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-semibold">Ganancia p/u:</span> <span className="font-bold text-sm text-red-600">${profitPerUnit.toLocaleString('es-AR')}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-semibold">Rentabilidad:</span> <Badge variant={profitability >= 0 ? 'default' : 'destructive'} className={cn(profitability >= 0 && "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs")}>{profitability === Infinity ? 'N/A' : `${profitability.toFixed(1)}%`}</Badge></div>
                            </CardContent>
                        </Card>
                    )}

                    {role === 'admin' ? (
                        <div className="flex flex-col gap-2 pt-4 pb-10 border-t border-slate-100 mt-4">
                            <div className="flex gap-3">
                <button 
                    type="button" 
                    className="w-14 h-14 text-slate-400 hover:text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 hover:border-red-200 transition-colors active:scale-[0.98]"
                    title="Eliminar producto"
                    onClick={() => {
                        if ('vibrate' in navigator) navigator.vibrate(6);
                        onClose();
                        onDelete(product);
                    }}
                >
                    <AlertCircle className="h-5 w-5" />
                </button>
                                <button 
                                    type="button" 
                                    className="flex-grow h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center gap-2 shadow-lg border-none"
                                    onClick={() => {
                                        if ('vibrate' in navigator) navigator.vibrate(6);
                                        onClose();
                                        onEdit(product);
                                    }}
                                >
                                    <Edit className="h-4 w-4 shrink-0" /> Corregir Stock
                                </button>
                            </div>
                            <button 
                                type="button" 
                                className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center transition-colors"
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : canModifyPricesAndStock ? (
                        <div className="flex flex-col gap-2 pt-4 pb-10 border-t border-slate-100 mt-4">
                            <button 
                                type="button" 
                                className="w-full h-14 bg-slate-900 active:bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center gap-2 shadow-lg border-none"
                                onClick={() => {
                                    if ('vibrate' in navigator) navigator.vibrate(6);
                                    onClose();
                                    onEdit(product);
                                }}
                            >
                                <Edit className="h-4 w-4 shrink-0" /> Corregir Precios y Stock
                            </button>
                            <button 
                                type="button" 
                                className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:bg-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center transition-colors"
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 pt-4 pb-10 border-t border-slate-100 mt-4">
                            <button 
                                type="button" 
                                className="w-full h-11 bg-slate-100 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center"
                                onClick={onClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default function StockPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreatePromoOpen, setIsCreatePromoOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productToConfirm, setProductToConfirm] = useState<any | null>(null);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { role, employee, effectiveRetailerId } = useRole();
  const targetRetailerId = effectiveRetailerId || user?.uid;
  const [isClient, setIsClient] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Multi-branch state & query
  const branchesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'retailer_branches'), where('retailerId', '==', targetRetailerId));
  }, [firestore, user]);
  const { data: branches } = useCollection(branchesQuery);

  // Active shift query (scoped to cashier / admin)
  const activeShiftQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const targetEmployeeId = role === 'admin' ? 'admin' : (employee?.id || null);
    if (!targetEmployeeId && role !== 'admin') return null;

    return query(
      collection(firestore, 'retailer_shifts'),
      where('retailerId', '==', targetRetailerId || ""),
      where('status', '==', 'open'),
      where('employeeId', '==', targetEmployeeId),
      limit(1)
    );
  }, [firestore, user, role, employee?.id, targetRetailerId]);
  const { data: activeShiftData } = useCollection<any>(activeShiftQuery);
  const currentShift = activeShiftData && activeShiftData.length > 0 ? activeShiftData[0] : null;
  const canModifyPricesAndStock = checkCanModifyPricesAndStock(role, employee);

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  // Si el vendedor tiene un turno de caja abierto, fijar automáticamente su sucursal de trabajo
  useEffect(() => {
    if (currentShift?.branchId) {
      setSelectedBranchFilter(currentShift.branchId);
    }
  }, [currentShift?.branchId]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferOriginBranchId, setTransferOriginBranchId] = useState('');
  const [transferDestBranchId, setTransferDestBranchId] = useState('');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('1');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const getStockForBranch = useCallback((product: any, branchId: string) => {
    if (!product || !branchId) return 0;
    return Math.max(0, computeProductBranchStock(product, branchId, branches));
  }, [branches]);

  const handleExecuteTransfer = async () => {
    if (!firestore || !user) return;
    if (!canModifyPricesAndStock) {
      return toast({ title: "Acceso denegado 🔒", description: "Solo personal autorizado puede transferir stock.", variant: "destructive" });
    }
    if (!transferOriginBranchId || !transferDestBranchId) {
      return toast({ title: "Sucursales requeridas", description: "Selecciona origen y destino.", variant: "destructive" });
    }
    if (transferOriginBranchId === transferDestBranchId) {
      return toast({ title: "Misma sucursal", description: "La sucursal de origen y destino deben ser distintas.", variant: "destructive" });
    }
    if (!transferProductId) {
      return toast({ title: "Producto requerido", description: "Selecciona un producto para transferir.", variant: "destructive" });
    }
    const qty = parseInt(transferQuantity);
    if (isNaN(qty) || qty <= 0) {
      return toast({ title: "Cantidad inválida", description: "Ingresa una cantidad mayor a 0.", variant: "destructive" });
    }

    const product = products?.find((p: any) => p.id === transferProductId);
    if (!product) return;

    const currentOriginStock = getStockForBranch(product, transferOriginBranchId);
    if (qty > currentOriginStock) {
      return toast({ title: "Stock insuficiente", description: `La sucursal origen solo tiene ${currentOriginStock} unidades disponibles.`, variant: "destructive" });
    }

    setIsSubmittingTransfer(true);
    try {
      const originBranchName = branches?.find((b: any) => b.id === transferOriginBranchId)?.name || 'Central';
      const destBranchName = branches?.find((b: any) => b.id === transferDestBranchId)?.name || 'Sucursal';
      const prodRef = doc(firestore, 'retailer_inventory', product.id);

      await runTransaction(firestore, async (transaction) => {
        const liveSnap = await transaction.get(prodRef);
        if (!liveSnap.exists()) {
          throw new Error('El producto ya no existe en la base de datos.');
        }
        const liveProduct: any = { id: liveSnap.id, ...liveSnap.data() };
        const liveOriginStock = Math.max(0, computeProductBranchStock(liveProduct, transferOriginBranchId, branches));
        if (qty > liveOriginStock) {
          throw new Error(`La sucursal origen solo tiene ${liveOriginStock} unidades disponibles.`);
        }
        const liveDestStock = Math.max(0, computeProductBranchStock(liveProduct, transferDestBranchId, branches));

        const currentStockByBranch = liveProduct.stockByBranch || {};
        const centralBranch = branches?.find((b: any) => b.isCentral);
        const centralId = centralBranch ? centralBranch.id : 'central';

        const updatedStockByBranch: Record<string, number> = {
          ...currentStockByBranch,
          [centralId]: currentStockByBranch[centralId] !== undefined
            ? Math.max(0, Number(currentStockByBranch[centralId]))
            : Math.max(0, Number(liveProduct.stock ?? 0))
        };

        updatedStockByBranch[transferOriginBranchId] = Math.max(0, liveOriginStock - qty);
        updatedStockByBranch[transferDestBranchId] = Math.max(0, liveDestStock + qty);
        Object.keys(updatedStockByBranch).forEach(k => {
          updatedStockByBranch[k] = Math.max(0, Number(updatedStockByBranch[k]) || 0);
        });
        const recomputedTotalStock = Object.values(updatedStockByBranch).reduce((acc, v) => acc + Math.max(0, Number(v) || 0), 0);

        transaction.update(prodRef, {
          stock: recomputedTotalStock,
          stockByBranch: updatedStockByBranch,
          updatedAt: serverTimestamp()
        });
      });

      await addDoc(collection(firestore, 'retailer_stock_transfers'), {
        retailerId: targetRetailerId,
        productId: product.id,
        productName: product.name,
        originBranchId: transferOriginBranchId,
        originBranchName,
        destBranchId: transferDestBranchId,
        destBranchName,
        quantity: qty,
        transferredBy: employee?.name || user.email || 'Admin',
        transferredAt: new Date().toISOString()
      });

      await logInventoryAction(
        product.id,
        product.name,
        'Traspaso Sucursal',
        `Se movieron ${qty} unidades de ${originBranchName} a ${destBranchName}`
      );

      toast({ title: "Traspaso Exitoso 📦", description: `Se movieron ${qty} unidades de ${product.name} a ${destBranchName}.` });
      setIsTransferModalOpen(false);
      setTransferProductId('');
      setTransferQuantity('1');
    } catch (e: any) {
      toast({ title: "Error en traspaso", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  useEffect(() => {
      setIsClient(true);
      const checkMobile = () => setIsMobileView(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);

      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCargaPorFoto = async () => {
    try {
        const image = await Camera.getPhoto({
            quality: 70,
            allowEditing: false,
            resultType: CameraResultType.Base64
        });
        
        if (!image.base64String) return;
        setIsUploadingPhoto(true);

        const response = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: image.base64String })
        });
        
        const result = await response.json();
        if (result.success && result.data) {
             const data = result.data;
             const parsedPrice = Number(data.precio) || 0;
             setSelectedMasterProduct({
                 name: data.nombre || 'Producto Escaneado',
                 salePrice: parsedPrice,
                 purchasePrice: parsedPrice ? parsedPrice * 0.7 : 0,
                 category: data.categoria || 'Sin Categoría',
                 stock: Number(data.cantidad) || 1,
                 code: `SCAN-${Date.now()}`
             });
             setIsEditOpen(true);
             toast({ title: "Datos extraídos con éxito" });
        } else {
            toast({ title: "No se pudo extraer", variant: "destructive" });
        }
    } catch (e: any) {
        console.error("Camera/Vision error", e);
        // Only toast if it's not a user cancellation
        if (e.message !== 'User cancelled photos app') {
            toast({ title: "Error al capturar", description: e.message, variant: "destructive" });
        }
    } finally {
        setIsUploadingPhoto(false);
    }
  };

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isLoadingUserData } = useDoc(userDocRef);

  const retailerProductsQuery = useMemoFirebase(() => {
    const isMasterOwner = user?.uid?.startsWith('HvnrCjJj');
    if (!firestore || !user) return null;
    // Permitir el acceso si es retailer, master owner, o si es un empleado/colaborador vinculado
    const isAllowedAccount = userData?.accountType === 'retailer' || isMasterOwner || !!effectiveRetailerId;
    if (!isAllowedAccount) return null;
    return query(collection(firestore, 'retailer_inventory'), where('retailerId', '==', targetRetailerId));
  }, [firestore, user, userData, effectiveRetailerId, targetRetailerId]);
  const { data: products, isLoading: isLoadingProducts } = useCollection(retailerProductsQuery);

  // Sync inventory to local IndexedDB for 48h Offline Resilience + Auto-saneamiento de stocks negativos por sucursal
  const sanitizedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (products && products.length > 0) {
        saveInventoryToOfflineCache(products);
        if (firestore) {
            products.forEach((p: any) => {
                if (!p?.id || sanitizedIdsRef.current.has(p.id)) return;
                if (p.stockByBranch && typeof p.stockByBranch === 'object') {
                    const hasNeg = Object.values(p.stockByBranch).some((val: any) => Number(val) < 0);
                    if (hasNeg) {
                        sanitizedIdsRef.current.add(p.id);
                        const cleaned: Record<string, number> = {};
                        Object.entries(p.stockByBranch).forEach(([k, val]) => {
                            cleaned[k] = Math.max(0, Number(val) || 0);
                        });
                        const newTotal = Object.values(cleaned).reduce((a, b) => a + b, 0);
                        updateDoc(doc(firestore, 'retailer_inventory', p.id), {
                            stockByBranch: cleaned,
                            stock: newTotal
                        }).catch(() => {});
                    }
                }
            });
        }
    }
  }, [products, selectedBranchFilter, getStockForBranch, firestore]);



  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "retailer_daily_operations"),
      where("retailerId", "==", targetRetailerId),
      where("createdAt", ">=", Timestamp.fromDate(todayStart))
    );
  }, [firestore, user, todayStart, targetRetailerId]);
  const { data: todaySales, isLoading: isLoadingSales } = useCollection(salesQuery);

  const ordersQuery = useMemoFirebase(() => {
    // orders_wholesaler tiene reglas de seguridad restringidas al UID dueño (retailerId == request.auth.uid).
    // Si el usuario actual es un empleado/colaborador (user.uid !== targetRetailerId), Firestore deniega la consulta y bloquea la pantalla con error.
    if (!firestore || !user || !targetRetailerId) return null;
    if (user.uid !== targetRetailerId) return null;
    return query(
        collection(firestore, "orders_wholesaler"),
        where("retailerId", "==", targetRetailerId),
        where("status", "==", "reception_confirmed"),
        where("deliveryConfirmedAt", ">=", Timestamp.fromDate(todayStart))
    );
  }, [firestore, user, todayStart, targetRetailerId]);
  const { data: todayOrders, isLoading: isLoadingOrders } = useCollection(ordersQuery);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'retailer_inventory_logs'),
        where('retailerId', '==', targetRetailerId),
        where('timestamp', '>=', Timestamp.fromDate(todayStart))
    );
  }, [firestore, user, todayStart, targetRetailerId]);
  const { data: todayLogs } = useCollection(logsQuery);

  const logInventoryAction = async (productId: string, productName: string, action: string, details: string, quantity?: number, branchId?: string) => {
    if (!firestore || !user) return;
    await addDoc(collection(firestore, 'retailer_inventory_logs'), {
        retailerId: targetRetailerId,
        productId,
        productName: productName || 'Producto Desconocido',
        action,
        details,
        quantity: quantity !== undefined ? Number(quantity) : null,
        branchId: branchId || null,
        userEmail: user.email || user.phoneNumber || 'Sin registro',
        timestamp: serverTimestamp()
    });
  };

  const handleOpenEditDialog = (product: any) => {
    if (!canModifyPricesAndStock) {
      toast({
        title: "Acceso denegado 🔒",
        description: "Solo el administrador o personal autorizado con función de almacén puede modificar precios y stock.",
        variant: "destructive"
      });
      return;
    }
    setViewingProduct(null); // Close detail view if open
    setEditingProduct(product);
    setIsEditOpen(true);
  };

  const handlePrepareConfirmation = (values: ProductFormValues) => {
    const productToSave = editingProduct || selectedMasterProduct;
    const finalData = {
        ...productToSave,
        ...values,
        _isEditingMode: !!editingProduct,
        _editingOriginalId: editingProduct?.id,
        _previousStock: editingProduct ? (editingProduct.stock ?? 0) : undefined,
        _stockUpdateMode: values.stockUpdateMode || 'add'
    };
    setProductToConfirm(finalData);
    setIsEditOpen(false);
    setEditingProduct(null);
    setSelectedMasterProduct(null);
  };
  
  const handleSaveProduct = async () => {
    if (!firestore || !user || !productToConfirm) return;
    if (!canModifyPricesAndStock) {
      toast({
        title: "Acceso denegado 🔒",
        description: "Solo el administrador o personal autorizado puede modificar productos.",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
  
    try {
        const isEditing = !!productToConfirm._isEditingMode;
        const editingOriginalId = productToConfirm._editingOriginalId;
        const previousStock = productToConfirm._previousStock;
        const stockMode = productToConfirm._stockUpdateMode || 'add';

        const finalData = { ...productToConfirm };
        
        // Remove internal confirmation flags
        delete finalData._isEditingMode;
        delete finalData._editingOriginalId;
        delete finalData._previousStock;
        delete finalData._stockUpdateMode;
        delete finalData.stockUpdateMode;

        // Remove inherited timestamps from master products
        delete finalData.createdAt;
        delete finalData.updatedAt;
        
        // Firestore STRICTLY forbids 'undefined' values. We must remove them.
        Object.keys(finalData).forEach(key => {
            if (finalData[key] === undefined) {
                delete finalData[key];
            }
        });
        
        finalData.businessName = userData?.businessName || 'Comercio Local';
        
        if (isEditing && editingOriginalId) {
            const targetBranchId = finalData.branchId;
            const inputQty = Number(finalData.stock || 0);
            const isExplicitZeroStock = finalData.stock === 0 || finalData.stock === '0';
            const effectiveStockMode = isExplicitZeroStock ? 'set' : stockMode;
            let totalStock = 0;
            let addedQty = 0;
            const prodRef = doc(firestore, 'retailer_inventory', editingOriginalId);

            // Transacción atómica de Firestore para no pisar ventas concurrentes de las cajeras
            await runTransaction(firestore, async (transaction) => {
                const liveSnap = await transaction.get(prodRef);
                const existingDoc: any = liveSnap.exists()
                    ? { id: liveSnap.id, ...liveSnap.data() }
                    : (products?.find((p: any) => p.id === editingOriginalId) || {});
                const updatedStockByBranch = { ...(existingDoc?.stockByBranch || {}) };

                if (targetBranchId && branches && branches.length > 0) {
                    const centralBranch = branches.find((b: any) => b.isCentral);
                    const centralId = centralBranch ? centralBranch.id : 'central';
                    if (Object.keys(updatedStockByBranch).length === 0 && updatedStockByBranch[centralId] === undefined) {
                        updatedStockByBranch[centralId] = Math.max(0, Number(existingDoc?.stock ?? 0));
                    }
                    const currentBranchStock = Math.max(0, computeProductBranchStock(existingDoc, targetBranchId, branches));
                    if (effectiveStockMode === 'add') {
                        updatedStockByBranch[targetBranchId] = Math.max(0, currentBranchStock + inputQty);
                        addedQty = inputQty;
                    } else {
                        updatedStockByBranch[targetBranchId] = Math.max(0, inputQty);
                        addedQty = inputQty - currentBranchStock;
                    }
                    // Saneamiento preventivo: ninguna sucursal puede quedar con stock negativo
                    Object.keys(updatedStockByBranch).forEach(k => {
                        updatedStockByBranch[k] = Math.max(0, Number(updatedStockByBranch[k]) || 0);
                    });
                    totalStock = Object.values(updatedStockByBranch).reduce((acc: number, val: any) => acc + Math.max(0, Number(val) || 0), 0);
                    finalData.stockByBranch = updatedStockByBranch;
                    finalData.stock = totalStock;
                } else {
                    const currentDocStock = Math.max(0, Number(existingDoc?.stock || 0));
                    if (effectiveStockMode === 'add') {
                        totalStock = Math.max(0, currentDocStock + inputQty);
                        addedQty = inputQty;
                    } else {
                        totalStock = Math.max(0, inputQty);
                        addedQty = inputQty - currentDocStock;
                    }
                    finalData.stock = totalStock;
                }

                transaction.update(prodRef, {
                    ...JSON.parse(JSON.stringify(finalData)),
                    updatedAt: serverTimestamp()
                });
            });

            // Registrar movimiento en logs
            const isIncoming = addedQty > 0;
            const logAction = isIncoming ? 'EDIT_MERGE' : 'EDIT';
            const logDetails = isIncoming 
              ? `Stock sumado en ${addedQty} u. Total: ${totalStock}. Precio: ${finalData.salePrice}.`
              : `Stock ajustado a ${totalStock}. Precio: ${finalData.salePrice}.`;

            await logInventoryAction(
              editingOriginalId, 
              finalData.name, 
              logAction, 
              logDetails, 
              isIncoming ? addedQty : undefined, 
              targetBranchId
            );

            toast({ 
              title: isIncoming ? "¡Stock ingresado correctamente! 📦" : "Producto Actualizado 📦",
              description: isIncoming ? `Se sumaron +${addedQty} u. al stock existente.` : undefined
            });
        } else {
            const existingId = finalData.productId || finalData.id;
            const existingInMemory = products?.find((p: any) => 
                p.productId === existingId || 
                p.id === existingId || 
                (p.code && finalData.code && p.code.toString() === finalData.code.toString()) ||
                (p.barcode && finalData.barcode && p.barcode.toString() === finalData.barcode.toString())
            );
            
            const targetBranchId = finalData.branchId;
            const inputStock = Math.max(0, Number(finalData.stock || 0));

            if (existingInMemory) {
                const prodRef = doc(firestore, 'retailer_inventory', existingInMemory.id);
                let nuevoStock = inputStock;

                await runTransaction(firestore, async (transaction) => {
                    const liveSnap = await transaction.get(prodRef);
                    const existing: any = liveSnap.exists() ? { id: liveSnap.id, ...liveSnap.data() } : existingInMemory;
                    const updatedStockByBranch = { ...(existing.stockByBranch || {}) };

                    if (targetBranchId && branches && branches.length > 0) {
                        const centralBranch = branches.find((b: any) => b.isCentral);
                        const centralId = centralBranch ? centralBranch.id : 'central';
                        if (Object.keys(updatedStockByBranch).length === 0 && updatedStockByBranch[centralId] === undefined) {
                            updatedStockByBranch[centralId] = Math.max(0, Number(existing.stock ?? 0));
                        }
                        const currentBranchStock = Math.max(0, computeProductBranchStock(existing, targetBranchId, branches));
                        updatedStockByBranch[targetBranchId] = currentBranchStock + inputStock;
                        Object.keys(updatedStockByBranch).forEach(k => {
                            updatedStockByBranch[k] = Math.max(0, Number(updatedStockByBranch[k]) || 0);
                        });
                        nuevoStock = Object.values(updatedStockByBranch).reduce((acc: number, val: any) => acc + Math.max(0, Number(val) || 0), 0);
                        finalData.stockByBranch = updatedStockByBranch;
                    } else {
                        nuevoStock = Math.max(0, Number(existing.stock) || 0) + inputStock;
                    }

                    transaction.update(prodRef, {
                        ...JSON.parse(JSON.stringify(finalData)),
                        id: existing.id,
                        stock: nuevoStock,
                        updatedAt: serverTimestamp()
                    });
                });
                await logInventoryAction(existingInMemory.id, finalData.name, 'EDIT_MERGE', `Stock sumado en ${inputStock} u. Total: ${nuevoStock}. Precio: ${finalData.salePrice}.`, inputStock, targetBranchId);
                toast({ title: "Producto Existente Actualizado 🔄" });
            } else {
                let stockByBranch: Record<string, number> = {};
                if (targetBranchId && branches && branches.length > 0) {
                    stockByBranch[targetBranchId] = inputStock;
                    finalData.stockByBranch = stockByBranch;
                }
                const newRef = doc(collection(firestore, 'retailer_inventory'));
                await setDoc(newRef, {
                    ...JSON.parse(JSON.stringify(finalData)),
                    id: newRef.id,
                    retailerId: targetRetailerId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                await logInventoryAction(newRef.id, finalData.name, 'CREATE', `Carga inicial: ${finalData.stock} unidades. Precio: ${finalData.salePrice}.`, inputStock, targetBranchId);
                toast({ title: "Producto Agregado ✅" });
            }
        }
    } catch (error) {
        console.error("Error saving product to retailer:", error);
        toast({ title: "Error", description: "No se pudo guardar el producto.", variant: "destructive" });
    } finally {
        setIsSaving(false);
        setProductToConfirm(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (role !== 'admin') {
      toast({
        title: "Acceso no permitido 🔒",
        description: "Solo el administrador o dueño puede eliminar productos del inventario.",
        variant: "destructive"
      });
      return;
    }
    if (!firestore || !user || !productToDelete) return;
    setIsDeleting(true);

    try {
        await deleteDoc(doc(firestore, 'retailer_inventory', productToDelete.id));
        await logInventoryAction(productToDelete.id, productToDelete.name, 'DELETE', 'Eliminación del inventario.');
        toast({ title: "Producto Borrado 🗑️" });
        setProductToDelete(null);
    } catch (error) {
        console.error("Error deleting product:", error);
        toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setProductToDelete(null);
    }
  };

  const handleCleanDuplicates = async () => {
    if (role !== 'admin') {
      toast({
        title: "Acceso no permitido 🔒",
        description: "Solo el administrador o dueño puede optimizar el inventario.",
        variant: "destructive"
      });
      return;
    }
    if (!firestore || !user || !products) return;
    setIsSaving(true);
    try {
        const productMap = new Map();
        const batch = writeBatch(firestore);
        let mergedCount = 0;
        const centralBranch = branches?.find((b: any) => b.isCentral);
        const centralId = centralBranch ? centralBranch.id : 'central';
        const invalidKeys = new Set(['N/A', 'SIN SKU', 'MANUAL', 'NULL', 'UNDEFINED', '']);

        for (const p of products) {
            const rawKey = String(p.code || p.barcode || p.productId || '').trim().toUpperCase();
            if (!rawKey || invalidKeys.has(rawKey)) continue;

            if (productMap.has(rawKey)) {
                // Duplicate found — fusionar tanto stock total como stockByBranch por sucursal
                const existing = productMap.get(rawKey);
                const mergedStockByBranch: Record<string, number> = { ...(existing.stockByBranch || {}) };
                if (Object.keys(mergedStockByBranch).length === 0) {
                    mergedStockByBranch[existing.branchId || centralId] = Math.max(0, Number(existing.stock) || 0);
                }

                const dupStockByBranch = p.stockByBranch && typeof p.stockByBranch === 'object' ? p.stockByBranch : {};
                if (Object.keys(dupStockByBranch).length > 0) {
                    Object.entries(dupStockByBranch).forEach(([bId, val]) => {
                        mergedStockByBranch[bId] = Math.max(0, (Number(mergedStockByBranch[bId]) || 0) + Math.max(0, Number(val) || 0));
                    });
                } else {
                    const targetBId = p.branchId || centralId;
                    mergedStockByBranch[targetBId] = Math.max(0, (Number(mergedStockByBranch[targetBId]) || 0) + Math.max(0, Number(p.stock) || 0));
                }

                const newStock = Object.values(mergedStockByBranch).reduce((acc, v) => acc + Math.max(0, Number(v) || 0), 0);
                const latestPrice = Math.max(Number(existing.salePrice) || 0, Number(p.salePrice) || 0);

                // Update existing
                batch.update(doc(firestore, 'retailer_inventory', existing.id), {
                    stock: newStock,
                    stockByBranch: mergedStockByBranch,
                    salePrice: latestPrice,
                    updatedAt: serverTimestamp()
                });

                // Delete duplicate
                batch.delete(doc(firestore, 'retailer_inventory', p.id));
                mergedCount++;

                // Update the map to have the new stock value for further merges
                productMap.set(rawKey, { ...existing, stock: newStock, stockByBranch: mergedStockByBranch, salePrice: latestPrice });
            } else {
                productMap.set(rawKey, p);
            }
        }

        if (mergedCount > 0) {
            await batch.commit();
            toast({ title: "Inventario Optimizado ✨", description: `Se fusionaron ${mergedCount} productos duplicados exitosamente.`});
        } else {
            toast({ title: "Inventario Limpio ✅", description: "No se encontraron productos duplicados en tu stock." });
        }
    } catch (error) {
        console.error("Error cleaning duplicates:", error);
        toast({ title: "Error", description: "Ocurrió un problema al optimizar el inventario.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (role !== 'admin') {
      toast({
        title: "Acceso no permitido 🔒",
        description: "Solo el administrador o dueño puede eliminar productos.",
        variant: "destructive"
      });
      return;
    }
    if (!firestore || !user || selectedProductIds.length === 0) return;
    setIsDeleting(true);

    try {
        const batch = writeBatch(firestore);
        selectedProductIds.forEach(id => {
            batch.delete(doc(firestore, 'retailer_inventory', id));
        });
        await batch.commit();
        
        toast({ title: 'Borrado Masivo Exitoso', description: `Se eliminaron ${selectedProductIds.length} productos de tu inventario.`});
        setSelectedProductIds([]);
    } catch (error) {
        console.error("Error in bulk delete:", error);
        toast({ title: "Error", description: "No se pudieron eliminar los productos seleccionados.", variant: "destructive" });
    } finally {
        setIsDeleting(false);
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedProductIds.length === filteredProducts.length) {
        setSelectedProductIds([]);
    } else {
        setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const categories = useMemo(() => {
    if (!products) return ['ALL'];
    const cats = new Set(products.map(p => normalizeCategory(p.category)));
    return ['ALL', ...Array.from(cats).sort()];
  }, [products]);
  
  
const getProductTimestamp = (product: any) => {
  const c = product.updatedAt || product.createdAt;
  if (!c) return 0;
  if (typeof c === 'number') return c;
  if (c.seconds) return c.seconds * 1000;
  if (c.toDate && typeof c.toDate === 'function') return c.toDate().getTime();
  const parsed = new Date(c).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const getDateLabel = (product: any) => {
  const ts = getProductTimestamp(product);
  if (!ts) return 'ACTUALIZACIONES ANTERIORES';
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `MODIFICADOS HOY (${format(d, 'dd/MM/yyyy')})`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `MODIFICADOS AYER (${format(d, 'dd/MM/yyyy')})`;
  }
  return `MODIFICADOS EL ${format(d, 'dd/MM/yyyy')}`;
};

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredProducts = useMemo(() => {
      if (!products) return [];
      let result = products;
      
      if (selectedCategory !== 'ALL') {
          result = result.filter(p => normalizeCategory(p.category) === selectedCategory);
      }

      // Filtrar por Sucursal si se seleccionó una específica
      if (selectedBranchFilter !== 'ALL') {
          const centralBranch = branches?.find((b: any) => b.isCentral);
          const centralId = centralBranch ? centralBranch.id : 'central';
          const isFilterCentral = selectedBranchFilter === 'central' || selectedBranchFilter === centralId;

          result = result.filter(p => {
              const branchStock = getStockForBranch(p, selectedBranchFilter);
              if (branchStock > 0) return true;

              if (p.stockByBranch && typeof p.stockByBranch === 'object') {
                  if (isFilterCentral) {
                      return p.stockByBranch[centralId] !== undefined || p.stockByBranch['central'] !== undefined;
                  }
                  return p.stockByBranch[selectedBranchFilter] !== undefined;
              }

              if (p.branchId) {
                  if (isFilterCentral) {
                      return p.branchId === 'central' || p.branchId === centralId;
                  }
                  return p.branchId === selectedBranchFilter;
              }

              return isFilterCentral;
          });
      }
      
      if (deferredSearchQuery) {
          const lowercasedQuery = deferredSearchQuery.toLowerCase().trim();
          result = result.filter(p => {
              if (matchesBarcodeSmart(p, deferredSearchQuery)) return true;
              const name = (p.name || '').toLowerCase();
              return name.includes(lowercasedQuery);
          });
      }

      // Sort newest created products first
      return result.sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a));
  }, [products, deferredSearchQuery, selectedCategory, selectedBranchFilter, getStockForBranch, branches]);

  const getProductBranches = useCallback((product: any) => {
    if (!product) return [];
    const centralBranch = branches?.find((b: any) => b.isCentral);
    const centralId = centralBranch ? centralBranch.id : 'central';
    const centralName = centralBranch?.name || 'Casa Central';

    if (selectedBranchFilter !== 'ALL') {
      const branchObj = branches?.find((b: any) => b.id === selectedBranchFilter || (selectedBranchFilter === 'central' && b.isCentral));
      const name = branchObj?.name || (selectedBranchFilter === 'central' ? 'Casa Central' : 'Sucursal');
      const bStock = getStockForBranch(product, selectedBranchFilter);
      return [{ id: selectedBranchFilter, name, stock: bStock, isCentral: branchObj?.isCentral ?? (selectedBranchFilter === 'central') }];
    }

    if (branches && branches.length > 0) {
      return [...branches].map((b: any) => {
        const bStock = getStockForBranch(product, b.id);
        return {
          id: b.id,
          name: b.name,
          stock: bStock,
          isCentral: !!b.isCentral
        };
      }).sort((a, b) => (b.isCentral ? 1 : 0) - (a.isCentral ? 1 : 0));
    }

    return [{ id: centralId, name: centralName, stock: Number(product.stock) || 0, isCentral: true }];
  }, [branches, selectedBranchFilter, getStockForBranch]);

  // Paginación eficiente para ultra rendimiento en móviles
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    setDisplayLimit(50);
  }, [deferredSearchQuery, selectedCategory, selectedBranchFilter]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  
  const productsToPrint = useMemo(() => {
    if (selectedProductIds.length > 0) {
      return (products || []).filter((p: any) => selectedProductIds.includes(p.id));
    }
    return (filteredProducts || []).slice(0, 30);
  }, [selectedProductIds, products, filteredProducts]);


  const dailyMovements = useMemo(() => {
    const incomeMap = new Map<string, { name: string; quantity: number; branchId?: string; branchName?: string }>();
    const centralBranch = branches?.find((b: any) => b.isCentral);
    const centralId = centralBranch ? centralBranch.id : 'central';

    const getBranchName = (bId?: string) => {
      if (!bId || bId === 'central' || bId === centralId) {
        return centralBranch?.name || 'Central';
      }
      return branches?.find((b: any) => b.id === bId)?.name || 'Sucursal';
    };
    
    // 1. Ingresos por pedidos mayoristas recibidos por la app
    const sortedOrders = [...(todayOrders || [])].sort((a, b) => {
        const timeA = a.deliveryConfirmedAt?.toMillis() || 0;
        const timeB = b.deliveryConfirmedAt?.toMillis() || 0;
        return timeA - timeB;
    });

    (sortedOrders || []).forEach(order => {
      const orderBranchId = order.branchId || centralId;
      if (selectedBranchFilter !== 'ALL') {
        const isMatch = (selectedBranchFilter === 'central' || selectedBranchFilter === centralId)
          ? (!order.branchId || order.branchId === 'central' || order.branchId === centralId)
          : order.branchId === selectedBranchFilter;
        if (!isMatch) return;
      }

      (order.items || []).forEach((item: any) => {
        if (!item) return;
        const baseKey = item.productId || item.name || 'Desconocido';
        const key = `${baseKey}_${orderBranchId}`;
        const existing = incomeMap.get(key);
        if (existing) {
          existing.quantity += item.quantity || 0;
        } else {
          incomeMap.set(key, { 
            name: item.name || 'Desconocido', 
            quantity: item.quantity || 0,
            branchId: orderBranchId,
            branchName: getBranchName(orderBranchId)
          });
        }
      });
    });

    // 2. Ingresos manuales (cargas manuales o reposiciones directas de mayoristas fuera de la app)
    (todayLogs || []).forEach((log: any) => {
      if (log.action === 'CREATE' || log.action === 'EDIT_MERGE' || log.action === 'IMPORT') {
        const logBranchId = log.branchId || centralId;
        if (selectedBranchFilter !== 'ALL') {
          const isMatch = (selectedBranchFilter === 'central' || selectedBranchFilter === centralId)
            ? (!log.branchId || log.branchId === 'central' || log.branchId === centralId)
            : log.branchId === selectedBranchFilter;
          if (!isMatch) return;
        }

        const baseKey = log.productId || log.productName || 'Desconocido';
        const key = `${baseKey}_${logBranchId}`;
        let qty = Number(log.quantity || 0);
        
        // Si no tiene quantity explícito, intentar parsear de los details (ej: "Stock sumado en 10 u.")
        if (!qty && log.details) {
          const matchSum = log.details.match(/sumado en (\d+)/i) || log.details.match(/inicial: (\d+)/i);
          if (matchSum && matchSum[1]) {
            qty = Number(matchSum[1]);
          }
        }

        if (qty > 0) {
          const existing = incomeMap.get(key);
          if (existing) {
            existing.quantity += qty;
          } else {
            incomeMap.set(key, { 
              name: log.productName || 'Desconocido', 
              quantity: qty,
              branchId: logBranchId,
              branchName: getBranchName(logBranchId)
            });
          }
        }
      }
    });

    const outcomeMap = new Map<string, { name: string; quantity: number; branchId?: string; branchName?: string }>();
    const salesOps = (todaySales || []).filter((op: any) => op.type === 'sale' || op.type === 'credit_sale');

    salesOps.forEach((sale: any) => {
      const saleBranchId = sale.branchId || centralId;
      if (selectedBranchFilter !== 'ALL') {
        const isMatch = (selectedBranchFilter === 'central' || selectedBranchFilter === centralId)
          ? (!sale.branchId || sale.branchId === 'central' || sale.branchId === centralId)
          : sale.branchId === selectedBranchFilter;
        if (!isMatch) return;
      }

      (sale.items || []).forEach((item: any) => {
        if (!item) return;
        const baseKey = item.productId || item.id || item.name || 'Desconocido';
        const key = `${baseKey}_${saleBranchId}`;
        const qty = Number(item.qty || item.quantity || 0);
        if (qty <= 0) return;
        const existing = outcomeMap.get(key);
        if (existing) {
          existing.quantity += qty;
        } else {
          outcomeMap.set(key, { 
            name: item.name || 'Desconocido', 
            quantity: qty,
            branchId: saleBranchId,
            branchName: getBranchName(saleBranchId)
          });
        }
      });
    });
    
    return { 
        income: Array.from(incomeMap.values()).sort((a, b) => b.quantity - a.quantity),
        outcome: Array.from(outcomeMap.values()).sort((a, b) => b.quantity - a.quantity),
    };
  }, [todayOrders, todayLogs, todaySales, selectedBranchFilter, branches]);

  const handleExportExcel = () => {
    const isSpecificBranch = selectedBranchFilter !== 'ALL';
    const branchObj = isSpecificBranch ? branches?.find(b => b.id === selectedBranchFilter) : null;
    const branchName = branchObj ? branchObj.name : 'Todas las Sucursales';

    // Si se eligió una sucursal específica, exportamos los productos activos en ella.
    // Si se eligió 'ALL', exportamos el catálogo completo.
    const listToExport = isSpecificBranch ? filteredProducts : (products || []);

    if (!listToExport || listToExport.length === 0) {
        toast({
            title: "No hay datos para exportar",
            description: isSpecificBranch ? `No hay productos con existencias en ${branchName}.` : undefined,
            variant: "destructive"
        });
        return;
    }

    let totalStock = 0;
    let totalCost = 0;
    let totalSale = 0;
    let totalProfit = 0;

    const dataToExport = listToExport.map(product => {
        const purchasePrice = product.purchasePrice || 0;
        const salePrice = product.salePrice || 0;
        const stock = isSpecificBranch ? getStockForBranch(product, selectedBranchFilter) : (product.stock || 0);
        const costTotal = purchasePrice * stock;
        const saleTotal = salePrice * stock;
        const profitTotal = saleTotal - costTotal;
        const profitability = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice) * 100 : 0;

        totalStock += stock;
        totalCost += costTotal;
        totalSale += saleTotal;
        totalProfit += profitTotal;

        if (isSpecificBranch) {
            return {
                'Sucursal': branchName,
                'Código': product.code || 'N/A',
                'Producto': product.name,
                'Stock en Sucursal': stock,
                'Precio Compra Unit. ($)': purchasePrice,
                'Precio Venta Unit. ($)': salePrice,
                'Costo Total Stock ($)': costTotal,
                'Valor Venta Stock ($)': saleTotal,
                'Ganancia Potencial ($)': profitTotal,
                'Rentabilidad (%)': profitability === Infinity ? "N/A" : `${profitability.toFixed(1)}%`,
            };
        }

        // Vista global / todas las sucursales
        const row: any = {
            'Código': product.code || 'N/A',
            'Producto': product.name,
            'Stock Total': stock,
        };

        // Desglose por sucursales si existen
        if (branches && branches.length > 0) {
            branches.forEach(b => {
                row[`Stock (${b.name})`] = getStockForBranch(product, b.id);
            });
        }

        row['Precio Compra Unit. ($)'] = purchasePrice;
        row['Precio Venta Unit. ($)'] = salePrice;
        row['Costo Total Stock ($)'] = costTotal;
        row['Valor Venta Stock ($)'] = saleTotal;
        row['Ganancia Potencial ($)'] = profitTotal;
        row['Rentabilidad (%)'] = profitability === Infinity ? "N/A" : `${profitability.toFixed(1)}%`;

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isSpecificBranch ? branchName.substring(0, 31) : "Inventario Global");

    // Fila de totales calculada dinámicamente según lo exportado
    if (isSpecificBranch) {
        XLSX.utils.sheet_add_aoa(worksheet, [
            [],
            ["TOTALES", "", "", totalStock, "", "", totalCost, totalSale, totalProfit]
        ], { origin: -1 });
    }

    const safeBranchFilename = isSpecificBranch ? branchName.toLowerCase().replace(/[^a-z0-9]/gi, '_') : 'total';
    XLSX.writeFile(workbook, `inventario_${safeBranchFilename}.xlsx`);
    toast({
        title: "Excel exportado 📊",
        description: `Se descargó el inventario de "${branchName}" con ${listToExport.length} productos.`
    });
  };

  const productsRef = React.useRef(products);
  useEffect(() => {
      productsRef.current = products;
  }, [products]);

  // SMART HID Scanner support for Stock Page
  useEffect(() => {
      let barcodeBuffer = '';
      let lastKeyTime = 0;

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
              return;
          }

          const now = Date.now();
          // Tolerancia de 300ms para pistolas inalámbricas o con lag
          if (now - lastKeyTime > 300) { 
              barcodeBuffer = '';
          }
          lastKeyTime = now;

          if (e.key === 'Enter') {
              const cleanCode = cleanBarcode(barcodeBuffer);
              barcodeBuffer = ''; // Reset immediately
              
              if (cleanCode.length >= 3) {
                  e.preventDefault();
                  
                  const currentLocalProducts = productsRef.current || [];
                  const foundLocal = currentLocalProducts.find(p => matchesBarcodeSmart(p, cleanCode));
                  
                  if (foundLocal) {
                      setSearchQuery(foundLocal.code || foundLocal.barcode || cleanCode);
                      toast({ title: "Producto encontrado en tu stock", description: foundLocal.name });
                  } else {
                      toast({ title: "Buscando en Catálogo Maestro...", description: `Código: ${cleanCode}` });
                      
                      searchMasterProductsServer(cleanCode).then(res => {
                          if (res.success && res.products && res.products.length > 0) {
                              const match = res.products[0];
                              toast({ title: "Encontrado en Catálogo Maestro", description: match.name });
                              setSelectedMasterProduct(match);
                              setIsEditOpen(true); // Open the New Product form!
                          } else {
                              toast({ 
                                  title: "Producto no encontrado", 
                                  description: "No existe en tu stock ni en el catálogo maestro.", 
                                  variant: "destructive" 
                              });
                          }
                      }).catch(err => {
                          toast({ title: "Error buscando código", description: err.message, variant: "destructive" });
                      });
                  }
              }
              return;
          }

          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              barcodeBuffer += e.key;
          }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toast]);

  const isLoading = isUserLoading || isLoadingProducts || isLoadingUserData || isLoadingSales || isLoadingOrders;
  
  if (isLoading) {
    return <div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-xl mx-auto text-center">
                <CardHeader>
                    <CardTitle>Acceso Requerido</CardTitle>
                    <CardDescription>Por favor, inicia sesión para acceder a esta sección.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild><Link href="/login">Iniciar Sesión</Link></Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  const isMasterOwner = user?.uid?.startsWith('HvnrCjJj');
  const isAuthorized = userData?.accountType === 'retailer' || isMasterOwner || !!employee?.retailerId || role === 'warehouse' || role === 'cashier_warehouse';

  if (!isAuthorized) {
      return <RetailerAccessWall />;
  }


  return (
    <RoleGuard moduleName="Stock" allowedRoles={['admin', 'warehouse', 'cashier_warehouse', 'cashier', 'accountant']}>
    <>
    <div id="main-content-wrapper" className="container mx-auto pb-36 sm:pb-12 pt-16 sm:pt-20 md:pt-4 space-y-6 transition-opacity duration-300">
        
        {/* Header & Unified Action Buttons Row */}
        <div className="flex flex-col gap-4 mb-6">
            <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3 uppercase italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <Package className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 shrink-0" />
                    Gestión de Stock <span className="text-red-600">.</span>
                </h1>
            </div>
            
            {/* Unified Action Buttons directly under title */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:flex-wrap pb-2">
                {canModifyPricesAndStock && (
                    <Button 
                        onClick={() => {
                            const centralBranch = branches?.find((b: any) => b.isCentral);
                            setTransferOriginBranchId(centralBranch ? centralBranch.id : '');
                            setIsTransferModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <Truck className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">Mover Stock</span>
                    </Button>
                )}
                {canModifyPricesAndStock && (
                    <Button 
                        onClick={() => setIsCreatePromoOpen(true)} 
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <Tag className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">Crear Promo</span>
                    </Button>
                )}
                {canModifyPricesAndStock && (
                    <Button 
                        onClick={() => setIsSearchOpen(true)} 
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <PlusCircle className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">Agregar Producto</span>
                    </Button>
                )}
                <Button 
                    onClick={() => setIsPrintModalOpen(true)} 
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 w-full sm:w-auto"
                >
                    <Printer className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">Imprimir Góndola A4</span>
                </Button>
            </div>
        </div>


        <Card>
            <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto flex-grow">
                    <div className="relative flex-grow w-full">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en mi inventario por nombre o código..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-56">
                         <UISelect value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                                <Filter className="w-3 h-3 mr-2" />
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat} value={cat} className="font-bold uppercase text-[10px] tracking-widest">
                                        {cat === 'ALL' ? 'Todas las Categorías' : cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </UISelect>
                    </div>
                    {/* Selector de Sucursal: para cajero/vendedor con turno abierto queda fijado automáticamente */}
                    {role !== 'admin' && currentShift ? (
                        <div className="w-full sm:w-56 h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 select-none">
                            <Store className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 leading-none">Sucursal Turno</span>
                                <span className="font-black uppercase text-[10px] tracking-wider text-slate-800 truncate leading-tight">
                                    {currentShift.branchName || branches?.find(b => b.id === currentShift.branchId)?.name || 'Sucursal'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        branches && branches.length > 0 && (
                            <div className="w-full sm:w-56">
                                <UISelect value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 font-bold uppercase text-[10px] tracking-widest">
                                        <Store className="w-3 h-3 mr-2 text-red-600" />
                                        <SelectValue placeholder="Sucursal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL" className="font-bold uppercase text-[10px] tracking-widest">
                                            Todas las Sucursales
                                        </SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="font-bold uppercase text-[10px] tracking-widest">
                                                {b.name} {b.isCentral ? '(Central)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </UISelect>
                            </div>
                        )
                    )}
                    {selectedProductIds.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <Button 
                                className="w-full sm:w-auto h-10 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold animate-in zoom-in-95 duration-200 shadow-md gap-2"
                                onClick={() => setIsPrintModalOpen(true)}
                            >
                                <Printer className="h-4 w-4" /> Imprimir Góndola ({selectedProductIds.length})
                            </Button>
                            {role === 'admin' && (
                                <Button 
                                    variant="destructive" 
                                    className="w-full sm:w-auto h-10 px-6 rounded-xl animate-in zoom-in-95 duration-200 shadow-lg shadow-red-500/20"
                                    onClick={() => setProductToDelete({ name: `${selectedProductIds.length} productos seleccionados`, isBulk: true })}
                                >
                                    <AlertCircle className="mr-2 h-4 w-4" /> Eliminar ({selectedProductIds.length})
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                {canModifyPricesAndStock && (
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportExcel} className="rounded-xl flex-1">
                        <FileUp className="mr-2 h-4 w-4"/>
                        Exportar
                    </Button>
                </div>
                )}
            </CardHeader>
            <CardContent>
                {isLoadingProducts ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : !products || products.length === 0 ? (
                    <Alert>
                        <List className="h-4 w-4" />
                        <AlertTitle>¡Empezá a construir tu inventario!</AlertTitle>
                        <AlertDescription>
                            Para poder registrar ventas, primero necesitas tener productos en tu stock. Tenés dos maneras de hacerlo:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>
                                    <b>Agregar Manualmente:</b> Usá el botón <span className="font-semibold text-primary">"Agregar Producto"</span> para buscar en el catálogo maestro y añadir items uno por uno.
                                </li>
                                <li>
                                    <b>Recepción de Pedidos:</b> Hacé un pedido en el <Link href="/redeconomix" className="underline font-semibold text-primary">Marketplace</Link> y, al confirmarlo en "Mis Compras", tu stock se actualizará automáticamente.
                                </li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="w-full">
                        {/* Mobile Grid View */}
                        {isMobileView && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {displayedProducts.length > 0 ? (
                                displayedProducts.map(product => {
                                    const stock = selectedBranchFilter !== 'ALL' ? getStockForBranch(product, selectedBranchFilter) : (product.stock || 0);
                                    const threshold = product.minStock ?? 5;
                                    const isLowStock = stock <= threshold && stock > 0;
                                    const isOutOfStock = stock <= 0;
                                    const isSelected = selectedProductIds.includes(product.id);
                                    
                                    return (
                                        <div key={product.id} className={cn("relative p-3 rounded-2xl border flex flex-col gap-2 shadow-xs transition-all bg-white", 
                                            isSelected ? "border-red-600 ring-2 ring-red-600/20" : "border-slate-200/80 hover:border-slate-300"
                                        )}>
                                            <div className="absolute top-2 left-2 z-10">
                                                <Checkbox 
                                                    checked={isSelected} 
                                                    onCheckedChange={() => toggleProductSelection(product.id)} 
                                                    className="w-5 h-5 bg-white/80 backdrop-blur rounded-[4px] border-slate-200" 
                                                />
                                            </div>
                                            
                                            <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center p-2 mt-4 cursor-pointer relative overflow-hidden select-none" onClick={() => setViewingProduct(product)}>
                                                {(product.imageUrl || product.image || product.photoUrl) ? (
                                                    <Image src={product.imageUrl || product.image || product.photoUrl} alt={product.name} fill className="object-contain p-2" />
                                                ) : (
                                                    <Package className="h-8 w-8 text-slate-300" />
                                                )}

                                                {isOutOfStock && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center"><Badge variant="destructive" className="scale-75 uppercase">Sin Stock</Badge></div>}
                                            </div>
                                            
                                            <div className="flex flex-col gap-1 cursor-pointer min-h-[40px]" onClick={() => setViewingProduct(product)}>
                                                <span className="font-bold text-[11px] text-slate-800 leading-tight line-clamp-2">{product.name}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {getProductBranches(product).map((b, idx) => (
                                                        <span 
                                                            key={`m-${b.id}-${idx}`}
                                                            className={cn(
                                                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black border leading-none shrink-0",
                                                                b.stock > 0 
                                                                    ? "bg-red-600 text-white border-red-700 shadow-2xs"
                                                                    : "bg-slate-100 text-slate-400 border-slate-200/60"
                                                            )}
                                                        >
                                                            <Store className={cn("w-2.5 h-2.5 shrink-0", b.stock > 0 ? "text-white" : "text-slate-300")} />
                                                            <span className="truncate max-w-[70px]">{b.name}:</span>
                                                            <span className={cn("font-mono font-black", b.stock > 0 ? "text-white" : "text-slate-400")}>{b.stock}u</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-slate-100/80">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1", 
                                                            isOutOfStock ? "bg-red-50 text-red-600 border border-red-100" : 
                                                            isLowStock ? "bg-amber-50 text-amber-600 border border-amber-100" : 
                                                            "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                        )}>
                                                            {stock} u.{selectedBranchFilter === 'ALL' && branches && branches.length > 1 ? ' Total' : ''}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">P. Venta</span>
                                                        <span className="text-[12px] font-black tracking-tight text-slate-900 leading-none">
                                                            ${(product.salePrice || 0).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                </div>
                                                {canModifyPricesAndStock && (
                                                    <div className="flex items-center justify-between bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-100">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">P. Unitario:</span>
                                                        <span className="text-[10px] font-bold text-slate-700 tabular-nums">
                                                            ${(product.purchasePrice || 0).toLocaleString('es-AR')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-100">
                                    <Package className="h-8 w-8 mx-auto opacity-20 mb-2" />
                                    <p className="font-medium text-xs text-muted-foreground">No hay productos.</p>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Desktop Table View */}
                        {!isMobileView && (
                        <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="w-[50px] pl-6 py-4">
                                            <Checkbox 
                                                checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                                                onCheckedChange={toggleAllSelection}
                                                className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </TableHead>
                                        <TableHead className="w-[80px] py-4">Imagen</TableHead>
                                        <TableHead className="py-4">Producto</TableHead>
                                        <TableHead className="text-center py-4">Stock</TableHead>
                                        <TableHead className="py-4">Sucursal</TableHead>
                                        {canModifyPricesAndStock && <TableHead className="text-right py-4">P. Unitario</TableHead>}
                                        <TableHead className="text-right py-4 pr-6">P. Venta</TableHead>
                                        <TableHead className="text-right w-[50px] py-4 pr-6"><span className="sr-only">Acciones</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedProducts.length > 0 ? (
                                        (() => {
                                            let lastDateLabel = '';
                                            return displayedProducts.map(product => {
                                                const dateLabel = getDateLabel(product);
                                                const isNewDateGroup = dateLabel !== lastDateLabel;
                                                if (isNewDateGroup) {
                                                    lastDateLabel = dateLabel;
                                                }
                                            const stock = selectedBranchFilter !== 'ALL' ? getStockForBranch(product, selectedBranchFilter) : (product.stock || 0);
                                            const threshold = product.minStock ?? 5;
                                            const isLowStock = stock <= threshold && stock > 0;
                                            const isOutOfStock = stock <= 0;
                                            const isSelected = selectedProductIds.includes(product.id);
                                            
                                            return (
                                                <React.Fragment key={`frag-${product.id}`}>
                                                    {isNewDateGroup && (
                                                        <TableRow className="bg-slate-100/90 hover:bg-slate-100/90 border-t-2 border-slate-300">
                                                            <TableCell colSpan={8} className="py-2.5 px-6">
                                                                <div className="flex items-center gap-2.5">
                                                                    <Calendar className="h-4 w-4 shrink-0 text-red-600" />
                                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                                                                        {dateLabel}
                                                                    </span>
                                                                    <div className="flex-1 h-[1px] bg-slate-200" />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                <TableRow key={product.id} className={cn("group transition-colors border-b border-slate-100 hover:bg-slate-50/70 bg-white", 
                                                    isSelected && "bg-red-50/40"
                                                )}>
                                                    <TableCell className="pl-6 py-4">
                                                        <Checkbox 
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleProductSelection(product.id)}
                                                            className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center border border-border/50 group-hover:scale-105 transition-transform relative">
                                                             {(product.imageUrl || product.image || product.photoUrl) ? (
                                                                 <Image src={product.imageUrl || product.image || product.photoUrl} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                                                             ) : (
                                                                 <Package className="h-5 w-5 text-muted-foreground/40" />
                                                             )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4" onClick={() => setViewingProduct(product)}>
                                                        <div className="flex flex-col cursor-pointer gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm tracking-tight">{product.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{product.code || 'SIN SKU'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        <div className="inline-flex items-center gap-1.5 justify-center">
                                                            <span className={cn(
                                                                "text-base font-black px-3 py-1 rounded-xl transition-all flex items-center gap-1.5",
                                                                isOutOfStock ? "text-red-600 bg-red-50" : isLowStock ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"
                                                            )}>
                                                                {stock}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col gap-1 max-w-[220px]">
                                                            {getProductBranches(product).map((b, idx) => (
                                                                <div 
                                                                    key={`${b.id}-${idx}`}
                                                                    className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors w-fit",
                                                                        b.stock > 0
                                                                            ? "bg-red-600 text-white border-red-700 shadow-2xs"
                                                                            : "bg-slate-100 text-slate-400 border-slate-200/60"
                                                                    )}
                                                                >
                                                                    <Store className={cn("w-3 h-3 shrink-0", b.stock > 0 ? "text-white" : "text-slate-300")} />
                                                                    <span className="truncate max-w-[120px]">{b.name}:</span>
                                                                    <span className={cn("font-mono font-black text-[9px] px-1 py-0.2 rounded ml-0.5", 
                                                                        b.stock > 0 ? "bg-white/20 text-white" : "bg-slate-200/50 text-slate-400"
                                                                    )}>
                                                                        {b.stock}u
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    {canModifyPricesAndStock && (
                                                    <TableCell className="text-right font-bold tabular-nums py-4 text-slate-500">
                                                        ${(product.purchasePrice || 0).toLocaleString('es-AR')}
                                                    </TableCell>
                                                    )}
                                                    <TableCell className="text-right py-4 pr-6">
                                                        <span className="text-[12px] font-bold  text-slate-900 tracking-tight leading-none block">
                                                            ${(product.salePrice || 0).toLocaleString('es-AR')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 pr-6">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl">
                                                                <DropdownMenuItem onClick={() => setViewingProduct(product)} className="rounded-lg gap-2 cursor-pointer">
                                                                    <Eye className="h-4 w-4" /> Ver Detalles
                                                                </DropdownMenuItem>
                                                                {canModifyPricesAndStock && (
                                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(product)} className="rounded-lg gap-2 cursor-pointer font-bold text-slate-800">
                                                                        <Edit className="h-4 w-4" /> Corregir Stock y Precios
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {role === 'admin' && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => setProductToDelete(product)} className="rounded-lg gap-2 text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600 font-bold">
                                                                            <AlertCircle className="h-4 w-4" /> Eliminar del Inventario
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                                </React.Fragment>
                                            );
                                        });
                                    })()
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={8} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                    <div className="p-4 bg-muted rounded-full">
                                                        <Package className="h-8 w-8 opacity-20" />
                                                    </div>
                                                    <p className="font-medium ">No se encontraron productos que coincidan con tu búsqueda.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        )}

                        {filteredProducts.length > displayLimit && (
                            <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDisplayLimit(prev => prev + 50)}
                                    className="px-6 h-12 rounded-2xl font-bold text-xs uppercase tracking-wider bg-slate-50 hover:bg-slate-100 border-slate-200 shadow-sm transition-all active:scale-95 text-slate-800"
                                >
                                    Cargar más productos (mostrando {displayedProducts.length} de {filteredProducts.length})
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setDisplayLimit(filteredProducts.length)}
                                    className="text-[11px] text-slate-400 hover:text-slate-600 underline font-semibold transition-colors"
                                >
                                    Mostrar todos ({filteredProducts.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
    
    <CreatePromoDialog
        open={isCreatePromoOpen}
        onOpenChange={setIsCreatePromoOpen}
        onSave={(data) => {
            setProductToConfirm(data);
            setIsCreatePromoOpen(false);
        }}
        existingProducts={products || []}
    />

    <SearchMasterProductDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectProduct={(product) => {
            const isAlreadyListed = products?.some((p: any) => 
                p.id === product.id || 
                (p.code && product.code && p.code.toString() === product.code.toString()) ||
                (p.barcode && product.barcode && p.barcode.toString() === product.barcode.toString())
            );
            if (isAlreadyListed) {
                toast({ title: "Producto ya en inventario 📦", description: "Ingresá la cantidad recibida para sumarla al stock.", variant: "default" });
                const existingProduct = products?.find((p: any) => 
                    p.id === product.id || 
                    (p.code && product.code && p.code.toString() === product.code.toString()) ||
                    (p.barcode && product.barcode && p.barcode.toString() === product.barcode.toString())
                );
                if (existingProduct) {
                    const mergedProduct = { ...existingProduct };
                    if (!mergedProduct.imageUrl && !mergedProduct.image && !mergedProduct.photoUrl && product.imageUrl) {
                        mergedProduct.imageUrl = product.imageUrl;
                    }
                    handleOpenEditDialog(mergedProduct);
                }
                setIsSearchOpen(false);
            } else {
                setSelectedMasterProduct(product);
                setIsSearchOpen(false);
                setIsEditOpen(true);
            }
        }}
    />

    <EditRetailerProductDialog
        open={isEditOpen}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setEditingProduct(null);
                setSelectedMasterProduct(null);
            }
            setIsEditOpen(isOpen);
        }}
        product={editingProduct || selectedMasterProduct}
        onSave={handlePrepareConfirmation}
        existingProducts={products || []}
        branches={branches || []}
        defaultBranchId={selectedBranchFilter !== 'ALL' ? selectedBranchFilter : (branches?.find(b => b.isCentral)?.id || branches?.[0]?.id)}
    />
     <ConfirmationDialog
        open={!!productToConfirm}
        onOpenChange={(isOpen) => !isOpen && setProductToConfirm(null)}
        product={productToConfirm}
        onConfirm={handleSaveProduct}
        isSaving={isSaving}
    />
     <ProductDetailDialog
        product={viewingProduct}
        branches={branches || []}
        getStockForBranch={getStockForBranch}
        displayStock={viewingProduct ? (selectedBranchFilter === 'ALL' ? (viewingProduct.stock || 0) : getStockForBranch(viewingProduct, selectedBranchFilter)) : 0}
        displayBranchName={selectedBranchFilter === 'ALL' ? 'Total' : branches?.find(b => b.id === selectedBranchFilter)?.name || ''}
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        onEdit={handleOpenEditDialog}
        onDelete={setProductToDelete}
    />

        <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="redeconomix-theme rounded-xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="font-headline text-xl">
                    {productToDelete?.isBulk ? '¿Eliminar productos seleccionados?' : '¿Eliminar del Inventario?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {productToDelete?.isBulk 
                        ? `Esta acción quitará los ${selectedProductIds.length} productos seleccionados de tu inventario para siempre.`
                        : `Esta acción quitará a "${productToDelete?.name}" de tu lista de stock. Podrás volver a agregarlo después desde el catálogo maestro.`
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            {!productToDelete?.isBulk && (
                <div className="flex flex-col items-center py-4 opacity-50 grayscale scale-75">
                    <RetailerProductPreviewCard product={productToDelete} />
                </div>
            )}
            <div className="flex gap-3 pt-4 mt-2">
                <button 
                    type="button" 
                    className="flex-1 h-12 bg-slate-50 active:bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center border-none"
                    onClick={() => {
                        if ('vibrate' in navigator) navigator.vibrate(6);
                        setProductToDelete(null);
                    }}
                    disabled={isDeleting}
                >
                    Cancelar
                </button>
                <button 
                    type="button" 
                    onClick={() => {
                        if ('vibrate' in navigator) navigator.vibrate(8);
                        if (productToDelete?.isBulk) {
                            handleBulkDelete();
                        } else {
                            handleDeleteProduct();
                        }
                    }}
                    disabled={isDeleting}
                    className="flex-1 h-12 bg-red-600 active:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] touch-manipulation select-none flex items-center justify-center shadow-lg shadow-red-600/20 border-none"
                >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
                    Eliminar
                </button>
            </div>
        </AlertDialogContent>
    </AlertDialog>

    {/* MODAL TRASPASO DE STOCK ENTRE SUCURSALES */}
    <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-[420px] rounded-[2rem] p-6 bg-white border-0 shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-center font-black uppercase tracking-widest text-slate-800 text-lg flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5 text-red-600" /> Traspaso de Stock
                </DialogTitle>
                <DialogDescription className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Mover mercadería entre sucursales
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Sucursal de Origen</label>
                    <select 
                        value={transferOriginBranchId}
                        onChange={e => setTransferOriginBranchId(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 font-bold text-sm border-0 focus:ring-2 focus:ring-red-200"
                    >
                        <option value="" disabled>Seleccionar Origen...</option>
                        {branches?.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.name} {b.isCentral ? '(Central)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Sucursal de Destino</label>
                    <select 
                        value={transferDestBranchId}
                        onChange={e => setTransferDestBranchId(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 font-bold text-sm border-0 focus:ring-2 focus:ring-red-200"
                    >
                        <option value="" disabled>Seleccionar Destino...</option>
                        {branches?.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.name} {b.isCentral ? '(Central)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Buscar Producto</label>
                    <div className="relative">
                        <SearchIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                            placeholder="Buscar por nombre o código..." 
                            value={transferSearchQuery}
                            onChange={e => setTransferSearchQuery(e.target.value)}
                            className="h-12 pl-11 pr-8 rounded-2xl bg-slate-50 border-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-red-200"
                        />
                        {transferSearchQuery && (
                            <button 
                                type="button"
                                onClick={() => setTransferSearchQuery('')} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Selected product badge */}
                    {transferProductId && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-bold text-slate-800 animate-in fade-in">
                            <div>
                                <p className="font-black text-slate-900">{products?.find((p: any) => p.id === transferProductId)?.name}</p>
                                <p className="text-[10px] text-red-600 font-bold mt-0.5">
                                    Stock en Origen: {transferOriginBranchId ? getStockForBranch(products?.find((p: any) => p.id === transferProductId), transferOriginBranchId) : 0} u.
                                </p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setTransferProductId('')} 
                                className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg shadow-xs border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                Cambiar
                            </button>
                        </div>
                    )}

                    {/* Filtered list */}
                    {!transferProductId && (
                        <div className="max-h-64 overflow-y-auto space-y-1.5 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                            {products
                                ?.filter((p: any) => {
                                    if (!transferSearchQuery) return true;
                                    const q = transferSearchQuery.toLowerCase();
                                    return p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
                                })
                                .map((p: any) => {
                                    const originStock = transferOriginBranchId ? getStockForBranch(p, transferOriginBranchId) : (p.stock ?? 0);
                                    const isDisabled = originStock <= 0;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => {
                                                setTransferProductId(p.id);
                                                setTransferSearchQuery('');
                                            }}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl flex justify-between items-center transition-all text-xs font-bold",
                                                isDisabled ? "opacity-40 cursor-not-allowed bg-slate-100" : "bg-white hover:bg-slate-50 hover:border-slate-300 shadow-xs border border-slate-200 active:scale-[0.99]"
                                            )}
                                        >
                                            <div>
                                                <p className="text-slate-900 font-bold">{p.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold tracking-wider">{p.code || 'Sin código'}</p>
                                            </div>
                                            <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black", isDisabled ? "bg-slate-200 text-slate-500" : "bg-emerald-50 text-emerald-600 border border-emerald-100")}>
                                                Stock: {originStock}
                                            </span>
                                        </button>
                                    );
                                })}
                            {products?.filter((p: any) => !transferSearchQuery || p.name?.toLowerCase().includes(transferSearchQuery.toLowerCase()) || p.code?.toLowerCase().includes(transferSearchQuery.toLowerCase())).length === 0 && (
                                <p className="text-center text-xs font-bold text-slate-400 py-6">No se encontraron productos.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cantidad a Transferir</label>
                    <Input 
                        type="number"
                        min={1}
                        value={transferQuantity}
                        onChange={e => setTransferQuantity(e.target.value)}
                        className="h-14 rounded-2xl bg-slate-50 font-bold text-lg text-center border-none"
                    />
                </div>
            </div>

            <DialogFooter className="mt-2">
                <Button 
                    onClick={handleExecuteTransfer}
                    disabled={isSubmittingTransfer}
                    className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/30"
                >
                    {isSubmittingTransfer ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <CheckCircle className="w-5 h-5 mr-2"/>}
                    Confirmar Traspaso
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </>

    <GondolaPrintModal 
        open={isPrintModalOpen} 
        onOpenChange={setIsPrintModalOpen} 
        allProducts={filteredProducts || []} 
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
    />

    </RoleGuard>
  );
}

function GondolaPrintModal({ 
    open, 
    onOpenChange, 
    allProducts, 
    selectedProductIds, 
    setSelectedProductIds 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    allProducts: any[]; 
    selectedProductIds: string[]; 
    setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>; 
}) {
    const [activeTab, setActiveTab] = useState<'preview' | 'select'>('preview');
    const [searchQuery, setSearchQuery] = useState('');

    const selectedProductsList = useMemo(() => {
        if (selectedProductIds.length > 0) {
            return allProducts.filter(p => selectedProductIds.includes(p.id));
        }
        return allProducts.slice(0, 30);
    }, [selectedProductIds, allProducts]);

    // Chunk products into groups of 30 items per A4 sheet
    const pages = useMemo(() => {
        if (selectedProductsList.length === 0) return [[]];
        const result = [];
        for (let i = 0; i < selectedProductsList.length; i += 30) {
            result.push(selectedProductsList.slice(i, i + 30));
        }
        return result;
    }, [selectedProductsList]);

    const totalPages = pages.length;

    const filteredSelectionList = useMemo(() => {
        if (!searchQuery.trim()) return allProducts;
        const q = searchQuery.toLowerCase();
        return allProducts.filter(p => (p.name || p.productName || '').toLowerCase().includes(q));
    }, [allProducts, searchQuery]);

    const handleToggleProduct = (id: string) => {
        setSelectedProductIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            }
            return [...prev, id];
        });
    };

    const handlePrint = () => {
        if (typeof window === 'undefined') return;

        const pagesHtml = pages.map((pageItems, pageIdx) => {
            const emptySlots = Math.max(0, 30 - pageItems.length);
            return `
              <div class="a4-page">
                <div class="grid">
                  ${pageItems.map(item => {
                    const price = item.salePrice || item.price || 0;
                    const formattedPrice = price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const code = item.barcode || item.code || item.sku || item.id || '7898567762106';
                    const name = item.name || item.productName || 'Producto Sin Nombre';
                    return `
                      <div class="tag">
                        <div class="title">${name}</div>
                        <div class="price">$${formattedPrice}</div>
                        <div class="barcode">${code}</div>
                      </div>
                    `;
                  }).join('')}
                  ${Array.from({ length: emptySlots }).map(() => `
                    <div class="tag empty"></div>
                  `).join('')}
                </div>
              </div>
            `;
        }).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiquetas de Góndola A4</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 5mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
    }
    .a4-page {
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
      padding: 0;
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 0;
      border: 1px solid #cbd5e1;
      width: 100%;
      box-sizing: border-box;
    }
    .tag {
      height: 2.58cm;
      border: 1px dashed #94a3b8;
      padding: 3px 4px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .tag.empty {
      border: 1px dashed #e2e8f0;
    }
    .title {
      font-size: 9.5px;
      line-height: 1.05;
      font-weight: bold;
      color: #1e293b;
      text-transform: uppercase;
      max-height: 2.1em;
      overflow: hidden;
      width: 100%;
      padding-top: 1px;
    }
    .price {
      font-size: 30px;
      font-weight: 900;
      color: #000000;
      font-family: 'Arial Black', Impact, sans-serif;
      letter-spacing: -1px;
      padding: 0;
      line-height: 1;
    }
    .barcode {
      font-size: 8.5px;
      font-family: monospace, Courier, monospace;
      color: #64748b;
      letter-spacing: 1px;
      padding-bottom: 1px;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

        let iframe = document.getElementById('gondola-print-frame') as HTMLIFrameElement;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'gondola-print-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-5xl sm:max-w-5xl md:max-w-5xl lg:max-w-5xl xl:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-6 pb-5 border-b border-slate-100 no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pr-14">
                    <div className="space-y-3">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                            <Printer className="h-6 w-6 text-red-600 shrink-0" />
                            Etiquetas de Góndola A4 (Estilo Multinexo)
                        </DialogTitle>
                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={cn(
                                    "px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2",
                                    activeTab === 'preview' ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                🖨️ Vista Previa ({totalPages} {totalPages === 1 ? 'Hoja' : 'Hojas'} A4)
                            </button>
                            <button
                                onClick={() => setActiveTab('select')}
                                className={cn(
                                    "px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2",
                                    activeTab === 'select' ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                📋 Seleccionar Productos ({selectedProductIds.length})
                            </button>
                        </div>
                    </div>
                    <Button onClick={handlePrint} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-8 h-12 gap-2 shadow-lg shadow-red-600/30 shrink-0 whitespace-nowrap text-sm uppercase tracking-wide">
                        <Printer className="h-5 w-5 shrink-0" />
                        Imprimir {totalPages} {totalPages === 1 ? 'Hoja' : 'Hojas'} A4
                    </Button>
                </DialogHeader>

                {/* TAB: SELECT PRODUCTS */}
                {activeTab === 'select' && (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 no-print">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="relative w-full">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Buscá en tu inventario por nombre o código de producto para seleccionar..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 text-sm font-medium w-full"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
                                {filteredSelectionList.map(product => {
                                    const isChecked = selectedProductIds.includes(product.id);
                                    return (
                                        <div 
                                            key={product.id} 
                                            onClick={() => handleToggleProduct(product.id)}
                                            className={cn(
                                                "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-slate-50",
                                                isChecked && "bg-red-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox 
                                                    checked={isChecked}
                                                    onCheckedChange={() => handleToggleProduct(product.id)}
                                                    className="border-red-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 uppercase">{product.name || product.productName}</p>
                                                    <p className="text-xs text-slate-400 font-mono">Cód: {product.barcode || product.code || product.sku || product.id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900 font-mono">${(product.salePrice || product.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Stock: {product.stock || 0}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: PREVIEW PRINT AREA */}
                {activeTab === 'preview' && (
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 gondola-print-area space-y-8">
                        <style jsx global>{`
                            @media print {
                                html, body {
                                    height: auto !important;
                                    overflow: visible !important;
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                /* Completely neutralize Radix Dialog backdrops and overlays in print */
                                div[data-state],
                                div[role="dialog"],
                                .bg-black\\/80,
                                .fixed.inset-0 {
                                    background: transparent !important;
                                    background-color: transparent !important;
                                    box-shadow: none !important;
                                    border: none !important;
                                }
                                #main-content-wrapper, aside, header, footer, nav {
                                    display: none !important;
                                }
                                .no-print {
                                    display: none !important;
                                }
                                .gondola-print-area {
                                    display: block !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 100% !important;
                                    height: auto !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    background: #ffffff !important;
                                    color: #000000 !important;
                                    z-index: 9999999 !important;
                                }
                                @page {
                                    size: A4 portrait;
                                    margin: 4mm;
                                }
                            }
                        `}</style>

                        {pages.map((pageItems, pageIdx) => {
                            const emptySlotsCount = Math.max(0, 30 - pageItems.length);
                            return (
                                <div key={pageIdx} className="space-y-2">
                                    <div className="flex items-center justify-between px-2 no-print">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                            Hoja N° {pageIdx + 1} de {totalPages} ({pageItems.length} etiquetas)
                                        </span>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
                                        <div className="grid grid-cols-3 gap-0 border border-slate-300 print:border-slate-400">
                                            {pageItems.map((item, idx) => {
                                                const price = item.salePrice || item.price || 0;
                                                const formattedPrice = price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                const code = item.barcode || item.code || item.sku || item.id || '7898567762106';

                                                return (
                                                    <div 
                                                        key={item.id || idx} 
                                                        className="h-[2.58cm] border border-dashed border-slate-300 print:border-slate-400 p-2 flex flex-col justify-between items-center text-center bg-white overflow-hidden box-border"
                                                    >
                                                        {/* Header: Product Name */}
                                                        <div className="text-[10px] leading-tight font-bold text-slate-800 uppercase tracking-tight line-clamp-2 w-full pt-0.5">
                                                            {item.name || item.productName || 'Producto Sin Nombre'}
                                                        </div>

                                                        {/* Middle: GIANT Price */}
                                                        <div className="text-2xl sm:text-3xl font-black text-black tracking-tighter font-sans py-0.5 leading-none">
                                                            ${formattedPrice}
                                                        </div>

                                                        {/* Bottom: EAN / Barcode Number */}
                                                        <div className="text-[9px] font-mono text-slate-500 tracking-widest pb-0.5">
                                                            {code}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Fill empty grid slots up to 30 for complete sheet visualization */}
                                            {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                                                <div 
                                                    key={`empty-${idx}`} 
                                                    className="h-[2.58cm] border border-dashed border-slate-200 p-2 flex flex-col justify-center items-center text-center bg-slate-50/20 no-print"
                                                >
                                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Espacio Vacío</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <DialogFooter className="p-4 bg-white border-t border-slate-100 flex items-center justify-between no-print">
                    <span className="text-xs text-slate-500 font-bold">
                        {selectedProductsList.length} etiquetas seleccionadas ({totalPages} {totalPages === 1 ? 'hoja A4' : 'hojas A4'}).
                    </span>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-xs uppercase px-6">
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
