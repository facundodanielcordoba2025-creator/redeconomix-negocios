'use client';

import React, { useState } from 'react';
import { Sparkles, Trophy, ShoppingCart, RefreshCw, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PointsRoulette() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [points, setPoints] = useState(0);
  const [wonAmount, setWonAmount] = useState<number | null>(null);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonAmount(null);
    
    // Simulación de giro de 3 segundos
    setTimeout(() => {
      const amounts = [100, 200, 500, 1000, 50, 250];
      const win = amounts[Math.floor(Math.random() * amounts.length)];
      setWonAmount(win);
      setPoints(prev => prev + win);
      setIsSpinning(false);
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[3rem] p-10 relative overflow-hidden flex flex-col items-center text-center gap-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00C805] to-transparent opacity-50" />
        
        <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
                Ruleta de <span className="text-[#00C805]">Puntos Cohete</span>
            </h2>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Ganá puntos diarios y canjealos en el Marketplace</p>
        </div>

        {/* Roulette Visual Mockup */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <motion.div 
               animate={isSpinning ? { rotate: 360 * 5 } : { rotate: 0 }}
               transition={isSpinning ? { duration: 2.5, ease: "circOut" } : { duration: 0 }}
               className="w-full h-full rounded-full border-[10px] border-[#2a2a2a] relative overflow-hidden"
               style={{ background: 'conic-gradient(#00C805 0% 16%, #141414 16% 33%, #00C805 33% 50%, #141414 50% 66%, #00C805 66% 83%, #141414 83% 100%)' }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 max-sm:h-12 bg-[#1e1e1e] rounded-full border-4 border-[#2a2a2a] flex items-center justify-center shadow-2xl">
                        <Sparkles className="h-6 w-6 text-[#00C805]" />
                    </div>
                </div>
            </motion.div>
            {/* Pointer */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-12 bg-white clip-path-triangle z-20 shadow-xl" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
        </div>

        <button 
          onClick={spin}
          disabled={isSpinning}
          className="w-full max-w-sm h-20 max-sm:h-14 bg-white text-black font-black text-2xl rounded-2xl shadow-[0_10px_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
        >
          {isSpinning ? <RefreshCw className="h-8 w-8 animate-spin" /> : "¡GIRAR AHORA!"}
        </button>

        <AnimatePresence>
          {wonAmount && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-10"
            >
               <Trophy className="h-20 max-sm:h-14 w-20 text-yellow-400 mb-4 animate-bounce" />
               <h3 className="text-4xl font-black uppercase text-white tracking-tighter">¡GANASTE!</h3>
               <span className="text-7xl font-black text-[#00C805] tracking-tighter">+{wonAmount}</span>
               <p className="text-slate-400 font-bold text-sm mt-4 uppercase tracking-widest">Puntos Cohete sumados a tu perfil</p>
               <button onClick={() => setWonAmount(null)} className="mt-8 px-8 py-3 bg-[#2a2a2a] rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">
                 CONTINUAR GIRA
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rewards Info Section */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-[#00C805]/5 border border-[#00C805]/20 rounded-3xl p-8 flex flex-col justify-between items-start gap-6">
            <div className="space-y-3">
               <div className="flex items-center gap-3 text-[#00C805]">
                  <Star className="h-6 w-6" />
                  <span className="text-xl font-black uppercase tracking-tighter italic">Total Acumulado</span>
               </div>
               <span className="text-5xl font-black text-white tracking-tighter">{points} pts</span>
               <p className="text-slate-400 text-sm font-medium">Equivale a aprox. <b>${(points * 0.5).toFixed(2)}</b> en el Marketplace.</p>
            </div>
            <button className="flex items-center gap-2 text-[#00C805] font-black uppercase tracking-widest text-[10px] hover:underline">
               VER HISTORIAL DE PUNTOS
            </button>
         </div>

         <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-3xl p-8 space-y-6">
             <div className="flex items-center gap-3 text-slate-400">
                <ShoppingCart className="h-6 w-6" />
                <span className="text-xl font-black uppercase tracking-tighter italic">Canjes Disponibles</span>
             </div>
             <div className="space-y-3">
                {[
                  { name: 'Cupón $500 Marketplace', cost: '1000 pts' },
                  { name: 'Envío Gratis Flash', cost: '500 pts' },
                  { name: '1 Mes Premium Business', cost: '5000 pts' },
                ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-[#141414] rounded-2xl border border-[#2a2a2a]">
                      <span className="text-xs font-bold text-white uppercase tracking-tight">{item.name}</span>
                      <span className="text-xs font-black text-[#00C805]">{item.cost}</span>
                   </div>
                ))}
             </div>
             <button className="w-full py-4 bg-[#2a2a2a] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00C805] hover:text-black transition-all">
                IR AL MARKETPLACE DE CANJE
             </button>
         </div>
      </div>
    </div>
  );
}
