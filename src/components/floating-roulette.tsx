'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { X, Gift, PartyPopper, Star, Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Prize } from '@/lib/redsorpresas-constants';

const FLOATING_PRIZES: Prize[] = [
  { id: '1', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#10B981' },
  { id: '2', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#059669' },
  { id: '3', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#10B981' },
  { id: '4', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#059669' },
  { id: '5', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#10B981' },
  { id: '6', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#059669' },
  { id: '7', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#10B981' },
  { id: '8', name: 'JUGO CEPITA 300ml', type: 'product', weight: 100, color: '#059669' },
];

export function FloatingRoulette() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerPrize, setWinnerPrize] = useState<Prize | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  
  const rotation = useMotionValue(0);

  // Persistence logic (v2: reset on mount once for the user to see it after my testing)
  useEffect(() => {
    const savedSpins = localStorage.getItem('floating_roulette_spins');
    // If it was '1' (from my test), we reset it once for the user's satisfaction
    if (savedSpins === '1') {
        localStorage.setItem('floating_roulette_spins', '0');
        setSpinCount(0);
    } else if (savedSpins) {
      setSpinCount(parseInt(savedSpins));
    }
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc(userDocRef);
  const isPremium = userData?.isPremium || false;
  const maxSpins = isPremium ? 4 : 1;

  const handleClose = () => {
    setIsOpen(false);
    // Widget stays visible now as requested
  };

  const startSpin = async () => {
    if (isSpinning) return;
    
    if (spinCount >= maxSpins) {
        setIsOpen(true);
        return;
    }

    setIsSpinning(true);
    setWinnerPrize(null);

    // Initial constant spin
    const infiniteSpin = animate(rotation, rotation.get() + 360, {
      repeat: Infinity,
      ease: "linear",
      duration: 0.4,
    });

    // Simulate backend delay (optional, but adds to the feel)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Select prize
    const randomIdx = Math.floor(Math.random() * FLOATING_PRIZES.length);
    const selectedPrize = FLOATING_PRIZES[randomIdx];

    infiniteSpin.stop();

    const stoppedAtRot = rotation.get();
    const sliceAngle = 360 / FLOATING_PRIZES.length;
    const baseLandingAngle = 360 - (randomIdx * sliceAngle) - (sliceAngle / 2);
    const extraSpins = 360 * 4; // Fewer extra spins for the small trigger
    const finalRotation = stoppedAtRot + extraSpins + baseLandingAngle + (360 - (stoppedAtRot % 360));

    await animate(rotation, finalRotation, {
      type: "tween",
      ease: "circOut",
      duration: 3,
    });

    setIsSpinning(false);
    setWinnerPrize(selectedPrize);
    
    // Increment spins count AFTER the animation
    const newCount = spinCount + 1;
    setSpinCount(newCount);
    localStorage.setItem('floating_roulette_spins', newCount.toString());

    // Automatically open the modal with results
    setTimeout(() => {
        setIsOpen(true);
        if (!user) setShowRegisterPrompt(true);
    }, 400);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Trigger Widget (The Wheel) */}
      <AnimatePresence>
        {!isOpen && isVisible && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            className="fixed bottom-24 left-6 z-40 cursor-grab active:cursor-grabbing touch-none"
            onTap={() => {
                const now = Date.now();
                if (now - lastTap < 300) {
                    if (!isSpinning) startSpin();
                }
                setLastTap(now);
            }}
          >
            <div className="relative touch-none group">
               <div className="w-16 h-16 max-sm:h-12 bg-white rounded-full border-4 border-yellow-400 shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-active:scale-95">
                  {/* Visual wheel that spins */}
                  <motion.div 
                      className="w-full h-full" 
                      style={{ 
                          background: `conic-gradient(#10B981 0deg 45deg, #059669 45deg 90deg, #10B981 90deg 135deg, #059669 135deg 180deg, #10B981 180deg 225deg, #059669 225deg 270deg, #10B981 270deg 315deg, #059669 315deg 360deg)`,
                          rotate: rotation
                      }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded-full border-2 border-yellow-400 shadow-sm flex items-center justify-center">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-yellow-400 z-20" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
               </div>
               
               {/* Close Button X (requested by user) */}
               <button 
                  onPointerDown={(e) => { e.stopPropagation(); setIsVisible(false); }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-50 hover:bg-black transition-colors"
               >
                  <X className="w-3 h-3" />
               </button>
               
               <motion.div 
                  animate={{ y: isSpinning ? 0 : [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-6 left-0 bg-yellow-400 text-black text-[8px] font-bold  uppercase px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap z-10 pointer-events-none"
               >
                  {isSpinning ? '¡GIRANDO!' : '¡2X TAP PARA GIRAR!'}
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={handleClose}
            />
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="relative bg-white rounded-[3rem] w-full max-w-[360px] overflow-hidden shadow-2xl border-4 border-yellow-400"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={handleClose} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 pt-10 text-center">
                 <h2 className="text-3xl font-bold  uppercase tracking-tight text-white leading-none">Ruleta<br/><span className="text-yellow-400 text-4xl">Express</span></h2>
                 <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">
                    {spinCount >= maxSpins ? 'Límite Diario Completado' : (isPremium ? 'Beneficio Socio Premium' : 'Giro Diario Disponible')}
                 </p>
              </div>

              <div className="p-4 flex flex-col items-center">
                {/* Result Display */}
                <div className="w-full py-8 flex flex-col items-center justify-center text-center px-4">
                  {winnerPrize ? (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <PartyPopper className="w-16 h-16 max-sm:h-12 text-yellow-500 mb-6 animate-bounce" />
                        <div className="bg-emerald-500 text-white text-[10px] font-bold uppercase px-6 py-1.5 rounded-full mb-3 shadow-lg shadow-emerald-500/20">¡FELICIDADES!</div>
                        <h3 className="text-3xl font-bold  uppercase tracking-tight text-slate-900 leading-tight">Ganaste:<br/><span className="text-red-600">{winnerPrize.name}</span></h3>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 max-sm:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Star className="w-8 h-8 text-slate-300 fill-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold  uppercase tracking-tight text-slate-800">¡Vuelve mañana!</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest">Ya has utilizado tus giros disponibles de hoy</p>
                    </div>
                  )}
                </div>

                {/* Login Prompt Overlay */}
                <AnimatePresence>
                    {showRegisterPrompt && (
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="mt-2 p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center w-full"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <UserPlus className="w-6 h-6 text-red-600" />
                            </div>
                            <h4 className="text-sm font-bold uppercase  text-slate-900">¿Cómo canjear el premio?</h4>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 mb-4">
                                {winnerPrize?.type === 'cashback' 
                                    ? 'El dinero se acreditará en tu cuenta al registrarte para compra o retiro.' 
                                    : 'Tu premio estará listo para ser retirado en tienda una vez que te registres.'}
                                <br/><span className="text-red-600 font-bold">¡Registrate ahora para canjearlo!</span>
                            </p>
                            <Button 
                                onClick={() => router.push('/register')}
                                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-bold  uppercase rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all text-sm tracking-widest"
                            >
                                Registrarme Ahora
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showRegisterPrompt && winnerPrize && (
                     <div className="mt-4 p-4 text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            {winnerPrize.type === 'cashback' 
                                ? 'El dinero se ha acreditado en tu cuenta para compra o retiro' 
                                : '¡Te enviamos tu regalo a domicilio! Podrás canjearlo añadiéndolo a tu carrito en cualquier compra superior a $10.000.'}
                        </p>
                        <Button 
                            onClick={handleClose}
                            className="mt-6 w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-black/10 active:scale-95 transition-all"
                        >
                            ¡CANJEAR!
                        </Button>
                     </div>
                )}
              </div>

              {/* Redundant footer removed to save space */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
