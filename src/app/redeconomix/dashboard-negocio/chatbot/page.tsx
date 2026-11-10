'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Zap, Settings, ShieldCheck, Activity, Send, 
  RefreshCcw, Phone, Database, Bot, ChevronLeft, CheckCircle2,
  AlertCircle, ExternalLink, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";

/* ============================================================
   CHATBOT CONTROL CENTER - REDECONOMIX
   ============================================================ */

export default function ChatbotConfigPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isAILive, setIsAILive] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [testPhone, setTestPhone] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('https://us2.make.com/2167228/scenarios/add'); // Reference from screenshots
    
    // Sample "Real-time" Logs
    const [logs, setLogs] = useState([
        { id: 1, time: '20:10:45', event: 'Mensaje entrante de +549...862', status: 'success', detail: 'Consulta sobre stock de fideos.' },
        { id: 2, time: '20:10:48', event: 'AI Generando respuesta...', status: 'processing', detail: 'Analizando catálogo...' },
        { id: 3, time: '20:10:52', event: 'Respuesta enviada via Twilio', status: 'success', detail: 'Link de catálogo compartido.' },
    ]);

    const handleTestMessage = async () => {
        if (!testPhone) {
            toast({ title: "Número Requerido", description: "Ingresá un número de WhatsApp para probar.", variant: "destructive" });
            return;
        }
        setIsTesting(true);
        // Simulate webhook call to Make.com
        setTimeout(() => {
            setIsTesting(false);
            toast({ 
                title: "Señal enviada a Make.com 🚀", 
                description: "La automatización de Twilio debería dispararse en segundos.",
            });
            setLogs(prev => [{
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                event: `Test enviado a ${testPhone}`,
                status: 'success',
                detail: 'Disparador manual activado.'
            }, ...prev]);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-50 bg-[#002752] text-white px-6 py-6 rounded-b-[2.5rem] shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight">WhatsApp AI</h1>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Configuración Twilio & Make.com</p>
                        </div>
                    </div>
                    <div className={cn(
                        "px-4 py-2 rounded-full border flex items-center gap-2",
                        isAILive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", isAILive ? "bg-emerald-400" : "bg-rose-400")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{isAILive ? "Online" : "Offline"}</span>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-5 mt-8 space-y-6">
                
                {/* 1. MAIN STATUS CARD */}
                <Card className="border-none shadow-2xl shadow-indigo-500/5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
                    <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                            <Bot className="w-12 h-12" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-2">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span className="text-[9px] font-black uppercase tracking-widest">IA de Ventas 24/7 RedEconomiX</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight leading-none italic">Asistente Inteligente</h2>
                            <p className="text-white/70 text-sm font-medium">Automatice el 90% de sus consultas y cierre ventas dormido.</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Switch checked={isAILive} onCheckedChange={setIsAILive} className="data-[state=checked]:bg-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isAILive ? "CONECTADO" : "DESCONECTADO"}</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* 2. CONFIGURATION CARD */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Settings className="w-4 h-4 text-primary" /> Parámetros de Enlace
                            </CardTitle>
                        </CardHeader>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook de Activación (Make.com)</Label>
                                <div className="flex gap-2">
                                    <Input value={webhookUrl} placeholder="https://hook.us2.make.com/..." className="rounded-xl bg-slate-50 border-none font-bold text-xs h-12" readOnly />
                                    <Button variant="ghost" className="h-12 w-12 rounded-xl bg-slate-100"><ExternalLink className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <Phone className="w-4 h-4 text-blue-600" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-blue-900 leading-tight">Twilio Sandbox</p>
                                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Activo (Ready)</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-purple-900 leading-tight">Prompt System</p>
                                    <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">Optimizado</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. TEST PANEL */}
                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 flex flex-col">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Send className="w-4 h-4 text-primary" /> Probar Automatización
                            </CardTitle>
                        </CardHeader>
                        <div className="flex-1 flex flex-col justify-center space-y-4">
                            <p className="text-[10px] text-slate-400 font-bold uppercase text-center leading-relaxed">
                                Enviá un mensaje de prueba para verificar que el webhook de Make y el conector de Twilio funcionen correctamente.
                            </p>
                            <Input 
                                placeholder="+5493873540862" 
                                value={testPhone} 
                                onChange={(e) => setTestPhone(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-black text-xl text-center shadow-inner" 
                            />
                            <Button 
                                onClick={handleTestMessage}
                                disabled={isTesting}
                                className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[12px] shadow-lg shadow-emerald-500/20"
                            >
                                {isTesting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Enviar Señal de Prueba"}
                            </Button>
                        </div>
                    </Card>

                </div>

                {/* 4. ACTIVITY LOG (DASHBOARD STYLE) */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6">
                    <div className="flex justify-between items-center mb-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Registro de Actividad IA
                        </CardTitle>
                        <span className="text-[9px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">Hoy en vivo</span>
                    </div>
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    log.status === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600 animate-pulse"
                                )}>
                                    {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className="text-xs font-black text-slate-900">{log.event}</p>
                                        <span className="text-[9px] font-bold text-slate-400">{log.time}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium">{log.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-[9px] font-black uppercase tracking-widest text-primary">Ver Logs Completos en Make.com <ExternalLink className="w-3 h-3 ml-2" /></Button>
                </Card>

                {/* 5. QUICK TIPS / INFO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-amber-900 uppercase mb-1">Backup CRM</p>
                            <p className="text-[9px] text-amber-700 leading-relaxed font-bold">Todos los leads se guardan automáticamente en Cloud Firestore bajo 'leads_whatsapp'.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-start gap-4">
                        <Zap className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-emerald-900 uppercase mb-1">Potenciador AI</p>
                            <p className="text-[9px] text-emerald-700 leading-relaxed font-bold">Usamos GPT-4o para analizar el lenguaje natural y ofrecer productos del marketplace.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                        <Database className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black text-indigo-900 uppercase mb-1">Sincronización</p>
                            <p className="text-[9px] text-indigo-700 leading-relaxed font-bold">Cada 15 minutos se actualiza el stock disponible para el Bot desde Make.</p>
                        </div>
                    </div>
                </div>

            </main>

        </div>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
