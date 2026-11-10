'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Users, Clock, DollarSign, TrendingUp, BarChart, MessageSquare, Newspaper, Check, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionCardProps {
  title: string;
  endDate: string;
  poolTotal: string;
  probYes: number;
  probNo: number;
  volume?: string;
}

export function PredictionCard({ title, endDate, poolTotal, probYes, probNo, volume = "$45K today" }: PredictionCardProps) {
  const [voted, setVoted] = useState<'SI' | 'NO' | null>(null);
  const [step, setStep] = useState<'initial' | 'amount' | 'transfer' | 'pending'>('initial');
  const [amount, setAmount] = useState('1000');

  const marketPrice = voted === 'SI' ? probYes / 100 : probNo / 100;
  const multiplier = 1 / Math.max(marketPrice * 1.10, 0.1); 
  const estimatedPayout = Math.floor(Number(amount) * multiplier);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={cn(
      "bg-white border border-slate-100 rounded-2xl p-6 transition-all font-outfit relative overflow-hidden",
      step !== 'initial' ? "shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-slate-200" : "hover:bg-slate-50/50 hover:border-[#00C805]/30"
    )}>
      
      {step === 'initial' && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">MERCADO ACTIVO</span>
             <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
               <Clock className="h-2.5 w-2.5" /> {endDate}
             </span>
          </div>

          <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 pr-6">
             {title}
          </h3>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 py-2">
             <span>Pool Total: {poolTotal}</span>
             <span className="text-slate-400">Vol: {volume}</span>
          </div>

          <div className="flex gap-2 pt-2">
             <button 
               onClick={() => { setVoted('SI'); setStep('amount'); }}
               className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center gap-1 hover:border-[#00C805]/40 hover:bg-primary/5 transition-all group"
             >
                <span className="text-xs font-bold text-primary group-hover:scale-110 transition-transform">SI</span>
                <span className="text-2xl font-bold text-slate-900">{probYes}%</span>
                <span className="text-xs font-bold text-slate-500">Multiplicador { (1/(probYes/100 * 1.1)).toFixed(2) }x</span>
             </button>
             <button 
               onClick={() => { setVoted('NO'); setStep('amount'); }}
               className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center gap-1 hover:border-[#FF2E55]/40 hover:bg-primary/5 transition-all group"
             >
                <span className="text-xs font-bold text-primary group-hover:scale-110 transition-transform">NO</span>
                <span className="text-2xl font-bold text-slate-900">{probNo}%</span>
                <span className="text-xs font-bold text-slate-500">Multiplicador { (1/(probNo/100 * 1.1)).toFixed(2) }x</span>
             </button>
          </div>
        </div>
      )}

      {step === 'amount' && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
           <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('initial')} className="h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                 <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-900">Invertir en {voted}</span>
                 <span className="text-xs font-bold text-slate-500">Multiplicador actual: {multiplier.toFixed(2)}x</span>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex gap-2">
                 {['1000', '5000', '10000'].map(val => (
                   <button 
                     key={val}
                     onClick={() => setAmount(val)}
                     className={cn(
                       "flex-1 py-3 rounded-xl text-xs font-bold border transition-all",
                       amount === val ? "bg-primary border-[#00C805] text-black shadow-lg shadow-green-500/20" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white/10"
                     )}
                   >
                      ${val}
                   </button>
                 ))}
              </div>

              <div className="relative">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                 <input 
                   type="text"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-4 text-slate-900 font-bold text-base outline-none focus:border-[#00C805]/50 transition-all shadow-inner"
                   placeholder="Monto personalizado"
                 />
              </div>

              <div className="bg-primary/10 border border-[#00C805]/20 p-4 rounded-2xl">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary">Pago Estimado</span>
                    <span className="text-lg font-bold text-primary">${estimatedPayout.toLocaleString()}</span>
                 </div>
              </div>

              <button 
                onClick={() => setStep('transfer')}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-xl",
                  voted === 'SI' ? "bg-primary text-black" : "bg-primary text-slate-900"
                )}
              >
                 Continuar al Pago
              </button>
           </div>
        </div>
      )}

      {step === 'transfer' && (
        <div className="animate-in zoom-in-95 fade-in duration-300 space-y-5">
           <div className="text-center space-y-1">
              <span className="bg-[#FF8A00] text-black text-xs font-bold px-4 py-1 rounded-full">PAGO REQUERIDO</span>
              <h4 className="text-slate-900 font-bold text-xs mt-4">Transferencia Bancaria</h4>
           </div>

           <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <div className="flex justify-between items-center group cursor-pointer" onClick={() => handleCopy('donaly')}>
                 <span className="text-xs font-bold text-slate-400">Alias</span>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">donaly</span>
                    <span className="text-[7px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">COPIAR</span>
                 </div>
              </div>
              <div className="flex justify-between items-center group cursor-pointer" onClick={() => handleCopy('0000076500000009357770')}>
                 <span className="text-xs font-bold text-slate-400">CBU</span>
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">0000076500000009357770</span>
                    <span className="text-[7px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">COPIAR</span>
                 </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                 <span className="text-xs font-bold text-slate-400">Total a transferir</span>
                 <span className="text-sm font-bold text-slate-900">${amount}</span>
              </div>
           </div>

           <button 
             onClick={() => setStep('pending')}
             className="w-full bg-white text-black py-4 rounded-2xl font-bold text-xs hover:scale-[1.02] transition-all shadow-2xl"
           >
              Ya realicé el envío
           </button>
        </div>
      )}

      {step === 'pending' && (
        <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-300 space-y-4">
           <div className="inline-flex h-16 max-sm:h-12 w-16 bg-primary/20 text-primary rounded-3xl items-center justify-center mb-2 animate-pulse">
              <TrendingUp className="h-8 w-8" />
           </div>
           <div className="space-y-2">
              <h4 className="text-slate-900 font-bold text-sm">Verificando Depósito</h4>
              <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                 Estamos validando tu transferencia de <span className="text-slate-900">${amount}</span>. <br/>
                 Recibirás una notificación al activarse tu inversión.
              </p>
           </div>
           <button 
             onClick={() => setStep('initial')}
             className="mt-6 text-xs font-bold text-primary hover:text-slate-900 transition-colors"
           >
              Volver al Mercado
           </button>
        </div>
      )}

    </div>
  );
}





