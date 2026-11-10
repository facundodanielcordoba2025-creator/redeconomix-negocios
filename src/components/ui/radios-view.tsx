import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play, Pause, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from './card';

export function RadiosView({ 
  currentRadio, 
  isPlaying, 
  onPlayRadio 
}: { 
  currentRadio: any, 
  isPlaying: boolean, 
  onPlayRadio: (radio: any) => void 
}) {
  const [radios, setRadios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRadios = async () => {
      setIsLoading(true);
      setError(false);
      try {
        // Fetch from our Next.js API Route to avoid CORS/Adblocker issues
        const res = await fetch('/api/radios');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        // Clean up data (some radios don't have good icons, we map them)
        const cleaned = data.map((r: any) => ({
          id: r.stationuuid,
          name: r.name.trim(),
          url: r.url_resolved || r.url,
          favicon: r.favicon || '',
          codec: r.codec || '',
          tags: r.tags ? r.tags.split(',').slice(0, 2) : [],
        })).filter((r: any) => {
          if (!r.url) return false;
          // Strictly filter only standard formats
          const validCodec = r.codec === 'MP3' || r.codec === 'AAC' || r.codec === 'AAC+';
          if (!validCodec) return false;
          // Strictly require HTTPS. HTTP streams are often blocked by browsers
          if (!r.url.startsWith('https://')) return false;
          // Filter out m3u8/pls
          if (r.url.includes('.m3u8') || r.url.includes('.m3u') || r.url.includes('.pls')) return false;
          return true;
        });
        
        setRadios(cleaned);
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRadios();
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Top 100 Radios</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Siguen sonando aunque cierres la pantalla.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 h-32 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-900/20">
           <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
           <p className="text-red-600 dark:text-red-400 font-bold">Error al cargar las radios.</p>
           <button onClick={() => window.location.reload()} className="mt-4 text-xs font-black uppercase text-red-500 hover:underline">Reintentar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {radios.map((radio) => {
            const isThisPlaying = currentRadio?.id === radio.id && isPlaying;
            return (
              <motion.button
                key={radio.id}
                
                
                onClick={() => onPlayRadio(radio)}
                className={`relative p-4 rounded-3xl border text-left transition-all overflow-hidden group ${
                  currentRadio?.id === radio.id 
                    ? 'bg-[#e62227] border-[#e62227] text-white shadow-lg shadow-red-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#e62227]/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                    currentRadio?.id === radio.id ? 'bg-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {radio.favicon ? (
                      <img src={radio.favicon} alt={radio.name} className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <Radio className={`w-5 h-5 ${currentRadio?.id === radio.id ? 'text-[#e62227]' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black truncate text-sm ${currentRadio?.id === radio.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {radio.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex gap-1 overflow-hidden">
                    {radio.tags.map((tag: string) => (
                      <span key={tag} className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full truncate max-w-[60px] ${
                        currentRadio?.id === radio.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isThisPlaying ? 'bg-white text-[#e62227]' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#e62227] group-hover:text-white transition-colors'
                  }`}>
                    {isThisPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
