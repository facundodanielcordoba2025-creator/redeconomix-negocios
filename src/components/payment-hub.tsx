import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  QrCode, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  Wallet,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Configuración de Billeteras para QR
const WALLETS = [
  { id: 'brubank', name: 'Brubank', color: 'bg-[#8A2BE2]', logo: 'https://play-lh.googleusercontent.com/9jS_zYp_tXlP7XvWv_z6X0z0_zG_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z', qr: '/qrs/brubank-qr.png' },
  { id: 'uala', name: 'Ualá', color: 'bg-[#0052FF]', logo: 'https://play-lh.googleusercontent.com/o0_zYp_tXlP7XvWv_z6X0z0_zG_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z', qr: '/qrs/uala-qr.png' },
  { id: 'ppay', name: 'Personal Pay', color: 'bg-[#00D1FF]', logo: 'https://play-lh.googleusercontent.com/p0_zYp_tXlP7XvWv_z6X0z0_zG_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z', qr: '/qrs/ppay-qr.png' },
  { id: 'naranjax', name: 'Naranja X', color: 'bg-[#FF4500]', logo: 'https://play-lh.googleusercontent.com/n0_zYp_tXlP7XvWv_z6X0z0_zG_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z_z', qr: '/qrs/naranjax-qr.png' },
];

export const PaymentHub = () => {
  const [method, setMethod] = useState<'none' | 'card' | 'qr'>('none');
  const [selectedWallet, setSelectedWallet] = useState<typeof WALLETS[0] | null>(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Renderizar Selector de Método
  if (method === 'none') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Método de Pago</h3>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Seleccioná cómo querés abonar tu suscripción</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setMethod('card')}
            className="group relative p-6 bg-[#1a1b1e] border border-white/5 rounded-[2rem] flex items-center justify-between hover:border-[#00C805]/40 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C805]/5 blur-3xl -mr-16 -mt-16 group-hover:bg-[#00C805]/10 transition-all" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#00C805]/10 flex items-center justify-center text-[#00C805]">
                <CreditCard className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Tarjeta Crédito / Débito</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activación instantánea via Mobbex</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-[#00C805] group-hover:translate-x-1 transition-all" />
          </button>

          <button 
            onClick={() => setMethod('qr')}
            className="group relative p-6 bg-[#1a1b1e] border border-white/5 rounded-[2rem] flex items-center justify-between hover:border-amber-400/40 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-400/10 transition-all" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                <QrCode className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">QR / Transferencia Directa</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sin comisiones - Aprobación manual</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-4">
          <ShieldCheck className="h-5 w-5 text-[#00C805] shrink-0" />
          <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase">
            Tus pagos están protegidos por encriptación de nivel bancario. RedEconomiX no almacena los datos de tu tarjeta.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar Pago con Tarjeta (Mobbex)
  if (method === 'card') {
    return (
      <div className="space-y-8 animate-fade-in">
        <button onClick={() => setMethod('none')} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest">
          <ArrowLeft className="h-3 w-3" /> Volver
        </button>

        <div className="space-y-2 text-center">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">Checkout Seguro</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ingresá los datos de tu tarjeta</p>
        </div>

        <Card className="bg-[#1a1b1e] border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Número de Tarjeta</label>
              <Input className="h-14 bg-white/5 border-white/10 rounded-xl text-white font-bold tracking-[0.2em]" placeholder="0000 0000 0000 0000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Vencimiento</label>
                <Input className="h-14 bg-white/5 border-white/10 rounded-xl text-white font-bold" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">CVV</label>
                <Input className="h-14 bg-white/5 border-white/10 rounded-xl text-white font-bold" placeholder="123" />
              </div>
            </div>
          </div>

          <Button className="w-full h-16 max-sm:h-12 bg-[#00C805] text-black hover:bg-[#00C805]/90 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-[#00C805]/20">
            Confirmar Suscripción
          </Button>
        </Card>
      </div>
    );
  }

  // Renderizar Pago con QR (Manual)
  return (
    <div className="space-y-8 animate-fade-in">
      <button onClick={() => { setMethod('none'); setSelectedWallet(null); setStep(1); }} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest">
        <ArrowLeft className="h-3 w-3" /> Volver
      </button>

      {!selectedWallet ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-none">Elegí tu Billetera</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Escaneá el QR directo para evitar comisiones y pagar el neto.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {WALLETS.map((w) => (
              <button 
                key={w.id} 
                onClick={() => setSelectedWallet(w)}
                className="p-6 bg-[#1a1b1e] border border-white/5 rounded-3xl hover:border-white/20 transition-all flex flex-col items-center gap-4 group"
              >
                <div className={`w-14 h-14 rounded-2xl ${w.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                   <Smartphone className="h-7 w-7 text-white" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                <div className="space-y-2">
                   <Badge className={`${selectedWallet.color} text-white border-none font-black text-[9px] px-4 py-1.5`}>{selectedWallet.name} DETECTADO</Badge>
                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Escaneá y Pagá</h4>
                </div>

                <div className="relative mx-auto w-64 h-64 bg-white p-4 rounded-[2rem] shadow-2xl">
                   {/* Aquí iría la imagen del QR real */}
                   <div className="w-full h-full bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-4 border-dashed border-slate-200">
                      <QrCode className="h-20 max-sm:h-14 w-20 text-slate-300" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-4 text-center px-4 tracking-widest">Imagen del QR Directo de {selectedWallet.name}</span>
                   </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CBU / Alias destino:</p>
                   <p className="text-sm font-black text-[#00C805] tracking-tight selection:bg-[#00C805] selection:text-black">REDECONOMIX.OFICIAL.UALA</p>
                </div>

                <Button onClick={() => setStep(2)} className="w-full h-16 max-sm:h-12 bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-[11px] rounded-2xl">
                  Ya realicé el pago
                </Button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                 <div className="space-y-2">
                   <div className="w-20 h-20 max-sm:h-14 bg-[#00C805]/10 rounded-full flex items-center justify-center mx-auto text-[#00C805]">
                      <Upload className="h-8 w-8" />
                   </div>
                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Subí tu Comprobante</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-8">Necesitamos la captura de pantalla para validar tu suscripción manualmente.</p>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 hover:border-[#00C805]/40 transition-all cursor-pointer group">
                   <input type="file" className="hidden" id="receipt" />
                   <label htmlFor="receipt" className="cursor-pointer space-y-4 block">
                      <div className="text-[#00C805] group-hover:scale-110 transition-transform flex justify-center"><Smartphone className="h-10 w-10" /></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Captura</span>
                   </label>
                </div>

                <Button onClick={() => setIsProcessing(true)} disabled={isProcessing} className="w-full h-16 max-sm:h-12 bg-[#00C805] text-black font-black uppercase tracking-widest text-[11px] rounded-2xl">
                  {isProcessing ? 'Enviando...' : 'Finalizar y Enviar'}
                </Button>

                {isProcessing && (
                  <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
                    Enviando comprobante al administrador. Tu cuenta se activará en breve.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
