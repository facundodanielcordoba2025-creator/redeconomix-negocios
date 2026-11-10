import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export type PenalFormState = {
    penalId: string;
    penalNameManual: string;
    penalAddressManual: string;
    remitenteNombre: string;
    remitenteApellido: string;
    remitenteTelefono: string;
    detenidoNombre: string;
    detenidoApellidoPaterno: string;
    detenidoApellidoMaterno: string;
    detenidoPabellon: string;
    acceptedTerms: boolean;
    upsells: {
        botella: boolean;
        bolsa: boolean;
    };
    isValid: boolean;
};

interface CheckoutPenalFormProps {
    onChange: (state: PenalFormState) => void;
}

const PENALES_OPTIONS = [
    { id: 'spb_1', name: 'Buenos Aires - Unidad 1 (Olmos)' },
    { id: 'spb_2', name: 'Buenos Aires - Unidad 2 (Sierra Chica)' },
    { id: 'spb_3', name: 'Buenos Aires - Unidad 3 (San Nicolás)' },
    { id: 'spb_9', name: 'Buenos Aires - Unidad 9 (La Plata)' },
    { id: 'spb_32', name: 'Buenos Aires - Unidad 32 (F. Varela)' },
    { id: 'salta_1', name: 'Salta - Unidad 1 (Capital)' },
    { id: 'salta_2', name: 'Salta - Unidad 2 (Metán)' },
    { id: 'salta_5', name: 'Salta - Unidad 5 (Tartagal)' },
    { id: 'salta_fed16', name: 'Salta - Unidad Federal 16 (Cerrillos)' },
    { id: 'jujuy_1', name: 'Jujuy - Est. Penitenciario N° 1' },
    { id: 'jujuy_fed8', name: 'Jujuy - Unidad Federal 8' },
    { id: 'tucuman_1', name: 'Tucumán - Unidad 1 (Penados)' },
    { id: 'tucuman_benjamin', name: 'Tucumán - Complejo Benjamín Paz' },
    { id: 'other', name: 'Otra / Ingresar manualmente' },
];

