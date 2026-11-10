"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ZapOff, X, RefreshCw, Camera } from "lucide-react";

interface UniversalScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
  continuous?: boolean;
}

export default function UniversalScanner({
  onScanSuccess,
  onClose,
  title = "Escáner de Alta Precisión",
  continuous = false,
}: UniversalScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // Forzar Re-enfoque cada 3 segundos (Soluciona el problema de "Cámara Borrosa")
  const startFocusPulse = (track: MediaStreamTrack) => {
    const interval = setInterval(async () => {
      try {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.focusMode?.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'manual', focusDistance: 0.5 } as any]
          });
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any]
          });
        }
      } catch (e) {
        console.warn("Focus pulse failed", e);
      }
    }, 4000);
    return interval;
  };

  const isStoppingRef = useRef(false);

  const initScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    try {
      setIsLoading(true);
      setError(null);

      // PARCHE PARA NEXT.JS 15 TURBOPACK Y HTML5-QRCODE
      // Evita el error: "Failed to construct 'Image': Please use the 'new' operator"
      if (typeof window !== 'undefined' && !(window as any)._patchedImageForQrCode) {
        const OriginalImage = window.Image;
        window.Image = function () {
          return new OriginalImage();
        } as any;
        window.Image.prototype = OriginalImage.prototype;
        (window as any)._patchedImageForQrCode = true;
      }

      const html5QrCode = new Html5Qrcode("universal-scanner-container");
      scannerRef.current = html5QrCode;

      // Calcular el aspect ratio real de la pantalla para evitar estiramientos y borrosidad
      const screenRatio = window.innerWidth / window.innerHeight;

      const config = {
        fps: 10, // 10 FPS es el estándar óptimo para escaneo JS (30 FPS recalienta y tilda celulares de gama media/baja)
        qrbox: { width: 280, height: 180 }, 
        aspectRatio: screenRatio, // Respetar la proporción del celular para no distorsionar ni estirar la imagen
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      };

      await html5QrCode.start(
        { 
          facingMode: "environment",
          width: { ideal: 1920 }, // Forzar cámara en HD para que los números no se vean borrosos
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }] // Obligar al lente a hacer foco automático (macro)
        } as any,
        config,
        async (decodedText) => {
          if (isStoppingRef.current) return;
          isStoppingRef.current = true;
          
          if ("vibrate" in navigator) navigator.vibrate(80);
          
          try {
            await html5QrCode.stop();
            onScanSuccessRef.current(decodedText);
          } catch (e) {
            console.error("Error stopping on success:", e);
            onScanSuccessRef.current(decodedText); // Continuar de todos modos
          }
        },
        undefined
      );

      setIsLoading(false);

      // Si se solicitó desmontar mientras iniciaba
      if (isStoppingRef.current) {
        try {
          await html5QrCode.stop();
        } catch (e) {
          console.warn("Error al apagar cámara de forma diferida:", e);
        }
      }
    } catch (err: any) {
      console.error("Scanner Error:", err);
      setError("No se pudo iniciar la cámara. Verifica los permisos del navegador.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) initScanner();
    }, 800); // 800ms para seguridad total de hidratación

    return () => {
      mounted = false;
      clearTimeout(timer);
      isStoppingRef.current = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.warn("No se pudo apagar de inmediato (puede estar inicializando):", err);
        });
      }
      
      // Apagar por fuerza bruta todos los tracks de video activos
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const stream = video.srcObject as MediaStream;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(track => track.stop());
          }
        });
      } catch (e) {}
    };
  }, [initScanner]);

  const toggleFlash = async () => {
    try {
      if (videoTrackRef.current) {
        const newState = !isFlashOn;
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: newState }]
        } as any);
        setIsFlashOn(newState);
      }
    } catch (e) {
      console.warn("Torch no disponible");
    }
  };

  return (
    <div className={continuous ? "absolute inset-0 bg-black flex flex-col items-center justify-center font-sans overflow-hidden rounded-xl" : "fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center font-sans overflow-hidden"}>
      {/* CAPA 0: EL SENSOR (Cero interferencias) */}
      <div 
        id="universal-scanner-container" 
        className="absolute inset-0 w-full h-full z-0" 
      />
      
      {/* CAPA 1: HUD DE ESCANEO (Interacción) */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none">
        {/* ENCUADRE DE PRECISIÓN */}
        <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-[2.5rem] border-2 border-white/20 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
           {/* Esquinas de Alto Contraste (RedEconomiX Neon) */}
           <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-primary rounded-tl-3xl shadow-[0_0_30px_rgba(255,46,85,0.6)]" />
           <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-primary rounded-tr-3xl shadow-[0_0_30px_rgba(255,46,85,0.6)]" />
           <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-primary rounded-bl-3xl shadow-[0_0_30px_rgba(255,46,85,0.6)]" />
           <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-primary rounded-br-3xl shadow-[0_0_30px_rgba(255,46,85,0.6)]" />
           
           {/* LÍNEA LÁSER DINÁMICA */}
           <motion.div 
             animate={{ top: ['5%', '95%', '5%'] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
             className="absolute left-0 right-0 h-1.5 bg-primary shadow-[0_0_35px_rgba(255,46,85,1)] z-20"
           />
           
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-pulse" />
        </div>

        {/* TEXTOS (Solo si no es continuous) */}
        {!continuous && (
          <div className="mt-12 text-center space-y-4 pointer-events-auto">
              <h2 className="text-white font-black uppercase text-2xl tracking-tighter italic shadow-2xl">
                Red<span className="text-primary italic">EconomiX</span> Sensor
              </h2>
              <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-[10px] bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                  Alinee el código con la línea láser
              </p>
          </div>
        )}
      </div>

      {/* BOTÓN DE CIERRE (Solo si no es continuous) */}
      {!continuous && (
        <button 
          onClick={onClose} 
          className="absolute top-10 right-8 p-5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-3xl border border-white/10 active:scale-90 transition-all z-50 shadow-2xl"
        >
          <X size={28} />
        </button>
      )}

      {/* CONTROLES DE HARDWARE (Inferior - Solo si no es continuous) */}
      {!continuous && (
        <div className="absolute bottom-16 flex items-center gap-6 z-50">
          <button 
            onClick={toggleFlash} 
            className={`p-6 rounded-[2rem] backdrop-blur-3xl border border-white/10 active:scale-90 transition-all shadow-xl ${isFlashOn ? 'bg-primary text-black' : 'bg-white/10 text-white'}`}
          >
            {isFlashOn ? <Zap size={28} fill="currentColor" /> : <ZapOff size={28} />}
          </button>
          
          <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  <span className="text-[10px] text-white font-black uppercase tracking-widest italic">Activo</span>
              </div>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Sincronización IA</span>
          </div>
        </div>
      )}

      {/* ESTADOS DE CARGA / ERROR */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
            <div className="w-16 h-16 max-sm:h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
            <p className="text-white font-black uppercase tracking-widest italic animate-pulse">Iniciando Sensor...</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-x-4 z-[60] bg-red-600/90 backdrop-blur-2xl p-4 rounded-2xl text-white text-center shadow-[0_40px_100px_rgba(220,38,38,0.3)] border border-white/10">
            <Camera className="w-8 h-8 mx-auto mb-2 text-white/50" />
            <p className="font-black text-xs mb-4 leading-tight italic uppercase">{error}</p>
            <button onClick={initScanner} className="w-full bg-white text-red-600 px-4 py-3 rounded-xl font-black uppercase tracking-tight flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-xs">
              <RefreshCw size={16} /> Reintentar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        #universal-scanner-container video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
        }
        @keyframes scan {
          from { transform: translateY(0); }
          to { transform: translateY(300px); }
        }
      `}</style>
    </div>
  );
}
