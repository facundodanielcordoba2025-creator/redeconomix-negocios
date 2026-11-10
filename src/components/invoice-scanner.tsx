'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, Zap, X, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';

interface InvoiceScannerProps {
  onPhotoTaken: (imageDataUri: string) => void;
  onClose: () => void;
}

export function InvoiceScanner({ onPhotoTaken, onClose }: InvoiceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
        });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onplaying = () => setIsLoading(false);
          
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              if (error.name !== 'AbortError') {
                console.error('Error playing video:', error);
                setHasPermission(false);
                setIsLoading(false);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg', 0.9);
        
        // Haptic feedback
        if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
        
        // Show flash effect
        setTimeout(() => {
            onPhotoTaken(dataUri);
            setIsCapturing(false);
        }, 300);
      }
    }
  };

  return (
    <div className="relative w-full h-[75vh] flex flex-col items-center justify-center bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl border-2 border-zinc-800 group">
      {hasPermission === false ? (
        <div className="p-10 w-full text-center space-y-6">
            <CameraOff className="h-16 max-sm:h-12 w-16 text-red-500 mx-auto opacity-70 animate-pulse" />
            <Alert variant="destructive" className="rounded-3xl border-none bg-red-500/10 py-6">
              <AlertTitle className="font-bold text-red-500 text-lg mb-2">Acceso Denegado</AlertTitle>
              <AlertDescription className="text-red-400 font-bold text-xs tracking-widest leading-relaxed uppercase">
                Habilitá la cámara en los ajustes de tu celular para capturar comprobantes.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={onClose} className="rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold w-full h-14">Cerrar</Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className={cn(
                "w-full h-full object-cover transition-all duration-500",
                isCapturing ? "brightness-150 scale-105" : "brightness-100 scale-100",
                isLoading ? "opacity-0" : "opacity-100"
            )}
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white z-20">
                <div className="relative">
                    <Loader2 className="h-16 max-sm:h-12 w-16 animate-spin text-emerald-500" />
                    <div className="absolute inset-0 blur-2xl bg-emerald-500/20 animate-pulse" />
                </div>
                <p className="font-bold tracking-widest text-[10px] mt-8 text-zinc-500 uppercase">Iniciando Lente HD...</p>
            </div>
          )}

          {!isLoading && (
            <>
                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-[85%] h-[60%] border-2 border-white/20 rounded-[2rem] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl" />
                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl" />
                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl" />
                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl" />
                        
                        {/* Scanning beam */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-emerald-500/50 to-transparent w-full animate-pulse" />
                    </div>
                </div>

                {/* Top Hint */}
                <div className="absolute top-8 left-0 right-0 px-8 flex justify-center z-30">
                    <div className="flex items-center gap-3 bg-zinc-900/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        <p className="text-white/80 font-bold tracking-widest text-[10px] uppercase">
                            Captura de Comprobante
                        </p>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6 px-10 z-30">
                    <Button 
                        variant="secondary"
                        size="lg"
                        onClick={handleTakePhoto}
                        className="h-20 max-sm:h-14 w-20 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-90 flex items-center justify-center"
                    >
                        <Camera className="h-8 w-8" />
                    </Button>
                    
                    <Button 
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-16 max-sm:h-12 w-16 rounded-[1.8rem] bg-zinc-900/80 backdrop-blur-xl text-white border border-white/10 hover:bg-red-500 transition-all flex shrink-0"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Instruction */}
                <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none z-30 opacity-60">
                    <p className="text-[10px] font-bold text-white tracking-widest px-10 leading-relaxed uppercase">
                        Asegurá que el texto sea legible y haya buena luz
                    </p>
                </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
