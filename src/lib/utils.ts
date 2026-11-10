import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateSocioId(uid: string, displayName: string | null | undefined): string {
  const nameAbbr = (displayName || "US").substring(0, 2).toUpperCase();
  
  // Simple hash function to convert UID to a number
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  const fourDigits = (Math.abs(hash) % 9000) + 1000; // Ensure a 4-digit number (1000-9999)
  
  return `${nameAbbr}${fourDigits}`;
}
export function proxyImg(src: string | null | undefined): string {
  if (!src) return "/favicon.png";
  if (src.startsWith('/')) return src; 
  
  // Only route known restrictive domains through the proxy
  const needsProxy = src.includes('mlstatic.com') || src.includes('vtexassets.com');
  if (needsProxy) {
      return `/api/img-proxy?url=${encodeURIComponent(src)}`;
  }
  
  return src;
}
