"use client";

import { useState, useCallback } from "react";
import { Upload, X, CheckCircle2, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useStorage, useUser } from "@/firebase";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImageUploaderProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  id?: string;
}

export function ProductImageUploader({ onUploadComplete, currentImageUrl, id }: ProductImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const storage = useStorage();
  const { user } = useUser();

  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("Compression timeout");
        resolve(file);
      }, 3000);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
          else if (h > MAX) { w *= MAX / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((b) => { clearTimeout(timeout); resolve(b || file); }, "image/webp", 0.75);
        };
        img.onerror = () => { clearTimeout(timeout); resolve(file); };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => { clearTimeout(timeout); resolve(file); };
      reader.readAsDataURL(file);
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
        alert("Sesión no detectada. Por favor reingresá.");
        return;
    }

    setIsUploading(true);
    setProgress(5);
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-8047565887-3a8da.appspot.com";
    setStatusText("Preparando envío...");

    try {
      const compressed = file.size > 400 * 1024 ? await compressImage(file) : file;
      
      setStatusText("Obteniendo permisos...");
      const idToken = await user.getIdToken();
      
      const timestamp = Date.now();
      const name = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const path = `products-master/${id ? `${id}/` : ''}${timestamp}_${name}`;
      
      setStatusText("Transmitiendo imagen (vía REST)...");
      setProgress(40);

      setStatusText("Subiendo a la nube (Cloudinary)...");
      setProgress(40);

      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('upload_preset', 'ml_default');
      formData.append('cloud_name', 'dffhpwfiz');
      formData.append('folder', 'products-master');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dffhpwfiz/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Falla en la subida a Cloudinary.");
      }

      const result = await response.json();
      const downloadUrl = result.secure_url;
      
      setProgress(85);
      setStatusText("Finalizando...");
      
      setPreviewUrl(downloadUrl);
      onUploadComplete(downloadUrl);
      setStatusText("¡Listo!");
      setProgress(100);
    } catch (error: any) {
      console.error("Tunnel Upload Error:", error);
      setStatusText(`Error: ${error.message}`);
      alert(`FALLÓ EL TÚNEL SEGURO: ${error.message}`);
    } finally {
      if (progress === 100) {
        setTimeout(() => setIsUploading(false), 800);
      } else {
        setIsUploading(false);
      }
    }
  }, [user, id, onUploadComplete]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onUploadComplete("");
  };

  return (
    <div className="space-y-4 w-full">
      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
          >
            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={removeImage}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="absolute top-2 right-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-white" />
            </div>
          </motion.div>
        ) : (
          <motion.label 
            className={cn(
              "flex flex-col items-center justify-center aspect-square w-full max-w-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-all bg-muted/50 border-zinc-200 dark:border-zinc-800 hover:bg-muted/80",
              isUploading && "pointer-events-none opacity-80"
            )}
          >
            <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={isUploading} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 p-3 w-full text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{statusText}</p>
                <Progress value={progress} className="h-1 w-full mt-1" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-1">
                    <Upload className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-tight">Subir Foto</p>
                <p className="text-[9px] text-muted-foreground leading-tight">Click o soltá acá</p>
              </div>
            )}
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
