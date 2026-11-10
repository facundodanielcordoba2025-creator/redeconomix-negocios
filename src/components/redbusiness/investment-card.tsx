'use client';

import React from 'react';
import { YieldProfile, calculateTrueYield } from '@/lib/investment';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  Briefcase, 
  Info,
  Building,
  Coins
} from 'lucide-react';

interface InvestmentInstrument {
  id: YieldProfile;
  name: string;
  description: string;
  type: 'comercial' | 'fci' | 'inmobiliaria';
  backing: string;
  minInvestment: number;
  minTermDays: number;
}

interface InvestmentCardProps {
  instrument: InvestmentInstrument;
  onInvestSelect?: (instrument: InvestmentInstrument) => void;
  salesVolume: number;
}

export function InvestmentCard({ instrument, onInvestSelect, salesVolume }: InvestmentCardProps) {
  // Calculate average preview rate
  const { tna, tea } = calculateTrueYield(100000, 'mensual', instrument.id, salesVolume);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Instrument Category & Header */}
        <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
          <span className="bg-red-950/60 text-red-500 text-[8px] font-black uppercase tracking-widest py-0.5 px-2 rounded border border-red-900/40">
            {instrument.type === 'comercial' ? 'Stock & Comercio' : instrument.type === 'fci' ? 'Cocos FCI' : 'Propiedades en Pozo'}
          </span>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">ARS / PESOS</span>
        </div>

        {/* Instrument Title & Description */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-white uppercase group-hover:text-red-500 transition-colors">
            {instrument.name}
          </h4>
          <p className="text-[10px] text-zinc-400 font-medium leading-relaxed min-h-[48px]">
            {instrument.description}
          </p>
        </div>

        {/* Technical Yield Info */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 border border-zinc-850 p-2.5 rounded text-left">
          <div>
            <span className="text-[8px] font-bold text-zinc-500 uppercase block mb-0.5">Tasa TNA Est.</span>
            <span className="text-xs font-black text-white tracking-tight">{(tna * 100).toFixed(0)}% <span className="text-[8px] font-normal text-zinc-500 block">Variable</span></span>
          </div>
          <div>
            <span className="text-[8px] font-bold text-zinc-500 uppercase block mb-0.5">Tasa TEA Est.</span>
            <span className="text-xs font-black text-emerald-500 tracking-tight">{(tea * 100).toFixed(0)}% <span className="text-[8px] font-normal text-zinc-500 block">Efectiva</span></span>
          </div>
        </div>

        {/* Backing assets details */}
        <div className="text-[10px] space-y-1 border-t border-zinc-900 pt-2 font-medium">
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">Garantía / Respaldo</span>
          <div className="text-zinc-300 leading-snug">
            {instrument.backing}
          </div>
        </div>
      </div>

      {/* Stats and Action */}
      <div className="space-y-3 pt-3 mt-4 border-t border-zinc-900">
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
          <span>Inversión Mínima</span>
          <span className="text-white font-black">${instrument.minInvestment.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
          <span>Plazo Mínimo</span>
          <span className="text-white font-black">{instrument.minTermDays} {instrument.minTermDays === 1 ? 'Día' : 'Días'}</span>
        </div>

        {onInvestSelect && (
          <button
            type="button"
            onClick={() => onInvestSelect(instrument)}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 text-white font-bold uppercase tracking-wider text-[10px] rounded transition-all flex items-center justify-center gap-1"
          >
            SUSCRIBIR FONDO <ArrowUpRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
