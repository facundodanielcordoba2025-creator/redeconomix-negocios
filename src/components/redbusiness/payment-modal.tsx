'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Landmark, QrCode, UploadCloud, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
}

export function PaymentModal({ isOpen, onClose, onConfirm, amount }: PaymentModalProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const cbu = '0000076500000009357770';
  const alias = 'donaly';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast({
      title: '¡Copiado!',
      description: 'El dato ha sido copiado al portapapeles.',
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onConfirm();
    }, 1500);
  };

  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold flex items-center gap-2">
            Completar Fondeo
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Para activar tu inversión de <strong>{formattedAmount}</strong>, realiza el pago mediante alguna de las siguientes opciones.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="transferencia" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100">
            <TabsTrigger value="transferencia" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-slate-500 font-bold text-xs uppercase">
              <Landmark className="h-4 w-4 mr-2" /> Transferencia
            </TabsTrigger>
            <TabsTrigger value="qr" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-slate-500 font-bold text-xs uppercase">
              <QrCode className="h-4 w-4 mr-2" /> Código QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transferencia" className="mt-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Banco</span>
                <p className="text-sm font-bold text-slate-900">Banco BBVA - Cuenta Corriente</p>
              </div>
              <div className="flex justify-between items-end border-t border-slate-200 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">CBU</span>
                  <p className="text-lg font-bold text-slate-900 tracking-wider">{cbu}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cbu)} className="text-primary h-8 px-2">
                  {hasCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex justify-between items-end border-t border-slate-200 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Alias</span>
                  <p className="text-lg font-bold text-slate-900">{alias}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(alias)} className="text-primary h-8 px-2">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleSimulateUpload} 
              disabled={isUploading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 uppercase tracking-wide text-xs"
            >
              {isUploading ? 'Subiendo comprobante...' : (
                <>
                  <UploadCloud className="h-5 w-5 mr-2" /> Ya transferí, notificar pago
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="mt-4 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
              <div className="w-48 h-48 bg-white border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                 <img src="https://res.cloudinary.com/dffhpwfiz/image/upload/v1778103729/Captura_de_Pantalla_2026-05-06_a_la_s_18.41.46_y9wbu8.png" alt="Código QR" className="absolute inset-0 w-full h-full object-contain p-2" />
              </div>
              <p className="text-xs text-slate-500 text-center font-medium">Abre tu billetera virtual (MercadoPago, MODO, Ualá) y escanea este código.</p>
            </div>
            
            <Button 
              onClick={handleSimulateUpload} 
              disabled={isUploading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 uppercase tracking-wide text-xs"
            >
              {isUploading ? 'Validando pago...' : 'Ya pagué con QR'}
            </Button>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}
