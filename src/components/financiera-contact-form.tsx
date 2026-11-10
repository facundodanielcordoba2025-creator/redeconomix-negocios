"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { CheckCircle } from "lucide-react"
import { useFirestore } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  phone: z.string().min(8, { message: "El teléfono debe tener al menos 8 caracteres." }),
  businessName: z.string().min(2, { message: "El nombre del emprendimiento debe tener al menos 2 caracteres." }),
  cuitCuil: z.string().regex(/^\d{11}$/, { message: "CUIT/CUIL inválido. Ingrese 11 dígitos sin guiones." }),
  businessAddress: z.string().min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  businessAntiquity: z.string().min(1, { message: "Por favor, indica la antigüedad." }),
  businessDescription: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
})

export function FinancieraContactForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        fullName: "",
        email: "",
        phone: "",
        businessName: "",
        cuitCuil: "",
        businessAddress: "",
        businessAntiquity: "",
        businessDescription: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo conectar a la base de datos. Intente de nuevo.",
        });
        return;
    }

    try {
      const inquiriesCollection = collection(firestore, "inquiries");
      await addDoc(inquiriesCollection, {
        name: values.fullName,
        email: values.email,
        phone: values.phone,
        message: `
          Emprendimiento: ${values.businessName}
          CUIT/CUIL: ${values.cuitCuil}
          Dirección: ${values.businessAddress}
          Antigüedad: ${values.businessAntiquity}
          Descripción: ${values.businessDescription}
        `,
        createdAt: serverTimestamp(),
        source: 'Financiera',
      });
      setIsSubmitted(true);
    } catch (error) {
       console.error("Error sending message: ", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Hubo un problema al enviar tu solicitud. Por favor, intenta de nuevo.",
       });
    }
  }

  if (isSubmitted) {
    return (
        <div className="text-center p-8">
            <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-headline">¡Solicitud Enviada!</h2>
            <p className="text-lg text-muted-foreground mt-2">
                Gracias por tu interés. Un asesor se comunicará con vos a la brevedad para guiarte.
            </p>
             <Button onClick={onFormSubmit} className="mt-6">Cerrar</Button>
        </div>
    )
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <h3 className="text-lg font-semibold border-b pb-2">Datos Personales</h3>
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
          </div>
           <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                  <Input placeholder="Tu número de teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />

          <h3 className="text-lg font-semibold border-b pb-2 pt-4">Datos del Emprendimiento</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nombre del Emprendimiento / Razón Social</FormLabel>
                      <FormControl>
                      <Input placeholder="Ej: Las Delicias de Ana" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="cuitCuil"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>CUIT / CUIL</FormLabel>
                      <FormControl>
                      <Input placeholder="Ingrese 11 dígitos sin guiones" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
          </div>

           <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Dirección del Emprendimiento</FormLabel>
                  <FormControl>
                  <Input placeholder="Calle, Número, Localidad" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="businessAntiquity"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Antigüedad del Negocio</FormLabel>
                  <FormControl>
                  <Input placeholder="Ej: 2 años" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />

          <FormField
              control={form.control}
              name="businessDescription"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>¿A qué se dedica tu emprendimiento?</FormLabel>
                  <FormControl>
                  <Textarea
                      placeholder="Contanos brevemente sobre tu negocio, qué productos o servicios ofrecés..."
                      className="resize-none"
                      rows={4}
                      {...field}
                  />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onFormSubmit}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
          </form>
      </Form>
    </div>
  )
}
