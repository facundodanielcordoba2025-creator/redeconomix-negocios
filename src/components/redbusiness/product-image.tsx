'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { proxyImg } from '@/lib/utils';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  searchQuery?: string; // used to search ML when src fails
  fill?: boolean;
  className?: string;
}

/**
 * Smart product image:
 * 1. Tries the catalog URL (via proxy)
 * 2. If it fails, queries /api/ml-img?q={alt} to get a real ML image
 * 3. If that also fails, shows a styled placeholder
 */
export function ProductImage({ src, alt, searchQuery, fill = true, className }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(proxyImg(src));
  const [status, setStatus] = useState<'loading' | 'ok' | 'ml-fallback' | 'placeholder'>('loading');
  const fetchedRef = useRef(false);

  // Reset when src changes
  useEffect(() => {
    setImgSrc(proxyImg(src));
    setStatus('loading');
    fetchedRef.current = false;
  }, [src]);

  const handleError = async () => {
    if (fetchedRef.current) {
      // Already tried ML fallback, show placeholder
      setStatus('placeholder');
      return;
    }

    fetchedRef.current = true;
    const query = searchQuery || alt;

    try {
      const res = await fetch(`/api/ml-img?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Use the proxy for the ML result too
          setImgSrc(`/api/img-proxy?url=${encodeURIComponent(data.url)}`);
          setStatus('ml-fallback');
          return;
        }
      }
    } catch {}

    setStatus('placeholder');
  };

  if (status === 'placeholder') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 gap-2 ${fill ? 'absolute inset-0' : ''}`}>
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider text-center px-2 leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized
      onError={handleError}
      onLoad={() => setStatus('ok')}
    />
  );
}
