'use client';

import React, { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasOfflineRef = React.useRef(false);

  useEffect(() => {
    // Check initial status
    const checkInitialStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOffline(!status.connected);
        wasOfflineRef.current = !status.connected;
      } catch (e) {
        console.error("Failed to get initial network status:", e);
      }
    };
    checkInitialStatus();

    // Listen for network status changes
    let handler: any = null;
    const registerListener = async () => {
      try {
        handler = await Network.addListener('networkStatusChange', (status) => {
          const isCurrentlyOffline = !status.connected;
          setIsOffline(isCurrentlyOffline);
          
          if (status.connected && wasOfflineRef.current) {
            // Only show connection restored if it was previously offline
            setShowRestored(true);
            setTimeout(() => setShowRestored(false), 3000);
          } else if (!status.connected) {
            setShowRestored(false);
          }
          
          wasOfflineRef.current = isCurrentlyOffline;
        });
      } catch (e) {
        console.error("Failed to register network listener:", e);
      }
    };
    registerListener();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-6 inset-x-6 mx-auto max-w-sm z-[9999] pointer-events-none"
        >
          <div className="bg-rose-500/90 text-white rounded-[2rem] px-6 py-4 shadow-[0_10px_30px_rgba(244,63,94,0.3)] backdrop-blur-xl border border-white/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <WifiOff className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Sin Conexión</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">
                Revisá tu señal. Las operaciones están pausadas.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {showRestored && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-6 inset-x-6 mx-auto max-w-sm z-[9999] pointer-events-none"
        >
          <div className="bg-emerald-500/90 text-white rounded-[2rem] px-6 py-4 shadow-[0_10px_30px_rgba(16,185,129,0.3)] backdrop-blur-xl border border-white/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Conexión Restaurada</p>
              <p className="text-[11px] font-semibold text-white/80 mt-0.5">
                Volviste a estar online con éxito.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
