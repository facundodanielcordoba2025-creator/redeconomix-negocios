import React, { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat, Resolution } from '@capacitor-mlkit/barcode-scanning';
import { Scan, AlertTriangle, Zap, ZapOff, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

// Re-use a single AudioContext to prevent exceeding the browser limit (usually 6) which causes crashes
let globalAudioCtx: any = null;

export default function NativeScanner({
    onScanSuccess,
    onClose,
    continuous = false
}: {
    onScanSuccess: (code: string) => void;
    onClose: () => void;
    title?: string;
    continuous?: boolean;
}) {
    const [status, setStatus] = useState<string>('Iniciando motor nativo...');
    const [error, setError] = useState<string | null>(null);
    const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(5);
    const [supportsHardwareZoom, setSupportsHardwareZoom] = useState<boolean | null>(null);
    const [isTorchAvailable, setIsTorchAvailable] = useState(false);

    const toggleTorch = async (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            await BarcodeScanner.toggleTorch();
            const res = await BarcodeScanner.isTorchEnabled();
            setTorchEnabled(res.enabled);
        } catch (err) {
            console.log("Torch error", err);
        }
    };

    const applyZoom = async (newZoom: number) => {
        // Redondear a 1 decimal
        const rounded = Math.round(newZoom * 10) / 10;
        // Limitar entre minZoom y maxZoom
        const clamped = Math.max(minZoom, Math.min(maxZoom, rounded));
        setZoomLevel(clamped);

        try {
            await BarcodeScanner.setZoomRatio({ zoomRatio: clamped });
        } catch (err) {
            console.log("Hardware zoom error", err);
        }
    };

    const playBeep = () => {
        try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                if (!globalAudioCtx) {
                    globalAudioCtx = new AudioContextClass();
                }
                const osc = globalAudioCtx.createOscillator();
                const gain = globalAudioCtx.createGain();
                osc.connect(gain);
                gain.connect(globalAudioCtx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(1200, globalAudioCtx.currentTime);
                gain.gain.setValueAtTime(1, globalAudioCtx.currentTime);
                osc.start();
                
                // Beep for 100ms
                osc.stop(globalAudioCtx.currentTime + 0.1);
            }
        } catch (e) {
            console.log("Audio/Vibración no soportada", e);
        }
    };

    const onScanSuccessRef = useRef(onScanSuccess);
    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    useEffect(() => {
        let isMounted = true;
        let listener: any = null;

        const startNativeScan = async () => {
            try {
                if (!Capacitor.isNativePlatform()) {
                    if (isMounted) {
                        setError("Estás navegando en Chrome (Web).");
                        setStatus("");
                    }
                    return;
                }

                // Pedir permiso nativo directo a Android
                const { camera } = await BarcodeScanner.requestPermissions();
                
                if (camera !== 'granted' && camera !== 'limited') {
                    if (isMounted) setError("Permiso denegado por el dispositivo nativo.");
                    return;
                }

                if (isMounted) setStatus("Láser activo (Cámara nativa)...");
                
                // Hacer el fondo de la página transparente para ver la cámara
                if (!continuous) {
                    document.body.classList.add('scanner-active');
                    document.documentElement.classList.add('scanner-active');
                } else {
                    document.body.classList.add('scanner-active-continuous');
                    document.documentElement.classList.add('scanner-active-continuous');
                }

                // Escuchar el evento de código escaneado
                listener = await BarcodeScanner.addListener('barcodesScanned', (result: any) => {
                    if (result.barcodes && result.barcodes.length > 0) {
                        const code = result.barcodes[0].rawValue || result.barcodes[0].displayValue;
                        const now = Date.now();
                        
                        // Prevent duplicate rapid scans of the same code
                        if (code !== lastScannedRef.current.code || (now - lastScannedRef.current.time > 2000)) {
                            lastScannedRef.current = { code, time: now };
                            playBeep();
                            onScanSuccessRef.current(code);
                            
                            if (!continuous) {
                                document.body.classList.remove('scanner-active');
                                document.documentElement.classList.remove('scanner-active');
                                BarcodeScanner.stopScan();
                            }
                        }
                    }
                });

                // Workaround crucial: Detener cualquier escáner previo que haya quedado colgado asíncronamente
                // Esto previene el error fatal de Android CameraX: "May be attempting to bind too many use cases"
                try {
                    await BarcodeScanner.stopScan();
                } catch (e) {}

                // Iniciar la cámara nativa por detrás del WebView optimizada para velocidad
                try {
                    await BarcodeScanner.startScan({
                        formats: [
                            BarcodeFormat.Ean13,
                            BarcodeFormat.Ean8,
                            BarcodeFormat.UpcA,
                            BarcodeFormat.UpcE,
                            BarcodeFormat.Code128,
                            BarcodeFormat.Code39,
                            BarcodeFormat.QrCode
                        ]
                    });
                } catch (scanOptErr) {
                    console.warn("Fallback to BarcodeScanner.startScan without options:", scanOptErr);
                    await BarcodeScanner.startScan();
                }
                try {
                    const res = await BarcodeScanner.isTorchAvailable();
                    setIsTorchAvailable(res.available);
                } catch (e) {}

                // Consultar capacidades de zoom de la cámara
                try {
                    const minRes = await BarcodeScanner.getMinZoomRatio();
                    const maxRes = await BarcodeScanner.getMaxZoomRatio();
                    const currentRes = await BarcodeScanner.getZoomRatio();

                    const minZ = typeof minRes?.zoomRatio === 'number' && minRes.zoomRatio > 0 ? minRes.zoomRatio : 1;
                    const maxZ = typeof maxRes?.zoomRatio === 'number' && maxRes.zoomRatio > 1 ? maxRes.zoomRatio : 1;
                    
                    if (isMounted) {
                        setMinZoom(minZ);
                        setMaxZoom(Math.min(maxZ, 8)); // tope sensato
                        setSupportsHardwareZoom(maxZ > minZ);
                        if (typeof currentRes?.zoomRatio === 'number' && currentRes.zoomRatio > 0) {
                            setZoomLevel(currentRes.zoomRatio);
                        }
                    }
                } catch (e) {
                    console.log("No se pudieron consultar límites de zoom nativo", e);
                    if (isMounted) {
                        setSupportsHardwareZoom(false);
                    }
                }

            } catch (err: any) {
                if (isMounted) {
                    setError("Error del motor ML Kit: " + err.message);
                }
            }
        };

        startNativeScan();

        return () => {
            isMounted = false;
            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
            document.body.classList.remove('scanner-active-continuous');
            document.documentElement.classList.remove('scanner-active-continuous');
            if (listener) {
                listener.remove();
            }
            if (Capacitor.isNativePlatform()) {
                 BarcodeScanner.stopScan().catch(() => {});
            }
        };
    }, [continuous]);

    if (Capacitor.isNativePlatform() && !error) {
        if (continuous) {
            // Inline continuous scanner (Point of Sale, embedded box)
            return (
                <div className="w-full h-full bg-transparent flex flex-col items-center justify-center relative overflow-hidden pointer-events-auto">
                    {/* Controles de Linterna en modo embebido (Esquina superior izquierda para evitar botón Cerrar) */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-[9999] pointer-events-auto">
                        {isTorchAvailable && (
                            <button 
                                type="button"
                                onClick={toggleTorch} 
                                onTouchEnd={toggleTorch}
                                className={cn(
                                    "p-3 rounded-full backdrop-blur-md shadow-xl border active:scale-90 transition-all flex items-center justify-center touch-manipulation select-none",
                                    torchEnabled 
                                        ? "bg-yellow-400 text-black border-yellow-300 shadow-yellow-400/50" 
                                        : "bg-black/70 text-white border-white/20 hover:bg-black"
                                )}
                            >
                                {torchEnabled ? <Zap className="text-black w-5 h-5 fill-current" /> : <ZapOff className="text-white w-5 h-5" />}
                            </button>
                        )}
                    </div>

                    {/* Botones rápidos de Zoom */}
                    {supportsHardwareZoom !== false && maxZoom > 1 ? (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto flex items-center gap-1.5 bg-black/75 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-xl">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyZoom(zoomLevel - 0.5); }}
                                className="w-7 h-7 rounded-full bg-white/10 active:bg-white/30 text-white flex items-center justify-center font-black text-sm active:scale-95 transition-all"
                            >
                                -
                            </button>
                            {[1, 1.5, 2, 3].filter(v => v <= maxZoom).map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); applyZoom(val); }}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[11px] font-black transition-all active:scale-95",
                                        Math.abs(zoomLevel - val) < 0.25 
                                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/50" 
                                            : "text-white/80 hover:text-white bg-white/10"
                                    )}
                                >
                                    {val}x
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyZoom(zoomLevel + 0.5); }}
                                className="w-7 h-7 rounded-full bg-white/10 active:bg-white/30 text-white flex items-center justify-center font-black text-sm active:scale-95 transition-all"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none bg-black/70 px-3 py-1 rounded-full border border-white/10">
                            <span className="text-[10px] text-white/60 font-semibold">Zoom 1x (fijo por sensor)</span>
                        </div>
                    )}

                    {/* Scanning Laser Line */}
                    <div className="absolute left-3 right-3 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-laser-scanner pointer-events-none" />
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-black/50 px-3 py-1 rounded-md z-10 backdrop-blur-sm absolute top-4 right-14 pointer-events-none">Láser Activo</p>
                </div>
            );
        }

        // Fullscreen single scanner (Marketplace, full screen overlay)
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none">
                {/* Translucent background with a hole punched out */}
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                
                {/* Controles flotantes superiores */}
                <div className="absolute top-12 left-6 z-[10000] flex flex-col gap-4 pointer-events-auto">
                    {isTorchAvailable && (
                        <button 
                            type="button"
                            onClick={toggleTorch} 
                            onTouchEnd={toggleTorch}
                            className={cn(
                                "p-4 rounded-full backdrop-blur-md shadow-xl border active:scale-90 transition-all flex items-center justify-center touch-manipulation select-none",
                                torchEnabled 
                                    ? "bg-yellow-400 text-black border-yellow-300 shadow-yellow-400/50" 
                                    : "bg-black/70 text-white border-white/20 hover:bg-black"
                            )}
                        >
                            {torchEnabled ? <Zap className="text-black w-6 h-6 fill-current" /> : <ZapOff className="text-white w-6 h-6" />}
                        </button>
                    )}
                </div>

                {/* Viewfinder box (hole punch simulation) */}
                <div className="relative w-72 h-72 rounded-3xl border-2 border-emerald-500 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden pointer-events-auto">
                    {/* Corner brackets */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />

                    {/* Scanning Laser Line */}
                    <div className="absolute left-3 right-3 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-laser-scanner" />
                </div>

                {/* Info Text & Action Controls below the viewfinder */}
                <div className="mt-8 text-center text-white space-y-6 px-6 z-10 pointer-events-auto w-full max-w-sm">
                    <div>
                        <p className="text-sm font-black uppercase tracking-wider text-emerald-400">Escaneando...</p>
                        <p className="text-xs text-slate-300 font-semibold mt-1">Colocá el código de barras dentro del recuadro</p>
                    </div>

                    {/* Botones de Zoom táctiles rápidos */}
                    {supportsHardwareZoom !== false && maxZoom > 1 ? (
                        <div className="w-full flex items-center justify-center gap-2 bg-black/60 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                            <ZoomIn className="text-white/60 w-4 h-4 shrink-0 mr-1" />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyZoom(zoomLevel - 0.5); }}
                                className="w-8 h-8 rounded-xl bg-white/10 active:bg-white/30 text-white flex items-center justify-center font-black text-base active:scale-95 transition-all"
                            >
                                -
                            </button>
                            {[1, 1.5, 2, 3].filter(v => v <= maxZoom).map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); applyZoom(val); }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95",
                                        Math.abs(zoomLevel - val) < 0.25 
                                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/50" 
                                            : "text-white/80 hover:text-white bg-white/10"
                                    )}
                                >
                                    {val}x
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyZoom(zoomLevel + 0.5); }}
                                className="w-8 h-8 rounded-xl bg-white/10 active:bg-white/30 text-white flex items-center justify-center font-black text-base active:scale-95 transition-all"
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex items-center justify-center py-2 bg-black/40 rounded-2xl border border-white/10">
                            <p className="text-[11px] text-white/60 font-semibold">Cámara sin zoom óptico (fijo a 1x)</p>
                        </div>
                    )}
                    
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="mx-auto px-8 h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md font-bold text-sm uppercase tracking-widest active:scale-95 transition-all w-full"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900 rounded-[2rem] p-4 flex flex-col items-center justify-center text-center min-h-[150px]">
            <AlertTriangle className="text-red-500 w-8 h-8 mb-2 mx-auto" />
            <p className="text-white font-bold text-xs mb-1">{error || "Requiere App Nativa."}</p>
            <p className="text-red-400 text-[10px]">Por favor, probá desde tu celular con la APK oficial.</p>
        </div>
    );
}
