'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Componente silencioso que escucha errores de permisos de Firestore para evitar que
 * se disparen excepciones no controladas en el árbol de React.
 * Registra advertencias en consola en lugar de bloquear la pantalla del usuario con popups invasivos.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: any) => {
      console.warn("Firestore Permission Notice (silenced in production UI):", error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
