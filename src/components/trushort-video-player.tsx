import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, RotateCcw, Play, Pause, Music } from 'lucide-react';

export const TrushortVideoPlayer = ({ videoUrl, isActive, isMuted }: { videoUrl: string; isActive: boolean; isMuted: boolean }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (isActive) {
      video.play().catch(err => console.log('Video auto-play blocked or interrupted:', err));
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  React.useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div className="absolute inset-0 w-full h-full bg-zinc-950 flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        className="w-full h-full object-cover"
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play().catch(e => console.log(e));
            } else {
              videoRef.current.pause();
            }
          }
        }}
      />
    </div>
  );
};

