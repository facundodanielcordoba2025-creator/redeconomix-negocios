'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DNICameraProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageSrc: string) => void;
    title?: string;
}

declare global {
    interface Window {
        Capacitor?: any;
    }
}

export function DNICamera({ isOpen, onClose, onCapture, title = "Escanea tu DNI" }: DNICameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string>('');

    // Iniciar cámara
    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, capturedImage]);

    const startCamera = async () => {
        try {
            // Check native permissions first if running in Capacitor
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                const { Camera: CapCamera } = await import('@capacitor/camera');
                const permission = await CapCamera.requestPermissions();
                if (permission.camera !== 'granted' && permission.camera !== 'prompt-with-rationale') {
                    setCameraError('Permiso denegado por el sistema operativo.');
                    setHasPermission(false);
                    return;
                }
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError('Tu navegador no soporta el acceso directo a la cámara (requiere HTTPS o estar en la app nativa).');
                setHasPermission(false);
                return;
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Usa la cámara trasera por defecto
            });
            setStream(mediaStream);
            setHasPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            setCameraError(err.message || 'No se pudo acceder a la cámara.');
            setHasPermission(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takeSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            // Limit max dimensions to avoid hitting Firestore 1MB document size limit with base64
            const MAX_DIMENSION = 800;
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > height && width > MAX_DIMENSION) {
                height = (height * MAX_DIMENSION) / width;
                width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
                width = (width * MAX_DIMENSION) / height;
                height = MAX_DIMENSION;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setCapturedImage(dataUrl);
            }
        }
    };

    const confirmCapture = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            handleClose();
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    const handleClose = () => {
        setCapturedImage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                <h3 className="text-white font-bold text-lg">{title}</h3>
                <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {hasPermission === false ? (
                <div className="text-center p-8 mt-20">
                    <p className="text-white text-lg font-bold">Sin acceso a la cámara</p>
                    <p className="text-white/60 mt-2 text-sm max-w-xs mx-auto">Por favor, otorga permisos de cámara en tu navegador o aplicación para continuar.</p>
                    {cameraError && (
                        <div className="mt-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl text-xs text-red-200">
                            <p className="font-bold mb-1">Detalle técnico:</p>
                            <p className="break-words">{cameraError}</p>
                        </div>
                    )}
                    <Button onClick={startCamera} className="mt-8 bg-white text-black hover:bg-slate-200 rounded-xl h-12 px-6">
                        Reintentar acceso
                    </Button>
                </div>
            ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* Viewfinder */}
                    {!capturedImage ? (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* DNI Frame Overlay */}
                            <div className="absolute inset-0 z-10 pointer-events-none border-[60px] border-black/50">
                                <div className="w-full h-full border-4 border-white border-dashed rounded-xl relative box-border">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 text-center font-bold text-lg uppercase tracking-widest">
                                        Centrá tu DNI aquí
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
                            <img src={capturedImage} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="Captura DNI" />
                        </div>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-6 z-20 pb-safe bg-gradient-to-t from-black/80 to-transparent">
                        {!capturedImage ? (
                            <button 
                                onClick={takeSnapshot} 
                                className="w-20 h-20 rounded-full border-4 border-white bg-white/30 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all"
                            >
                                <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>
                        ) : (
                            <div className="flex w-full max-w-md gap-4">
                                <Button onClick={retake} variant="outline" className="flex-1 h-14 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    <RefreshCw className="mr-2 h-5 w-5" /> Repetir
                                </Button>
                                <Button onClick={confirmCapture} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-red-700 text-white">
                                    <Check className="mr-2 h-5 w-5" /> Usar foto
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
