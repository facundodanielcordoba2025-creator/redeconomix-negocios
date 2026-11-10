'use client';

import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, DollarSign, Smartphone, Lightbulb, Copy, Truck, 
  MapPin, CreditCard, Wallet, Banknote, Clock, Zap
} from 'lucide-react';
import { createServiceRequest } from '@/app/redeconomix/actions';

/* ============================================================
   SCHEMAS
   ============================================================ */

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(100, "El monto mínimo es $100"),
  cardNumber: z.string().min(16, "Número de tarjeta inválido").max(19),
  cardHolder: z.string().min(3, "Nombre es requerido"),
  address: z.string().min(5, "Dirección requerida para confirmación"),
});

const topupSchema = z.object({
  phoneNumber: z.string().min(10, "Número inválido"),
  line: z.string().min(2, "Línea requerida (Personal, Claro, etc)"),
  amount: z.coerce.number().min(500, "Monto mínimo $500"),
  cardNumber: z.string().min(16, "Tarjeta requerida"),
});

const billPaymentSchema = z.object({
  serviceType: z.string().min(2, "Tipo de servicio requerido"),
  company: z.string().min(2, "Empresa requerida"),
  customerId: z.string().min(4, "ID de cliente requerido"),
  amount: z.coerce.number().min(1, "Monto inválido"),
});

const photocopySchema = z.object({
  copies: z.coerce.number().min(1, "Mínimo 1 copia"),
  address: z.string().min(5, "Dirección de entrega requerida"),
  distance: z.coerce.number().min(0).default(0),
});

/* ============================================================
   DIALOG COMPONENTS
   ============================================================ */

interface ServiceFormValues {
  address: string;
  amount: number;
  copies: number;
  distance: number;
  cardNumber: string;
  phoneNumber: string;
  line: string;
  serviceType: string;
  company: string;
  customerId: string;
  cardHolder?: string;
}