export function CheckoutPenalForm({ onChange }: CheckoutPenalFormProps) {
    const [state, setState] = useState<PenalFormState>({
        penalId: '',
        penalNameManual: '',
        penalAddressManual: '',
        remitenteNombre: '',
        remitenteApellido: '',
        remitenteTelefono: '',
        detenidoNombre: '',
        detenidoApellidoPaterno: '',
        detenidoApellidoMaterno: '',
        detenidoPabellon: '',
        acceptedTerms: false,
        upsells: {
            botella: false,
            bolsa: false,
        },
        isValid: false,
    });

    useEffect(() => {
        const isValid = 
            state.penalId !== '' && 
            (state.penalId !== 'other' || (state.penalNameManual.trim() !== '' && state.penalAddressManual.trim() !== '')) &&
            state.remitenteNombre.trim() !== '' &&
            state.remitenteApellido.trim() !== '' &&
            state.remitenteTelefono.trim() !== '' &&
            state.detenidoNombre.trim() !== '' &&
            state.detenidoApellidoPaterno.trim() !== '' &&
            state.detenidoApellidoMaterno.trim() !== '' &&
            state.detenidoPabellon.trim() !== '' &&
            state.acceptedTerms;

        onChange({ ...state, isValid });
    }, [state]);

    const updateState = (updates: Partial<PenalFormState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    return (
        <div className="space-y-6 pt-4 border-t border-slate-100 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* DESTINO */}
            <div className="space-y-3">
                <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">1. Destino Penitenciario</h5>
                <Select value={state.penalId} onValueChange={(val) => updateState({ penalId: val })}>
                    <SelectTrigger className="h-12 bg-white rounded-xl text-xs font-bold shadow-sm">
                        <SelectValue placeholder="Seleccioná la Unidad Penitenciaria" />
                    </SelectTrigger>
                    <SelectContent>
                        {PENALES_OPTIONS.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                {state.penalId === 'other' && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <Input 
                            placeholder="Nombre del Penal..." 
                            className="h-12 bg-white rounded-xl text-xs" 
                            value={state.penalNameManual}
                            onChange={(e) => updateState({ penalNameManual: e.target.value })}
                        />
                        <Input 
                            placeholder="Dirección del Penal..." 
                            className="h-12 bg-white rounded-xl text-xs" 
                            value={state.penalAddressManual}
                            onChange={(e) => updateState({ penalAddressManual: e.target.value })}
                        />
                    </div>
                )}
            </div>

            {/* REMITENTE */}
            <div className="space-y-3">
                <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">2. ¿Quién envía? (Remitente)</h5>
                <div className="grid grid-cols-2 gap-3">
                    <Input 
                        placeholder="Nombre..." 
                        className="h-12 bg-white rounded-xl text-xs" 
                        value={state.remitenteNombre}
                        onChange={(e) => updateState({ remitenteNombre: e.target.value })}
                    />
                    <Input 
                        placeholder="Apellido..." 
                        className="h-12 bg-white rounded-xl text-xs" 
                        value={state.remitenteApellido}
                        onChange={(e) => updateState({ remitenteApellido: e.target.value })}
                    />
                </div>
                <Input 
                    placeholder="Número de Teléfono (ej: +54 9 11...)" 
                    className="h-12 bg-white rounded-xl text-xs" 
                    value={state.remitenteTelefono}
                    onChange={(e) => updateState({ remitenteTelefono: e.target.value })}
                />
            </div>

            {/* DETENIDO */}
            <div className="space-y-3">
                <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">3. ¿Quién recibe? (Interno)</h5>
                <Input 
                    placeholder="Nombres del interno..." 
                    className="h-12 bg-white rounded-xl text-xs" 
                    value={state.detenidoNombre}
                    onChange={(e) => updateState({ detenidoNombre: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input 
                        placeholder="Apellido Paterno..." 
                        className="h-12 bg-white rounded-xl text-xs" 
                        value={state.detenidoApellidoPaterno}
                        onChange={(e) => updateState({ detenidoApellidoPaterno: e.target.value })}
                    />
                    <Input 
                        placeholder="Apellido Materno..." 
                        className="h-12 bg-white rounded-xl text-xs" 
                        value={state.detenidoApellidoMaterno}
                        onChange={(e) => updateState({ detenidoApellidoMaterno: e.target.value })}
                    />
                </div>
                <Input 
                    placeholder="Número de Pabellón..." 
                    className="h-12 bg-white rounded-xl text-xs" 
                    value={state.detenidoPabellon}
                    onChange={(e) => updateState({ detenidoPabellon: e.target.value })}
                />
            </div>

            {/* UPSELLS */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <AlertTriangle className="w-16 h-16 text-amber-900" />
                </div>
                <h6 className="text-xs font-black text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 
                    ATENCIÓN - REGULACIÓN DE REQUISA
                </h6>
                <p className="text-[10px] font-medium text-amber-800 leading-relaxed relative z-10">
                    Algunos productos deben enviarse en bolsas o botellas transparentes para su traspaso. Si no se cuenta con estos elementos, RedEconomiX no se responsabiliza por mercadería rechazada en el ingreso al penal.
                </p>
                <div className="space-y-2 relative z-10 pt-2">
                    <Button 
                        variant="outline" 
                        className={cn("w-full h-12 justify-between text-xs font-bold transition-all", state.upsells.botella ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-amber-200 text-slate-700")}
                        onClick={() => updateState({ upsells: { ...state.upsells, botella: !state.upsells.botella } })}
                    >
                        <span className="flex items-center gap-2">
                            <PlusCircle className={cn("w-4 h-4", state.upsells.botella ? "text-amber-600" : "text-slate-400")} />
                            Botella de traspaso reutilizable
                        </span>
                        <span className="font-black">+$1.000</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        className={cn("w-full h-12 justify-between text-xs font-bold transition-all", state.upsells.bolsa ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-amber-200 text-slate-700")}
                        onClick={() => updateState({ upsells: { ...state.upsells, bolsa: !state.upsells.bolsa } })}
                    >
                        <span className="flex items-center gap-2">
                            <PlusCircle className={cn("w-4 h-4", state.upsells.bolsa ? "text-amber-600" : "text-slate-400")} />
                            Bolsa transparente de traspaso
                        </span>
                        <span className="font-black">+$500</span>
                    </Button>
                </div>
            </div>

            {/* LEGAL TERMS */}
            <div className="p-4 bg-slate-900 rounded-2xl">
                <div className="flex items-start gap-3">
                    <Checkbox 
                        id="terms-penal" 
                        checked={state.acceptedTerms} 
                        onCheckedChange={(checked) => updateState({ acceptedTerms: checked === true })}
                        className="mt-1 bg-white data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <label htmlFor="terms-penal" className="text-[10px] text-slate-300 font-medium leading-relaxed cursor-pointer select-none">
                        Acepto los <a href="/redeconomix/legales-penal" target="_blank" className="text-blue-400 underline font-bold">Términos de Logística Penitenciaria</a>. Entiendo que el pedido demora 24-48hs en ser entregado y declaro bajo juramento que el interno ya presentó la nota de autorización de ingreso por RedEconomiX ante las autoridades de requisa del penal.
                    </label>
                </div>
            </div>
            
            {/* CARGO PENAL SUMMARY */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Cargo por Logística Institucional y Delivery</span>
                <span className="text-sm font-black text-emerald-900">+$7.500</span>
            </div>
        </div>
    );
}
