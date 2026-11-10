'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CameraOff, Loader2, Zap, ZapOff, X, Keyboard, Search as SearchIcon, Scan } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ScannerModule, type DeviceClass } from '@/lib/scanner-module';


interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
  continuous?: boolean;
  holePunchColor?: string;
}

import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';

const UniversalScanner = dynamic(() => import('@/components/scanner/universal-scanner'), { ssr: false });
const HybridScanner = dynamic(() => import('@/components/scanner/hybrid-scanner').then(m => m.default), { ssr: false });

export function BarcodeScanner({ onScanSuccess, onClose, continuous = false, holePunchColor = '#f8fafc' }: BarcodeScannerProps) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.warn);
      }
    };
  }, []);

  useEffect(() => {
    if (continuous) return;

    // Registrar un estado virtual en el historial para interceptar el botón atrás
    window.history.pushState({ scannerActive: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Limpiar el historial si el escáner se cierra programáticamente (X o éxito)
      if (window.history.state?.scannerActive) {
        window.history.back();
      }
    };
  }, [continuous, onClose]);

  return (
    <div className={continuous ? "w-full h-full relative z-0 rounded-2xl bg-transparent" : "w-full h-full"}>
        {/* Hole punch safe shadow is ONLY for embedded (continuous) native scanners */}
        {continuous && isNative && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: `0 0 0 4000px ${holePunchColor}` }}></div>
        )}
        
        {isNative ? (
            <>
                <HybridScanner 
                    title="Radar de Precisión"
                    onScanSuccess={onScanSuccess}
                    onClose={onClose}
                    continuous={continuous}
                />
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hidden">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">
                        Motor de Precisión Híbrido Activo (IA + WASM)
                    </p>
                </div>
            </>
        ) : (
            <UniversalScanner 
                onScanSuccess={onScanSuccess}
                onClose={onClose}
                title="Buscador Rápido"
                continuous={continuous}
            />
        )}
    </div>
  );
}

/* END OF UNIFIED SCANNER */
