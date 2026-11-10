'use client';

import React from 'react';
import { 
  Star, DollarSign, Target, Truck, BarChart3, SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

interface EliteBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EliteBenefitsModal({ isOpen, onClose }: EliteBenefitsModalProps) {
  const benefits = [
    { title: 'Comisiones Low-Cost', desc: 'Garantizamos un 1% de comisión para reinvertir en la red.', icon: DollarSign },
    { title: 'Alcance Orgánico', desc: 'Tu catálogo frente a miles de comercios sin gastar un peso en pauta.', icon: Target },
    { title: 'Flete Optimizado', desc: 'Reducí costos y tiempos muertos con rutas inteligentes.', icon: Truck },
    { title: 'Métricas de Oro', desc: 'Gestión de stock y análisis de demanda totalmente gratuitos.', icon: BarChart3 },
  ];

  const roadmapItems = [
    { title: "Notificaciones Pro", desc: "Preferencias por WhatsApp y Email" },
    { title: "Logística Inteligente", desc: "Gestión de zonas y costos de envío" },
    { title: "Reglas de Venta", desc: "Configuración de montos mínimos" },
    { title: "Personalización", desc: "Temas y logos personalizados" }
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-white rounded-t-[2.5rem] border-none font-sans overflow-hidden max-h-[95vh] pb-safe flex flex-col">
        <DrawerTitle className="sr-only">Beneficios Elite y Configuración</DrawerTitle>
        <DrawerDescription className="sr-only">Información de Elite y Roadmap de Configuración</DrawerDescription>
        
        {/* Header */}
        <div className="p-6 bg-primary text-white relative shrink-0">
          <div className="mx-auto w-10 h-1 bg-white/20 rounded-full mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-black/10">
              <Star className="h-6 w-6 text-primary fill-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-none uppercase">Beneficios <span className="font-black font-sans">Elite</span></h2>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-slate-50/50 overflow-y-auto no-scrollbar flex-1 space-y-8">
          
          {/* Beneficios Section */}
          <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((b) => (
                  <div
                    key={b.title}
                    className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center gap-4 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight mb-0.5">{b.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug font-semibold">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>

          {/* Configuración / Roadmap Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <SlidersHorizontal className="h-4 w-4 text-slate-900" />
                 </div>
                 <div>
                    <h3 className="font-black uppercase text-sm tracking-tight text-slate-900">Configuración Avanzada</h3>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest">En fase de desarrollo</p>
                 </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roadmapItems.map((item, i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3 shadow-sm">
                       <div className="h-2 w-2 rounded-full bg-slate-300 mt-1 shrink-0" />
                       <div>
                           <p className="text-[11px] font-black uppercase tracking-tight text-slate-900">{item.title}</p>
                           <p className="text-[10px] font-bold text-slate-500 tracking-wide mt-0.5">{item.desc}</p>
                       </div>
                    </div>
                ))}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Socio Verificado</span>
          </div>
          <button 
            className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase text-xs tracking-widest active:scale-95 transition-all touch-manipulation select-none border-none shadow-sm flex items-center justify-center"
            onClick={onClose}
          >
            Entendido
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
