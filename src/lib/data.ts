

import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GraduationCap, Bus, Eye, Baby, Award, Gift, ShieldCheck, Star, TrendingUp, Smile, Home, Car, Store, Shield, Users, Ticket, HeartHandshake, Smartphone, Wallet, HardHat, Tractor, Truck, Search as SearchIcon, Wrench, Sprout, HandCoins, Rocket, Handshake, Building, Camera, Mountain, Factory, Wind, Atom, FilePen, Pointer, CheckCircle, Hand, ShoppingBag, Fuel, Pill, Tv, Refrigerator, WashingMachine, AirVent, LandPlot, Bike, HeartPulse, Hammer, Ambulance, Dog, UserRound, Banknote, ShieldQuestion, Stethoscope, Check, Film, Lightbulb, BookOpen, Scale, PiggyBank, Briefcase, Landmark, Utensils, Sparkles as SparklesIcon, ShoppingCart, Locate, CreditCard, Percent, MapPin, PartyPopper, Droplet, Recycle, RefreshCw, Package, Sun, Plane, DollarSign, ArrowLeft, Paintbrush, MessageCircle, KeyRound, Coffee, CookingPot, Flame, Layers, Laptop, Shirt, Leaf, UserCheck, Calendar, BookUser, Globe, Copy, Heart } from 'lucide-react';

