'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Sparkles, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ShareBenefitData {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  referralCode?: string;
}

interface ShareBenefitModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: ShareBenefitData | null;
}

export function ShareBenefitModal({
  isOpen,
  onOpenChange,
  benefit,
}: ShareBenefitModalProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  if (!benefit) return null;

  // Build referral-aware share URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.redeconomix.com';
  const shareUrl = benefit.referralCode 
    ? `${baseUrl}/programa-esencial?ref=${encodeURIComponent(benefit.referralCode)}`
    : `${baseUrl}/programa-esencial`;

  // Pre-formatted sharing message
  const shareMessage = `¡Mirá este beneficio en RedEconomiX Bienestar! 🛡️

👉 ${benefit.title}${benefit.subtitle ? ` (${benefit.subtitle})` : ''}
${benefit.description ? `\n${benefit.description}\n` : ''}
Conocé todos los detalles y sumate acá:
${shareUrl}`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareMessage);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace con tu invitación fue copiado al portapapeles.",
        className: "bg-emerald-600 text-white font-bold"
      });
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace automáticamente.",
        variant: "destructive"
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `RedEconomiX: ${benefit.title}`,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  const openShareWindow = (url: string) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    }
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] sm:max-w-md focus:outline-none">
        {/* Header Rojo Sólido Oficial de RedEconomiX */}
        <div className="bg-[#FF0000] p-6 text-center text-white relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#FF0000] shadow-lg mb-2">
            <Share2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
            Compartir Beneficio
          </DialogTitle>
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/90 mt-1">
            RedEconomiX Bienestar • Compartí con tus contactos
          </p>
        </div>

        {/* Contenido del Modal */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card Resumen del Beneficio */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-1 relative">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FF0000]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                {benefit.badge || 'COBERTURA OFICIAL'}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
              {benefit.title}
            </h4>
            {benefit.subtitle && (
              <p className="text-xs font-black text-[#FF0000] uppercase tracking-wide">
                {benefit.subtitle}
              </p>
            )}
            {benefit.description && (
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-2 pt-0.5">
                {benefit.description}
              </p>
            )}
          </div>

          {/* Botón Principal: WhatsApp (con su color oficial #25D366) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => openShareWindow(shareLinks.whatsapp)}
              className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md shadow-[#25D366]/25 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Enviar por WhatsApp</span>
            </button>
          </div>

          {/* Grilla de Redes Sociales con sus iconos y colores oficiales */}
          <div className="grid grid-cols-3 gap-2">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => openShareWindow(shareLinks.facebook)}
              className="h-11 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tight">Facebook</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={() => openShareWindow(shareLinks.telegram)}
              className="h-11 rounded-xl bg-[#229ED9] hover:bg-[#1d8ec4] text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tight">Telegram</span>
            </button>

            {/* X (Twitter) */}
            <button
              type="button"
              onClick={() => openShareWindow(shareLinks.twitter)}
              className="h-11 rounded-xl bg-black hover:bg-slate-900 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tight">X</span>
            </button>
          </div>

          {/* Bloque para Copiar Enlace Directo */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              O copiá el enlace directo:
            </span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 font-mono flex-1 outline-none truncate select-all"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className={`h-8 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shrink-0 ${
                  hasCopied
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-xs shadow-red-500/25'
                }`}
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Menú Nativo Móvil si el navegador lo soporta */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-[#FF0000] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Más opciones de compartir del dispositivo</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
