'use client';

import React, { useState } from 'react';
import { Play, Flame, Heart, Share2, MessageCircle, TrendingUp, Check, X, DollarSign, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenger: string;
  description: string;
  pool: string;
  startTime: string;
  probYes?: number;
  probNo?: number;
}

export function ChallengeCard({ challenger, description, pool, startTime, probYes = 65, probNo = 35 }: ChallengeCardProps) {
  const [voted, setVoted] = useState<'SI' | 'NO' | null>(null);
  const [isSelectingAmount, setIsSelectingAmount] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [isConfirmed, setIsConfirmed] = useState<boolean | 'validating'>(false);

  const handleVoteClick = (choice: 'SI' | 'NO') => {
    setVoted(choice);
    setIsSelectingAmount(true);
  };

  const confirmBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmed(true);
    setIsSelectingAmount(false);
  };

  return (
    <div className="relative aspect-[9/16] rounded-[2.5rem] overflow-hidden group border border-slate-100 bg-white font-outfit shadow-2xl transition-all hover:scale-[1.02]">
      
      {/* Simulation of Video Background */}
      <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
         <Flame className="h-20 max-sm:h-14 w-20 text-primary opacity-10 animate-pulse" />
      </div>

      {/* Social Overlay Right Column */}
      <div className="absolute right-4 bottom-32 z-30 flex flex-col gap-5 items-center">
         <div className="flex flex-col items-center group/btn cursor-pointer">
            <div className="h-12 w-12 bg-slate-50 backdrop-blur-xl rounded-full flex items-center justify-center border border-slate-200 group-hover/btn:bg-primary/20 transition-all">
               <Heart className="h-6 w-6 text-slate-900" />
            </div>
            <span className="text-xs font-bold mt-1 text-slate-500">1.2k</span>
         </div>
         <div className="flex flex-col items-center group/btn cursor-pointer">
            <div className="h-12 w-12 bg-slate-50 backdrop-blur-xl rounded-full flex items-center justify-center border border-slate-200">
               <MessageCircle className="h-6 w-6 text-slate-900" />
            </div>
            <span className="text-xs font-bold mt-1 text-slate-500">45</span>
         </div>
         <div className="flex flex-col items-center group/btn cursor-pointer">
            <div className="h-12 w-12 bg-slate-50 backdrop-blur-xl rounded-full flex items-center justify-center border border-slate-200">
               <Share2 className="h-6 w-6 text-slate-900" />
            </div>
         </div>
      </div>

      {/* Prediction HUD - THE "Apostar" Section */}
      <div className="absolute top-1/2 left-0 right-16 -translate-y-1/2 z-40 p-4 space-y-3 pointer-events-auto">
         <div className="bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-3xl p-4 space-y-4 shadow-2xl">
            {!isSelectingAmount && !isConfirmed ? (
              <>
                <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-500">¿Lo logrará?</span>
                   <div className="flex items-center gap-1 text-xs font-bold text-primary animate-pulse">
                      <TrendingUp className="h-3 w-3" /> EN VIVO
                   </div>
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleVoteClick('SI'); }}
                     className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-900 bg-slate-50 hover:bg-primary/20 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-0.5"
                   >
                      <span className="text-xs font-bold">SI</span>
                      <span className="text-sm font-bold">{probYes}%</span>
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleVoteClick('NO'); }}
                     className="flex-1 h-14 rounded-2xl border border-slate-200 text-slate-900 bg-slate-50 hover:bg-primary/20 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-0.5"
                   >
                      <span className="text-xs font-bold">NO</span>
                      <span className="text-sm font-bold">{probNo}%</span>
                   </button>
                </div>
              </>
            ) : isSelectingAmount ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-3">
                   <button onClick={(e) => { e.stopPropagation(); setIsSelectingAmount(false); }} className="text-slate-500 hover:text-slate-900">
                      <ArrowLeft className="h-4 w-4" />
                   </button>
                   <span className="text-xs font-bold text-slate-900">Monto de Inversión</span>
                </div>

                <div className="space-y-3">
                   <div className="flex gap-2">
                      {['1000', '5000', '10000'].map(val => (
                        <button 
                          key={val}
                          onClick={(e) => { e.stopPropagation(); setAmount(val); }}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                            amount === val ? "bg-primary border-[#00C805] text-black" : "bg-slate-50 border-slate-100 text-slate-900/60"
                          )}
                        >
                           ${val}
                        </button>
                      ))}
                   </div>
                   
                   <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <input 
                        type="text" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-slate-900 font-bold text-sm outline-none focus:border-[#00C805]/50 transition-all"
                        placeholder="Monto personalizado"
                      />
                   </div>

                  <span className="text-xs font-bold text-slate-900">Monto de Inversión</span>
                </div>

                <div className="space-y-3">
                   <div className="flex gap-2">
                      {['1000', '5000', '10000'].map(val => (
                        <button 
                          key={val}
                          onClick={(e) => { e.stopPropagation(); setAmount(val); }}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                            amount === val ? "bg-primary border-[#00C805] text-black" : "bg-slate-50 border-slate-100 text-slate-900/60"
                          )}
                        >
                           ${val}
                        </button>
                      ))}
                   </div>
                   
                   <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      <input 
                        type="text" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-slate-900 font-bold text-sm outline-none focus:border-[#00C805]/50 transition-all"
                        placeholder="Monto personalizado"
                      />
                   </div>

                   <button 
                    onClick={confirmBet}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-sm transition-all shadow-xl",
                      voted === 'SI' ? "bg-primary text-black" : "bg-primary text-slate-900"
                    )}
                   >
                      Confirmar {voted} por ${amount}
                   </button>
                </div>
              </div>
            ) : isConfirmed === true ? (
              <div className="animate-in fade-in zoom-in-95 duration-300 space-y-4">
                 <div className="text-center">
                    <span className="bg-[#FF8A00] text-black text-xs font-bold px-3 py-1 rounded-full">Transferencia Pendiente</span>
                    <h4 className="text-slate-900 font-bold text-xs mt-3">Datos para el pago</h4>
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center group/copy cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText('donaly'); }}>
                       <span className="text-xs font-bold text-slate-400">Alias:</span>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">donaly</span>
                          <span className="text-xs font-bold text-primary opacity-0 group-hover/copy:opacity-100 transition-opacity">COPIAR</span>
                       </div>
                    </div>
                    <div className="flex justify-between items-center group/copy cursor-pointer" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText('0000076500000009357770'); }}>
                       <span className="text-xs font-bold text-slate-400">CBU:</span>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">0000076500000009357770</span>
                          <span className="text-xs font-bold text-primary opacity-0 group-hover/copy:opacity-100 transition-opacity">COPIAR</span>
                       </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                       <span className="text-xs font-bold text-slate-400">Total a transferir:</span>
                       <span className="text-sm font-bold text-slate-900">${amount}</span>
                    </div>
                 </div>

                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsConfirmed('validating'); }}
                   className="w-full bg-white text-black py-3 rounded-xl font-bold text-xs hover:scale-[1.02] transition-all"
                 >
                    Ya realicé la transferencia
                 </button>
              </div>
            ) : (
              <div className="py-4 text-center animate-in fade-in zoom-in-95 duration-300">
                 <div className="inline-flex h-12 w-12 bg-[#FF8A00]/20 text-[#FF8A00] rounded-full items-center justify-center mb-3 animate-pulse">
                    <TrendingUp className="h-6 w-6" />
                 </div>
                 <div className="space-y-1">
                    <h4 className="text-slate-900 font-bold text-xs">Validando Depósito</h4>
                    <p className="text-xs font-bold text-slate-500 leading-tight">
                       Estamos verificando tu transferencia de ${amount}. <br/>
                       Tu predicción al {voted} se activará en minutos.
                    </p>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setIsConfirmed(false); }}
                  className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-900 border-b border-slate-200"
                 >
                    Volver a Predicciones
                 </button>
              </div>
            )}
         </div>
      </div>

      {/* Info Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/60 z-20" />
      
      <div className="absolute top-6 left-6 z-30">
         <div className="bg-primary/20 backdrop-blur-md border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> VOTACIÓN: 7 DÍAS RESTANTES
         </div>
      </div>

      <div className="absolute bottom-8 left-6 right-20 z-30 space-y-4">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#00C805] to-[#008a04] rounded-2xl border border-white/20 shadow-xl flex items-center justify-center font-bold text-xs text-black">
               {challenger.substring(1, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-900">{challenger}</span>
               <span className="text-xs font-bold text-slate-400">Verificado</span>
            </div>
         </div>

         <h3 className="text-lg font-bold leading-tight text-slate-900">
            {description}
         </h3>

         <div className="bg-slate-50 backdrop-blur-2xl border border-slate-200 py-3 px-5 rounded-[1.5rem] flex items-center justify-between group/bar cursor-pointer hover:bg-white/10 transition-all">
            <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-400">Pool Acumulado</span>
               <span className="text-xl font-bold text-primary leading-none">{pool}</span>
            </div>
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover/bar:scale-110 transition-all">
               <Play className="h-4 w-4 fill-white" />
            </div>
         </div>
      </div>

      {/* Glass border reflection */}
      <div className="absolute inset-0 border border-slate-100 rounded-[2.5rem] pointer-events-none z-50" />
    </div>
  );
}
