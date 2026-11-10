import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, MapPin, Clock, Building2, Briefcase } from 'lucide-react';

export function JobDetailModal({ job, onClose }: { job: any; onClose: () => void }) {
  return (
    <AnimatePresence>
      {job && (
        <motion.div
          key="job-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            key="job-modal-content"
          initial={{ y: "100%", opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: "100%", opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-[#FDFCF8] w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative pt-6 px-6 pb-2 flex justify-between items-start">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight pr-8">
              {job.title}
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-6 pb-6">
            <p className="text-lg font-bold text-[#e62227] mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {job.company}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto hide-scrollbar flex-1 pt-0">
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location || 'Salta'}
              </div>
              <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl text-sm font-medium text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                {job.type || 'Full-time'}
              </div>
            </div>

            {job.provider && Object.keys(job.provider).length > 0 && (
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] shadow-sm mb-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {job.provider.logo && (
                  <div className="w-20 h-20 max-sm:h-14 shrink-0 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden p-2">
                    <img src={job.provider.logo} alt={job.provider.name} className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-black text-slate-900 mb-1">{job.provider.name}</h3>
                  {job.provider.category && (
                     <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">{job.provider.category}</p>
                  )}
                  {job.provider.email && (
                     <a href={`mailto:${job.provider.email}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#e62227] hover:text-[#c41d21] transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
                       ✉️ {job.provider.email}
                     </a>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <Briefcase className="w-4 h-4" /> Descripción del Puesto
              </h3>
              {job.descriptionHtml ? (
                <div 
                  className="prose prose-sm md:prose-base prose-slate max-w-none leading-relaxed overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
                />
              ) : (
                <div className="prose prose-sm md:prose-base prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              )}
            </div>
            
            {job.isUrgent && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6 text-amber-800 text-sm font-medium flex items-start gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse"></div>
                 Se busca cubrir esta vacante de forma urgente. ¡Postúlate hoy mismo!
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgb(0,0,0,0.03)] relative z-10">
            <a 
              href={job.applyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full"
            >
              <button className="w-full bg-[#e62227] hover:bg-[#c91d22] text-white rounded-full py-4 font-black tracking-wide flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md shadow-red-500/20">
                Postularme Oficialmente <ExternalLink className="w-5 h-5" />
              </button>
            </a>
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest mt-4 font-bold">
              Te dirigirás a un portal externo
            </p>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
