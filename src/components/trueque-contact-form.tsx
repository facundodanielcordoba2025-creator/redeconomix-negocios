'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "./ui/card";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

const formSchema = z.object({
  productToOffer: z.string().min(5, "Describí brevemente qué ofrecés."),
  productToOfferState: z.string().min(10, "Detallá el estado del producto."),
  desiredProduct: z.string().min(5, "Contanos qué producto nuevo te interesa."),
  photos: z.any().optional(),
});

export function TruequeContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productToOffer: "",
      productToOfferState: "",
      desiredProduct: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "Debes iniciar sesión para proponer un trueque.",
        });
        return;
    }

    try {
      const inquiriesCollection = collection(firestore, "inquiries");
      await addDoc(inquiriesCollection, {
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber,
        message: `Propuesta de Trueque:\nProducto Ofrecido: ${values.productToOffer}\nEstado: ${values.productToOfferState}\nProducto Deseado: ${values.desiredProduct}`,
        createdAt: serverTimestamp(),
        source: 'Trueque',
      });
      setIsSubmitted(true);
    } catch (error) {
       console.error("Error sending message: ", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Hubo un problema al enviar tu propuesta. Por favor, intenta de nuevo.",
       });
    }
  }

  if (isSubmitted) {
    return (
        <Card className="text-center bg-card/10 border-green-500/20 border p-8">
            <div className="mx-auto bg-green-500/10 text-green-600 p-3 rounded-full mb-4 w-fit">
                <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-headline font-bold">¡Propuesta Enviada!</h2>
            <p className="text-muted-foreground mt-2">
                Gracias por tu interés. Nuestro equipo analizará tu propuesta y se pondrá en contacto para coordinar los siguientes pasos.
            </p>
        </Card>
    )
  }

  return (
    <Card>
        <CardContent className="p-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="productToOffer"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>¿Qué producto querés ofrecer?</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: Celular Samsung S21, Bicicleta mountain bike, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="productToOfferState"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Describí el estado de tu producto</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Detallá el estado, antigüedad, si tiene algún detalle, etc."
                            className="resize-none"
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="desiredProduct"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>¿Qué producto nuevo te interesa?</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: Moto Keller 110cc, Plan Muebles, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjuntá fotos de tu producto</FormLabel>
                      <FormControl>
                        <Input type="file" multiple {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Enviando..." : "Enviar Propuesta"}
                </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
