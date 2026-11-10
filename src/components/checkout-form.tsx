"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/firebase';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

const paymentSchema = z.object({
  fullName: z.string().min(3, 'El nombre es requerido.'),
  dni: z.string().min(7, 'El DNI es requerido.'),
  email: z.string().email('El email no es válido.'),
  phone: z.string().min(8, 'El teléfono es requerido.'),
  address: z.string().min(5, 'La dirección es requerida.'),
  municipio: z.string().min(3, 'El municipio es requerido.'),
  provincia: z.string().min(3, 'La provincia es requerida.'),
  productId: z.string().min(1, 'Debe seleccionar un producto.'),
  paymentMethod: z.string().min(1, 'Debe seleccionar un método de pago.'),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  subscribe: z.boolean().default(false),
  donate: z.boolean().default(false),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type Product = {
    id: string;
    name: string;
    price: number;
}

interface CheckoutFormProps {
    selectedProductId?: string;
    products: Product[];
}

export function CheckoutForm({ selectedProductId, products }: CheckoutFormProps) {
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);
    
    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            fullName: user?.displayName || '',
            email: user?.email || '',
            dni: '',
            phone: '',
            address: '',
            municipio: '',
            provincia: '',
            productId: selectedProductId || '',
            paymentMethod: '',
            subscribe: false,
            donate: false,
        },
    });

     useEffect(() => {
        if (user) {
            form.setValue('fullName', user.displayName || '');
            form.setValue('email', user.email || '');
        }
    }, [user, form]);

    const paymentMethod = form.watch('paymentMethod');
    const productId = form.watch('productId');

    useEffect(() => {
        const product = products.find(p => p.id === productId);
        setSelectedProductPrice(product ? product.price : 0);
    }, [productId, products]);

     useEffect(() => {
        if (selectedProductId) {
            form.setValue('productId', selectedProductId);
        }
    }, [selectedProductId, form]);

    const taxes = {
        iva: selectedProductPrice * 0.21,
        rentas: selectedProductPrice * 0.05,
        municipalidad: selectedProductPrice * 0.015,
        iibb: selectedProductPrice * 0.03,
    };
    const totalAmount = selectedProductPrice + taxes.iva + taxes.rentas + taxes.municipalidad + taxes.iibb + (form.watch('donate') ? 2500 : 0);

    const onSubmit = (data: PaymentFormValues) => {
        console.log(data);
        toast({
            title: "Procesando Pago...",
            description: "Su pago está siendo procesado. En un entorno real, esto notificaría al administrador y a facturación.",
        });
    };
    
    if (isUserLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
             <div className="text-center py-8">
                <h2 className="text-2xl font-bold">Acceso Requerido</h2>
                <p className="text-muted-foreground mt-2">Por favor, inicie sesión para continuar con la compra.</p>
            </div>
        )
    }

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* User Details */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">1. Datos Personales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre y Apellido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tu nombre completo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tu DNI" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="tu@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tu teléfono" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Calle y número" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="municipio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Municipio</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tu municipio" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="provincia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provincia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Tu provincia" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </section>

                    {/* Product Selection */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">2. Producto y Costos</h3>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Producto o Servicio</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un producto" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map(product => (
                                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {selectedProductPrice > 0 && (
                                <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Importe Neto:</span> <span className="font-medium">${selectedProductPrice.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-muted-foreground"><span>IVA (21%):</span> <span>${taxes.iva.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-muted-foreground"><span>Rentas (5%):</span> <span>${taxes.rentas.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-muted-foreground"><span>Municipalidad (1.5%):</span> <span>${taxes.municipalidad.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-muted-foreground"><span>IIBB (3%):</span> <span>${taxes.iibb.toFixed(2)}</span></div>
                                    {form.watch('donate') && <div className="flex justify-between text-primary"><span>Donación:</span> <span className="font-medium">${(2500).toFixed(2)}</span></div>}
                                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>IMPORTE TOTAL:</span> <span>${totalAmount.toFixed(2)}</span></div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Payment Method */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">3. Método de Pago</h3>
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seleccione una opción</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                         <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Elegir método de pago" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="credit_card">Tarjeta de Crédito/Débito</SelectItem>
                                            <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                                            <SelectItem value="pago_facil">Pago Fácil</SelectItem>
                                            <SelectItem value="rapi_pago">Rapi Pago</SelectItem>
                                            <SelectItem value="cash">Efectivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {paymentMethod === 'credit_card' && (
                            <div className="mt-4 border p-4 rounded-lg space-y-4">
                                <h4 className="font-medium flex items-center gap-2"><CreditCard className="h-5 w-5" /> Ingrese los datos de su tarjeta</h4>
                                <div className="grid gap-4">
                                     <FormField
                                        control={form.control}
                                        name="cardName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre en la tarjeta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Juan Perez" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cardNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de tarjeta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="**** **** **** ****" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                         <FormField
                                            control={form.control}
                                            name="cardExpiry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Vencimiento (MM/AA)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="12/28" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cardCvc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CVC</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Additional Options */}
                    <section className="space-y-4">
                        <FormField
                            control={form.control}
                            name="subscribe"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Sí, quiero adherirme al débito automático mensual para este servicio.
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="donate"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Quiero donar $2.500 a las fundaciones de causas sociales asociadas.
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </section>

                    <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pagar ${totalAmount > 0 ? '$' + totalAmount.toFixed(2) : ''}`}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
