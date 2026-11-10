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
import { Card, CardContent } from "./ui/card"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, FileText, Bike } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { marketplaceServices } from "@/lib/data"


const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Email inválido."),
  phone: z.string().min(8, "Teléfono requerido."),
  message: z.string().min(20, "Detalla tu experiencia (mínimo 20 caracteres)."),
  cv: z.any().optional(),
  services: z.array(z.string()).refine(value => value.length > 0, { message: 'Debes seleccionar al menos un servicio.' }),
  otherService: z.string().optional(),
  hasVehicle: z.enum(["yes", "no"], { required_error: "Debes seleccionar una opción." }),
  vehicleType: z.string().optional(),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehiclePhoto: z.any().optional(),
  platePhoto: z.any().optional(),
  drivingLicensePhoto: z.any().optional(),
  vehicleInsurancePhoto: z.any().optional(),
  hasExtraHelmet: z.boolean().default(false),
}).superRefine((data, ctx) => {
    if (data.hasVehicle === 'yes' && data.services.includes('Moto Taxi')) {
        if (!data.vehicleType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["vehicleType"] });
        if (!data.vehicleBrand) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["vehicleBrand"] });
        if (!data.vehicleModel) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["vehicleModel"] });
        if (!data.vehicleYear) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["vehicleYear"] });
        if (!data.vehiclePlate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Requerido", path: ["vehiclePlate"] });
    }
     if (data.services.includes('otros') && (!data.otherService || data.otherService.length < 3)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Por favor, especifica el otro servicio que ofreces.",
            path: ["otherService"],
        });
    }
    if (data.services.includes('Moto Taxi') && data.hasVehicle !== 'yes') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El vehículo es obligatorio para ser Moto Taxi.", path: ["hasVehicle"] });
    }
    if (data.services.includes('Moto Taxi') && !data.hasExtraHelmet) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes confirmar que tienes un casco adicional.", path: ["hasExtraHelmet"] });
    }
});

