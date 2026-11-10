'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { 
  X, Camera, Sparkles, ChevronRight, ArrowLeft, ShieldCheck, Search, Minus, Plus, ShoppingCart, MessageCircle, HelpCircle,
  BarChart, Package, Zap, Smartphone, Send, Mic, Play, RefreshCcw, PartyPopper, Gift, Banknote, HandCoins, Star, ChevronLeft,
  CheckCircle, Calculator, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRedEconomiXCart } from '@/context/redeconomix-cart-context';

// PURE SVG ANIMATED SOLID BODY ASTRONAUT - Premium Version
function VectorAstronaut({ className }: { className?: string }) {
  return (
    <motion.svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="initial"
      animate="animate"
    >
      <motion.g
        animate={{ 
            y: [-3, 3, -3],
            rotate: [-1, 1, -1]
        }}
        transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
        }}
      >
        <path 
            d="M30 45C30 36.1634 37.1634 29 46 29H54C62.8366 29 70 36.1634 70 45V85C70 93.8366 62.8366 101 54 101H46C37.1634 101 30 93.8366 30 85V45Z" 
            fill="white" 
            stroke="#94A3B8"
            strokeWidth="1.5"
        />
        <path 
            d="M38 42C38 37.5817 41.5817 34 46 34H54C58.4183 34 62 37.5817 62 42C62 46.4183 58.4183 50 54 50H46C41.5817 50 38 46.4183 38 42Z" 
            fill="#1E293B" 
        />
        <circle cx="45" cy="40" r="2" fill="white" fillOpacity="0.2" />
        <g>
            <rect x="23" y="55" width="10" height="25" rx="5" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
            <motion.rect 
                x="67" y="55" width="10" height="25" rx="5" fill="white" stroke="#94A3B8" strokeWidth="1.5"
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
        </g>
        <rect x="30" y="52" width="6" height="1.5" rx="0.75" fill="#94A3B8" />
        <rect x="64" y="52" width="6" height="1.5" rx="0.75" fill="#94A3B8" />
        <rect x="42" y="58" width="16" height="12" rx="3" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
        <circle cx="46" cy="62" r="1.5" fill="#EF4444" />
        <circle cx="50" cy="62" r="1.5" fill="#3B82F6" />
        <circle cx="54" cy="62" r="1.5" fill="#10B981" />
        <path d="M48 68L50 64L52 68H48Z" fill="#3B82F6" />
        <path d="M30 85V95C30 98.3137 32.6863 101 36 101H45V85H30Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M55 85V101H64C67.3137 101 70 98.3137 70 95V85H55Z" fill="white" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="30" y="80" width="40" height="3" fill="#E2E8F0" />
      </motion.g>
    </motion.svg>
  );
}

interface FloatingAssistantProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onStartScanner?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedProduct?: any;
  onClearSelection?: () => void;
  lastAddedProduct?: any;
  className?: string;
}

type Message = {
    id: string;
    text: string;
    sender: 'ai' | 'user';
    type?: 'product' | 'text' | 'quantity' | 'rounding';
    data?: any;
};

