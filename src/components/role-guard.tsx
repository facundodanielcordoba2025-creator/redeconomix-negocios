'use client';

import React, { useState } from 'react';
import { useRole, RoleType } from '@/hooks/use-role';
import { useUser } from '@/firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle, KeyRound, ArrowLeft, ShieldCheck, UserCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RoleGuardProps {
    children: React.ReactNode;
    moduleName?: string;
    allowedRoles?: RoleType[];
}

export function RoleGuard({ children, moduleName = "Módulo", allowedRoles = ['admin'] }: RoleGuardProps) {
    const { user } = useUser();
    const { role, employee, loginAsAdmin, loginWithDni, resetPin } = useRole();
    const [dni, setDni] = useState('');
    const [pin, setPin] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);
    const [password, setPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // If current role is allowed, render the component
    if (allowedRoles.includes(role)) {
        return <>{children}</>;
    }

    const handleUnlock = async () => {
        setIsLoading(true);
        // 1. Check if it's the Master PIN (Owner login without DNI)
        if (pin && !dni) {
            const success = await loginAsAdmin(pin);
            if (success) {
                toast({ title: "Acceso Admin 🔓", description: "Caja desbloqueada.", className: "bg-emerald-600 text-white border-none" });
            } else {
                toast({ title: "Credenciales Incorrectas ❌", description: "PIN Maestro inválido.", variant: "destructive" });
                setPin('');
            }
            setIsLoading(false);
            return;
        }

        // 2. Check if DNI and PIN are provided for employee login
        if (dni && pin) {
            try {
                const success = await loginWithDni(dni, pin);
                if (success) {
                    toast({ title: "Sesión Iniciada ✅", description: "Acceso concedido." });
                } else {
                    toast({ title: "Credenciales Incorrectas ❌", description: "DNI o PIN inválidos, o usuario suspendido.", variant: "destructive" });
                    setPin('');
                }
            } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" });
            }
            setIsLoading(false);
            return;
        }

        // 3. Fallback error
        toast({ title: "Datos Incompletos ❌", description: "Ingresa tu DNI y PIN, o solo el PIN Maestro si eres el dueño.", variant: "destructive" });
        setIsLoading(false);
    };

    const handleRecovery = async () => {
        if (!password || password.length < 6) { 
            toast({ title: "Contraseña inválida", description: "Debes ingresar la contraseña real de tu cuenta de administrador.", variant: "destructive" });
            return;
        }

        if (!/^\d{4}$/.test(newPin)) {
            toast({ title: "PIN Inválido", description: "El nuevo PIN debe tener exactamente 4 dígitos numéricos.", variant: "destructive" });
            return;
        }

        if (!user || !user.email) {
            toast({ title: "Sin sesión activa", description: "No se encontró el correo de la cuenta titular para verificar la contraseña.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await resetPin(newPin);
            await loginAsAdmin(newPin);
            toast({ title: "PIN Restablecido 🔓", description: "Identidad verificada. Tu nuevo PIN Maestro ha sido guardado en la nube.", className: "bg-emerald-600 text-white border-none" });
            setIsRecovering(false);
            setPassword('');
            setNewPin('');
        } catch (e: any) {
            toast({ title: "Contraseña Incorrecta 🔒", description: "La contraseña ingresada no coincide con la de la cuenta titular.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isRecovering) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-md pt-[100px]">
                <Card className="border-red-100 shadow-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-red-50/50 pb-6 pt-8">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4 border border-red-100">
                            <KeyRound className="w-8 h-8 text-red-600" />
                        </div>
                        <CardTitle className="text-center text-2xl font-black uppercase tracking-tight text-slate-800">
                            Recuperar PIN Maestro
                        </CardTitle>
                        <CardDescription className="text-center font-medium px-4">
                            Ingresa la contraseña de tu cuenta para crear un nuevo PIN de administrador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Contraseña de tu Cuenta</label>
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.1em] text-slate-400 ml-1">Nuevo PIN Maestro</label>
                            <Input 
                                type="password" 
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="Ej: 1234" 
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                className="h-16 rounded-2xl bg-slate-50 border-slate-200 text-center text-4xl tracking-[0.5em] font-black focus:bg-white"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pb-8 px-6">
                        <Button onClick={handleRecovery} className="w-full h-14 rounded-2xl font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20 text-white transition-all hover:scale-[1.02]">
                            Guardar Nuevo PIN
                        </Button>
                        <Button variant="ghost" onClick={() => setIsRecovering(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-wider h-12 rounded-2xl">
                            Cancelar
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-md pt-[110px] md:pt-[130px]">
            <Card className="border-slate-100 shadow-2xl rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-xl">
                <CardHeader className="text-center pb-2 pt-10 relative">
                    <div className="mx-auto bg-red-600 p-5 rounded-[2rem] mb-6 shadow-xl shadow-red-600/20 relative w-20 h-20 flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-white" />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
                        {role === 'locked' ? 'Identifícate' : 'Acceso Restringido'}
                    </CardTitle>
                    <CardDescription className="text-xs font-bold mt-3 text-slate-400 px-4 uppercase tracking-widest leading-relaxed">
                        {role === 'locked' 
                            ? "Ingresa tu DNI y PIN para acceder a tu área de trabajo." 
                            : `Tu perfil actual (${role}) no tiene permisos para ver ${moduleName}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-2 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tu DNI</label>
                        <Input 
                            type="number" 
                            placeholder="Sin puntos" 
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:border-red-300 focus:bg-white text-center text-xl font-black transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tu PIN</label>
                        <Input 
                            type="password" 
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="h-16 rounded-2xl bg-slate-50 border-slate-100 focus:border-red-300 focus:bg-white text-center text-4xl tracking-[0.5em] font-black transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        />
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-[9px] text-center font-bold text-slate-400">
                            *Si eres el dueño, puedes dejar el DNI vacío e ingresar solo tu PIN Maestro.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-6 pb-10 px-8">
                    <Button 
                        onClick={handleUnlock} 
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acceder"}
                    </Button>
                    
                    <div className="flex w-full items-center justify-between text-xs font-bold px-2 mt-2">
                        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 flex items-center gap-2 uppercase tracking-widest transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </button>
                        <button onClick={() => setIsRecovering(true)} className="text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors underline decoration-red-200 underline-offset-4">
                            Olvidé el PIN Dueño
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
