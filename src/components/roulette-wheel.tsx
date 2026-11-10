"use client";

import { useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Prize } from '@/lib/redsorpresas-actions';

interface RouletteWheelProps {
  prizes: Prize[];
  onSpin: () => Promise<Prize>;
  isSpinning: boolean;
  setIsSpinning: (spin: boolean) => void;
  disabled: boolean;
}

export function RouletteWheel({ prizes, onSpin, isSpinning, setIsSpinning, disabled }: RouletteWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Físicas imperativas de alta fidelidad: Cero Latencia visual + Control exacto de frenado
  const rotation = useMotionValue(0);

  const startSpin = async () => {
    if (isSpinning || disabled) return;
    setIsSpinning(true);

    // 1. Comenzar la animación infinitamente *antes* de esperar la red.
    const currentRot = rotation.get();
    const infiniteSpin = animate(rotation, currentRot + 360, {
      repeat: Infinity,
      ease: "linear",
      duration: 0.35, // Giro constante y rápido
    });

    try {
      // 2. Esperar al Backend (Simulación o Prod)
      const selectedPrize = await onSpin();
      
      const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);
      if (prizeIndex === -1) throw new Error("Premio no encontrado en el set.");

      // 3. Detener Giro Infinito y calcular Desaceleración en base al milisegundo exacto de Frenado
      infiniteSpin.stop();
      
      const stoppedAtRot = rotation.get();
      const sliceAngle = 360 / prizes.length;
      const baseLandingAngle = 360 - (prizeIndex * sliceAngle) - (sliceAngle / 2);
      
      const extraSpins = 360 * 5; // Vueltas físicas del peso de freno visual
      const newRotation = stoppedAtRot + extraSpins + baseLandingAngle + (360 - (stoppedAtRot % 360));

      // 4. Iniciar Frenado Curvo Suave (Ease Out)
      await animate(rotation, newRotation, {
         type: "tween",
         ease: "circOut",
         duration: 4.5
      });

      // Se resuelve cuando el freno llega a 0 velocidad
      setIsSpinning(false);

    } catch (error) {
       console.error("Spin error", error);
       infiniteSpin.stop();
       setIsSpinning(false);
    }
  };

  return (
    <div className="relative w-[110vw] max-w-[500px] aspect-square mx-auto my-8 flex items-center justify-center left-1/2 -translate-x-1/2">
      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-10 bg-yellow-400 drop-shadow-xl z-20" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
      
      {/* Wheel */}
      <motion.div 
        ref={wheelRef}
        className="relative w-full h-full rounded-full border-[8px] sm:border-[12px] border-yellow-500 shadow-2xl overflow-hidden bg-zinc-950"
        style={{
           boxShadow: '0 0 40px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(0,0,0,0.5)',
           background: `conic-gradient(${prizes.map((p, i) => `${p.color} ${i * (360 / prizes.length)}deg ${(i + 1) * (360 / prizes.length)}deg`).join(', ')})`,
           rotate: rotation
        }}
      >
        {prizes.map((prize, i) => {
          const sliceAngle = 360 / prizes.length;
          const rotationAngle = (i * sliceAngle) + (sliceAngle / 2); // Center of slice
          
          return (
            <div 
               key={i + "-" + prize.id}
               className="absolute flex items-center justify-end pr-2 sm:pr-4"
               style={{
                 top: '50%',
                 left: '50%',
                 width: '50%', 
                 height: '24px', 
                 marginTop: '-12px',
                 transformOrigin: '0% 50%',
                 transform: `rotate(${rotationAngle - 90}deg)`,
               }}
            >
                <span 
                   className="text-white font-bold uppercase text-[7px] sm:text-[9px] md:text-[11px] tracking-tight leading-none text-right truncate block"
                   style={{
                     textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                     maxWidth: '85%'
                   }}
                >
                  {prize.name}
                </span>
            </div>
          );
        })}
      </motion.div>

      {/* Center Spin Button (Static, outside animation) */}
      <button 
         onClick={startSpin}
         disabled={isSpinning || disabled}
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 max-sm:h-14 bg-gradient-to-br from-red-600 to-red-800 rounded-full border-4 border-yellow-400 shadow-[0_0_40px_rgba(220,38,38,0.8)] z-30 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ring-4 ring-black/20"
      >
        <span className="text-white text-base font-bold  uppercase tracking-tight drop-shadow-md">
          {isSpinning ? '...' : 'GIRAR'}
        </span>
      </button>

    </div>
  );
}
