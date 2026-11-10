'use client';

import React from 'react';

export const RocketIcon = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]`}>
    <path d="M12 2C12 2 9 6 9 12C9 14.5 9.5 15.5 10 16.5C10 16.5 7 17.5 7 21C7 21 11 20 12 18C13 20 17 21 17 21C17 17.5 14 16.5 14 16.5C14.5 15.5 15 14.5 15 12C15 6 12 2 12 2Z" fill="currentColor" />
    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#FF2E55" />
    <path d="M9 17C8.44772 17 8 17.4477 8 18C8 18.5523 8.44772 19 9 19C9.55228 19 10 18.5523 10 18C10 17.4477 9.55228 17 9 17Z" fill="currentColor" opacity="0.5" />
    <path d="M15 17C14.4477 17 14 17.4477 14 18C14 18.5523 14.4477 19 15 19C15.5523 19 16 18.5523 16 18C16 17.4477 15.5523 17 15 17Z" fill="currentColor" opacity="0.5" />
  </svg>
);

/**
 * IDENTITY SYSTEM - L100_CORE_V2
 * Deploy Hash: 7fb22a_sync_force
 */
export const REXLogo = ({ className = "", variant = "light" }: { className?: string, variant?: "light" | "dark" | "all-white" }) => (
    <div className={`flex items-center gap-3 ${className} group`}>

        <div className="flex flex-col">
            <div className="flex items-baseline leading-none">
                <span className={`font-black text-xl sm:text-3xl tracking-tighter ${variant === 'light' || variant === 'all-white' ? 'text-white' : 'text-slate-900'}`}>
                    RedEconomi
                </span>
                <span className={`font-black text-2xl sm:text-4xl italic ml-[-2px] tracking-tighter ${variant === 'all-white' ? 'text-white' : 'text-[#FF0000]'}`}>
                    X
                </span>
            </div>
        </div>
    </div>
);

// Force build sync L100
export const RedEconomiXLogo = REXLogo;

export const RedServicioXLogo = ({ className = "", variant = "dark" }: { className?: string, variant?: "light" | "dark" }) => (
    <div className={`flex items-center gap-0 group ${className}`}>
        <div className="flex items-baseline leading-none">
            <span className={`font-black text-xl sm:text-2xl tracking-tighter ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>
                RedServicio
            </span>
            <span className="font-black text-2xl sm:text-3xl text-[#FF0000] italic ml-[-1px] tracking-tighter transform group-hover:rotate-12 transition-transform">
                X
            </span>
        </div>
    </div>
);
