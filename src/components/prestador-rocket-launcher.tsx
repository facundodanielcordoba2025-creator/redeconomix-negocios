'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, X, Zap, ShieldCheck, Truck, 
  BarChart3, Target, Bell, Info, Star,
  DollarSign, MapPin, Search, ChevronRight,
  Award, Heart, Share2, TrendingUp, Sparkles, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PrestadorRocketLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('beneficios');

  const benefits = [
    { title: 'Despacho Real-time', desc: 'Recibí misiones instantáneas cerca de tu ubicación actual.', icon: Zap, color: 'text-indigo-500' },
    { title: 'Ingresos Extras', desc: 'Misiones sociales y referidos para ganar dinero sin moverte.', icon: DollarSign, color: 'text-emerald-500' },
    { title: 'Flete Optimizado', desc: 'Rutas inteligentes que ahorran hasta un 33% de combustible.', icon: Truck, color: 'text-primary' },
    { title: 'Métricas de Oro', desc: 'Seguí tus ganancias y desempeño con reportes detallados.', icon: BarChart3, color: 'text-amber-500' },
  ];

  const protocol = [
    { title: 'El Control es Tuyo', desc: 'Decidí cuándo conectarte y qué misiones aceptar.', icon: ShieldCheck },
    { title: 'Seguridad', desc: 'Cada viaje está monitoreado para tu tranquilidad.', icon: Heart },
    { title: 'Pago Semanal', desc: 'Cobrá tus ganancias todos los martes sin demoras.', icon: Award },
  ];

  const advances = [
    { title: 'GPS en Tiempo Real', desc: 'Visualización precisa para coordinar con mayoristas.', icon: MapPin },
    { title: 'Alertas de Zona', desc: 'Notificaciones cuando entres en áreas de alta demanda.', icon: Bell },
    { title: 'Gestión de Clientes', desc: 'Reportes automáticos de visitas y tiempos dedicados.', icon: Search },
  ];

  return (
    <>
      {/* Floating Button */}
      <motion.button
        
        
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[100] w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-400 group border-2 border-white/20 backdrop-blur-md"
      >
        <Rocket className="h-6 w-6 group-hover:animate-bounce" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col font-sans max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                    <Rocket className="h-40 w-40" />
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-10"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="relative z-10 space-y-4">
                    <div className="w-16 h-16 max-sm:h-12 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3">
                        <Star className="h-8 w-8 text-white fill-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">Bóveda Segura</h2>
                        <p className="text-xs font-bold text-primary tracking-widest mt-2 uppercase opacity-80">Protocolo de Gestión Elite</p>
                    </div>
                </div>
              </div>

              {/* Tabs Nav */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
                {[
                  { id: 'beneficios', label: 'Beneficios', icon: Sparkles },
                  { id: 'protocolo', label: 'Protocolo', icon: ShieldCheck },
                  { id: 'avances', label: 'Avances', icon: TrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    {activeTab === 'beneficios' && benefits.map((b, i) => (
                      <div key={b.title} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center gap-5 group hover:border-primary/20 transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
                          <b.icon className={cn("h-6 w-6", b.color)} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{b.title}</h4>
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-1">{b.desc}</p>
                        </div>
                      </div>
                    ))}

                    {activeTab === 'protocolo' && (
                        <div className="space-y-6">
                            <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white relative overflow-hidden">
                                <ShieldCheck className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10 rotate-12" />
                                <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Manual de Operaciones</h3>
                                <p className="text-xs font-medium leading-relaxed opacity-90">Nuestro protocolo garantiza que cada servicio sea rentable y seguro. Seguí las guías para maximizar tus ingresos.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {protocol.map((p) => (
                                    <div key={p.title} className="flex gap-4 p-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0"><p.icon className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase">{p.title}</h4>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">{p.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'avances' && (
                        <div className="space-y-6">
                            <div className="p-8 bg-amber-500 rounded-[2.5rem] text-white">
                                <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Próximos Pasos</h3>
                                <p className="text-xs font-medium leading-relaxed opacity-90">Estamos construyendo el futuro de la logística. Muy pronto tendrás estas herramientas disponibles.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {advances.map((a) => (
                                    <div key={a.title} className="flex gap-4 p-4 items-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-sm"><a.icon className="h-5 w-5" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-xs uppercase">{a.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">En desarrollo</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Servidor Online</span>
                </div>
                <Button onClick={() => setIsOpen(false)} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
