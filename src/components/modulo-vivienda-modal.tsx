'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Layers, 
  Hammer, 
  Truck, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  X
} from "lucide-react";

interface ModuloViviendaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlanTotal?: () => void;
}

const MODULO_IMAGES = [
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153648/850097942_18012909998975579_751629585328922791_n_eu7ipw.jpg",
    title: "Fachada Exterior Steel Frame con Deck"
  },
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153667/861762709_18012909989975579_6306354053875197525_n_svtq2e.jpg",
    title: "Cocina y Mobiliario Completo"
  },
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153655/858635758_18012910022975579_3916559835091454370_n_ceimqr.jpg",
    title: "Living y Espacio Principal"
  },
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153655/858799982_18012910031975579_4512710294028039795_n_suzyw8.jpg",
    title: "Dormitorio y Placard a Medida"
  },
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153649/857580221_18012910007975579_3001643526560095293_n_lb1fsz.jpg",
    title: "Pasillo y Revestimiento en Madera"
  },
  {
    url: "https://res.cloudinary.com/dffhpwfiz/image/upload/v1793153650/849552254_122118373563412446_1351409125138389992_n_wppuqs.jpg",
    title: "Planos y Distribución de Planta"
  }
];

const ESPECIFICACIONES = [
  {
    pregunta: "¿Qué incluye el módulo?",
    respuesta: "El módulo incluye: estructura completa, cerramientos, aislación térmica e hidrófuga, instalación eléctrica, instalación sanitaria, aberturas (puertas y ventanas), y terminaciones interiores y exteriores según el diseño elegido. Básicamente, llegás y podés habitarlo.",
    icono: Home
  },
  {
    pregunta: "¿Qué material se usa en la estructura de los módulos?",
    respuesta: "Trabajamos con Steel Frame, un sistema de construcción en seco que reduce tiempos de obra sin resignar resistencia. Toda la estructura tiene garantía de fabricación y control de calidad en cada etapa del proceso.",
    icono: Layers
  },
  {
    pregunta: "¿Los módulos son aptos para vivienda permanente?",
    respuesta: "Absolutamente. Nuestros módulos están diseñados y certificados para vivienda permanente. Cuentan con aislación térmica y acústica de primer nivel y resistencia sísmica: contienen el calor, no se oxidan y no filtran humedad. Son tan sólidos o más que una construcción tradicional.",
    icono: ShieldCheck
  },
  {
    pregunta: "¿Necesito tener el terreno listo?",
    respuesta: "Sí, es necesario contar con un terreno nivelado y con acceso suficiente para el camión de transporte. Te asesoramos sobre las condiciones mínimas que necesita tu terreno antes de la entrega, sin costo adicional.",
    icono: Truck
  },
  {
    pregunta: "¿Necesito obras civiles adicionales?",
    respuesta: "En la mayoría de los casos solo se necesita una base o platea de hormigón simple, que podés hacer con cualquier albañil local. El módulo llega con todo incluido y se apoya sobre la base. Te damos especificaciones precisas para que lo hagas antes de la entrega.",
    icono: Hammer
  }
];

export function ModuloViviendaModal({
  isOpen,
  onOpenChange,
  onSelectPlanTotal
}: ModuloViviendaModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % MODULO_IMAGES.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + MODULO_IMAGES.length) % MODULO_IMAGES.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] sm:max-w-2xl lg:max-w-3xl focus:outline-none max-h-[92vh] flex flex-col">
        {/* Header Rojo Sólido Oficial */}
        <div className="bg-[#FF0000] p-6 text-center text-white relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#CC0000] text-white shadow-md mb-2">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-white" />
            Premio Exclusivo Plan Total
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
            Vivienda Módulo Habitación
          </DialogTitle>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/90 mt-1">
            Construcción en Steel Frame • Madera y Placas de Cemento • 100% Habitable
          </p>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-700">
          
          {/* Galería de Imágenes */}
          <div className="space-y-3">
            {/* Imagen Principal */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900 shadow-lg group">
              <Image
                src={MODULO_IMAGES[activeImageIndex].url}
                alt={MODULO_IMAGES[activeImageIndex].title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />

              {/* Controles de Navegación */}
              <button
                type="button"
                onClick={prevImage}
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <button
                type="button"
                onClick={nextImage}
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>

              {/* Badge de Título y Conteo */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-lg">
                  {MODULO_IMAGES[activeImageIndex].title}
                </span>
                <span className="bg-[#FF0000] text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg">
                  {activeImageIndex + 1} / {MODULO_IMAGES.length}
                </span>
              </div>
            </div>

            {/* Miniaturas */}
            <div className="grid grid-cols-6 gap-2">
              {MODULO_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx 
                      ? 'border-[#FF0000] scale-105 shadow-md' 
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta de Beneficio Destacado */}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF0000] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                Participación Automática con Plan Total
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Manteniendo activo tu <strong>Plan Total ($10.000/mes)</strong> participás automáticamente de este sorteo de vivienda modular llave en mano, además de la moto 0KM y los premios mensuales en efectivo.
            </p>
          </div>

          {/* Especificaciones Técnicas y Preguntas Frecuentes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Ficha Técnica y Respuestas Clave
              </h4>
            </div>

            <div className="space-y-3">
              {ESPECIFICACIONES.map((item, index) => {
                const IconComponent = item.icono;
                return (
                  <div 
                    key={index}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:border-red-300 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#FF0000] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                          {item.pregunta}
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {item.respuesta}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer de Acciones */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-slate-500 text-center sm:text-left">
            * Entrega con flete y montaje coordinado en tu terreno nivelado.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                if (onSelectPlanTotal) onSelectPlanTotal();
              }}
              className="flex-1 sm:flex-none h-11 px-6 rounded-xl font-black text-xs uppercase tracking-wider bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-md shadow-red-500/25 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Adherirme al Plan Total ($10.000)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
