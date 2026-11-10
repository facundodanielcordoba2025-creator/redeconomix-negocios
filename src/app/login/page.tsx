'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, Phone, ChevronLeft, Mail, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RedEconomiXLogo, RocketIcon } from '@/components/branding';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Contraseña requerida.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Iconos SVG 
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

// Branding components moved to @/components/branding

// Branding components moved to @/components/branding

export default function UserLoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { isUserLoading, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [view, setView] = useState<'splash' | 'email'>('splash');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { 
      setIsClient(true); 
      // Si el usuario ya está conectado y cargó todo, redirigir automáticamente (silencioso)
      if (!isUserLoading && user) {
          handleRedirect(null); 
      } else if (!isUserLoading) {
          // Splash ultra-rápido de 800ms para logo branding
          const timer = setTimeout(() => setView('email'), 800);
          return () => clearTimeout(timer);
      }
  }, [isUserLoading, user]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleRedirect = async (userData: any) => {
    let data = userData;
    
    // Priority check: Is this user an employee (preventista)?
    if (auth?.currentUser && firestore) {
        try {
            const empSnap = await getDoc(doc(firestore, 'employees', auth.currentUser.uid));
            if (empSnap.exists()) {
                data = { ...empSnap.data(), accountType: 'preventista' };
            } else if (!data) {
                const userSnap = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
                data = userSnap.data();
            }
        } catch(e) {}
    }
    
    const type = data?.accountType?.toLowerCase();
    if (type && typeof window !== 'undefined') {
      localStorage.setItem('rex_role', type);
      localStorage.setItem('rex_session_active', '1');
    }

    if (type === 'preventista') router.push('/redeconomix/empleados');
    else if (type === 'provider' || type === 'prestador') router.push('/redeconomix/prestadores/panel');
    else if (type === 'wholesaler' || type === 'mayorista') router.push('/redeconomix/dashboard-mayorista');
    else if (type === 'retailer' || type === 'negocio' || type === 'admin') {
      const savedRoute = typeof window !== 'undefined' ? localStorage.getItem('rex_last_route') : null;
      if (savedRoute && savedRoute.startsWith('/redeconomix/dashboard-negocio')) {
        router.push(savedRoute);
      } else {
        router.push('/redeconomix/dashboard-negocio');
      }
    }
    else router.push('/redeconomix'); // Redirect Person (Consumer) to Marketplace
    
    toast({ title: '¡Bienvenido!', description: 'Sesión iniciada con éxito.' });
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!auth || !firestore) return;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userDocSnap = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      handleRedirect(userDocSnap.data());
    } catch (error: any) {
      console.error("Login Error:", error);
      let message = 'Credenciales inválidas.';
      if (error.code === 'auth/network-request-failed') message = 'Error de conexión. Revisá tu internet.';
      if (error.code === 'auth/too-many-requests') message = 'Demasiados intentos. Intentá más tarde.';
      
      toast({ 
        variant: 'destructive', 
        title: 'Error de Ingreso', 
        description: message 
      });
      setIsLoading(false);
    }
  };

  const onForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Email Requerido", description: "Ingresá tu email para continuar.", variant: "destructive" });
      return;
    }

    setIsResetLoading(true);
    try {
      if (!auth) throw new Error('Auth no inicializado');
      
      await sendPasswordResetEmail(auth, resetEmail);

      toast({ 
        title: "📧 Enlace Enviado", 
        description: "Revisá tu casilla de correo para restablecer tu clave de forma segura." 
      });
      setIsResetModalOpen(false);
    } catch (error: any) {
      console.error("Reset Error:", error);
      let message = "No pudimos enviar el correo. Verificá que el email sea correcto.";
      if (error.code === 'auth/user-not-found') message = "No encontramos ninguna cuenta con ese email.";
      
      toast({ 
        title: "Error", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen w-full bg-[#F40009] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F40009] overflow-hidden flex flex-col font-sans">

      <AnimatePresence mode="wait">
        
        {/* VIEW: SPLASH */}
        {view === 'splash' && (
          <motion.div 
            key="splash"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex-1 flex items-center justify-center relative z-20 bg-white"
          >
            <RedEconomiXLogo variant="dark" />
          </motion.div>
        )}

        {/* VIEW: DIRECT LOGIN */}
        {view === 'email' && (
          <motion.div 
            key="email"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col relative z-10 p-6 md:p-12 w-full max-w-md mx-auto justify-center"
          >
             <div className="flex flex-col items-center mb-10">
                <h2 className="text-white text-3xl font-bold uppercase tracking-tight">Ingresar <span className="text-black/50">.</span></h2>
             </div>

             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Email o Celular" 
                            className="h-16 max-sm:h-12 bg-white border-none text-slate-900 px-6 rounded-[1.2rem] font-bold placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-black/10" 
                            {...field}
                          />
                        </FormControl>
                        <div className="px-2 pt-1"><FormMessage className="text-[10px] text-white font-bold uppercase" /></div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Contraseña"
                                    className="h-16 max-sm:h-12 bg-white border-none text-slate-900 px-6 rounded-[1.2rem] font-bold placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-black/10 pr-12" 
                                    {...field}
                                />
                                <button 
                                    type="button" 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormControl>
                        <div className="px-2 pt-1"><FormMessage className="text-[10px] text-white font-bold uppercase" /></div>
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-16 max-sm:h-12 bg-black hover:bg-zinc-800 text-white rounded-[1.2rem] font-bold  uppercase tracking-tight text-lg shadow-xl shadow-black/10 transition-transform active:scale-95"
                      >
                        {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : 'Entrar Ahora'}
                      </Button>
                  </div>
                </form>
             </Form>

              <div className="mt-8 text-center flex flex-col items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-white/70 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    ¿Olvidaste tu contraseña?
                </button>

                <div className="pt-2 border-t border-white/10 w-full">
                  <Link 
                    href="/redeconomix/register"
                    className="inline-flex items-center justify-center gap-1.5 text-white font-black text-xs uppercase tracking-wider py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                  >
                    ¿No tienes cuenta? <span className="underline decoration-white/40 underline-offset-4 text-white">Regístrate gratis</span>
                  </Link>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
          <DialogContent className="sm:max-w-md bg-white rounded-[2rem] border-none shadow-2xl p-8">
              <DialogHeader className="flex flex-col items-center">
                  <div className="w-16 h-16 max-sm:h-12 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-900 mb-4 shadow-sm">
                      <ShieldAlert className="w-8 h-8" />
                  </div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 text-center">
                      Recuperit <span className="text-red-500">.</span>
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium text-center text-xs leading-relaxed max-w-[250px] mx-auto mt-2">
                      Te enviaremos un link a tu correo para que puedas elegir una nueva clave.
                  </DialogDescription>
              </DialogHeader>

              <div className="py-8">
                  <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                          <Mail className="h-5 w-5" />
                      </div>
                      <Input
                          placeholder="tu@email.com"
                          className="h-16 max-sm:h-12 bg-slate-50 border-slate-100 text-slate-900 pl-14 pr-6 rounded-[1.2rem] font-bold placeholder:text-slate-300 focus-visible:ring-4 focus-visible:ring-slate-100"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                      />
                  </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 h-16 max-sm:h-12 rounded-[1.2rem] font-bold text-slate-400 uppercase tracking-widest text-[10px]"
                  >
                      Cancelar
                  </Button>
                  <Button 
                    onClick={onForgotPassword}
                    disabled={isResetLoading || !resetEmail}
                    className="flex-1 h-16 max-sm:h-12 bg-black hover:bg-zinc-800 text-white rounded-[1.2rem] font-bold uppercase tracking-tight text-sm shadow-xl active:scale-95 transition-transform"
                  >
                      {isResetLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enviar Enlace'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