export function FinancialServiceDialog({ 
  service, isOpen, onClose, user, userData 
}: { 
  service: any | null, isOpen: boolean, onClose: () => void, user: any, userData: any 
}) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic schema selection
    const getSchema = () => {
        if (!service) return z.object({});
        if (service.id === 'retiro-efectivo' || service.id === 'dinero-domicilio') return withdrawalSchema;
        if (service.id === 'recarga-credito') return topupSchema;
        if (service.id === 'pago-servicios') return billPaymentSchema;
        if (service.id === 'fotocopias') return photocopySchema;
        return z.object({});
    };

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(getSchema() as any),
        defaultValues: {
            address: userData?.address || '',
            amount: 0,
            copies: 1,
            distance: 0,
            cardNumber: '',
            phoneNumber: '',
            line: '',
            serviceType: '',
            company: '',
            customerId: ''
        }
    });

    if (!service) return null;

    const onSubmit = async (values: any) => {
        if (!user) return;
        setIsSubmitting(true);
        
        let extraDetails = "";
        let finalAmount = values.amount || 0;
        let fee = 0;

        if (service.id === 'recarga-credito') {
            fee = Math.ceil(values.amount / 1000) * 100;
            extraDetails = `Recarga para ${values.line}: ${values.phoneNumber}. Costo servicio: $${fee}`;
            finalAmount += fee;
        } else if (service.id === 'pago-servicios') {
            fee = values.amount * 0.03;
            extraDetails = `Pago de ${values.serviceType} (${values.company}). ID: ${values.customerId}. Comisión 3%: $${fee}`;
            finalAmount += fee;
        } else if (service.id === 'retiro-efectivo') {
            extraDetails = `Retiro de efectivo en negocio. Tarjeta: ****${values.cardNumber.slice(-4)}`;
        } else if (service.id === 'dinero-domicilio') {
            const now = new Date();
            const hour = now.getHours();
            const nightFee = (hour >= 22 || hour < 6) ? 1500 : 0;
            extraDetails = `Dinero a domicilio. Recargo nocturno: $${nightFee}`;
            finalAmount += nightFee;
        } else if (service.id === 'fotocopias') {
            const pricePerCopy = 350;
            const baseDist = 1.5;
            const extraDistFee = values.distance > baseDist ? (values.distance - baseDist) * 2500 : 0;
            finalAmount = (values.copies * pricePerCopy) + extraDistFee;
            extraDetails = `${values.copies} copias. Distancia: ${values.distance}km. Extra km: $${extraDistFee}`;
        }

        const result = await createServiceRequest({
            clientId: user.uid,
            clientName: user.displayName || 'Cliente',
            serviceType: service.title,
            description: extraDetails,
            address: values.address || 'Negocio Adherido',
            cityId: userData?.cityId || 'default',
            totalAmount: finalAmount as any
        } as any);

        setIsSubmitting(false);
        if (result.success) {
            toast({ title: "Solicitud Procesada", description: `Monto Final: $${finalAmount.toLocaleString('es-AR')}. Revisa tu sección de Asistencia.` });
            onClose();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="rounded-[2.5rem] p-8 sm:max-w-md bg-white border-none shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <service.icon className="h-7 w-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold  uppercase tracking-tight">{service.title}</DialogTitle>
                            <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest">Servicio Financiero RedEconomiX</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Dynamic Fields based on Service ID */}
                        
                        {(service.id === 'retiro-efectivo' || service.id === 'dinero-domicilio' || service.id === 'recarga-credito' || service.id === 'pago-servicios') && (
                            <FormField control={form.control} name="amount" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Monto a Operar</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input type="number" className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-100" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {(service.id === 'retiro-efectivo' || service.id === 'dinero-domicilio' || service.id === 'recarga-credito') && (
                            <FormField control={form.control} name="cardNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Número de Tarjeta</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input placeholder="0000 0000 0000 0000" className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-100" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {service.id === 'recarga-credito' && (
                            <>
                                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Número de Celular</FormLabel>
                                        <FormControl><Input placeholder="Ej: 3875123456" className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="line" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Compañía</FormLabel>
                                        <FormControl><Input placeholder="Personal, Claro, Movistar..." className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </>
                        )}

                        {service.id === 'pago-servicios' && (
                            <>
                                <FormField control={form.control} name="serviceType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Tipo de Servicio</FormLabel>
                                        <FormControl><Input placeholder="Luz, Agua, Gas..." className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="company" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Empresa (Ej: EDESA)</FormLabel>
                                        <FormControl><Input className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="customerId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Número de Cliente / Usuario</FormLabel>
                                        <FormControl><Input className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </>
                        )}

                        {service.id === 'fotocopias' && (
                            <>
                                <FormField control={form.control} name="copies" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Cantidad de Copias</FormLabel>
                                        <FormControl><Input type="number" className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="distance" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Distancia Estimada (km)</FormLabel>
                                        <FormControl><Input type="number" step="0.1" className="h-12 rounded-xl bg-slate-50 border-slate-100" {...field} /></FormControl>
                                        <FormDescription className="text-[9px]">Grátis hasta 1.5km. Luego $2500 x km extra.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </>
                        )}

                        {(service.id === 'dinero-domicilio' || service.id === 'fotocopias' || service.id === 'retiro-efectivo') && (
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold  uppercase text-[10px] tracking-widest text-slate-400">Dirección</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input placeholder="Tu dirección actual" className="h-12 pl-10 rounded-xl bg-slate-50 border-slate-100" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {/* Summary for Topup or Bills */}
                        {service.id === 'recarga-credito' && Number(form.watch('amount')) > 0 && (
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <p className="text-[10px] font-bold uppercase text-primary/60">Resumen de Recarga</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="font-bold text-slate-600">Comisión ($100 x $1000)</span>
                                    <span className="font-bold text-primary">${(Math.ceil(Number(form.watch('amount')) / 1000) * 100).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-400">Cerrar</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-14 bg-primary text-white font-bold  uppercase tracking-tight shadow-lg shadow-red-500/20 flex-1">
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Zap className="mr-2 h-5 w-5" />}
                                Confirmar Pedido
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
