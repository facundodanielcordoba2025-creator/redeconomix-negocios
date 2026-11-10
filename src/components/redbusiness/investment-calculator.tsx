'use client';

import React, { useState } from 'react';
import { INVESTMENT_TERMS, YIELD_PROFILES, calculateTrueYield, InvestmentTerm, YieldProfile } from '@/lib/investment';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  Info,
  Check,
  TrendingUp,
  Percent
} from 'lucide-react';

interface InvestmentCalculatorProps {
  onInvestConfirm?: (amount: number, term: InvestmentTerm, profileId: YieldProfile) => void;
  salesVolume: number;
}

export function InvestmentCalculator({ onInvestConfirm, salesVolume }: InvestmentCalculatorProps) {
  const [amount, setAmount] = useState<number>(100000);
  const [selectedTerm, setSelectedTerm] = useState<InvestmentTerm>('mensual');
  const [selectedProfile, setSelectedProfile] = useState<YieldProfile>('ganancia_segura');

  const { tna, baseTna, variableTna, tea, days, accruedReturn, totalAmount, backingFormula } = calculateTrueYield(
    amount,
    selectedTerm,
    selectedProfile,
    salesVolume
  );

  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);

  const formattedReturn = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(accruedReturn);

  const formattedTotal = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(totalAmount);

  const termConfig = INVESTMENT_TERMS.find(t => t.id === selectedTerm);
  const isShortTermMinRate = termConfig?.isMinimumRate || false;

  return (
    <div className="bg-white border border-slate-200 text-slate-900 rounded-lg p-5 md:p-6 shadow-2xl relative">
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-2">
          <div>

            <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase mt-0.5">
              Colocación de Capital e Instrumento Financiero
            </h3>
          </div>
          <div className="bg-primary/10 text-primary text-[10px] font-black uppercase py-1 px-3 rounded border border-primary/20 self-start flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> LIQUIDEZ CON RESCATE 48HS
          </div>
        </div>

        {/* Amount Slider and Input */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8 space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Capital a Colocar (ARS)</label>
              <span className="text-[9px] text-slate-400 font-bold">Mínimo: $5.000</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5000"
                max="2000000"
                step="5000"
                value={amount > 2000000 ? 2000000 : amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-red-600"
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                value={amount}
                min={5000}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-7 py-2 text-right font-black text-slate-900 text-base outline-none focus:border-primary focus:ring-1 focus:ring-red-600/20 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">ARS</span>
            </div>
          </div>
        </div>

        {/* 7 Frequencies Tabs */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Plazo de Renta (Frecuencia)</label>
            {isShortTermMinRate && (
              <span className="text-[9px] text-amber-500 font-bold">⚠️ Corto plazo: Tasas mínimas conservadoras</span>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
            {INVESTMENT_TERMS.map((term) => {
              const isSelected = selectedTerm === term.id;
              // Calculate actual TNA preview for each button
              const preview = calculateTrueYield(amount, term.id, selectedProfile, salesVolume);
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => setSelectedTerm(term.id)}
                  className={cn(
                    "py-2 rounded text-center transition-all border flex flex-col items-center justify-center",
                    isSelected
                      ? "bg-primary text-white border-primary shadow"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  <span className="text-[10px] font-black uppercase leading-none">{term.label}</span>
                  <span className={cn(
                    "text-[8px] font-bold block mt-1",
                    isSelected ? "text-white" : "text-slate-400"
                  )}>
                    {(preview.tna * 100).toFixed(1)}% TNA
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Selector (Fixed vs. Hybrid) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Seleccionar Perfil de Rendimiento</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {YIELD_PROFILES.map((profile) => {
              const isSelected = selectedProfile === profile.id;
              const preview = calculateTrueYield(amount, selectedTerm, profile.id, salesVolume);
              
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfile(profile.id)}
                  className={cn(
                    "p-4 rounded text-left border transition-all flex flex-col justify-between relative overflow-hidden",
                    isSelected
                      ? "bg-slate-50 border-primary shadow-md"
                      : "bg-slate-50/40 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="space-y-1.5 z-10 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 block uppercase tracking-tight">{profile.name}</span>
                      {isSelected && (
                        <span className="bg-red-950 text-primary border border-primary/20 rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      {profile.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-2 border-t border-slate-200/80 flex justify-between items-baseline text-[10px] z-10 relative">
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Rendimiento Estimado:</span>
                    <span className="text-emerald-500 font-black text-xs">
                      {(preview.tna * 100).toFixed(2)}% TNA
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
               {/* Simple Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-bold text-slate-500 uppercase block">Capital a invertir</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formattedAmount}
            </div>
          </div>

          <div className="space-y-1 text-center md:text-left border-t md:border-t-0 md:border-l border-slate-200 md:pl-5 pt-3 md:pt-0">
            <span className="text-xs font-bold text-slate-500 uppercase block">Ganancia estimada</span>
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              +{formattedReturn}
            </div>
          </div>

          <div className="space-y-1 text-center md:text-left border-t md:border-t-0 md:border-l border-slate-200 md:pl-5 pt-3 md:pt-0">
            <span className="text-xs font-bold text-slate-500 uppercase block">Total a retirar ({days} días)</span>
            <div className="text-2xl font-black text-primary tracking-tight">
              {formattedTotal}
            </div>
          </div>
        </div>
        </div>

        {/* Action Button */}
        {onInvestConfirm && (
          <button
            type="button"
            onClick={() => onInvestConfirm(amount, selectedTerm, selectedProfile)}
            className="w-full py-4 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-black uppercase tracking-wider text-sm rounded-xl transition-all shadow-[0_4px_12px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2"
          >
            CONFIRMAR INVERSIÓN <Check className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