export function RrhhContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.displayName || "",
      email: user?.email || "",
      phone: "",
      message: "",
      services: [],
      otherService: "",
      hasVehicle: undefined,
      vehicleType: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      vehiclePlate: "",
      cv: undefined,
      vehiclePhoto: undefined,
      platePhoto: undefined,
      drivingLicensePhoto: undefined,
      vehicleInsurancePhoto: undefined,
      hasExtraHelmet: false,
    },
  })
  
  const hasVehicle = form.watch("hasVehicle");
  const services = form.watch("services");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error de Autenticación",
            description: "Debes iniciar sesión para postularte.",
        });
        return;
    }
    
    try {
      const applicationsCollection = collection(firestore, "providerApplications");
      
      const combinedServices = [...values.services];
      if (values.services.includes('otros') && values.otherService) {
        // Remove 'otros' and add the specific service
        const index = combinedServices.indexOf('otros');
        if (index > -1) {
            combinedServices.splice(index, 1);
        }
        combinedServices.push(values.otherService);
      }
      
      await addDoc(applicationsCollection, {
        userId: user.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        services: combinedServices, // Save the array directly
        hasVehicle: values.hasVehicle,
        vehicleInfo: values.hasVehicle === 'yes' ? {
            type: values.vehicleType,
            brand: values.vehicleBrand,
            model: values.vehicleModel,
            year: values.vehicleYear,
            plate: values.vehiclePlate,
        } : null,
        hasExtraHelmet: values.hasExtraHelmet,
        cvUrl: null, // Placeholder for future file upload logic
        vehiclePhotoUrl: null, // Placeholder
        platePhotoUrl: null, // Placeholder
        drivingLicenseUrl: null, // Placeholder
        insuranceUrl: null, // Placeholder
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      setIsSubmitted(true);
    } catch (error) {
       console.error("Error submitting application: ", error);
       toast({
         variant: "destructive",
         title: "Error al Enviar",
         description: "Hubo un problema al enviar tu postulación. Por favor, intenta de nuevo más tarde.",
       });
    }
  }
  
  if (isSubmitted) {
    return (
        <Card className="text-center bg-white border-slate-100 shadow-xl rounded-[2rem] p-10 max-w-lg w-full mx-auto">
            <div className="mx-auto bg-green-50 text-green-500 p-4 rounded-full mb-6 w-fit shadow-inner">
                <CheckCircle className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">¡Postulación Enviada!</h2>
            <p className="font-bold text-slate-500 mt-4 leading-relaxed text-sm">
                Gracias por tu interés. Hemos recibido tu postulación y nuestro equipo la revisará a la brevedad. Recibirás una notificación con el resultado.
            </p>
        </Card>
    )
  }

  return (
    <Card className="bg-white rounded-[2rem] border-slate-100 shadow-xl max-w-2xl w-full mx-auto">
        <CardContent className="p-6 md:p-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Nombre y Apellido</FormLabel><FormControl><Input placeholder="Tu nombre completo" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Tu número de teléfono" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem><FormLabel>Experiencia y Habilidades</FormLabel><FormControl><Textarea placeholder="Detalla tu experiencia, oficios, estudios o por qué te gustaría ser proveedor..." className="resize-none" rows={5} {...field}/></FormControl><FormMessage /></FormItem>
                )}/>
                
                 <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                        <FormItem>
                        <Accordion type="single" collapsible className="w-full border rounded-md px-4">
                            <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline">
                                <FormLabel>Servicios que Ofrecés</FormLabel>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                                {marketplaceServices.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="services"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-center space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.title)}
                                                onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                return checked
                                                    ? field.onChange([...currentValues, item.title])
                                                    : field.onChange(
                                                        currentValues.filter(
                                                        (value) => value !== item.title
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal text-sm">
                                            {item.title}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                <FormField
                                    key="otros"
                                    control={form.control}
                                    name="services"
                                    render={({ field }) => (
                                    <FormItem
                                        key="otros"
                                        className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes('otros')}
                                            onCheckedChange={(checked) => {
                                             const currentValues = field.value || [];
                                            return checked
                                                ? field.onChange([...currentValues, 'otros'])
                                                : field.onChange(
                                                    currentValues.filter(
                                                    (value) => value !== 'otros'
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                        Otros
                                        </FormLabel>
                                    </FormItem>
                                    )}
                                />
                                </div>
                                {form.watch('services')?.includes('otros') && (
                                <FormField
                                    control={form.control}
                                    name="otherService"
                                    render={({ field }) => (
                                    <FormItem className="mt-2">
                                        <FormLabel>Por favor, especifica el otro servicio</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Ej: Jardinería" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                )}
                            </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <FormMessage className="pt-1" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="hasVehicle"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel>¿Disponés de vehículo para trabajar?</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="yes" /></FormControl>
                                    <FormLabel className="font-normal">Sí</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="no" /></FormControl>
                                    <FormLabel className="font-normal">No</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                {hasVehicle === 'yes' && (
                    <Collapsible open={true} asChild>
                        <CollapsibleContent asChild>
                            <div className="space-y-4 border p-4 rounded-md">
                                <h4 className="font-semibold text-md">Datos del Vehículo</h4>
                                <FormField control={form.control} name="vehicleType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Vehículo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="moto">Moto</SelectItem>
                                                <SelectItem value="auto">Auto</SelectItem>
                                                <SelectItem value="camioneta">Camioneta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="vehicleBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Ej: Honda" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="vehicleModel" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input placeholder="Ej: Wave" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="vehicleYear" render={({ field }) => (<FormItem><FormLabel>Año</FormLabel><FormControl><Input placeholder="Ej: 2022" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="vehiclePlate" render={({ field }) => (<FormItem><FormLabel>Patente</FormLabel><FormControl><Input placeholder="AE 123 CD" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                {services?.includes("Moto Taxi") && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <FormField
                                            control={form.control}
                                            name="drivingLicensePhoto"
                                            render={({ field: { value, ...rest } }) => (
                                                <FormItem><FormLabel>Foto del Carnet de Conducir</FormLabel><FormControl><Input type="file" {...rest} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="vehicleInsurancePhoto"
                                            render={({ field: { value, ...rest } }) => (
                                                <FormItem><FormLabel>Foto del Seguro del Vehículo</FormLabel><FormControl><Input type="file" {...rest} /></FormControl><FormMessage /></FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="hasExtraHelmet"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Declaro que tengo un casco adicional para pasajero.</FormLabel>
                                                    <FormMessage/>
                                                </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}


                <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>¡Importante para Profesionales!</AlertTitle>
                    <AlertDescription>
                        Si tu servicio requiere una matrícula profesional (médicos, abogados, etc.), es <strong>obligatorio</strong> adjuntar una copia de la misma para validar tu postulación.
                    </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="cv"
                  render={({ field: { value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Adjuntar CV o Documentación (PDF, DOCX, JPG)</FormLabel>
                      <FormControl>
                        <Input type="file" {...rest} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Sube tu CV, matrícula profesional u otra documentación relevante.</p>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Enviando..." : "Enviar Postulación"}
                </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}
