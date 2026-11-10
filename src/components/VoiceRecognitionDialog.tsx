'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Loader2, AlertTriangle } from 'lucide-react';

interface VoiceRecognitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (transcript: string) => void;
}

type RecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

// This is to satisfy TypeScript since the Web Speech API is not fully standardized
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceRecognitionDialog({ open, onOpenChange, onResult }: VoiceRecognitionDialogProps) {
  const [status, setStatus] = useState<RecognitionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);

  // Effect to initialize (and clean up) the recognition object
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (open) { // Only show error if dialog is open
        setStatus('error');
        setErrorMessage('Tu navegador no soporta el reconocimiento de voz.');
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'es-AR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setStatus('listening');
    
    recognition.onresult = (event: any) => {
      setStatus('processing');
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      onOpenChange(false); // Close on success
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Ocurrió un error. Intenta de nuevo.';
      if (event.error === 'no-speech') {
        errorMsg = 'No se detectó voz. Habla más claro, por favor.';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Permiso denegado. Habilita el acceso al micrófono.';
      }
      setErrorMessage(errorMsg);
      setStatus('error');
    };

    recognition.onend = () => {
      // Only reset to idle if we weren't in the middle of processing a result
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [open, onOpenChange, onResult, status]); // Dependency on `status` to reset `onend` behavior

  const handleStartListening = useCallback(() => {
    if (recognitionRef.current && status !== 'listening') {
      setStatus('idle'); // Reset any error state
      setErrorMessage('');
      recognitionRef.current.start();
    }
  }, [status]);
  
  // When the dialog opens, reset the state
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [open]);

  const getStatusContent = () => {
    switch (status) {
      case 'listening':
        return (
          <>
            <Mic className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg font-medium text-muted-foreground mt-4">Escuchando...</p>
          </>
        );
      case 'processing':
        return (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-lg font-medium text-muted-foreground mt-4">Procesando...</p>
          </>
        );
      case 'error':
        return (
           <div className="flex flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium text-destructive mt-4">Error</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
             <Button onClick={handleStartListening} className="mt-4">Intentar de Nuevo</Button>
          </div>
        );
      default: // idle
        return (
          <Button
            onClick={handleStartListening}
            className="h-24 w-24 rounded-full"
            size="icon"
          >
            <Mic className="h-12 w-12" />
          </Button>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-2xl">Búsqueda por Voz</DialogTitle>
          <DialogDescription className="text-center">
            {status === 'idle' ? 'Tocá el micrófono y decí qué producto buscás.' : 'Por ejemplo: "Gaseosa Coca-Cola de 2 litros".'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center h-48">
            {getStatusContent()}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
