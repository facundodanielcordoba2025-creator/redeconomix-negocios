'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Activity, X, ShieldCheck, Zap, Sparkles, Camera, Timer, Target, Flame } from 'lucide-react';

declare global {
  interface Window {
    tf: any;
    poseDetection: any;
  }
}

interface ChallengeRecorderProps {
  onClose: () => void;
  onComplete: (reps: number) => void;
  title?: string;
  mode?: 'squats' | 'pushups';
}

export function ChallengeRecorder({ onClose, onComplete, title = "Reto de Sentadillas", mode = "squats" }: ChallengeRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<any>(null);
  
  const [reps, setReps] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [step, setStep] = useState(0); // 0: intro, 1: calibration, 2: counting, 3: result
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [depth, setDepth] = useState(0); 
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  // Carga de Scripts con versiones estables
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    async function initAI() {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.17.0');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.17.0');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.17.0');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3');
      setScriptsLoaded(true);
    }
    initAI();
  }, []);

  // Inicialización del Detector
  useEffect(() => {
    if (!scriptsLoaded) return;
    async function loadModel() {
      const tf = window.tf;
      const poseDetection = window.poseDetection;
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, 
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER } // Thunder es más preciso que Lightning
        );
        setIsLoading(false);
      } catch (err) {
        console.error("AI Error:", err);
      }
    }
    loadModel();
  }, [scriptsLoaded]);

  // Gestión de Cámara y Audio
  useEffect(() => {
    if (step < 3) {
      async function startCamera() {
        if (!videoRef.current) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
            audio: false
          });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setPermissionError(null);
        } catch (err: any) {
          console.error("Camera Access Error:", err);
          if (err.name === 'NotAllowedError') {
            setPermissionError("Permiso de cámara denegado. Por favor, habilitá el acceso en la configuración de tu navegador.");
          } else {
            setPermissionError("No se pudo acceder a la cámara. Verificá que no esté siendo usada por otra app.");
          }
        }
      }
      startCamera();
    }

    // Inicializar Audio
    if (!audioRef.current) {
      audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=game-music-7408.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    if (!successAudioRef.current) {
      successAudioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
      successAudioRef.current.volume = 0.6;
    }

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [step]);

  // Manejo de reproducción de audio según el paso
  useEffect(() => {
    if (step === 2) {
      audioRef.current?.play().catch(e => console.log("Audio play blocked:", e));
    } else if (step === 3) {
      audioRef.current?.pause();
      successAudioRef.current?.play().catch(e => console.log("Success audio blocked:", e));
    }
  }, [step]);

  // Lógica de Detección y Dibujo Pro
  useEffect(() => {
    let animationId: number;
    
    const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: any[]) => {
      const connections = [
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'],
        ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'],
        ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'],
        ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
        ['left_hip', 'left_knee'],
        ['left_knee', 'left_ankle'],
        ['right_hip', 'right_knee'],
        ['right_knee', 'right_ankle']
      ];

      ctx.strokeStyle = 'var(--primary, #E60000)'; // Verde Matrix/Cyberpunk
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      connections.forEach(([p1, p2]) => {
        const kp1 = keypoints.find(k => k.name === p1);
        const kp2 = keypoints.find(k => k.name === p2);
        if (kp1?.score > 0.3 && kp2?.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      });

      // Puntos de articulación estéticos
      keypoints.forEach(kp => {
        if (kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'var(--primary, #E60000)';
          ctx.stroke();
        }
      });
    };

    async function detect() {
      if (!detectorRef.current || !videoRef.current || step !== 2) return;
      if (videoRef.current.readyState < 2) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        const hip = keypoints.find((k: any) => k.name === 'left_hip' || k.name === 'right_hip');
        const knee = keypoints.find((k: any) => k.name === 'left_knee' || k.name === 'right_knee');
        const ankle = keypoints.find((k: any) => k.name === 'left_ankle' || k.name === 'right_ankle');

        if (mode === 'squats' && hip && knee && ankle) {
          const hipKneeDist = knee.y - hip.y;
          const kneeAnkleDist = ankle.y - knee.y;
          const currentDepth = Math.max(0, Math.min(100, (hipKneeDist / kneeAnkleDist) * 150));
          setDepth(currentDepth);

          if (currentDepth > 70 && !isDown) {
            setIsDown(true);
          } else if (currentDepth < 30 && isDown) {
            setIsDown(false);
            setReps(r => r + 1);
          }
        } 
        else if (mode === 'pushups') {
          const shoulder = keypoints.find((k: any) => k.name === 'left_shoulder' || k.name === 'right_shoulder');
          const wrist = keypoints.find((k: any) => k.name === 'left_wrist' || k.name === 'right_wrist');
          
          if (shoulder && wrist && shoulder.score > 0.3 && wrist.score > 0.3) {
            const dist = wrist.y - shoulder.y;
            // En flexiones, cuando el hombro baja, la distancia a la muñeca (en Y) disminuye
            const currentPushDepth = Math.max(0, Math.min(100, (1 - (dist / 150)) * 100));
            setDepth(currentPushDepth);

            if (currentPushDepth > 80 && !isDown) {
              setIsDown(true);
            } else if (currentPushDepth < 40 && isDown) {
              setIsDown(false);
              setReps(r => r + 1);
            }
          }
        }

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            drawSkeleton(ctx, keypoints);
          }
        }
      }
      animationId = requestAnimationFrame(detect);
    }

    if (step === 2) detect();
    return () => cancelAnimationFrame(animationId);
  }, [step, isDown]);

  // Timer de cuenta regresiva
  useEffect(() => {
    if (step === 1 && countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (step === 1 && countdown === 0) {
      setStep(2);
      setTimeout(() => setStep(3), 30000); // 30 seg de reto
    }
  }, [step, countdown]);

  if (permissionError) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 text-center space-y-8 font-outfit">
        <div className="w-20 h-20 max-sm:h-14 bg-primary/20 rounded-full flex items-center justify-center">
           <Camera className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-4">
           <h2 className="text-3xl font-black text-white uppercase italic leading-none">Acceso Denegado</h2>
           <p className="text-xs font-medium text-slate-400 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
              {permissionError}
           </p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-4">
           <button 
             onClick={() => { setPermissionError(null); setStep(0); }}
             className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest"
           >
             REINTENTAR
           </button>
           <button onClick={onClose} className="text-white/40 font-black uppercase text-[10px] tracking-widest">
             CERRAR
           </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center font-outfit">
        <div className="relative">
           <div className="w-24 h-24 border-2 border-white/10 rounded-full animate-ping" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-8 w-8 text-[var(--primary, #E60000)] animate-pulse" />
           </div>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">InversioneX Advanced Neural Engine</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col font-outfit overflow-hidden">
      
      {/* Viewfinder Layer */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} className="w-full h-full object-cover opacity-80 scale-x-[-1]" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]" />
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 z-20" />
        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none z-20" />
        
        {/* Viewfinder Marks */}
        <div className="absolute top-10 left-10 w-8 h-8 border-t-2 border-l-2 border-white/30 z-30" />
        <div className="absolute top-10 right-10 w-8 h-8 border-t-2 border-r-2 border-white/30 z-30" />
        <div className="absolute bottom-10 left-10 w-8 h-8 border-b-2 border-l-2 border-white/30 z-30" />
        <div className="absolute bottom-10 right-10 w-8 h-8 border-b-2 border-r-2 border-white/30 z-30" />
      </div>

      {/* Top HUD */}
      <div className="relative z-50 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-red-600 rounded text-[10px] font-black text-white flex items-center gap-2 animate-pulse">
            <div className="w-1.5 h-1.5 bg-white rounded-full" /> REC
          </div>
          <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
            {step === 2 ? '00:00:30' : '00:00:00'}
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-40 flex-1 flex flex-col items-center justify-center p-6">
        
        {step === 0 && (
          <div className="max-w-xs w-full bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
             <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary, #E60000)]/10 rounded-full border border-[var(--primary, #E60000)]/20">
                   <Target className="h-3 w-3 text-[var(--primary, #E60000)]" />
                   <span className="text-[9px] font-black text-[var(--primary, #E60000)] uppercase tracking-widest">Calibración Cuerpo Completo</span>
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{title}</h2>
                <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest">Sentadillas Validadas por IA</p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                   <Camera className="h-5 w-5 text-[var(--primary, #E60000)]" />
                   <p className="text-[9px] font-bold text-white/70 uppercase leading-relaxed">Mostrá tu cuerpo completo de costado para mejor precisión.</p>
                </div>
             </div>

             <button onClick={() => setStep(1)} className="w-full h-16 max-sm:h-12 bg-[var(--primary, #E60000)] text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(230,0,0,0.3)]">
                INICIAR SCANNER
             </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
             <div className="text-[14rem] font-black text-white italic leading-none drop-shadow-[0_0_80px_rgba(230,0,0,0.5)]">{countdown}</div>
             <p className="text-xs font-black text-[var(--primary, #E60000)] uppercase tracking-[0.8em]">Prepárate</p>
          </div>
        )}

        {step === 2 && (
          <>
             {/* Dynamic Reps Display */}
             <div className="absolute top-24 flex flex-col items-center">
                <div className="text-[12rem] font-black text-white italic leading-none drop-shadow-2xl">{reps}</div>
                <div className="text-xs font-black text-[var(--primary, #E60000)] uppercase tracking-[0.5em] -mt-4">Repeticiones</div>
             </div>

             {/* Depth Meter HUD */}
             <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <div className="text-[9px] font-black text-white/40 uppercase rotate-90 mb-8 whitespace-nowrap">Depth Range</div>
                <div className="w-1.5 h-64 bg-white/10 rounded-full relative overflow-hidden">
                   <div 
                     className="absolute bottom-0 w-full bg-[var(--primary, #E60000)] transition-all duration-100" 
                     style={{ height: `${depth}%` }}
                   />
                   {/* Target indicator */}
                   <div className="absolute bottom-[70%] w-full h-[2px] bg-white z-10" />
                </div>
                <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center">
                   <Activity className={`h-4 w-4 ${depth > 70 ? 'text-[var(--primary, #E60000)]' : 'text-white/20'} transition-colors`} />
                </div>
             </div>

             {/* Bottom Tracking Stats */}
             <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end">
                <div className="space-y-1">
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block">AI Tracker Status</span>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--primary, #E60000)] rounded-full animate-pulse" />
                      <span className="text-[11px] font-black text-white uppercase italic">Active Tracking</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="text-right">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block">Precision</span>
                      <span className="text-[11px] font-black text-[var(--primary, #E60000)] uppercase italic">Thunder v4</span>
                   </div>
                </div>
             </div>
          </>
        )}

        {step === 3 && (
           <div className="max-w-xs w-full bg-black/80 backdrop-blur-3xl border border-[var(--primary, #E60000)]/30 p-10 rounded-[3rem] text-center space-y-8 animate-in zoom-in duration-500">
              <div className="relative inline-block">
                 <div className="w-24 h-24 bg-[var(--primary, #E60000)]/20 rounded-full flex items-center justify-center">
                    <Flame className="h-12 w-12 text-[var(--primary, #E60000)]" />
                 </div>
                 <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-full">+50 PTS</div>
              </div>
              
              <div className="space-y-1">
                 <h3 className="text-4xl font-black uppercase text-white italic tracking-tighter">{title}</h3>
                 <div className="flex items-center justify-center gap-3">
                    <span className="text-6xl font-black text-[var(--primary, #E60000)] italic">{reps}</span>
                    <span className="text-[10px] font-black text-white/50 uppercase text-left leading-tight">Total<br/>Reps</span>
                 </div>
              </div>

              <div className="p-5 bg-white/5 rounded-2xl space-y-2 border border-white/5">
                 <p className="text-[9px] font-black text-[var(--primary, #E60000)] uppercase tracking-widest">Reto en Proceso de Validación</p>
                 <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">
                    Tu video será publicado por **7 días**. Al finalizar, recibirás un link de cobro con el importe proporcional generado por la comunidad.
                 </p>
              </div>

              <button 
                onClick={() => onComplete(reps)}
                className="w-full h-16 max-sm:h-12 bg-[var(--primary, #E60000)] text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(230,0,0,0.2)]"
              >
                PUBLICAR RETO
              </button>
           </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
