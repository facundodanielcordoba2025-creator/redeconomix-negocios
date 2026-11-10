'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Wrench, ShoppingCart, Hammer, Package, Truck, Users } from 'lucide-react';

const RocketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]">
    {/* Rocket body - Bright RED */}
    <path d="M12 2C12 2 9 6 9 12C9 14.5 9.5 15.5 10 16.5C10 16.5 7 17.5 7 21C7 21 11 20 12 18C13 20 17 21 17 21C17 17.5 14 16.5 14 16.5C14.5 15.5 15 14.5 15 12C15 6 12 2 12 2Z" fill="#FF0000" stroke="white" strokeWidth="0.8" />
    {/* Window/porthole - white */}
    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="white" />
    {/* Engine nozzles */}
    <path d="M9 17C8.44772 17 8 17.4477 8 18C8 18.5523 8.44772 19 9 19C9.55228 19 10 18.5523 10 18C10 17.4477 9.55228 17 9 17Z" fill="white" opacity="0.8" />
    <path d="M15 17C14.4477 17 14 17.4477 14 18C14 18.5523 14.4477 19 15 19C15.5523 19 16 18.5523 16 18C16 17.4477 15.5523 17 15 17Z" fill="white" opacity="0.8" />
  </svg>
);

const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: 0, x: 0, opacity: 0.8, scale: 1 }}
    animate={{ 
      y: [0, 150, 300], 
      x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 150],
      opacity: 0,
      scale: [1, 0.6, 0]
    }}
    transition={{ 
      duration: 1.2, 
      repeat: Infinity, 
      delay,
      ease: "easeOut"
    }}
    className="absolute w-3 h-3 bg-white rounded-full blur-[3px]"
    style={{ left: '50%', top: '100%', marginLeft: '-6px' }}
  />
);

const FloatingIcon = ({ Icon, delay, duration, startY, endY, direction = 'ltr', scale = 1 }: any) => (
  <motion.div
    initial={{ 
      x: direction === 'ltr' ? '-20vw' : '120vw', 
      y: startY, 
      opacity: 0, 
      scale: scale * 0.8,
      rotate: direction === 'ltr' ? 0 : 180
    }}
    animate={{ 
      x: direction === 'ltr' ? '120vw' : '-20vw', 
      y: endY, 
      opacity: [0, 0.2, 0.2, 0],
      scale: scale,
      rotate: direction === 'ltr' ? 10 : 170
    }}
    transition={{ 
      duration, 
      repeat: Infinity, 
      delay, 
      ease: "linear" 
    }}
    className="absolute text-white pointer-events-none filter blur-[1px]"
  >
    <Icon className="w-12 h-12 md:w-16 md:h-16 max-sm:h-12" />
  </motion.div>
);

export function RocketBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (clientX / innerWidth - 0.5) * 40,
        y: (clientY / innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const generatedStars = [...Array(40)].map((_, i) => ({
      id: i,
      width: Math.random() * 5 + 1,
      height: Math.random() * 5 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 4 + 2,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#FF2E55] overflow-hidden pointer-events-none z-0">
      {/* Dynamic Starfield (Depth) */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full opacity-30"
          style={{
            width: star.width,
            height: star.height,
            left: star.left,
            top: star.top,
          }}
          animate={{
            y: [-30, 30],
            opacity: [0.15, 0.4, 0.15],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating Ecosystem Icons */}
      <FloatingIcon Icon={Bike} delay={0} duration={20} startY="70vh" endY="60vh" scale={0.6} />
      <FloatingIcon Icon={Truck} delay={5} duration={25} startY="80vh" endY="75vh" direction="rtl" scale={0.7} />
      <FloatingIcon Icon={Wrench} delay={10} duration={18} startY="30vh" endY="40vh" scale={0.5} />
      <FloatingIcon Icon={ShoppingCart} delay={15} duration={22} startY="20vh" endY="10vh" direction="rtl" scale={0.8} />
      <FloatingIcon Icon={Hammer} delay={2} duration={30} startY="90vh" endY="85vh" scale={0.4} />
      <FloatingIcon Icon={Package} delay={7} duration={28} startY="15vh" endY="25vh" scale={0.5} opacity={0.15} />

      {/* Floating 3D-ish Circles */}
      <motion.div 
        className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-[#38C5EF] rounded-full mix-blend-screen opacity-40 blur-[100px]"
        animate={{ 
          x: mousePos.x * 0.8, 
          y: mousePos.y * 0.8,
          scale: [1, 1.15, 1] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div 
        className="absolute top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"
        animate={{ 
          x: -mousePos.x * 0.4, 
          y: -mousePos.y * 0.4 
        }}
      />

      {/* THE ROCKET (The Protagonist - Larger) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ x: '-100vw', y: '60vh', rotate: 45, scale: 0.7 }}
          animate={{ 
            x: '100vw', 
            y: '-60vh',
            transition: { 
              duration: 12, 
              repeat: Infinity, 
              ease: "linear",
              delay: 1
            }
          }}
          className="relative w-40 h-40 md:w-56 md:h-56"
        >
          {/* Rocket Body */}
          <div className="w-full h-full relative">
             <RocketIcon />
             
             {/* Large Particles coming from engine */}
             <Particle delay={0} />
             <Particle delay={0.15} />
             <Particle delay={0.3} />
             <Particle delay={0.45} />
             <Particle delay={0.6} />
          </div>

          {/* Motion Blur Trail */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-2 bg-gradient-to-l from-white/30 to-transparent blur-xl -rotate-45 -z-10 origin-right"
            style={{ right: '50%' }}
          />
        </motion.div>
      </div>

      {/* Additional Subtle Rocket passing later */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ x: '100vw', y: '100vh', rotate: -45, scale: 0.4 }}
          animate={{ 
            x: '-100vw', 
            y: '-100vh',
            transition: { 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear",
              delay: 7
            }
          }}
          className="opacity-15 blur-[2px]"
        >
          <div className="w-24 h-24">
            <RocketIcon />
          </div>
        </motion.div>
      </div>

      {/* Grid Pattern for Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 mix-blend-overlay" />
    </div>
  );
}
