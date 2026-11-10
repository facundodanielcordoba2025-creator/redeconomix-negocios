'use client';
import { Car, CheckCircle, ShieldCheck } from 'lucide-react';

export const llaveroProductDescription = {
    title: '¿Qué compra el usuario?',
    description: 'Al adquirir un Llavero Digital del Club, el usuario obtiene:',
    items: [
        'Membresía mensual al Club de Beneficios',
        'Cobertura de Microasistencia GRATUITA durante el mes en curso',
        'Acceso a descuentos y reintegros (supermercados, combustible, transporte, etc.)',
        'Participación promocional en el sorteo del vehículo correspondiente al plan elegido'
    ],
    note: 'El sorteo es un beneficio adicional, no el objeto principal de la compra.'
}

export const microasistenciaIncluida = {
    title: 'Microasistencia incluida (sin costo adicional)',
    icon: ShieldCheck,
    description: 'Durante el mes en curso, el usuario accede a:',
    items: [
        'Asistencia básica (según plan vigente)',
        'Beneficios comerciales y reintegros',
        'Acceso a la comunidad privada del Club'
    ],
    note: 'La cobertura se renueva mensualmente con cada nueva compra de llavero.'
}

export const basesYCondiciones = [
    {
        title: "ORGANIZADOR",
        content: "La promoción es organizada por Grupo FRAMAB, con domicilio legal en la República Argentina, en adelante “LA EMPRESA”."
    },
    {
        title: "NATURALEZA DEL PRODUCTO",
        content: "El usuario adquiere un producto digital/membresía denominado Llavero del Club, que otorga acceso a beneficios, microasistencia y promociones. La participación en el sorteo del vehículo es gratuita, accesoria y promocional."
    },
    {
        title: "PARTICIPACIÓN",
        content: "Cada Llavero adquirido equivale a una (1) chance promocional. El usuario puede adquirir más de un llavero, incrementando sus chances. Los llaveros no son transferibles. No existe reembolso una vez realizada la compra."
    },
    {
        title: "GRUPOS Y CUPOS",
        content: "Cada plan se compone de hasta 1.500 participantes. El avance del grupo se publica en tiempo real en la plataforma. El sorteo se realiza el día en que el grupo alcanza el cupo total. En ningún caso el plan podrá extenderse más allá del año calendario en curso."
    },
    {
        title: "SORTEO",
        content: "El sorteo se realizará entre los participantes activos del plan. Será transmitido en vivo y auditado (escribano o sistema verificable). El ganador será contactado por los medios registrados."
    },
    {
        title: "VEHÍCULOS",
        content: "Todos los premios corresponden a vehículos usados. La empresa gestiona: búsqueda, verificación general, compra y coordinación de entrega. La transferencia y gastos registrales corren por cuenta del ganador. No se otorga garantía mecánica, al tratarse de unidades usadas."
    },
    {
        title: "NO COMPLETAMIENTO DEL CUPO",
        content: "Si un plan no alcanza los 1.500 participantes dentro del plazo máximo, el usuario podrá optar por integrar otro plan vigente o solicitar la devolución del importe abonado."
    },
    {
        title: "RESPONSABILIDAD",
        content: "La empresa no reemplaza al fabricante ni al vendedor original del vehículo. La entrega se realiza en el estado de uso propio de un vehículo usado."
    },
    {
        title: "ACEPTACIÓN",
        content: "La compra del llavero implica la aceptación total de estas Bases y Condiciones."
    }
];

export const planesLlavero = [
    { 
        id: 'plan-porsche',
        name: 'PLAN 1',
        vehicle: 'Porsche Cayenne 3.6 V6',
        referenceValue: 'USD 25.000',
        condition: 'Usado',
        keyPrice: 37500,
        imageId: 'porscheCayenne',
        colorClass: 'border-red-500/50 bg-red-500/5 text-red-100'
    },
    { 
        id: 'plan-bmw-serie3',
        name: 'PLAN 2',
        vehicle: 'BMW Serie 3',
        referenceValue: 'USD 16.000',
        condition: 'Usado',
        keyPrice: 24000,
        imageId: 'bmwSerie3',
        colorClass: 'border-blue-500/50 bg-blue-500/5 text-blue-100'
    },
    { 
        id: 'plan-yamaha-r1',
        name: 'PLAN 3',
        vehicle: 'Yamaha R1',
        referenceValue: 'USD 20.000',
        condition: 'Usado',
        keyPrice: 30000,
        imageId: 'yamahaR1',
        colorClass: 'border-green-500/50 bg-green-500/5 text-green-100'
    },
    { 
        id: 'plan-audi-a4',
        name: 'PLAN 4',
        vehicle: 'Audi A4',
        referenceValue: 'USD 12.000',
        condition: 'Usado',
        keyPrice: 18000,
        imageId: 'audiA4',
        colorClass: 'border-yellow-500/50 bg-yellow-500/5 text-yellow-100'
    },
    { 
        id: 'plan-bmw-x6',
        name: 'PLAN 5',
        vehicle: 'BMW X6',
        referenceValue: 'USD 35.000',
        condition: 'Usado',
        keyPrice: 52500,
        imageId: 'bmwX6',
        colorClass: 'border-orange-500/50 bg-orange-500/5 text-orange-100'
    },
    { 
        id: 'plan-amarok-v6',
        name: 'PLAN 6',
        vehicle: 'VW Amarok V6',
        referenceValue: '$45.000.000',
        condition: 'Usado',
        keyPrice: 45000,
        imageId: 'amarokV6',
        colorClass: 'border-stone-500/50 bg-stone-500/5 text-stone-100'
    },
    { 
        id: 'plan-hilux-4x4',
        name: 'PLAN 7',
        vehicle: 'Toyota Hilux 4x4',
        referenceValue: '$50.000.000',
        condition: 'Usado',
        keyPrice: 50000,
        imageId: 'toyotaHilux',
        colorClass: 'border-purple-500/50 bg-purple-500/5 text-purple-100'
    },
    { 
        id: 'plan-vento-tsi',
        name: 'PLAN 8',
        vehicle: 'VW Vento 2.0 TSI',
        referenceValue: '$20.500.000',
        condition: 'Usado',
        keyPrice: 20500,
        imageId: 'ventoTSI',
        colorClass: 'border-zinc-500/50 bg-zinc-500/5 text-zinc-100'
    }
];
