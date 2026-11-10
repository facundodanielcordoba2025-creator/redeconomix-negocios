/**
 * ScannerModule / CameraService
 * Optimized module for high-performance barcode scanning in web environments.
 * Implements adaptive resolution and continuous focus for professional POS experience.
 */

export type DeviceClass = 'LOW' | 'MID' | 'HIGH';

export interface ScannerModuleConfig {
  fps: number;
  qrbox: { width: number, height: number } | number | undefined;
  aspectRatio: number;
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: boolean;
  };
  videoConstraints: MediaTrackConstraints;
}

export const ScannerModule = {
  /**
   * Detects device performance class based on RAM and CPU cores.
   */
  getDeviceClass(): DeviceClass {
    if (typeof navigator === 'undefined') return 'MID';
    
    // @ts-ignore - deviceMemory is experimental but supported in most Chromium browsers
    const ram = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (ram <= 4 || cores <= 4) return 'LOW';
    if (ram <= 8 || cores <= 8) return 'MID';
    return 'HIGH';
  },

  /**
   * Returns optimal scanning configuration based on device class (v3 Optimized).
   */
  getOptimalConfig(deviceClass: DeviceClass) {
    const isLow = deviceClass === 'LOW';
    
    return {
      fps: 60, // Solicitud ideal 60fps
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      
      videoConstraints: {
        facingMode: { ideal: "environment" },
        // PRO v3 Corrected: 1080p ideal, pero sin piso obligatorio para evitar bloqueos
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60 } ,
        // @ts-ignore
        focusMode: { ideal: "continuous" },
        // @ts-ignore
        exposureMode: { ideal: "continuous" },
        // @ts-ignore
        whiteBalanceMode: { ideal: "continuous" }
      }
    };
  },

  /**
   * Applies v3 contrast and grayscale filters to a canvas context.
   */
  applyV3Filters(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Factor de contraste 1.6
    const factor = 1.6;
    const intercept = 128 * (1 - factor);

    for (let i = 0; i < data.length; i += 4) {
      // Conversión a escala de grises (Luminancia estándar)
      // gray = 0.299·R + 0.587·G + 0.114·B
      const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      
      // Aumento de contraste factor 1.6
      // enhanced = clamp(1.6 × gray + 128 × (1 - 1.6))
      const enhanced = factor * gray + intercept;
      
      const val = Math.max(0, Math.min(255, enhanced));
      data[i] = val;     // R
      data[i+1] = val;   // G
      data[i+2] = val;   // B
    }
    ctx.putImageData(imageData, 0, 0);
  },

  async stopAllScanners(videoEl: HTMLVideoElement | null, stream: MediaStream | null, loopId: number | null) {
    if (loopId) cancelAnimationFrame(loopId);
    if (videoEl) {
        videoEl.pause();
        videoEl.srcObject = null; // 2. Primero desconectar
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop()); // 3. Luego matar hardware
    }
    await new Promise(resolve => setTimeout(resolve, 300)); // 4. Espera liberación hardware
  },

  /**
   * Attempts to enable continuous focus and 1.8x dynamic zoom.
   */
  async optimizeTrack(track: MediaStreamTrack) {
    if (!track || typeof track.applyConstraints !== 'function') return;
    
    try {
      const capabilities = track.getCapabilities() as any;
      const constraints: any = { advanced: [] };

      // PRO v3: Precise Focus and Exposure
      if (capabilities.focusMode?.includes('continuous')) {
        constraints.advanced.push({ focusMode: 'continuous' });
      }
      if (capabilities.exposureMode?.includes('continuous')) {
        constraints.advanced.push({ exposureMode: 'continuous' });
      }
      if (capabilities.whiteBalanceMode?.includes('continuous')) {
        constraints.advanced.push({ whiteBalanceMode: 'continuous' });
      }

      // PRO v3: 1.8x Dynamic Zoom Helper
      if (capabilities.zoom) {
        // We aim for 1.8x but cap at what the device supports
        const targetZoom = Math.min(capabilities.zoom.max, 1.8); 
        constraints.advanced.push({ zoom: targetZoom });
      }

      if (constraints.advanced.length > 0) {
        await track.applyConstraints(constraints);
        console.log("ScannerModule v3: Track optimized", constraints);
      }
    } catch (err) {
      console.warn("ScannerModule: Failed to optimize track", err);
    }
  },

  /**
   * Checks if native BarcodeDetector is available.
   */
  isNativeSupported(): boolean {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window;
  },

  /**
   * Debounces scans and handles role-based logic if needed.
   */
  createScanHandler(onSuccess: (code: string) => void, throttleMs: number = 1500) {
    let lastCode = '';
    let lastTime = 0;

    return (decodedText: string) => {
      const now = Date.now();
      // Only trigger if it's a different code or enough time has passed
      if (decodedText !== lastCode || (now - lastTime) > throttleMs) {
        lastCode = decodedText;
        lastTime = now;
        onSuccess(decodedText);
      }
    };
  }
};
