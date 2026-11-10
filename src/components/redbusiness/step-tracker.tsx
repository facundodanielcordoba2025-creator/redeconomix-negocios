'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Footprints, TrendingUp, Zap, Trophy, BellRing as Ring, Smartphone, Activity } from 'lucide-react';

interface StepTrackerProps {
  onClose: () => void;
  onComplete: (steps: number) => void;
}

export function StepTracker({ onClose, onComplete }: StepTrackerProps) {
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const lastStepTime = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const threshold = 12; 

  const requestPermission = async () => {
    // 1. Verificar si estamos en un contexto seguro (HTTPS)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      console.warn("Sensor APIs require HTTPS");
      setPermission('denied');
      return;
    }

    // 2. Manejo para iOS 13+ (requiere gesto de usuario y prompt)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        if (response === 'granted') {
          setPermission('granted');
          setIsTracking(true);
        } else {
          setPermission('denied');
        }
      } catch (e) {
        console.error("Sensor Permission Error:", e);
        setPermission('denied');
      }
    } else {
      // 3. Android o browsers antiguos (generalmente no requieren prompt explícito)
      // Pero verificamos si el evento existe
      if ('DeviceMotionEvent' in window) {
        setPermission('granted');
        setIsTracking(true);
      } else {
        console.error("DeviceMotionEvent not supported on this device/browser");
        setPermission('denied');
      }
    }
  };

  useEffect(() => {
    if (!isTracking || permission !== 'granted') return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const currentAcc = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
      );

      const delta = Math.abs(currentAcc - Math.sqrt(
        lastAcceleration.current.x ** 2 + lastAcceleration.current.y ** 2 + lastAcceleration.current.z ** 2
      ));

      const now = Date.now();
      // Si el pico de aceleración supera el umbral y ha pasado suficiente tiempo desde el último paso (evitar rebotes)
      if (delta > threshold && now - lastStepTime.current > 350) {
        setSteps(s => s + 1);
        lastStepTime.current = now;
      }

      lastAcceleration.current = {
        x: acc.x || 0,
        y: acc.y || 0,
        z: acc.z || 0
      };
    };

    window.addEventListener('devicemotion', handleMotion);

    // Inicializar y reproducir Audio si está trackeando
    if (!audioRef.current) {
      audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a7315b.mp3?filename=action-game-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    audioRef.current.play().catch(e => console.log("Audio play blocked:", e));

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isTracking, permission]);

  // Manejo de Finalización con Sonido
  const handleFinish = () => {
    if (!successAudioRef.current) {
      successAudioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success.mp3');
    }
    audioRef.current?.pause();
    successAudioRef.current.play().catch(e => console.log("Success audio blocked:", e));
    setTimeout(() => onComplete(steps), 500);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black font-outfit flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00C805]/10 blur-[120px] rounded-full animate-pulse" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#1a1b1e] border border-white/10 rounded-full flex items-center justify-center text-[#00C805]">
               <Footprints className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Sweat Mode</p>
               <h3 className="text-xs font-black text-white uppercase tracking-tighter italic">Paso a Paso InversioneX</h3>
            </div>
         </div>
         <button onClick={onClose} className="text-white/50 hover:text-white uppercase font-black text-[10px] tracking-widest border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            Cerrar X
         </button>
      </div>

      {/* Main Content */}
      <div className="relative z-40 w-full max-w-sm flex flex-col items-center gap-12">
         
         {permission === 'prompt' && (
           <div className="bg-[#1a1b1e]/80 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 max-sm:h-14 bg-[#00C805]/20 rounded-full mx-auto flex items-center justify-center">
                 <Smartphone className="h-10 w-10 text-[#00C805] animate-bounce" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">ACTIVA TUS<br/>SENSORES</h2>
                 <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">
                    Necesitamos acceso al acelerómetro para contar tus pasos. Guardá el celular en tu bolsillo y empezá a caminar.
                 </p>
              </div>
              <button 
                onClick={requestPermission}
                className="w-full bg-[#00C805] text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(0,200,5,0.3)]"
              >
                VINCULAR SENSORES
              </button>
           </div>
         )}

         {permission === 'granted' && (
           <>
             <div className="relative">
                {/* Circular Step Progress */}
                <div className="w-72 h-72 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative">
                   <div className="absolute inset-0 rounded-full border-4 border-[#00C805] border-t-transparent animate-spin [animation-duration:3000ms]" />
                   <span className="text-[8rem] font-black text-white italic leading-none drop-shadow-2xl">{steps}</span>
                   <span className="text-xs font-black text-[#00C805] uppercase tracking-[0.5em] -mt-2">Pasos</span>
                </div>
                
                {/* Floatings items */}
                <div className="absolute -top-4 -right-4 bg-white text-black px-4 py-2 rounded-2xl font-black text-[10px] shadow-xl animate-bounce">
                   +{ (steps * 0.5).toFixed(1) } RedEconomiX
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-2">
                   <TrendingUp className="h-5 w-5 text-[#00C805]" />
                   <span className="text-[10px] font-black text-white/50 uppercase">Progreso</span>
                   <span className="text-lg font-black text-white italic">{(steps / 10).toFixed(0)}%</span>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-2">
                   <Zap className="h-5 w-5 text-orange-500" />
                   <span className="text-[10px] font-black text-white/50 uppercase">Energía</span>
                   <span className="text-lg font-black text-white italic">High</span>
                </div>
             </div>

             <div className="w-full space-y-4">
                <div className="flex flex-col gap-4 bg-[#1a1b1e] p-6 rounded-3xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#00C805]/10 rounded-full flex items-center justify-center">
                         <Activity className="h-5 w-5 text-[#00C805]" />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-white uppercase tracking-tighter">Estado: Pendiente de Publicación</p>
                         <p className="text-[9px] font-medium text-slate-500 uppercase leading-tight mt-1">
                            Tu actividad será validada por la comunidad durante los próximos **7 días**.
                         </p>
                      </div>
                   </div>
                   <div className="pt-3 border-t border-white/5">
                      <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center">Recibirás un link de cobro con el importe proporcional al finalizar el periodo.</p>
                   </div>
                </div>
                
                <button 
                  onClick={handleFinish}
                  className="w-full bg-[#00C805] text-black py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,200,5,0.2)]"
                >
                  PUBLICAR RETO
                </button>
             </div>
           </>
         )}

         {permission === 'denied' && (
           <div className="text-center space-y-6">
              <Ring className="h-16 max-sm:h-12 w-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-black text-white uppercase italic">Permiso Denegado</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  No pudimos acceder a los sensores de movimiento. Asegúrate de:
                  <br/>1. Estar usando un **celular**.
                  <br/>2. Tener habilitado el acceso a sensores en la configuración de privacidad.
                  <br/>3. Estar navegando bajo una conexión segura **HTTPS**.
              </p>
              <button onClick={onClose} className="text-[#00C805] font-black uppercase text-xs">Volver al Panel</button>
           </div>
         )}
      </div>

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
         <div className="h-1.5 w-1.5 bg-[#00C805] rounded-full" />
         <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em]">InversioneX Mobile Sensor Node</span>
      </div>

    </div>
  );
}
