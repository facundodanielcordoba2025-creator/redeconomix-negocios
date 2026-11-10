'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, Zap, X, Sparkles, Orbit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface VisualSearchScannerProps {
  onPhotoTaken: (imageDataUri: string) => void;
  onClose: () => void;
}

export function VisualSearchScanner({ onPhotoTaken, onClose }: VisualSearchScannerProps) {
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
    <div className="relative w-full h-[70vh] flex flex-col items-center justify-center bg-[#0A0B14] rounded-[3rem] overflow-hidden shadow-2xl border-2 border-white/5 group">
      {hasPermission === false ? (
        <div className="p-10 w-full text-center space-y-6">
            <CameraOff className="h-16 max-sm:h-12 w-16 text-red-500 mx-auto opacity-70 animate-pulse" />
            <Alert variant="destructive" className="rounded-3xl border-none bg-red-500/10 py-6">
              <AlertTitle className="font-bold  uppercase text-red-500 text-lg mb-2">Error de Sensores</AlertTitle>
              <AlertDescription className="text-red-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                Habilitá la cámara en los ajustes para que el sistema pueda identificar el producto.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={onClose} className="rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold  uppercase w-full h-14">Abortar</Button>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0B14] text-white z-20">
                <div className="relative">
                    <Orbit className="h-16 max-sm:h-12 w-16 animate-spin text-blue-500" />
                    <div className="absolute inset-0 blur-2xl bg-blue-500/20 animate-pulse" />
                </div>
                <p className="font-bold  uppercase tracking-[0.4em] text-[10px] mt-8 text-white/30 text-center px-10">Conectando con Servidor de Visión...</p>
            </div>
          )}

          {!isLoading && (
            <>
                {/* HUD Viewfinder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="w-[75%] h-[50%] border border-blue-500/30 rounded-[3rem] relative shadow-[0_0_0_9999px_rgba(10,11,20,0.6)]">
                        {/* HUD Corners */}
                        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        
                        {/* Targeting Reticle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center opacity-40">
                            <div className="w-full h-[1px] bg-white" />
                            <div className="absolute w-[1px] h-full bg-white" />
                        </div>
                    </div>
                </div>

                {/* Header Controls */}
                <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-30">
                    <div className="flex items-center gap-2.5 bg-[#171926]/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <p className="text-white font-bold  uppercase tracking-widest text-[10px]">
                            Escáner Visual de Productos
                        </p>
                    </div>
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-5 px-10 z-30">
                    <Button 
                        variant="secondary"
                        onClick={handleTakePhoto}
                        className="h-20 max-sm:h-14 w-20 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-[0_0_50px_rgba(37,99,235,0.4)] active:scale-90 flex items-center justify-center group/btn"
                    >
                        <div className="w-14 h-14 rounded-full border-4 border-white/20 flex items-center justify-center group-hover/btn:border-white/50 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-full" />
                        </div>
                    </Button>
                    
                    <Button 
                        variant="ghost"
                        onClick={onClose}
                        className="h-16 max-sm:h-12 w-16 rounded-[1.8rem] bg-white/5 backdrop-blur-xl text-white border border-white/10 hover:bg-red-500 transition-all flex shrink-0"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Instruction */}
                <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none z-30 opacity-60">
                    <p className="text-[10px] font-bold  uppercase text-white/50 tracking-[0.3em] px-10 leading-relaxed">
                        Centre el producto para identificarlo
                    </p>
                </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
