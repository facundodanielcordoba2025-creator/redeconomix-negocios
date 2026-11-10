import Link from 'next/link';
import { REXLogo } from './branding';
import { Instagram, Twitter, Mail, Facebook } from 'lucide-react';

export function MainFooter({ variant = 'default', brandText }: { variant?: 'default' | 'automotores', brandText?: string }) {
    return (
        <footer className="bg-white border-t border-slate-50 py-10 mt-12">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                
                {/* Branding */}
                <div className="flex flex-col items-center md:items-start gap-2">
                    {brandText ? (
                        <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">{brandText}</span>
                    ) : (
                        <REXLogo variant="dark" className="scale-75 origin-left" />
                    )}
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight uppercase">
                        &copy; {new Date().getFullYear()} {brandText ? brandText.toUpperCase() : 'REDECONOMIX'}
                    </p>
                </div>

                {/* Links de Navegación */}
                <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-black text-slate-500 tracking-widest uppercase">
                    <Link href="/terminos" className="hover:text-[#FF0000] transition-colors">Términos</Link>
                    <Link href="/terminos" className="hover:text-[#FF0000] transition-colors">Privacidad</Link>
                    <Link href="/contacto" className="hover:text-[#FF0000] transition-colors">Soporte</Link>
                </div>

                {/* Socials / Contact */}
                <div className="flex gap-5">
                    <a href="https://www.facebook.com/profile.php?id=61592494411678" target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-5 w-5 text-slate-300 hover:text-[#FF0000] transition-colors cursor-pointer" />
                    </a>
                    <a href="https://www.instagram.com/redeconomix.oficial/" target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-5 w-5 text-slate-300 hover:text-[#FF0000] transition-colors cursor-pointer" />
                    </a>
                    <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-5 w-5 text-slate-300 hover:text-[#FF0000] transition-colors cursor-pointer" />
                    </a>
                    <a href="mailto:rrhh@redeconomix.com">
                        <Mail className="h-5 w-5 text-slate-300 hover:text-[#FF0000] transition-colors cursor-pointer" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
