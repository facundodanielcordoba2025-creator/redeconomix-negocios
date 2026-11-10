import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Loader2, Radio as RadioIcon } from 'lucide-react';

export function RadioPlayer({
  radio,
  isPlaying,
  onTogglePlay,
  onClose
}: {
  radio: any | null;
  isPlaying: boolean;
  onTogglePlay: (play: boolean) => void;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Setup Media Session API for background playback controls on lock screen
  useEffect(() => {
    if ('mediaSession' in navigator && radio) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: radio.name,
        artist: 'RedEconomiX Radio',
        album: 'Transmisión en Vivo',
        artwork: [
          { src: radio.favicon || 'https://www.redeconomix.com/logo.png', sizes: '96x96', type: 'image/png' },
          { src: radio.favicon || 'https://www.redeconomix.com/logo.png', sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => onTogglePlay(true));
      navigator.mediaSession.setActionHandler('pause', () => onTogglePlay(false));
      navigator.mediaSession.setActionHandler('stop', () => onClose());
    }
  }, [radio, onTogglePlay, onClose]);

  // Handle Play/Pause with Native Audio (Bypasses Next.js DOM Errors)
  useEffect(() => {
    let currentAudio = audioRef.current;

    if (isPlaying && radio) {
      setIsLoading(true);
      setHasError(false);

      if (!currentAudio || currentAudio.src !== radio.url) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.src = '';
        }
        currentAudio = new Audio(radio.url);
        currentAudio.preload = 'none';
        audioRef.current = currentAudio;

        currentAudio.addEventListener('playing', () => setIsLoading(false));
        currentAudio.addEventListener('error', () => {
          setHasError(true);
          setIsLoading(false);
          onTogglePlay(false);
        });
      }

      currentAudio.play().catch(error => {
        // We catch the promise rejection quietly
        setIsLoading(false);
        setHasError(true);
        onTogglePlay(false);
      });
    } else if (currentAudio) {
      currentAudio.pause();
    }

    return () => {
      // Cleanup when unmounting or switching radio
      if (!isPlaying && currentAudio) {
        currentAudio.pause();
      }
    };
  }, [isPlaying, radio, onTogglePlay]);

  // Total cleanup when closed completely
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  if (!radio) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 flex items-center gap-4"
        >
          {/* Logo */}
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-200 dark:border-slate-700">
            {radio.favicon ? (
              <img src={radio.favicon} alt="Radio" className="w-full h-full object-contain p-2" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <RadioIcon className="w-6 h-6 text-slate-400" />
            )}
            {isPlaying && !isLoading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-0.5">
                <span className="w-1 h-3 bg-white rounded-full animate-pulse"></span>
                <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75"></span>
                <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150"></span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sm text-slate-900 dark:text-white truncate leading-tight">
              {radio.name}
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 truncate mt-1">
              {hasError ? <span className="text-red-500">Error de conexión</span> : isLoading ? 'Conectando...' : 'En vivo'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => onTogglePlay(!isPlaying)}
              className="w-12 h-12 bg-[#e62227] hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-1" />
              )}
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