export const marketplaceServices = [
    { id: 'alquiler-seguro', icon: ShieldCheck, title: "Alquiler Seguro", description: 'Alquilá sin garante y con beneficios únicos.', details: ["Plataforma que conecta inquilinos y propietarios.", "Garantía propia y cobertura de imprevistos."], href: '/alquiler-seguro' },
    { id: 'mecanico-motos', icon: Bike, title: "Servicio mecánico motos", description: 'Mantenimiento y reparación de motocicletas.', details: ["Precios a convenir.", "Presupuesto sin cargo en taller."] },
    { id: 'mecanico-autos', icon: Car, title: "Servicio mecánico autos", description: 'Reparaciones generales y mantenimiento para tu auto.', details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000."] },
    { id: 'auxilio-motos', icon: Ambulance, title: "Auxilio motos", description: 'Asistencia en el lugar para problemas menores con tu moto.', details: ["Servicio de grúa y reparaciones básicas.", "Tarifas varían según la distancia."] },
    { id: 'auxilio-autos', icon: Ambulance, title: "Auxilio autos", description: 'Servicio de remolque y asistencia mecánica para tu auto.', details: ["Cobertura en toda la ciudad.", "Costo de enganche y por km recorrido."] },
    { id: 'electricista', icon: Wrench, title: "Electricista", description: "Instalaciones y reparaciones eléctricas seguras.", details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000 (bonificado si contrata)."] },
    { id: 'plomeria', icon: Wrench, title: "Plomería", description: 'Soluciones para pérdidas de agua, instalaciones y más.', details: ["Precios a convenir.", "Urgencias 24hs disponibles."] },
    { id: 'ninera', icon: Baby, title: "Niñera", description: 'Cuidado responsable y con experiencia para tus hijos.', details: ["Servicio por hora o jornada completa.", "Referencias comprobables."] },
    { id: 'delivery-pequeno', icon: Package, title: "Delivery paquetes pequeños", description: 'Envío rápido y seguro de paquetería en tu zona.', details: ["Tarifas según distancia y tamaño del paquete.", "Seguimiento en tiempo real."] },
    { id: 'transporte-mayorista', icon: Truck, title: "Logística RedEconomiX", description: 'Logística de entrega para pedidos de RedEconomiX con infraestructura propia.', details: ["Vehículos habilitados para transporte de mercadería.", "Vinculación directa con la red."] },
    { id: 'moto-taxi', icon: Bike, title: "Moto taxi", description: 'Traslados rápidos y económicos por la ciudad.', details: ["Requiere casco adicional y seguro para pasajeros.", "Tarifas por distancia."] },
    { id: 'corte-cesped', icon: Leaf, title: "Corte de Césped", description: "Mantené tu jardín impecable.", details: ["Precio a convenir según el tamaño del terreno.", "25% de descuento en el costo total del servicio por ser miembro de la plataforma."] },
    { id: 'mecanico-emergencia', icon: Wrench, title: "Mecánico de emergencia", description: 'Asistencia inmediata para urgencias mecánicas.', details: ["Disponibilidad 24/7.", "Costo de visita y reparación a convenir."] },
    { id: 'nafta-domicilio', icon: Fuel, title: "Nafta a domicilio", description: "¿Te quedaste sin nafta? Te llevamos ayuda.", details: ["Llevamos un bidón de 5L de nafta o gasoil.", "Rango de hasta 10 km.", "Costo del viaje: $5.000 (se abona al solicitar).", "El costo del combustible se abona por separado."] },
    { id: 'reparaciones-basicas', icon: SparklesIcon, title: "Reparaciones Básicas del Hogar", description: "Soluciones rápidas para pequeñas tareas.", details: ["Cambio de focos, tomacorrientes, mover muebles, etc.", "Costo inicial: $5.000 por los primeros 30 minutos.", "Costo adicional: $15.000 por hora."] },
    { id: 'abogado-virtual', icon: Scale, title: "Abogado Virtual", description: "Consultas legales para resolver tus dudas.", details: ["Precios a convenir.", "Costo de presupuesto: $5.000 (bonificado si contrata)."] },
    { id: 'maestra-particular', icon: BookUser, title: "Maestra Particular", description: "Apoyo escolar para todas las materias y niveles.", details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000 (bonificado si contrata)."] },
    { id: 'reparacion-bicicletas', icon: Wrench, title: "Reparación de Bicicletas", description: "Mantenimiento y arreglos para tu bicicleta.", details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000 (bonificado si contrata)."] },
    { id: 'reparacion-muebles', icon: Hammer, title: "Reparación de Muebles", description: "Restauración y arreglos de tus muebles.", details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000 (bonificado si contrata)."] },
    { id: 'cuidado-adultos', icon: HeartHandshake, title: "Cuidado adultos mayores", description: 'Acompañamiento y asistencia para la tercera edad.', details: ["Personal con experiencia y referencias.", "Servicios diurnos, nocturnos o 24hs."] },
    { id: 'cuidado-ninos', icon: Baby, title: "Cuidado de niños", description: 'Cuidado responsable y con experiencia para tus hijos.', details: ["Servicio por hora o jornada completa.", "Referencias comprobables."] },
    { id: 'acompanamiento-hospitalario', icon: Stethoscope, title: "Acompañamiento hospitalario", description: 'Cuidado y compañía para pacientes en sanatorios y hospitales.', details: ["Asistencia y compañía para tus seres queridos.", "Personal con calidez humana."] },
    { id: 'clases-conducir', icon: Car, title: "Clases de conducir", description: "Aprendé a conducir con instructores de confianza.", details: ["Precios a convenir.", "Costo de presupuesto a domicilio: $5.000 (bonificado si contrata)."] },
    { id: 'limpieza-comercial', icon: Store, title: "Limpieza comercial", description: 'Mantenimiento de limpieza para locales y oficinas.', details: ["Servicio por horas o abono mensual.", "Presupuesto sin cargo."] },
    { id: 'limpieza-casas', icon: Home, title: "Limpieza de casas", description: 'Servicio de limpieza profundo o de mantenimiento para tu hogar.', details: ["Servicio por horas o jornada completa.", "Precios a convenir."] },
    { id: 'limpieza-techos', icon: Home, title: "Limpieza de techos", description: 'Remoción de hojas, basura y mantenimiento de canaletas.', details: ["Presupuesto sin cargo según el tamaño y tipo de techo."] },
    { id: 'limpieza-espacios-verdes', icon: Leaf, title: "Limpieza de espacios verdes", description: 'Desmalezamiento y mantenimiento general de jardines y parques.', details: ["Precio a convenir según superficie y estado."] },
    { id: 'enfermeria-domicilio', icon: Stethoscope, title: "Enfermería a domicilio", description: 'Inyecciones, curaciones y control de signos vitales en tu casa.', details: ["Atención por profesional matriculado.", "Tarifas por práctica."] },
    { id: 'acompanante-personal', icon: UserCheck, title: "Acompañante personal", description: 'Compañía y asistencia para trámites, citas médicas o eventos sociales.', details: ["Servicio por hora con total discreción y confianza."] },
    { id: 'amigos-bailar', icon: Users, title: "Amigos para ir a bailar", description: '¿No tenés con quién salir? Te conectamos con gente para formar grupo.', details: ["Servicio de conexión social, no es un servicio de citas.", "Requiere validación de perfil."] },
    { id: 'retiro-efectivo', icon: Banknote, title: "Retiro de Efectivo", description: 'Retirá dinero en efectivo en cualquier negocio adherido.', details: ["Operación segura con tarjeta de débito.", "Monto mínimo $100."] },
    { id: 'dinero-domicilio', icon: Truck, title: "Dinero a Domicilio", description: 'Te llevamos el efectivo a tu casa en minutos.', details: ["Servicio 24hs (recargo nocturno después de las 22hs).", "Seguridad garantizada."] },
    { id: 'recarga-credito', icon: Smartphone, title: "Recarga de Crédito", description: 'Recargá tu celular o el de alguien más al instante.', details: ["Todas las compañías.", "Costo de servicio: $100 por cada $1000."] },
    { id: 'pago-servicios', icon: Lightbulb, title: "Pago de Servicios", description: 'Pagá tus facturas de Luz, Agua, Gas y más.', details: ["Procesamiento en 24hs hábiles.", "Comisión del 3% sobre el total."] },
    { id: 'fotocopias', icon: Copy, title: "Fotocopias a Domicilio", description: 'Envíanos tus archivos y te llevamos las copias.', details: ["Costo por copia: $350.", "Envío gratis hasta 1.5km."] },
    { id: 'acompanamiento-mates', icon: Coffee, title: "Acompañamiento para tomar mates", description: 'Simplemente compañía para charlar y compartir un momento agradable.', details: ["Servicio de compañía por hora.", "Ideal para adultos mayores o personas que viven solas."] }
];

export const promoAlCosto = [
  { id: 'promo1', imageId: 'promoAlCosto1' },
  { id: 'promo2', imageId: 'promoAlCosto2' },
  { id: 'promo3', imageId: 'promoAlCosto3' },
  { id: 'promo4', imageId: 'promoAlCosto4' },
  { id: 'promo5', imageId: 'promoAlCosto5' },
  { id: 'promo6', imageId: 'promoAlCosto6' },
  { id: 'promo7', imageId: 'promoAlCosto7' },
  { id: 'promo8', imageId: 'promoAlCosto8' },
  { id: 'promo9', imageId: 'promoAlCosto9' },
  { id: 'promo10', imageId: 'promoAlCosto10' },
  { id: 'promo11', imageId: 'promoAlCosto11' },
  { id: 'promo12', imageId: 'promoAlCosto12' },
  { id: 'promo13', imageId: 'promoAlCosto13' },
  { id: 'promo14', imageId: 'promoAlCosto14' },
  { id: 'promo15', imageId: 'promoAlCosto15' },
  { id: 'promo16', imageId: 'promoAlCosto16' },
  { id: 'promo17', imageId: 'promoAlCosto17' },
  { id: 'promo18', imageId: 'promoAlCosto18' },
  { id: 'promo19', imageId: 'promoAlCosto19' },
  { id: 'promo20', imageId: 'promoAlCosto20' },
];

export const rentalProperties = [
  {
    id: 'depto-palermo',
    title: 'Moderno Departamento en Palermo',
    price: 250000,
    imageId: 'rentalProperty1',
    description: 'Luminoso departamento de 2 ambientes con balcón. Excelente ubicación cerca de parques y transporte público.',
    location: 'Palermo, Buenos Aires',
  },
  {
    id: 'casa-cordoba',
    title: 'Casa con Pileta en Sierras Chicas',
    price: 350000,
    imageId: 'rentalProperty2',
    description: 'Amplia casa de 3 dormitorios con pileta y jardín. Ideal para familias. Vistas espectaculares.',
    location: 'Sierras Chicas, Córdoba',
  },
  {
    id: 'ph-boedo',
    title: 'PH reciclado en Boedo',
    price: 200000,
    imageId: 'rentalProperty3',
    description: 'Encantador PH de 3 ambientes con patio interno. Completamente reciclado a nuevo. Sin expensas.',
    location: 'Boedo, Buenos Aires',
  },
  {
    id: 'local-belgrano',
    title: 'Local Comercial en Av. Cabildo',
    price: 500000,
    imageId: 'rentalProperty4',
    description: 'Excelente local comercial sobre avenida principal. Apto para diversos rubros. Alto tránsito peatonal.',
    location: 'Belgrano, Buenos Aires',
  },
];


export type Benefit = {
    id: string;
    title: string;
    description: string;
    unlocked?: boolean;
    icon: React.ElementType;
    href?: string;
    imageId?: string;
    details?: {
        title: string;
        description: string;
        requirements: string[];
        price?: number;
        priceSuffix?: string;
    };
    coverage?: string;
    requirements?: string;
};

export const clientBenefits: Benefit[] = [
  { id: 'minicredito', title: 'Minicrédito Renovable', description: 'Accedé a un minicrédito renovable de $50.000 a devolver en 24 cuotas diarias.', icon: CreditCard, coverage: '$ 50.000,00', requirements: 'N/A' },
  { id: 'aporte-jubilatorio', title: 'Aporte Jubilatorio y Sueldo', description: 'Abono mensual de $250.000 para tu caja jubilatoria, obra social, ART y seguro de vida.', icon: Landmark, coverage: '$ 250.000,00', requirements: 'Para acceder al beneficio, el cliente no debe tener moras en los creditos y haber consumido un minimo de compra annual de $15.000.000' },
  { id: 'pasanaku', title: 'Pasanaku Moto Motomel 110cc', description: 'Posibilidad de integrar grupo Pasanaku de 11 personas. Aportá $150.000 mensuales y asegurá tu moto.', icon: Bike, coverage: '$ 1.500.000,00', requirements: 'N/A' },
  { id: 'reintegro-farmacias', title: 'Reintegro en Farmacias (25%)', description: 'Un servicio de reintegro en gastos de farmacia por mes, con un tope de $100.000.', icon: Pill, coverage: 'Hasta $100.000', requirements: 'N/A' },
  { id: 'fallecimiento-laboral', title: 'Fallecimiento Laboral Accidental', description: 'Asistencia económica por fallecimiento del titular de la cuenta.', icon: HeartHandshake, coverage: '$ 1.000.000,00', requirements: 'Presentar fotocopia del DNI y certificado de defunción. En caso de ser familiar, presentar documentación que demuestre el parentesco.' },
  { id: 'fallecimiento-hogar', title: 'Fallecimiento en Hogar Accidental (Adulto)', description: 'Asistencia económica por fallecimiento del titular de la cuenta en el hogar.', icon: HeartHandshake, coverage: '$ 1.500.000,00', requirements: 'Presentar fotocopia del DNI y certificado de defunción. En caso de ser familiar, presentar documentación que demuestre el parentesco.' },
  { id: 'fallecimiento-escolar', title: 'Fallecimiento Escolar Accidental (Menor)', description: 'Asistencia económica por fallecimiento de hijos directos del titular.', icon: HeartHandshake, coverage: '$ 1.500.000,00', requirements: 'Presentar fotocopia del DNI y certificado de defunción. En caso de ser familiar, presentar documentación que demuestre el parentesco.' },
  { id: 'fallecimiento-hogar-menor', title: 'Fallecimiento en Hogar Accidental (Menor)', description: 'Asistencia económica por fallecimiento de hijos directos del titular en el hogar.', icon: HeartHandshake, coverage: '$ 2.000.000,00', requirements: 'Presentar fotocopia del DNI y certificado de defunción. En caso de ser familiar, presentar documentación que demuestre el parentesco.' },
  { id: 'enfermedades-graves-titular', title: 'Enfermedades Graves (Titular)', description: 'Asistencia económica por detección de enfermedades graves.', icon: HeartPulse, coverage: '$ 400.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'enfermedades-graves-familia', title: 'Enfermedades Graves (Familia)', description: 'Asistencia económica para cónyuge o hijos por detección de enfermedades graves.', icon: HeartPulse, coverage: '$ 300.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'internacion-menores', title: 'Internación de Menores', description: 'Asistencia económica para internación de cualquier integrante menor del grupo familiar.', icon: Baby, coverage: '$ 25.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'gastos-medicos-accidente-familia', title: 'Gastos Médicos por Accidente (Familia)', description: 'Asistencia económica por accidentes en la vía pública para cónyuge o hijos.', icon: Ambulance, coverage: '$ 50.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'gastos-medicos-accidente-titular', title: 'Gastos Médicos por Accidente (Titular)', description: 'Asistencia económica por accidentes en la vía pública para el titular.', icon: Ambulance, coverage: '$ 75.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'gastos-medicos-hogar-familia', title: 'Gastos Médicos por Accidente en Hogar (Familia)', description: 'Asistencia económica por accidentes en el hogar para cónyuge o hijos.', icon: Ambulance, coverage: '$ 50.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'gastos-medicos-hogar-titular', title: 'Gastos Médicos por Accidente en Hogar (Titular)', description: 'Asistencia económica por accidentes en el hogar para el titular.', icon: Ambulance, coverage: '$ 40.000,00', requirements: 'Presentar informe médico expedido por organismo público para constatar la lesión.' },
  { id: 'reparaciones-domicilio', title: 'Reparaciones Menores a Domicilio', description: 'Asistencia económica para reparaciones menores. 1 evento por año.', icon: Wrench, coverage: '$ 75.000,00', requirements: 'Presentar factura del servicio a nombre de la empresa.' },
  { id: 'cerrajeria-plomeria', title: 'Cerrajería y Plomería', description: 'Asistencia económica por daños y reparación. 1 evento por año.', icon: KeyRound, coverage: '$ 25.000,00', requirements: 'Presentar factura del servicio a nombre de la empresa.' },
  { id: 'reparacion-gas', title: 'Reparación de Pérdidas de Gas', description: 'Asistencia económica para reparar pérdidas de gas. 1 evento por año.', icon: Shield, coverage: '$ 25.000,00', requirements: 'Presentar factura del servicio a nombre de la empresa.' },
  { id: 'bono-nacimiento', title: 'Bono por Nacimiento', description: 'Asistencia económica por nacimiento de hijo directo del titular.', icon: Baby, coverage: '$ 150.000,00', requirements: 'Presentar certificado de nacimiento y DNI del menor.' },
  { id: 'odontologia-menores', title: 'Odontología Básica (Menores)', description: 'Asistencia económica para atención odontológica de menores. 1 evento por año.', icon: Smile, coverage: '$ 50.000,00', requirements: 'Presentar factura del servicio a nombre de la empresa.' },
  { id: 'fondo-desempleo', title: 'Fondo de Desempleo', description: 'Asistencia económica para personas en relación de dependencia (antigüedad de 2 años).', icon: Briefcase, coverage: '$ 200.000,00', requirements: 'Presentar telegrama de despido, último recibo de sueldo y liquidación final.' },
  { id: 'robo-motos', title: 'Robo de Motos', description: 'Asistencia económica por robo de motovehículo. 1 evento por año.', icon: Bike, coverage: '$ 200.000,00', requirements: 'Presentar denuncia policial del siniestro, titulo de propiedad demostrando ser titular del vehiculo.' },
  { id: 'danos-terceros', title: 'Daños a Terceros', description: 'Asistencia económica por accidente en la vía pública con daños a terceros. 1 evento por año.', icon: Car, coverage: '$ 200.000,00', requirements: 'Presentar denuncia policial del siniestro, demostrar ser titular del vehiculo y datos del tercero involucrado ' },
  { id: 'invalidez-permanente', title: 'Invalidez Permanente', description: 'Asistencia económica por invalidez. Se cobra por única vez.', icon: UserRound, coverage: '$ 500.000,00', requirements: 'Presentar certificado de salud expedido por personal medico + historia clinica demostrando el evento.' },
  { id: 'invalidez-temporaria', title: 'Invalidez Temporaria', description: 'Asistencia económica por invalidez temporaria. 1 evento por año.', icon: UserRound, coverage: '$ 250.000,00', requirements: 'Presentar certificado de salud expedido por personal medico + historia clinica demostrando el evento.' },
  { id: 'asistencia-mudanza', title: 'Asistencia por Mudanza', description: 'Asistencia económica para gastos de mudanza. 1 evento por año.', icon: Truck, coverage: '$ 100.000,00', requirements: 'Presentar factura por servicio de transporte a nombre de la empresa.' },
  { id: 'asistencia-alquiler', title: 'Asistencia para Alquiler', description: 'Asistencia económica para gastos de alquiler. 1 evento por año.', icon: Home, coverage: '$ 200.000,00', requirements: 'Presentar contrato de alquiler + datos del titular para constatar la veracidad del vinculo comercial.' },
  { id: 'asistencia-alquiler-madres', title: 'Asistencia Alquiler (Madres Solteras)', description: 'Beneficio especial de asistencia económica para alquiler. 1 evento por año.', icon: Home, coverage: '$ 200.000,00', requirements: 'Presentar contrato de alquiler + datos del titular para constatar la veracidad del vinculo comercial.' },
  { id: 'asistencia-roturas-hogar', title: 'Asistencia Roturas de Hogar', description: 'Asistencia económica para reparaciones menores en el hogar. 1 evento por año.', icon: Wrench, coverage: '$ 50.000,00', requirements: 'Presentar contrato de alquiler + datos del titular para constatar la veracidad del vinculo comercial.' },
  { id: 'asistencia-pintura-hogar', title: 'Asistencia Pintura de Hogar', description: 'Asistencia económica para pintura básica (color blanco). 1 evento por año.', icon: Paintbrush, coverage: '$ 50.000,00', requirements: 'Presentar contrato de alquiler + datos del titular para constatar la veracidad del vinculo comercial.' },
  { id: 'asistencia-seguridad-hogar', title: 'Asistencia Seguridad de Hogar', description: 'Asistencia económica para reparación de cámaras de seguridad. 1 evento por año.', icon: Camera, coverage: '$ 50.000,00', requirements: 'Presentar factura a nombre de la empresa por el servicio de reparacion de camara de seguridad.' },
  { id: 'reparacion-vehiculo', title: 'Reparación de Vehículo', description: 'Asistencia económica por rotura de auto o moto a nombre del titular. 1 evento por año.', icon: Car, coverage: '$ 100.000,00', requirements: 'Presentar la factura de la reparacion del vehiculo + foto del titulo de propiedad para demotrar la titularidad del vehiculo.' },
  { id: 'remolque-vehicular', title: 'Remolque Vehicular', description: 'Asistencia económica por remolque o traslado de vehículos. 1 evento por año.', icon: Truck, coverage: '$ 50.000,00', requirements: 'Presentar la factura del remolque del vehiculo + foto del titulo de propiedad para demotrar la titularidad del vehiculo.' },
  { id: 'reposicion-documentos', title: 'Reposición Documentos y Llaves', description: 'Asistencia para restitución de documentación por robo. 1 evento por año.', icon: KeyRound, coverage: '$ 50.000,00', requirements: 'debera presentar denuncia policial a nombre del titular.' },
  { id: 'celular-dano', title: 'Daño Accidental de Celular', description: 'Asistencia económica por rotura de celular. 1 evento por año.', icon: Smartphone, coverage: '$ 75.000,00', requirements: 'Debera presentar factura de reparacion del dispositivo + factura de compra del dispositivo para demostrar titularidad.' },
  { id: 'robo-celular', title: 'Robo de Celular', description: 'Asistencia económica por robo de celular. 1 evento por año.', icon: Smartphone, coverage: '$ 150.000,00', requirements: 'Debera presentar denuncia policial con los datos del dispositivo + factura del compra del dispositivo a nombre del titular.' },
  { id: 'robo-notebook', title: 'Robo de Notebook', description: 'Asistencia económica por robo de notebook. 1 evento por año.', icon: Laptop, coverage: '$ 200.000,00', requirements: 'Debera presentar denuncia policial con los datos del dispositivo + factura del compra del dispositivo a nombre del titular.' },
  { id: 'robo-herramientas', title: 'Robo de Herramientas de Trabajo', description: 'Asistencia económica por robo de herramiento de trabajo. / 1 evento por año', icon: Hammer, coverage: '$ 50.000,00', requirements: 'Debera presentar denuncia policial con detalle de los equipos robados + factura de compra de los productos indicados en la denuncia.' },
  { id: 'robo-bolso', title: 'Robo de Bolso/Mochila/Cartera', description: 'Asistencia económica por robo de bolso, mochila o cartera / 1 evento por año', icon: ShoppingBag, coverage: '$ 50.000,00', requirements: 'Debera presentar denuncia policial con detalle de los equipos robados + factura de compra de los productos indicados en la denuncia.' },
  { id: 'robo-extraccion-sucursal', title: 'Robo en Extracción (Sucursal)', description: 'Asistencia económica por robos. / 1 evento por año', icon: Wallet, coverage: '$ 50.000,00', requirements: 'debera presentar denuncia policial a nombre del titular.' },
  { id: 'robo-extraccion-cajero', title: 'Robo en Extracción (Cajero)', description: 'Asistencia económica por robos. / 1 evento por año', icon: Wallet, coverage: '$ 50.000,00', requirements: 'debera presentar denuncia policial a nombre del titular.' },
  { id: 'robo-extraccion-comercio', title: 'Robo en Extracción (Comercios)', description: 'Asistencia económica por robos. / 1 evento por año', icon: Wallet, coverage: '$ 50.000,00', requirements: 'debera presentar denuncia policial a nombre del titular.' },
  { id: 'rotura-cristales-anteojos', title: 'Rotura de Cristales (Anteojos)', description: 'Asistencia económica por rotura / 1 evento por año', icon: Layers, coverage: '$ 50.000,00', requirements: 'Debera presentar factura de reparacion a nombre de la empresa ' },
  { id: 'rotura-cristales-vehiculo', title: 'Rotura de Cristales (Vehículos)', description: 'Asistencia económica por rotura / 1 evento por año', icon: Layers, coverage: '$ 50.000,00', requirements: 'Debera presentar factura de reparacion a nombre de la empresa ' },
  { id: 'rotura-cristales-comercio', title: 'Rotura de Cristales (Comercio)', description: 'Asistencia económica por rotura / 1 evento por año', icon: Layers, coverage: '$ 50.000,00', requirements: 'Debera presentar factura de reparacion a nombre de la empresa ' },
  { id: 'rotura-cristales-vivienda', title: 'Rotura de Cristales (Vivienda)', description: 'Asistencia económica por rotura / 1 evento por año', icon: Layers, coverage: '$ 50.000,00', requirements: 'Debera presentar factura de reparacion a nombre de la empresa ' },
  { id: 'incendio-negocio-25', title: 'Incendio Parcial 25% (Negocio)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 100.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas + habilitacion municipal del negocio.' },
  { id: 'incendio-negocio-50', title: 'Incendio Parcial 50% (Negocio)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 200.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas + habilitacion municipal del negocio.' },
  { id: 'incendio-negocio-100', title: 'Incendio Total (Negocio)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 500.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas + habilitacion municipal del negocio.' },
  { id: 'incendio-vivienda-25', title: 'Incendio Parcial 25% (Vivienda)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 100.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas.' },
  { id: 'incendio-vivienda-50', title: 'Incendio Parcial 50% (Vivienda)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 200.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas.' },
  { id: 'incendio-vivienda-100', title: 'Incendio Total (Vivienda)', description: 'Asistencia económica por incendio / 1 evento por año', icon: Flame, coverage: '$ 500.000,00', requirements: 'Debera presentar denuncia policial + acta de bomberos con plano delimitando la zona afectadas.' },
];
export const benefits = clientBenefits;

export const clientBenefitsTimeline = [
  {
    month: 2,
    title: 'Mes 2 – Protección Inicial',
    description: 'Desde el segundo mes ya estás protegido.',
    icon: ShieldCheck,
    perks: [
      { id: 'fallecimiento-laboral' },
      { id: 'fallecimiento-hogar' },
      { id: 'fallecimiento-escolar' },
      { id: 'fallecimiento-hogar-menor' },
      { id: 'internacion-menores' },
      { id: 'minicredito' },
    ],
  },
  {
    month: 3,
    title: 'Mes 3 – Salud y Protección Personal',
    description: 'Tu salud y tus cosas empiezan a estar cubiertas.',
    icon: HeartPulse,
    perks: [
      { id: 'enfermedades-graves-titular' },
      { id: 'enfermedades-graves-familia' },
      { id: 'reintegro-farmacias' },
      { id: 'pasanaku' },
      { id: 'reposicion-documentos' },
      { id: 'rotura-cristales-anteojos' },
      { id: 'rotura-cristales-vehiculo' },
      { id: 'rotura-cristales-comercio' },
      { id: 'rotura-cristales-vivienda' },
    ],
  },
  {
    month: 4,
    title: 'Mes 4 – Accidentes y Vida Diaria',
    description: 'Te cubrimos ante los imprevistos del día a día.',
    icon: Ambulance,
    perks: [
      { id: 'gastos-medicos-accidente-titular' },
      { id: 'gastos-medicos-accidente-familia' },
      { id: 'gastos-medicos-hogar-titular' },
      { id: 'gastos-medicos-hogar-familia' },
      { id: 'odontologia-menores' },
      { id: 'robo-herramientas' },
      { id: 'robo-bolso' },
    ],
  },
    {
    month: 5,
    title: 'Mes 5 – Seguridad',
    description: 'Soluciones para imprevistos en tu hogar y seguridad financiera.',
    icon: Shield,
    perks: [
      { id: 'cerrajeria-plomeria' },
      { id: 'reparacion-gas' },
      { id: 'robo-extraccion-sucursal' },
      { id: 'robo-extraccion-cajero' },
      { id: 'robo-extraccion-comercio' },
    ],
  },
   {
    month: 6,
    title: 'Mes 6 – Protección Hogar y Negocio',
    description: 'Medio año de confianza que desbloquea asistencias clave.',
    icon: Home,
    perks: [
      { id: 'reparaciones-domicilio' },
      { id: 'asistencia-seguridad-hogar' },
      { id: 'celular-dano' },
      { id: 'incendio-negocio-25' },
      { id: 'incendio-negocio-50' },
      { id: 'incendio-negocio-100' },
      { id: 'incendio-vivienda-25' },
      { id: 'incendio-vivienda-50' },
      { id: 'incendio-vivienda-100' },
    ],
  },
  {
    month: 7,
    title: 'Mes 7 – Movilidad',
    description: 'Más protección en la calle para vos y tu vehículo.',
    icon: Car,
    perks: [
      { id: 'robo-motos' },
      { id: 'danos-terceros' },
    ],
  },
  {
    month: 8,
    title: 'Mes 8 – Estabilidad Laboral',
    description: 'Apoyo económico en momentos difíciles y para tu movilidad.',
    icon: Briefcase,
    perks: [
      { id: 'fondo-desempleo' },
      { id: 'reparacion-vehiculo' },
      { id: 'remolque-vehicular' },
    ],
  },
  {
    month: 9,
    title: 'Mes 9 – Familia',
    description: 'Beneficios que acompañan los momentos importantes de la vida.',
    icon: Baby,
    perks: [
      { id: 'bono-nacimiento' },
      { id: 'robo-celular' },
    ],
  },
   {
    month: 10,
    title: 'Mes 10 – Protección Mayor',
    description: 'Coberturas integrales para situaciones de salud y trabajo.',
    icon: Award,
    perks: [
      { id: 'invalidez-permanente' },
      { id: 'invalidez-temporaria' },
      { id: 'robo-notebook' },
    ],
  },
   {
    month: 12,
    title: 'Mes 12 – Nivel Premium',
    description: 'Un año con RedEconomiX y tu vida está respaldada.',
    icon: Star,
    perks: [
      { id: 'aporte-jubilatorio' },
      { id: 'asistencia-mudanza' },
      { id: 'asistencia-alquiler' },
      { id: 'asistencia-alquiler-madres' },
      { id: 'asistencia-roturas-hogar' },
      { id: 'asistencia-pintura-hogar' },
    ],
  },
];

export const portalBanners = [
  {
    title: 'RedEconomiX',
    subtitle: 'Personas y Comercios',
    description: 'Un ecosistema de ahorro, crédito y beneficios diseñado para que cada persona y negocio en Argentina pueda progresar, alcanzar sus metas y asegurar su tranquilidad.',
    href: '/marketplace',
    imageId: 'bannerCrecer'
  },
];

export const ffaaExclusiveBenefits = [
    {
        id: 'ffaa-juicios',
        title: 'Juicios por Aportes y Retroactivos',
        description: 'Iniciá tu reclamo previsional sin costos iniciales y pagá solo si ganamos.',
        icon: Scale,
        imageId: 'ffaaJuiciosCardNew',
        href: '#',
        details: {
            title: 'Juicios por Aportes y Retroactivos',
            includes: 'Análisis previsional inicial 100% gratuito. Revisión de aportes, haberes y situación ante IAF. Informe de viabilidad del reclamo. Gestión administrativa y/o judicial del reclamo. Seguimiento del expediente y gestión del retroactivo.',
            cost: 'Inicio del trámite SIN CARGO. Comisión del 20% sobre el monto efectivamente cobrado. Si no hay resultado, no pagas nada.'
        }
    },
    {
        id: 'ffaa-limpieza-veraz',
        title: 'Limpieza de Firma y Deudas',
        description: 'Gestionamos la rectificación de tus datos en Veraz y otros registros, sin cargo inicial.',
        icon: PiggyBank,
        imageId: 'ffaaLimpiezaCardNew',
        href: '#',
        details: {
            title: 'Limpieza de Firma y Deudas en Veraz',
            appliesTo: 'Personal FFAA con firma afectada en Veraz, B.C.R.A., etc., por deudas impagas o mal informadas (con 5+ años de antigüedad).',
            whatIsManaged: 'Rectificación de datos erróneos y actualización de deudas canceladas. Eliminación o reducción de registros negativos.',
            cost: 'Consulta inicial y trámite SIN CARGO. Comisión del 20% sobre el monto de la deuda efectivamente limpiada. Si no se logra, no pagas nada.'
        }
    },
    {
        id: 'ffaa-salud-infantil',
        title: 'Beneficios Solidarios de Salud',
        description: 'Alojamiento y comida para vos y un acompañante si tu hijo necesita tratamiento médico lejos de casa.',
        icon: Baby,
        imageId: 'ffaaSaludInfantil',
        href: '#',
        details: {
            title: 'Beneficio Familiar Solidario',
            whatItCovers: 'Alojamiento y comida diaria para el titular y un acompañante. Duración: Hasta 60 días, continuos o fraccionados.',
            cost: 'TOTALMENTE GRATUITO. Un beneficio exclusivo para personal de las Fuerzas Armadas.'
        }
    },
    {
        id: 'ffaa-uniformes',
        title: 'Renovación de Uniformes GRATIS',
        description: 'Recibí un uniforme completo una vez al año, totalmente gratis, por ser socio.',
        icon: Briefcase,
        imageId: 'ffaaUniformes',
        href: '#',
        details: {
            title: 'Renovación de Uniforme GRATIS',
            includes: 'Como miembro activo de las FFAA y socio de RedEconomiX, te enviamos un uniforme completo una vez al año, totalmente gratis. Solo necesitas tener 6 meses de antigüedad y tus cuotas al día. Participan todas las fuerzas armadas de la Republica Argentina.',
            cost: 'TOTALMENTE GRATUITO.'
        }
    }
];

export const ffaaBenefitCategories = [
    {
        category: "Asistencia Legal y Previsional",
        icon: Scale,
        items: [
            { name: 'Juicios de reajuste de haberes', detail: 'Sin costo inicial' },
            { name: 'Reclamos por aportes no registrados', detail: 'A resultado' },
            { name: 'Gestión de pensiones y retiros', detail: 'Asesoramiento' },
        ]
    },
    {
        category: "Apoyo Financiero",
        icon: Banknote,
        items: [
            { name: 'Limpieza de firma en Veraz', detail: 'Sin costo inicial' },
            { name: 'Acceso a microcréditos', detail: 'Condiciones preferenciales' },
            { name: 'Asesoramiento para deudas', detail: 'Gratuito' },
        ]
    },
    {
        category: "Beneficios Familiares y Solidarios",
        icon: HeartHandshake,
        items: [
            { name: 'Renovación de uniforme anual', detail: 'Gratis' },
            { name: 'Traslado y alojamiento por salud infantil', detail: 'Cobertura total' },
            { name: 'Bono por nacimiento', detail: '$150.000' },
        ]
    }
];


export const platformBenefits = [
  {
      icon: DollarSign,
      title: "Ahorro",
      description: "Accedé a precios de mayorista, descuentos exclusivos y beneficios que potencian tu poder de compra."
  },
  {
      icon: Handshake,
      title: "Conexión",
      description: "Formá parte de una red que une a comercios, proveedores y servicios en un ecosistema colaborativo."
  },
  {
      icon: Rocket,
      title: "Oportunidades",
      description: "Encontrá nuevas vías de ingreso, equipá tu negocio y accedé a créditos para crecer sin límites."
  },
];

export const trustMetrics = [
  { value: '+10.000', label: 'usuarios activos' },
  { value: '+500', label: 'emprendedores' },
  { value: '+50', label: 'ciudades conectadas' },
];

export const marketplaceCategories = [
    { href: '/alquileres', icon: Home, label: 'Alquileres Cohete' },
    { href: '/?q=sorteos', icon: Ticket, label: 'Sorteos' },
    { href: '/?q=llavero-digital', icon: KeyRound, label: 'Llavero Digital' },
    { href: '/?q=vehiculos', icon: Car, label: 'Vehículos' },
    { href: '/?q=viviendas', icon: Home, label: 'Viviendas' },
    { href: '/?q=pasanaku', icon: Bike, label: 'Pasanaku' },
    { href: '/?q=celulares', icon: Smartphone, label: 'Celulares' },
    { href: '/?q=creditos', icon: Banknote, label: 'Créditos' },
    { href: '/?q=microasistencia', icon: ShieldCheck, label: 'Microasistencia' },
    { href: '/?q=beneficios', icon: Award, label: 'Beneficios' },
    { href: '/?q=proyectos', icon: HardHat, label: 'Proyectos' },
    { href: '/alquiler-seguro', icon: ShieldCheck, label: 'Alquiler Seguro' },
];

export const mainNavGroups = [
  {
    title: 'Principal',
    items: [
      { href: '/marketplace', icon: Store, label: 'Marketplace' },
      { href: '/rental-total', icon: Car, label: 'Renta CAR' },
      { href: '/benefits', icon: Award, label: 'Beneficios y Promos' },
      { href: '/redcashback', icon: HandCoins, label: 'RedCashback' },
    ],
  },
  {
      title: 'Categorías',
      items: marketplaceCategories,
  },
  {
    title: 'Herramientas',
    items: [
      { href: '/creditos', icon: Banknote, label: 'Créditos' },
      { href: '/redeconomix/servicios', icon: Handshake, label: 'Servicios' },
      { href: '/redeconomix/prestadores/panel', icon: Briefcase, label: 'Panel Prestador' },
    ],
  },
  {
    title: 'Nuestra Comunidad',
    items: [
        { href: "/rse", icon: HeartHandshake, label: "RSE" },
        { href: "/redeconomix/emprendedores", icon: Bike, label: "Emprendedores" },
    ]
  }
];

export const productCategories = [
    {
        title: "Vehículos",
        products: [
            { id: "chevrolet-onix", name: "CHEVROLET ONIX PLUS 1.0T LT MT", price: 250000, priceSuffix: '+ imp.', imageIds: ["chevroletOnix1"], href: '/marketplace/chevrolet-onix' },
            { id: "fiat-cronos", name: "Fiat Cronos 0 Km", price: 199900, priceSuffix: '+ imp.', imageIds: ["fiatCronos1"], href: '/marketplace/fiat-cronos' },
            { id: "vw-vento", name: "Volkswagen Vento 2011 o similar", price: 150000, priceSuffix: '+ imp.', imageIds: ["volkswagenVento1"], href: '/marketplace/volkswagen-vento' },
            { id: "vw-gol", name: "Volkswagen Gol 2012 o similar", price: 100000, priceSuffix: '+ imp.', imageIds: ["volkswagenGol1"], href: '/marketplace/volkswagen-gol' }
        ]
    },
    {
        title: "Motos",
        products: [
            { id: "honda-tornado", name: "HONDA XR 300L TORNADO", price: 125000, priceSuffix: '+ imp.', imageIds: ["hondaTornado1"], href: '/marketplace/honda-xr-300l-tornado' },
            { id: "benelli-trk-502", name: "BENELLI TRK 502", price: 135000, priceSuffix: '+ imp.', imageIds: ["benelliTrk502_1"], href: '/marketplace/benelli-trk-502' },
            { id: "zanella-zr150", name: "MOTO ZANELLA ZR150", price: 90000, priceSuffix: '+ imp.', imageIds: ["zanellaZr150"], href: '/marketplace/zanella-zr150' },
            { id: "rouser-125", name: "MOTO ROUSER 125cc", price: 75000, priceSuffix: '+ imp.', imageIds: ["rouser125"], href: '/marketplace/rouser-125' },
            { id: "keller-110", name: "MOTO KELLER 110cc", price: 50000, priceSuffix: '+ imp.', imageIds: ["keller110"], href: '/marketplace/keller-110' },
        ]
    },
    {
        title: "Viviendas",
        products: [
            { id: "casa-terreno", name: "Plan Casa de Ladrillo 45m² + Terreno 150m²", price: 249900, priceSuffix: '+ imp.', imageIds: ["casaTerreno1"], href: '/marketplace/casa-terreno' },
            { id: "casa-steel", name: "Plan Casa Steel 45m² + Cochera 14m² + Terreno 147m²", price: 199900, priceSuffix: '+ imp.', imageIds: ["steelFrameGallery1"], href: '/marketplace/casa-steel' },
            { id: "cabana", name: "Cabaña de Madera 45m2 + Cochera Liviana 14m2 + Terreno 147m2", price: 99900, priceSuffix: '+ imp.', imageIds: ["cabana1"], href: '/marketplace/cabana' },
            { id: "cabana-30m2", name: "Cabaña de Madera 30m2 + Cochera Liviana 14m2 (no incluye Terreno)", price: 75000, priceSuffix: '+ imp.', imageIds: ["cabana30m2_1"], href: '/marketplace/cabana-30m2' },
            { id: "casa-eps-sip", name: "Casa EPS / SIP de 45m2 + Cochera Liviana de 14m2 + Terreno de 147m2", price: 149900, priceSuffix: '+ imp.', imageIds: ["casaEpsSip1"], href: '/marketplace/casa-eps-sip' },
            { id: "refaccion-casa", name: "CASA Refaccionada", price: 49900, priceSuffix: '+ imp.', imageIds: ["casaRefaccionada"], href: '/marketplace/refaccion-casa' },
        ]
    },
    {
        title: "Emprendimientos",
        products: [
            { id: 'pack-sandwicheria-plus', name: 'PACK SANDWICHERÍA PLUS', price: 50000, priceSuffix: '/mes + imp.', imageIds: ['sandwicheria'], href: '/redeconomix/emprendedores/sandwicheria-plus' },
            { id: 'pack-kiosko-plus', name: 'PACK KIOSKO PLUS', price: 0, imageIds: ['kiosko'], href: '/redeconomix/emprendedores/kiosko-plus' },
            { id: 'pack-panaderia', name: 'PACK PANADERÍA', price: 0, imageIds: ['panaderia'], href: '/redeconomix/emprendedores/panaderia' },
            { id: 'pack-verduleria-pro', name: 'PACK VERDULERÍA PRO', price: 0, imageIds: ['verduleria'], href: '/redeconomix/emprendedores/verduleria-pro' },
            { id: 'pack-tienda-femenina', name: 'PACK TIENDA FEMENINA', price: 0, imageIds: ['tiendaFemenina'], href: '/redeconomix/emprendedores/tienda-femenina' },
        ]
    },
    {
        title: "Alquiler Seguro",
        products: rentalProperties.map(p => ({...p, href: '/alquiler-facil', id: p.id, name: p.title, description: p.description, price: p.price, priceSuffix: '/mes', imageIds: [p.imageId]}))
    }
];

export const adminInquiries = [
  { id: 'inq-1', name: 'Ana Torres', email: 'ana.t@example.com', message: 'Hola, tengo una consulta sobre mi último pago, no se ve reflejado en la app.', createdAt: new Date(2024, 6, 21), source: 'Soporte General', status: 'pending', handledBy: null },
  { id: 'inq-4', name: 'Marta Diaz', email: 'marta.d@example.com', message: 'Tengo un grupo de 5 mujeres emprendedoras y queremos solicitar el Crédito CONECTAR.', createdAt: new Date(2024, 6, 18), source: 'Financiera', status: 'resolved', handledBy: 'Ana Clara' },
  { id: 'inq-5', name: 'Distribuidora PG', email: 'pgdistribuciones@email.com', message: 'No puedo cargar nuevos productos a mi catálogo en RedEconomiX, me da un error.', createdAt: new Date(2024, 6, 22), source: 'Soporte', status: 'pending', handledBy: null },
];

export const adminTeam = [
  { id: 'team-1', name: 'Facundo Córdoba', email: 'facundo.cordoba@example.com', dni: '30123456', role: 'Admin', status: 'Active' },
  { id: 'team-2', name: 'Lucía Ferreyra', email: 'lucia.ferreyra@example.com', dni: '32789123', role: 'Gestor de Pedidos', status: 'Active' },
  { id: 'team-3', name: 'Marcos Rojo', email: 'marcos.rojo@example.com', dni: '28456789', role: 'Soporte', status: 'Blocked' },
  { id: 'team-4', name: 'Carla Diaz', email: 'carla.diaz@example.com', dni: '35987654', role: 'Editor de Productos', status: 'Active' },
];

export const adminStats = [
  { name: 'Ingresos (Últ. Mes)', icon: 'DollarSign', value: '$45,231.89', change: '+20.1%'},
  { name: 'Nuevos Socios', icon: 'Users', value: '+2350', change: '+180.1%'},
  { name: 'Créditos Otorgados', icon: 'CreditCard', value: '+12,234', change: '+19%'},
  { name: 'Actividad de la Red', icon: 'Activity', value: '+573', change: '+201'},
];

export const recentSales = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
  },
];

export const pendingInquiries = [
  {
    name: "Constructora del Sur",
    message: "Solicitud de cotización para maquinaria pesada...",
    source: "Connect",
  },
  {
    name: "Mariana Gomez",
    message: "Consulta sobre crédito para emprendedoras...",
    source: "Financiera",
  },
];

export const membershipBenefits = [
    { icon: Ticket, text: 'Participación automática en el Sorteo Anual.' },
    { icon: Percent, text: 'Acceso a descuentos exclusivos para Clientes Selectos.' },
    { icon: SparklesIcon, text: 'Acceso anticipado a promociones especiales.' },
    { icon: ShoppingCart, text: 'Ofertas mayoristas especiales solo para miembros.' },
];

export const clubGanadorPrizes = [
    {
        title: '10 premios de $1.000.000',
        description: 'Diez oportunidades de ganar un millón de pesos para impulsar tu economía o tu negocio.',
        imageIds: ['premio_efectivo_arg'],
        icon: Banknote,
    },
    {
        title: '5 premios de $2.000.000',
        description: 'Un gran impulso financiero para tus proyectos o compras mayores en la plataforma.',
        imageIds: ['premio_efectivo_arg'],
        icon: DollarSign,
    },
    {
        title: '30 premios de $100.000',
        description: 'Treinta premios en efectivo o saldo para tus consumos y compras diarias.',
        imageIds: ['premio_efectivo_arg'],
        icon: Banknote,
    },
    {
        title: '10 Motos Motomel 110 cc',
        description: 'Ideal para tu delivery o uso personal. Ganá una moto 0km para potenciar tu logística.',
        imageIds: ['premio_moto_motomel'],
        icon: Bike,
    },
    {
        title: '2 Chevrolet Montana LT',
        description: 'Una camioneta versátil y moderna para tu trabajo, herramientas o paseos en familia.',
        imageIds: ['premio_chevrolet_montana'],
        icon: Car,
    },
    {
        title: '2 Cabañas de 3 Dormitorios',
        description: 'El lugar de descanso soñado para disfrutar con toda la familia en la naturaleza.',
        imageIds: ['premio_cabana_arg'],
        icon: Home,
    },
    {
        title: '2 Casas Prefabricadas',
        description: 'El premio que cambia tu vida: una casa con la solidez y rapidez de la construcción en seco.',
        imageIds: ['premio_casa_prefab'],
        icon: Home,
    },
    {
        title: '2 Autos VW Polo Track',
        description: 'Un auto ágil y compacto, perfecto para el uso urbano y tus viajes.',
        imageIds: ['premio_vw_polo'],
        icon: Car,
    },
    {
        title: '8 Notebooks de Trabajo',
        description: 'Herramienta fundamental para potenciar tu productividad, estudio o desarrollo online.',
        imageIds: ['premio_notebook'],
        icon: Laptop,
    },
    {
        title: '10 Smart TVs 55"',
        description: 'El mejor entretenimiento con excelente calidad de imagen para tu living o habitación.',
        imageIds: ['premio_smart_tv'],
        icon: Tv,
    }
];

export const importantConditions = [
    "Ser miembro activo de RedEconomiX y estar al día con los pagos es un requisito indispensable para participar.",
    "Para participar del sorteo, es necesario contar con una antigüedad mínima de 6 meses como miembro activo en la plataforma.",
    "El sorteo se realizará durante el mes de diciembre de cada año, en una fecha que será confirmada por la plataforma.",
    "Los premios son intransferibles y no podrán ser canjeados por su valor en efectivo bajo ninguna circunstancia.",
    "El ganador será notificado a través de los datos de contacto registrados en su perfil y tendrá 30 días corridos para reclamar su premio.",
    "RedEconomiX Argentina se reserva el derecho de modificar los premios o las condiciones del sorteo, notificando previamente a los participantes."
];


export const clubGanadorEscalera = [
    { month: 'Enero', prize: 'Kit Verano (sombrilla, reposeras, conservadora)', icon: Sun },
    { month: 'Febrero', prize: 'Cena para 2 personas', icon: Utensils },
    { month: 'Marzo', prize: 'Sorteo de varios celulares', icon: Smartphone },
    { month: 'Abril', prize: 'Sorteo de electrodomésticos', icon: Refrigerator },
    { month: 'Mayo', prize: 'Sorteo de motos', icon: Bike },
    { month: 'Junio', prize: 'Sorteo de un auto 0km', icon: Car },
    { month: 'Julio', prize: 'Sorteo de un viaje', icon: Plane },
    { month: 'Agosto', prize: 'Sorteo de una casa', icon: Home },
    { month: 'Septiembre', prize: 'Sorteo de un sueldo por un año', icon: DollarSign },
    { month: 'Octubre', prize: 'Sorteo de un millón de pesos', icon: Banknote },
    { month: 'Noviembre', prize: 'Sorteo de dos autos 0km', icon: Car },
    { month: 'Diciembre', prize: '¡Sorteo final con todos los premios acumulados durante el año!', icon: Award },
];

export const clubGanadorSteps = [
    {
        icon: ShoppingCart,
        title: "1. Comprá en la Red",
        description: "Cada compra que realizás en la app de RedEconomiX suma puntos automáticamente a tu cuenta."
    },
    {
        icon: Star,
        title: "2. Acumulá Puntos",
        description: "Tus puntos se acumulan sin fecha de vencimiento. Mientras más comprás, más puntos tenés."
    },
    {
        icon: Gift,
        title: "3. Canjeá Premios",
        description: "Usá tus puntos acumulados para canjear premios increíbles, desde electrodomésticos hasta una casa."
    }
];

export const pasanakuPlanes = [
    {
        level: 'Base A',
        moto: 'Keller Crono Eco 110',
        valor: '1.350.000',
        cuota: '129.000',
        publico: 'Primera moto / ultra accesible',
        color: 'bg-green-500/10 text-green-700 dark:text-green-400',
        imageId: 'keller110'
    },
    {
        level: 'Base B',
        moto: 'Motomel Blitz 110 Base',
        valor: '1.500.000',
        cuota: '149.000',
        publico: 'Uso urbano diario',
        color: 'bg-green-500/10 text-green-700 dark:text-green-400',
        imageId: 'giveawayMoto110'
    },
    {
        level: 'Intermedio A',
        moto: 'Corven Triax 150',
        valor: '~3.000.000',
        cuota: '250.000',
        publico: 'Upgrade desde 110 cc',
        color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        imageId: 'zanellaZr150'
    },
    {
        level: 'Intermedio B',
        moto: 'Bajaj Rouser NS 125',
        valor: '~4.800.000',
        cuota: '400.000',
        publico: 'Marca + diseño deportivo',
        color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
        imageId: 'rouser125'
    },
    {
        level: 'Premium',
        moto: 'Yamaha FZ 4.0',
        valor: '7.500.000',
        cuota: '650.000',
        publico: 'Performance / aspiracional',
        color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        imageId: 'benelliTrk502_1'
    },
    {
        level: 'Alta Gama',
        moto: 'Yamaha XTZ 250',
        valor: '10.500.000',
        cuota: '920.000',
        publico: 'Off-road / profesional',
        color: 'bg-red-500/10 text-red-700 dark:text-red-400',
        imageId: 'hondaTornado1'
    }
];

export const creditProducts = [
    {
        icon: Rocket,
        title: "Microcreditos",
        description: "Financiación 100% online y en el acto para tu emprendimiento. Comenzá con $50.000 y accedé a montos mayores a medida que cumplís.",
        href: "/marketplace/creditos/microcreditos"
    },
    {
        icon: Users,
        title: "Préstamos Urgentes",
        description: "Soluciones individuales para personas de medianos y bajos ingresos, con un servicio justo, responsable y oportuno para tus necesidades.",
        href: "/marketplace/creditos/urgentes"
    },
    {
        icon: Landmark,
        title: "Financiera CONECTAR",
        description: "Línea de microcréditos grupales para mujeres emprendedoras que no tienen acceso a la banca tradicional.",
        href: "/marketplace/financiera"
    },
    {
        icon: Wrench,
        title: "Crédito para Reparaciones",
        description: "Financiación para arreglar tu auto o moto. Volvé al ruedo sin que tu bolsillo lo sienta.",
        href: "/marketplace/creditos/reparacion-vehiculos"
    },
    {
        icon: Bike,
        title: "Crédito para Motos de Delivery",
        description: "La herramienta que necesitás para empezar a trabajar o renovar tu moto de reparto.",
        href: "/marketplace/creditos/moto-delivery"
    },
    {
        icon: PartyPopper,
        title: "Crédito para Fiestas",
        description: "Festejá esos momentos únicos, como los 15 o los 18, sin preocuparte por el dinero.",
        href: "/marketplace/creditos/fiesta-15"
    }
];

export const testimonials = [
  {
    name: "Laura Pérez",
    role: "Dueña de Kiosco 'El Sol'",
    quote: "Desde que uso RedEconomiX, mis márgenes de ganancia mejoraron un 20%. Compro más barato y gestiono mi stock desde el celular con RedEconomiX. ¡Me cambió el negocio!",
    avatarId: "userAvatar2"
  },
  {
    name: "Carlos Gomez",
    role: "Distribuidora 'El Abasto'",
    quote: "La plataforma me abrió un nuevo canal de ventas y me simplificó la logística. Ahora llego a comercios que antes era imposible contactar. El sistema de pedidos es excelente.",
    avatarId: "userAvatar3"
  },
  {
    name: "Sofía Diaz",
    role: "Repartidora Asociada",
    quote: "Ser repartidora en RedEconomiX me da la flexibilidad que necesito. Gano dinero extra en mis tiempos libres y la app es súper fácil de usar. Lo recomiendo 100%.",
    avatarId: "userAvatar1"
  }
];

export const footerNav = {
    title: 'Navegación',
    links: [
        { href: "/rrhh", label: "RRHH" },
    ]
};

export const footerContact = {
    title: 'Contacto',
    address: 'Av. Belgrano 687, 5° Piso, Of. 30<br/>C1092AAG, CABA, Argentina',
    links: []
};

export const constructionSystems = [
    {
        name: "Steel Framing",
        value: "steel-frame",
        idealFor: "Viviendas eficientes y rápidas.",
        advantage: "Rapidez y eficiencia",
        description: "Sistema en seco con perfiles de acero galvanizado. Ofrece excelente aislación, rapidez de obra y flexibilidad de diseño.",
        plans: [
            { name: 'Plan 45m²', description: 'Vivienda 2 dormitorios, 1 baño', price: 'USD 50.000', includes: ['Estructura completa', 'Instalaciones básicas', 'Revestimiento exterior', 'Aberturas de aluminio'] },
            { name: 'Plan 60m²', description: 'Vivienda 2 dorm, 2 baños', price: 'USD 65.000', includes: ['Todo lo del plan 45m²', 'Revestimientos interiores', 'Pisos cerámicos'] },
            { name: 'Plan 90m²', description: 'Vivienda 3 dorm, 2 baños, suite', price: 'USD 90.000', includes: ['Todo lo del plan 60m²', 'Muebles de cocina', 'Placares'] },
        ]
    },
    {
        name: "Ladrillo",
        value: "ladrillo",
        idealFor: "Construcción tradicional y robusta.",
        advantage: "Solidez y confianza",
        description: "Construcción húmeda tradicional. Estructura de hormigón armado, mampostería de ladrillo cerámico y losa.",
        plans: [
            { name: 'Plan 45m²', description: 'Vivienda 2 dormitorios, 1 baño', price: 'USD 55.000', includes: ['Fundaciones', 'Estructura H°A°', 'Mampostería completa', 'Techo de losa'] },
            { name: 'Plan 60m²', description: 'Vivienda 2 dorm, 2 baños', price: 'USD 72.000', includes: ['Todo lo del plan 45m²', 'Revoques completos', 'Contrapisos'] },
            { name: 'Plan 90m²', description: 'Vivienda 3 dorm, 2 baños, suite', price: 'USD 100.000', includes: ['Todo lo del plan 60m²', 'Instalaciones completas', 'Aberturas'] },
        ]
    },
    {
        name: "EPS / SIP",
        value: "eps-sip",
        idealFor: "Máxima aislación y ahorro energético.",
        advantage: "Eficiencia energética",
        description: "Paneles SIP con núcleo EPS de alta densidad y caras cementicias. Rápido montaje y máxima eficiencia térmica.",
        plans: [
            { name: 'Plan 45m²', description: 'Vivienda 2 dormitorios, 1 baño', price: 'USD 52.000', includes: ['Paneles SIP estructurales', 'Montaje sobre platea', 'Techo SIP', 'Aberturas PVC DVH'] },
            { name: 'Plan 60m²', description: 'Vivienda 2 dorm, 2 baños', price: 'USD 68.000', includes: ['Todo lo del plan 45m²', 'Instalaciones básicas', 'Revestimiento exterior'] },
            { name: 'Plan 90m²', description: 'Vivienda 3 dorm, 2 baños, suite', price: 'USD 95.000', includes: ['Todo lo del plan 60m²', 'Revestimientos interiores', 'Pisos flotantes'] },
        ]
    }
];

export const rseCauses = [
    {
        title: "Reduciendo el Déficit Habitacional",
        description: "Creemos que una vivienda digna es el pilar para el desarrollo de cualquier familia. Por eso, colaboramos activamente con la Fundación TECHO, donando materiales y recursos para la construcción de viviendas de emergencia en asentamientos populares. Cada compra en nuestra plataforma nos acerca más a la meta de que más familias tengan un lugar seguro al que llamar hogar.",
        link: "https://www.techo.org/argentina/",
        linkText: "Conocé más sobre TECHO",
        logoId: "techoLogo"
    },
    {
        title: "Apoyando la Salud Infantil",
        description: "La salud de los más chicos es una prioridad absoluta. Nos enorgullece ser un socio estratégico de la Fundación Garrahan, aportando recursos para la compra de equipamiento médico de alta complejidad y el sostenimiento de la Casa Garrahan, que aloja a niños de todo el país mientras reciben tratamiento.",
        link: "https://www.fundaciongarrahan.org/",
        linkText: "Colaborá con la Fundación Garrahan",
        logoId: "garrahanLogo"
    },
    {
        title: "Combatiendo la Desnutrición Infantil",
        description: "En el norte argentino, la desnutrición es una dura realidad. Trabajamos mano a mano con la Fundación Pata Pila, que realiza un trabajo admirable en comunidades originarias de Salta. Nuestros aportes se destinan a sus programas de nutrición, atención médica y desarrollo infantil temprano.",
        link: "https://patapila.org/",
        linkText: "Sumate a Pata Pila",
        logoId: "patapilaLogo"
    }
];

export const rseDevelopmentIdeas = [
  {
    icon: Tractor,
    title: "Comedores Rurales",
    description: "Crear una red de apoyo para comedores en zonas rurales, garantizando el acceso a alimentos nutritivos para niños y familias.",
    details: {
      title: "Apoyo a Comedores Rurales",
      description: "Desarrollaremos un sistema logístico para que los excedentes de producción de nuestros mayoristas asociados lleguen a comedores escolares y comunitarios en parajes rurales, combatiendo el desperdicio de alimentos y la inseguridad alimentaria."
    }
  },
  {
    icon: Sprout,
    title: "Huertas Comunitarias",
    description: "Fomentar la creación de huertas orgánicas en barrios, promoviendo la soberanía alimentaria y la alimentación saludable.",
    details: {
      title: "Fomento de Huertas Comunitarias",
      description: "Financiaremos la compra de semillas, herramientas y la capacitación técnica necesaria para que grupos de vecinos puedan iniciar y sostener sus propias huertas, generando alimentos frescos y fortaleciendo el tejido social."
    }
  },
  {
    icon: Recycle,
    title: "Reciclaje Inclusivo",
    description: "Apoyar a cooperativas de recuperadores urbanos, dignificando su trabajo y promoviendo la economía circular.",
    details: {
      title: "Alianza con Cooperativas de Reciclaje",
      description: "Estableceremos puntos de recolección en los comercios adheridos a RedEconomiX y coordinaremos con cooperativas locales para asegurar que los materiales reciclables sean procesados correctamente en la red."
    }
  }
];
// Data for /admin/analytics
export const monthlyRevenue = [
  { month: "Jan", revenue: 2000 },
  { month: "Feb", revenue: 1800 },
  { month: "Mar", revenue: 2200 },
  { month: "Apr", revenue: 2500 },
  { month: "May", revenue: 2300 },
  { month: "Jun", revenue: 3200 },
  { month: "Jul", revenue: 3500 },
];

export const newUsers = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 150 },
  { month: "Mar", users: 170 },
  { month: "Apr", users: 210 },
  { month: "May", users: 250 },
  { month: "Jun", users: 280 },
  { month: "Jul", users: 320 },
];

// Data for /admin/assistance
export const adminAssistanceRequests = [
    { id: 'as-1', userName: 'Juan Perez', userEmail: 'juan.p@example.com', assistanceType: 'medico', description: 'Consulta médica a domicilio por fiebre alta.', providerId: null, status: 'pending', createdAt: new Date(2024, 6, 20) },
    { id: 'as-2', userName: 'Maria Rodriguez', userEmail: 'maria.r@example.com', assistanceType: 'legal', description: 'Revisión de contrato de alquiler.', providerId: 'prov-abc', status: 'assigned', createdAt: new Date(2024, 6, 19) },
    { id: 'as-3', userName: 'Carlos Sanchez', userEmail: 'carlos.s@example.com', assistanceType: 'tecnico', description: 'La heladera no enfría.', providerId: 'prov-def', status: 'completed', createdAt: new Date(2024, 6, 15) },
];


// Data for /redeconomix/premios
export const pointPrizes = [
    { id: 'aceite-1', title: 'Aceite Girasol 1.5L', points: 2700, price: 2700, imageId: 'aceite', icon: ShoppingBag },
    { id: 'voucher-fuel', title: 'Voucher Combustible $5.000', points: 5000, price: 5000, imageId: 'nafta', icon: Fuel },
    { id: 'voucher-farmacia', title: 'Voucher Farmacia $10.000', points: 10000, price: 10000, imageId: 'farmacia', icon: Heart },
    { id: 'voucher-transporte', title: 'Carga SUBE / Transporte $2.000', points: 2000, price: 2000, imageId: 'sube', icon: Car },
    { id: 'tv-32', title: 'TV Smart 32" Full HD', points: 250000, price: 250000, imageId: 'tv32', icon: Tv },
    { id: 'celular-a14', title: 'Smartphone Samsung Galaxy', points: 350000, price: 350000, imageId: 'celular', icon: Smartphone },
    { id: 'moto-110', title: 'Moto 110cc 0km', points: 1200000, price: 1200000, imageId: 'moto', icon: Bike },
    { id: 'heladera-f', title: 'Heladera con Freezer Premium', points: 650000, price: 650000, imageId: 'heladera', icon: Refrigerator },
    { id: 'licuadora', title: 'Licuadora de Mesa', points: 60000, price: 60000, imageId: 'licuadora', icon: Utensils },
    { id: 'cafetera', title: 'Cafetera Express', points: 150000, price: 150000, imageId: 'cafetera', icon: Coffee },
];
