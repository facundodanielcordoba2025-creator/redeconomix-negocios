'use client';

import React from 'react';
import { Truck, Users, CheckCircle2, Flame, Bike, Car } from 'lucide-react';

export function SweepstakesBanner() {
  return (
    <div className="space-y-8 font-outfit">
      {/* Community Progress Tracker */}
      <div className="bg-[#1a1b1e] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#00C805]/10 rounded-full blur-[100px] -mr-40 -mt-40" />
        
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00C805]/10 text-[#00C805] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#00C805]/20">
                   <Flame className="h-3 w-3 animate-bounce" /> RUMBO A LOS 5.000 USUARIOS
                 </div>
                 <h2 className="text-4xl font-black tracking-tight uppercase leading-tight">
                   META COMUNIDAD <br /><span className="text-[#00C805]">REDINVERSIONEX</span>
                 </h2>
              </div>
              <div className="text-right">
                 <span className="text-4xl font-black text-white">3.124</span>
                 <span className="text-xl font-bold text-slate-500"> / 5.000</span>
                 <p className="text-[10px] font-bold text-[#00C805] uppercase tracking-widest mt-1">Usuarios Activos</p>
              </div>
           </div>

           {/* High Impact Progress Bar */}
           <div className="space-y-4">
              <div className="h-6 w-full bg-[#0f1012] rounded-full overflow-hidden border border-white/5 p-1 relative">
                 <div 
                   className="h-full bg-gradient-to-r from-[#00C805] via-[#00C805] to-white rounded-full shadow-[0_0_30px_rgba(0,200,5,0.6)] transition-all duration-1000 relative" 
                   style={{ width: '62.4%' }}
                 >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full animate-pulse" />
                 </div>
              </div>
              <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                ¡Al llegar a los 5.000 sorteamos la primer Pickup Preparada entre todos los activos!
              </p>
           </div>
        </div>
      </div>

      {/* Vehicles Showcase Grid */}
      <div className="grid md:grid-cols-2 gap-6">
         <div className="bg-[#1a1b1e] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#00C805]/50 transition-all">
            <div className="aspect-video bg-[#0f1012] flex items-center justify-center relative">
               <Bike className="h-20 max-sm:h-14 w-20 text-white/5" />
               <div className="absolute top-4 left-4 bg-[#FF2E55] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight">
                  Próximo Sorteo: Honda Tornado Preparada
               </div>
            </div>
            <div className="p-6">
               <h3 className="text-xl font-black uppercase tracking-tight mb-2">Honda Tornado 300cc "Flash"</h3>
               <p className="text-xs text-slate-400 font-bold mb-4">Escape deportivo, cubiertas nuevas y kit de stickers RedEconomiX Edition.</p>
               <button className="w-full py-3 bg-[#00C805] text-black font-black uppercase text-[10px] tracking-widest rounded-xl">VER CÓMO PARTICIPAR</button>
            </div>
         </div>

         <div className="bg-[#1a1b1e] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#00C805]/50 transition-all opacity-70 grayscale">
            <div className="aspect-video bg-[#0f1012] flex items-center justify-center relative">
               <Car className="h-20 max-sm:h-14 w-20 text-white/5" />
               <div className="absolute top-4 left-4 bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight">
                  Enero 2025: VW Gol Power Turbo
               </div>
            </div>
            <div className="p-6">
               <h3 className="text-xl font-black uppercase tracking-tight mb-2">VW GOL POWER "STREET"</h3>

               <p className="text-xs text-slate-400 font-bold mb-4">Mecánica forjada, suspensión regulable y escape en 3 pulgadas.</p>
               <button className="w-full py-3 bg-[#2a2b30] text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl cursor-not-allowed">PRÓXIMAMENTE</button>
            </div>
         </div>
      </div>
    </div>
  );
}