export function FloatingAssistant({ 
  isOpen,
  setIsOpen,
  onStartScanner, 
  searchQuery, 
  setSearchQuery,
  selectedProduct,
  onClearSelection,
  lastAddedProduct
}: FloatingAssistantProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart, cartTotal } = useRedEconomiXCart();
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '¡Hola! Soy tu asistente de IA. ¿Qué buscás hoy?', sender: 'ai' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<'searching' | 'choosing' | 'quantity' | 'rounding' | 'idle'>('idle');
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [showBubble, setShowBubble] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Handle product selected from the external marketplace
  useEffect(() => {
    if (selectedProduct && isOpen) {
        setTempProduct(selectedProduct);
        setCurrentStep('quantity');
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), text: `Seleccionaste: ${selectedProduct.name}`, sender: 'user' },
            { id: (Date.now() + 1).toString(), text: `¡Excelente elección! ¿Qué cantidad sumamos al carrito?`, sender: 'ai', type: 'quantity' }
        ]);
        if (onClearSelection) onClearSelection();
    }
  }, [selectedProduct, isOpen, onClearSelection]);

  // Success feedback
  useEffect(() => {
      if (lastAddedProduct && isOpen) {
          setMessages(prev => [
              ...prev,
              { id: Date.now().toString(), text: `¡Sumado con éxito: ${lastAddedProduct.name}!`, sender: 'ai', type: 'text' },
              { id: (Date.now() + 1).toString(), text: `¿Deseás buscar algo más?`, sender: 'ai' }
          ]);
      }
  }, [lastAddedProduct, isOpen]);

  const addMessage = (text: string, sender: 'ai' | 'user', type: Message['type'] = 'text', data?: any) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, type, data }]);
  };

  const handleSendMessage = (text: string = inputMessage) => {
    if (!text.trim()) return;
    
    addMessage(text, 'user');
    setInputMessage('');
    setIsProcessing(true);

    setTimeout(() => {
        const lowerText = text.toLowerCase();
        
        if (currentStep === 'quantity' || /^\d+$/.test(text)) {
            const qty = parseInt(text) || 1;
            confirmAddToCart(qty);
        } else if (lowerText.includes('no') || lowerText.includes('listo') || lowerText.includes('pagar') || lowerText.includes('ya está')) {
            handleRoundingOffer();
        } else {
            // Normalizar texto para búsqueda: eliminar signos de puntuación
            const cleanText = text.replace(/[¿?¡!.,]/g, '').trim();
            
            if (setSearchQuery) setSearchQuery(cleanText);
            addMessage(`Buscando "${cleanText}" en la red...`, 'ai');
            
            setTimeout(() => {
                addMessage(`Tengo estas opciones disponibles. Elegí la que prefieras:`, 'ai', 'product', { query: cleanText });
                setCurrentStep('choosing');
            }, 500);
        }
        setIsProcessing(false);
    }, 800);
  };

  const confirmAddToCart = (qty: number) => {
    const productToUse = tempProduct || { name: 'Producto Seleccionado', price: 950 };
    addToCart(productToUse, qty);
    const lineTotal = productToUse.price * qty;
    
    addMessage(`¡Listo! Sumé ${qty} x ${productToUse.name} ($${lineTotal.toLocaleString()}).`, 'ai');
    addMessage(`¿Querés sumar algo más? Por ejemplo, ¿fideos o azúcar para redondear el ticket?`, 'ai');
    
    setTempProduct(null);
    setCurrentStep('idle');
  };

  const handleRoundingOffer = () => {
    const currentTotal = cartTotal || 0;
    const nextRound = Math.ceil(currentTotal / 1000) * 1000;
    const diff = nextRound - currentTotal;
    
    // Logic: If they are close to a round number, suggest a candy or staple product
    if (diff > 0 && diff < 800) {
        addMessage(`Tu carrito actual suma $${currentTotal.toLocaleString()}.`, 'ai');
        addMessage(`¡OFERTA DE REDONDEO!: Te faltan solo $${diff} para los $${nextRound}. ¿Sumamos un Alfajor Triple por solo $450 (¡15% OFF aplicado!)?`, 'ai', 'rounding');
        setCurrentStep('rounding');
    } else {
        addMessage(`Perfecto. Tenés un total de $${currentTotal.toLocaleString()} en el carrito. Podés finalizar cuando quieras.`, 'ai');
        setCurrentStep('idle');
    }
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed bottom-52 left-4 z-[110] flex flex-col items-start pointer-events-auto cursor-grab active:cursor-grabbing touch-none floating-assistant-container"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[340px] h-[500px] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-white overflow-hidden flex flex-col transition-all duration-500 relative ring-1 ring-slate-200"
          >
            {/* Header */}
            <div className="bg-slate-50/80 border-b border-slate-100 p-4 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-200 border-b-4 shadow-sm overflow-hidden p-1">
                    <VectorAstronaut className="scale-125 translate-y-1" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[11px] uppercase tracking-widest text-[#FF0000]">Asistente de IA</h3>
                </div>
                <button onClick={() => { setIsOpen(false); if(setSearchQuery) setSearchQuery(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                    <X className="h-4 w-4 text-slate-400" />
                </button>
            </div>

            {/* Conversational Screen */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white/50">
                {messages.map((m) => (
                    <motion.div 
                        key={m.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex flex-col", m.sender === 'ai' ? "items-start" : "items-end")}
                    >
                        <div className={cn(
                            "max-w-[85%] p-4 rounded-[1.8rem] text-[13px] font-bold leading-relaxed shadow-sm",
                            m.sender === 'ai' ? "bg-white text-slate-700 rounded-tl-none border border-slate-100" : "bg-primary text-white rounded-tr-none shadow-red-500/20"
                        )}>
                            {m.text}

                            {/* QUANTITY CHOICE PILLS */}
                            {m.type === 'quantity' && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {[1, 2, 3, 5, 12, 24].map(n => (
                                        <Button 
                                            key={n} 
                                            variant="outline"
                                            onClick={() => {
                                                addMessage(`${n} unidades`, 'user');
                                                confirmAddToCart(n);
                                            }}
                                            className="h-9 px-4 bg-white border-slate-200 text-slate-900 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all text-[11px] font-black"
                                        >
                                            {n}
                                        </Button>
                                    ))}
                                </div>
                            )}

                            {/* REDON OFFER PILLS */}
                            {m.type === 'rounding' && (
                                <div className="mt-4 space-y-2">
                                    <Button 
                                        onClick={() => {
                                            addMessage('¡Sí, sumalo!', 'user');
                                            toast({ title: "Oferta Aplicada", description: "Alfajor Triple sumado al carrito." });
                                            setCurrentStep('idle');
                                        }}
                                        className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-400/20"
                                    >
                                        <Sparkles className="h-3 w-3 mr-2" /> SUMAR PARA REDONDEAR
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => {
                                            addMessage('No por ahora.', 'user');
                                            setCurrentStep('idle');
                                        }}
                                        className="w-full h-8 text-slate-400 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        Finalizar compra así
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* PRODUCT CARDS INSIDE CHAT (CONVERSATIONAL SEARCH) */}
                        {m.type === 'product' && (
                            <div className="w-[110%] -ml-[5%] mt-3 overflow-x-auto no-scrollbar flex gap-3 px-6 pb-2">
                                {[
                                    { id: 'p1', name: 'Leche Descremada 1L', price: 1150, brand: 'La Serenísima', cat: 'leche', img: 'https://images.unsplash.com/photo-1550586678-f7225f03ec44?q=80&w=200' },
                                    { id: 'p2', name: 'Leche Entera 1L', price: 1100, brand: 'Tregar', cat: 'leche', img: 'https://images.unsplash.com/photo-1563636619-e910ef2a844b?q=80&w=200' },
                                    { id: 'p3', name: 'Fideos Tallarín 500g', price: 850, brand: 'Luchetti', cat: 'fideo', img: 'https://images.unsplash.com/photo-1551462147-3a8833c95a01?q=80&w=200' },
                                    { id: 'p4', name: 'Fideos Tirabuzón 500g', price: 850, brand: 'Matarazzo', cat: 'fideo', img: 'https://images.unsplash.com/photo-1612966809572-775211a2995b?q=80&w=200' },
                                    { id: 'p5', name: 'Arroz Largo Fino 1kg', price: 1200, brand: 'Gallo', cat: 'arroz', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=200' },
                                    { id: 'p6', name: 'Aceite Natura 1.5L', price: 2400, brand: 'Natura', cat: 'aceite', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=200' },
                                    { id: 'p7', name: 'Yerba Playadito 1kg', price: 3200, brand: 'Playadito', cat: 'yerba', img: 'https://images.unsplash.com/photo-1515694590185-73647ae02c1f?q=80&w=200' },
                                    { id: 'p8', name: 'Azúcar Ledesma 1kg', price: 950, brand: 'Ledesma', cat: 'azucar', img: 'https://images.unsplash.com/photo-1622484211148-716598e04141?q=80&w=200' }
                                ].filter(p => {
                                    const searchTerms = (m.data?.query || '').toLowerCase().split(' ');
                                    return searchTerms.some((term: string) => 
                                        p.name && p.name.toLowerCase().includes(term) || 
                                        p.cat.toLowerCase().includes(term)
                                    );
                                }).map(p => (
                                    <motion.div 
                                        key={p.id}
                                        
                                        onClick={() => {
                                            setTempProduct(p);
                                            setCurrentStep('quantity');
                                            addMessage(`Elijo ${p.name}`, 'user');
                                            addMessage(`¡Genial! El precio unitario es de $${p.price.toLocaleString()}. ¿Qué cantidad sumamos al carrito?`, 'ai', 'quantity');
                                        }}
                                        className="min-w-[150px] bg-white p-4 rounded-3xl border border-slate-100 shadow-md cursor-pointer flex flex-col gap-2 shrink-0 group hover:border-primary/30 transition-all"
                                    >
                                        <div className="w-full h-24 bg-slate-50 rounded-2xl flex items-center justify-center border-b-2 border-slate-100 overflow-hidden relative">
                                            {p.img ? (
                                                <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <Package className="h-9 w-9 text-slate-200 group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{p.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{p.brand}</p>
                                        </div>
                                        <p className="text-[13px] font-black text-primary">${p.price.toLocaleString()}</p>
                                        <div className="bg-primary/5 rounded-full py-1 text-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <span className="text-[9px] font-black uppercase">Seleccionar</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
                
                {isProcessing && (
                    <div className="flex gap-1 items-center p-3 bg-slate-50 w-fit rounded-2xl rounded-tl-none">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    </div>
                )}
            </div>

            {/* Smart Interaction Bar */}
            <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-4">
                <div className="flex gap-2">
                    <Button 
                        onClick={onStartScanner}
                        className="h-12 w-12 rounded-2xl bg-slate-900 hover:bg-black text-white p-0 shadow-lg shadow-black/10 transition-all active:scale-95"
                    >
                        <Camera className="h-6 w-6" />
                    </Button>
                    <div className="flex-1 relative">
                        <Input 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ej: 'Buscá leche entera'..."
                            className="h-12 rounded-2xl bg-slate-100 border-none px-5 pr-12 text-[13px] font-bold placeholder:text-slate-400 focus-visible:ring-1 ring-primary/20"
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            className={cn("absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all", inputMessage.trim() ? "text-primary scale-110" : "text-slate-300")}
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
                
                {/* Visual Status / Quick Actions */}
                <div className="flex justify-between items-center px-1">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Compra</p>
                        <p className="text-[13px] font-black text-slate-900">${(cartTotal || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="h-8 px-4 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all" onClick={() => router.push('/redeconomix/carrito')}>Finalizar</button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Astronaut Trigger */}
      <motion.div 
        drag
        dragMomentum={false}
        className="relative group pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence>
          {showBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: -20 }}
              className="absolute bottom-full left-0 mb-6 bg-primary text-white text-[10px] font-black px-5 py-2.5 rounded-[1.5rem] rounded-bl-none shadow-[0_15px_40px_rgba(255,0,0,0.5)] border-2 border-white whitespace-nowrap z-[110] flex items-center gap-3"
            >
               <div className="w-2 h-2 bg-white rounded-full animate-ping" />
               ASISTENTE DE IA
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isOpen && (
            <motion.button
              key="assistant-trigger"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              
              
              onClick={() => {
                setIsOpen(true);
                setShowBubble(false);
              }}
              className="w-24 h-28 flex items-center justify-center transition-all duration-500 group relative bg-transparent pointer-events-auto"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-8 bg-primary/40 rounded-full blur-3xl transition-all duration-500 group-hover:bg-primary/60 outline-none" />
                  <div className="relative z-10 w-full h-full flex items-center justify-center overflow-visible">
                     <VectorAstronaut className="w-[130px] h-[150px] drop-shadow-[0_25px_50px_rgba(255,0,0,0.25)]" />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute top-4 left-4 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full z-20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.08);
          border-radius: 20px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  );
}
