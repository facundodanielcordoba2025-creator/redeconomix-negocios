'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Landmark, 
  Banknote, 
  Copy, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  User,
  UserCheck 
} from "lucide-react";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LegalNoticeModal } from '@/components/aviso-legal-modal';

interface PremiumCheckoutModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  planName?: string;
  planPrice?: string;
}

export function PremiumCheckoutModal({ 
  isOpen: controlledOpen, 
  onOpenChange: setControlledOpen,
  planName = "Plan Esencial",
  planPrice = "$4.999"
}: PremiumCheckoutModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const userDocRef = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userData } = useDoc<any>(userDocRef);

  // Carga dinámica de los datos bancarios oficiales del negocio (Doña Lili / Benjamin Cordoba)
  const adminDocRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'users', 'HvnrCjJjK7armD1qs0ISB7yG1nj1');
  }, [firestore]);
  const { data: adminData } = useDoc<any>(adminDocRef);

  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transferencia' | 'efectivo'>('transferencia');

  // Form states
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userNeighborhood, setUserNeighborhood] = useState('');
  const [preferredTime, setPreferredTime] = useState('Tarde (14 a 19 hs)');
  const [receiptRef, setReceiptRef] = useState('');
  const [sellerRef, setSellerRef] = useState('');

  // Carga automática del código de vendedor desde URL o almacenamiento local
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refFromUrl = urlParams.get('ref') || urlParams.get('vendedor') || urlParams.get('asesor');
      if (refFromUrl) {
        const cleaned = refFromUrl.trim().toUpperCase();
        setSellerRef(cleaned);
        try { localStorage.setItem('rex_vendedor_ref', cleaned); } catch (_) {}
      } else {
        try {
          const saved = localStorage.getItem('rex_vendedor_ref');
          if (saved) setSellerRef(saved.trim().toUpperCase());
        } catch (_) {}
      }
    }
  }, []);

  // Prefill when user data is available
  useEffect(() => {
    if (userData) {
      if (!userName && (userData.ownerName || userData.displayName)) {
        setUserName(userData.ownerName || userData.displayName);
      }
      if (!userPhone && (userData.phoneNumber || userData.phone)) {
        setUserPhone(userData.phoneNumber || userData.phone);
      }
      if (!userEmail && (userData.email || user?.email)) {
        setUserEmail(userData.email || user?.email || '');
      }
      if (!userAddress && userData.address) {
        setUserAddress(userData.address);
      }
    } else if (user) {
      if (!userName && user.displayName) setUserName(user.displayName);
      if (!userEmail && user.email) setUserEmail(user.email);
    }
  }, [userData, user]);

  const effectiveCbu = adminData?.banking?.cbu || userData?.banking?.cbu || "0000076500000009357770";
  const effectiveAlias = adminData?.banking?.alias || adminData?.paymentAlias || userData?.banking?.alias || userData?.paymentAlias || "donaly";
  const effectiveTitular = adminData?.businessName ? `${adminData.businessName} (RedEconomiX)` : (adminData?.displayName ? `${adminData.displayName} (Doña Lili)` : "Doña Lili (RedEconomiX)");
  const effectiveQr = adminData?.banking?.qrImage || userData?.banking?.qrImage || "https://res.cloudinary.com/dffhpwfiz/image/upload/v1791377745/Captura_de_pantalla_2026-10-07_a_la_s_9.54.33_a._m._f512c2.png";

  const bankData = {
    titular: effectiveTitular,
    cbu: effectiveCbu,
    alias: effectiveAlias,
    qrImage: effectiveQr,
    valor: `${planPrice}/mes`
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles.`,
      className: 'bg-[#FF0000] text-white font-bold border-none'
    });
  };

  const handleConfirmRequest = async () => {
    if (!userName.trim()) {
      toast({ title: "Campo requerido", description: "Por favor indicá tu nombre y apellido.", variant: "destructive" });
      return;
    }
    if (!userPhone.trim() || userPhone.trim().length < 6) {
      toast({ title: "Teléfono requerido", description: "Indicá tu número de teléfono o WhatsApp para contactarte.", variant: "destructive" });
      return;
    }
    if (activeTab === 'efectivo') {
      if (!userAddress.trim()) {
        toast({ title: "Domicilio requerido", description: "Por favor indicá la dirección donde te visitará el asesor comercial.", variant: "destructive" });
        return;
      }
      if (!userNeighborhood.trim()) {
        toast({ title: "Localidad requerida", description: "Indicá tu localidad o barrio.", variant: "destructive" });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const orderPayload = {
        userId: user?.uid || null,
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        userEmail: (userEmail.trim() || user?.email || ''),
        planName,
        planPrice,
        paymentMethod: activeTab, // 'transferencia' | 'efectivo'
        address: activeTab === 'efectivo' ? userAddress.trim() : '',
        neighborhood: activeTab === 'efectivo' ? userNeighborhood.trim() : '',
        preferredTime: activeTab === 'efectivo' ? preferredTime : '',
        receiptRef: activeTab === 'transferencia' ? receiptRef.trim() : '',
        vendedorRef: sellerRef.trim().toUpperCase(),
        status: 'pending_contact'
      };

      // 1. Enviar a la API del servidor (guarda en Firestore con permisos de admin y despacha notificaciones)
      const res = await fetch('/api/email/plan-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'No se pudo procesar la solicitud en el servidor');
      }

      // 2. Guardado secundario en Firestore cliente (si está habilitado por reglas)
      if (firestore) {
        try {
          await addDoc(collection(firestore, 'solicitudes_planes'), {
            ...orderPayload,
            createdAt: serverTimestamp()
          });
        } catch (clientFsErr) {
          console.warn('Nota: Guardado secundario cliente omitido, orden ya persistida en Firestore por el servidor.', clientFsErr);
        }

        if (user?.uid) {
          try {
            await setDoc(doc(firestore, 'users', user.uid), {
              premiumStatus: 'pending_approval',
              selectedPlan: planName,
              planPrice: planPrice,
              paymentMethod: activeTab,
              phone: userPhone.trim(),
              address: activeTab === 'efectivo' ? userAddress.trim() : (userData?.address || ''),
              premiumRequestAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (userDocErr) {
            console.warn('Nota: Actualización de usuario cliente omitida:', userDocErr);
          }
        }
      }
      
      toast({
        title: "¡Solicitud Registrada con Éxito!",
        description: activeTab === 'efectivo' 
          ? `Coordinaremos la visita de nuestro asesor a ${userAddress} para el cobro en efectivo.`
          : `Validaremos tu transferencia y nos contactaremos a tu WhatsApp (${userPhone}).`,
        className: 'bg-emerald-600 text-white font-bold border-none shadow-xl'
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: error?.message || "No se pudo registrar la solicitud. Por favor reintentá.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden max-w-[95vw] sm:max-w-lg focus:outline-none">
        {/* Solid Red Header */}
        <div className="bg-[#FF0000] p-5 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#CC0000] text-white shadow-lg mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
            {planName}
          </DialogTitle>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black tracking-tight">{planPrice}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white/90">/ mes</span>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Modalidad de Pago: Solo Transferencia o Efectivo a Domicilio */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Elegí la Modalidad de Pago
            </Label>
            <Tabs 
              value={activeTab} 
              onValueChange={(val: any) => setActiveTab(val)} 
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-12 bg-slate-100 rounded-xl p-1 gap-1">
                <TabsTrigger 
                  value="transferencia" 
                  className="rounded-lg font-black uppercase tracking-tight text-[10px] sm:text-[11px] data-[state=active]:bg-[#FF0000] data-[state=active]:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Landmark className="w-3.5 h-3.5" /> Transferencia
                </TabsTrigger>
                <TabsTrigger 
                  value="efectivo" 
                  className="rounded-lg font-black uppercase tracking-tight text-[10px] sm:text-[11px] data-[state=active]:bg-[#FF0000] data-[state=active]:text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Banknote className="w-3.5 h-3.5" /> Efectivo (A Domicilio)
                </TabsTrigger>
              </TabsList>

              {/* TAB TRANSFERENCIA */}
              <TabsContent value="transferencia" className="space-y-3 pt-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Datos Bancarios Oficiales RedEconomiX
                  </p>
                  {[
                    { label: 'Titular', value: bankData.titular, copy: false },
                    { label: 'CBU / CVU', value: bankData.cbu, copy: true },
                    { label: 'ALIAS', value: bankData.alias, copy: true }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between group bg-white p-2 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                        <p className="text-xs font-black text-slate-900 tracking-tight">{item.value}</p>
                      </div>
                      {item.copy && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-[#FF0000] hover:bg-red-50 hover:text-[#CC0000] rounded-lg" 
                          onClick={() => copyToClipboard(item.value, item.label)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {bankData.qrImage && (
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Código QR de Pago</p>
                      <img src={bankData.qrImage} alt="QR de Pago" className="w-36 h-36 object-contain rounded-lg border border-slate-200 shadow-sm" />
                      <span className="text-[10px] text-slate-500 font-medium mt-1">Escaneá desde Mercado Pago o cualquier billetera</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-600">N° de Comprobante / Referencia (Opcional)</Label>
                  <Input 
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="Ej: 00482910" 
                    className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                  />
                </div>
              </TabsContent>

              {/* TAB EFECTIVO A DOMICILIO */}
              <TabsContent value="efectivo" className="space-y-3 pt-3">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-950 uppercase tracking-tight">Cobro en Efectivo a Domicilio</p>
                    <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed mt-0.5">
                      Un asesor comercial se trasladará a tu domicilio para hacer la entrega formal del kit de bienvenida y recibir el pago en mano.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF0000]" /> Domicilio Completo (Calle y Número) *
                    </Label>
                    <Input 
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="Ej: Av. San Martín 1420 Piso 2 Depto B" 
                      className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-600">Localidad / Barrio *</Label>
                      <Input 
                        value={userNeighborhood}
                        onChange={(e) => setUserNeighborhood(e.target.value)}
                        placeholder="Ej: San Miguel / Palermo" 
                        className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Horario Preferido
                      </Label>
                      <select 
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                      >
                        <option value="Mañana (9 a 13 hs)">Mañana (9 a 13 hs)</option>
                        <option value="Tarde (14 a 19 hs)">Tarde (14 a 19 hs)</option>
                        <option value="Cualquier horario">Cualquier horario</option>
                      </select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Datos Personales de Contacto */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Tus Datos para el Cierre de Venta
            </p>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Nombre y Apellido *
              </Label>
              <Input 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nombre completo" 
                className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#FF0000]" /> Teléfono / WhatsApp *
                </Label>
                <Input 
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="Ej: 11 3456 7890" 
                  className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
                </Label>
                <Input 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ejemplo@correo.com" 
                  className="h-10 rounded-xl border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Código de Asesor Comercial / Vendedor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-slate-400" /> Asesor / Código de Vendedor
                </Label>
                {sellerRef && (
                  <Badge variant="outline" className="text-[9px] font-bold bg-slate-100 text-slate-700 border-slate-200 h-4 px-1.5">
                    Asesor Asignado
                  </Badge>
                )}
              </div>
              <Input 
                value={sellerRef}
                onChange={(e) => setSellerRef(e.target.value.toUpperCase())}
                placeholder="Ej: LUCAS (Opcional)" 
                className="h-10 rounded-xl border-slate-200 text-xs font-semibold uppercase tracking-wider"
              />
            </div>
          </div>

          {/* Confirmación y Términos */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-start space-x-2 px-1">
              <Checkbox 
                id="terms-premium" 
                checked={isTermsAccepted} 
                onCheckedChange={(checked) => setIsTermsAccepted(checked === true)} 
                className="mt-0.5 h-4 w-4 border-slate-300 data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]" 
              />
              <label htmlFor="terms-premium" className="text-[10px] font-bold text-slate-600 leading-snug cursor-pointer">
                Acepto el{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLegalModalOpen(true);
                  }}
                  className="text-[#FF0000] underline hover:text-[#CC0000] font-black cursor-pointer"
                >
                  Aviso Legal y Políticas de la Empresa
                </button>{' '}
                (Leyes 17.418, 24.240 y 25.506).
              </label>
            </div>

            <Button 
              type="button"
              onClick={handleConfirmRequest} 
              disabled={!isTermsAccepted || isLoading} 
              className={cn(
                "w-full h-12 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-md", 
                isTermsAccepted 
                  ? "bg-[#FF0000] hover:bg-[#CC0000] text-white shadow-red-500/25 cursor-pointer" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : activeTab === 'efectivo' ? (
                'SOLICITAR ASESOR A DOMICILIO'
              ) : (
                'SOLICITAR ADHESIÓN POR TRANSFERENCIA'
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-center">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-[8px] font-bold uppercase tracking-wider">
                Un asesor comercial te contactará inmediatamente para el cierre
              </span>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Aviso Legal y Políticas */}
      <LegalNoticeModal 
        isOpen={isLegalModalOpen}
        onOpenChange={setIsLegalModalOpen}
        onAccept={() => setIsTermsAccepted(true)}
        isAccepted={isTermsAccepted}
      />
    </Dialog>
  );
}
