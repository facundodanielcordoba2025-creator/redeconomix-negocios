import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Megaphone, Plus, X, Send } from 'lucide-react';

export function ClasificadosView({ clasificados }: { clasificados: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !phone) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'informativa_news'), {
        text: text,
        contactInfo: phone,
        source: 'User',
        origin: 'RedInformativa',
        province: 'Clasificados',
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setText('');
        setPhone('');
      }, 2000);
    } catch (error) {
      console.error("Error posting ad:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-serif">Avisos Clasificados</h2>
          <p className="text-sm text-slate-500">Encuentra y publica servicios locales</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#e62227] hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Publicar Gratis
        </button>
      </div>

      {!clasificados || clasificados.length === 0 ? (
         <div className="text-center py-20 opacity-50 bg-white rounded-2xl border border-slate-200 shadow-sm relative z-10">
           <div className="w-16 h-16 max-sm:h-12 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Megaphone className="w-8 h-8 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 font-serif">Sin avisos activos</h3>
           <p className="text-sm text-slate-500 mt-2">Sé el primero en publicar un aviso.</p>
         </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          <AnimatePresence>
            {clasificados.map((ad: any, index: number) => (
              <motion.div 
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {ad.title && <h3 className="font-bold text-slate-900 text-xs mb-1.5">{ad.title}</h3>}
                  <p className="text-slate-600 text-[11px] whitespace-pre-wrap leading-relaxed">{ad.text}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ad.source !== 'User' ? (
                      <>
                        <img src="https://www.google.com/s2/favicons?domain=nuevodiariodesalta.com.ar&sz=128" alt="Nuevo Diario" className="w-5 h-5 rounded-full" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none max-w-[80px] truncate">Nuevo Diario</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-500">U</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Usuario</span>
                      </>
                    )}
                  </div>
                  {ad.contactInfo ? (
                    <a href={`https://wa.me/${ad.contactInfo.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors whitespace-nowrap">
                      Contactar
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">Aviso</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-black text-slate-900">Publicar Aviso</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {success ? (
                   <div className="text-center py-8">
                     <div className="w-16 h-16 max-sm:h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
                       <Send className="w-8 h-8 text-green-600" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">¡Aviso publicado!</h3>
                     <p className="text-sm text-slate-500 mt-2">Tu aviso ya está visible en la plataforma.</p>
                   </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Tu Anuncio (Máx. 300 caracteres)</label>
                      <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={300}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#e62227] focus:ring-1 focus:ring-[#e62227] resize-none h-32"
                        placeholder="Ej. Se necesita pintor para casa en zona centro..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Teléfono de Contacto</label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#e62227] focus:ring-1 focus:ring-[#e62227]"
                        placeholder="Ej. 387 123 4567"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={submitting || !text || !phone}
                      className="w-full mt-4 bg-[#e62227] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Publicando...' : 'Publicar Aviso Gratis'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-4">
                      Puedes publicar hasta 3 anuncios gratuitos de texto plano.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
