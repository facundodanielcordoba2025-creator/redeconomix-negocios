"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const spinnerContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  const MAX_PULL = 100;
  const REFRESH_THRESHOLD = 70;

  useEffect(() => {
    // Only enable touch gesture logic on mobile touch-enabled environments
    if (!Capacitor.isNativePlatform() && typeof window !== "undefined" && !("ontouchstart" in window)) {
      return;
    }

    const container = containerRef.current;
    const spinner = spinnerContainerRef.current;
    const content = contentRef.current;
    if (!container || !spinner || !content) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only pull down if we are at the very top of the page
      if (window.scrollY === 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
        // Remove transitions during active dragging for instant response
        content.style.transition = "none";
        spinner.style.transition = "none";
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing || window.scrollY > 0) return;

      const y = e.touches[0].clientY;
      const diff = y - startYRef.current;

      if (diff > 0) {
        // Prevent default browser behavior (like overscroll bounce or reload)
        if (e.cancelable) e.preventDefault();

        // Logarithmic resistance formula for natural feel
        const pullDistance = Math.min(diff * 0.4, MAX_PULL);
        currentYRef.current = pullDistance;

        // Apply hardware-accelerated transforms directly to the DOM (bypasses React state and rerenders!)
        content.style.transform = `translate3d(0, ${pullDistance}px, 0)`;
        spinner.style.transform = `translate3d(0, ${pullDistance}px, 0) rotate(${pullDistance * 3}deg)`;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      // Add smooth transitions for the release animation
      content.style.transition = "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)";
      spinner.style.transition = "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)";

      if (currentYRef.current >= REFRESH_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);

        // Snap to intermediate loading position (e.g. 50px)
        content.style.transform = "translate3d(0, 50px, 0)";
        spinner.style.transform = "translate3d(0, 50px, 0)";

        if ("vibrate" in navigator) {
          try {
            navigator.vibrate(10);
          } catch (e) {}
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          currentYRef.current = 0;
          
          // Animate back to original top position
          content.style.transform = "translate3d(0, 0, 0)";
          spinner.style.transform = "translate3d(0, 0, 0)";
        }
      } else {
        // Cancel pull, animate back to top
        currentYRef.current = 0;
        content.style.transform = "translate3d(0, 0, 0)";
        spinner.style.transform = "translate3d(0, 0, 0)";
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative min-h-screen w-full touch-pan-y overflow-hidden">
      {/* Spinner container animated via DOM ref */}
      <div 
        ref={spinnerContainerRef}
        className="absolute top-0 left-0 w-full flex justify-center items-end pb-3 z-30 h-[100px] -mt-[100px] pointer-events-none"
      >
        <div className="bg-white shadow-md rounded-full p-2 border border-slate-100 flex items-center justify-center h-10 w-10">
          <Loader2 className={`h-5 w-5 text-red-600 ${isRefreshing ? "animate-spin" : ""}`} />
        </div>
      </div>

      {/* Main page content animated via DOM ref */}
      <div ref={contentRef} className="relative z-10 bg-background min-h-screen w-full">
        {children}
      </div>
    </div>
  );
}
