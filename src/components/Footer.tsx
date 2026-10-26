'use client';

import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshake,
  Home,
  Mail,
  MapPin,
  Megaphone,
  ShoppingCart,
  Smartphone,
  Ticket,
} from "lucide-react";

// Enlaces del pie. Los que piden sesión no se muestran a un visitante (`guest`), que no debe salir hacia
// páginas protegidas (spec 012, D-12).
const FOOTER_LINKS = [
  { href: '/', label: 'Inicio', Icon: Home, needsSession: false },
  { href: '/raffles', label: 'Rifas', Icon: Ticket, needsSession: true },
  { href: '/products', label: 'Marketplace', Icon: ShoppingCart, needsSession: true },
  { href: '/plans/mobile-plans', label: 'Recargas', Icon: Smartphone, needsSession: true },
  { href: '/ads', label: 'Anuncios', Icon: Megaphone, needsSession: true },
  { href: '/forum', label: 'Historias de Impacto', Icon: HeartHandshake, needsSession: true },
] as const;

// En celular cada enlace mide 44 px de alto (py-3); desde `md:` queda con el aspecto de siempre.
const LINK_CLASS =
  'flex min-h-11 items-center gap-2 py-3 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white active:text-white md:min-h-0 md:py-0';

export default function Footer({ guest = false }: { guest?: boolean }) {
  const links = FOOTER_LINKS.filter((link) => !(guest && link.needsSession));

  return (
      <footer className="w-full bg-gradient-to-br from-[#080f32] via-[#0b2448] to-[#03548C] text-white py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {/* Company Info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Image src="/logos/logoDorado.png" alt="VeryGana Logo" width={52} height={52} className="object-contain" />
            <h3 className="text-xl font-bold">VerYGana</h3>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-gray-300">
            Tu plataforma integral donde puedes participar en rifas emocionantes, comprar productos increíbles,
            recargar tu celular y descubrir historias de impacto social en nuestra comunidad.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#1EA5BD]">Navegación</h4>
          <ul className="space-y-1 text-sm md:space-y-2.5">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className={LINK_CLASS}><Icon size={15} />{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Media & Contact */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#1EA5BD]">Contacto</h4>
          <div className="space-y-3 text-sm text-gray-300">
            <p className="flex items-center gap-2"><Mail size={15} className="shrink-0 text-[#1EA5BD]" />soporte@VerYGana.com</p>
            <p className="flex items-center gap-2 text-xs text-gray-400"><MapPin size={15} className="shrink-0 text-[#1EA5BD]" />Armenia, Quindío - Colombia</p>
          </div>
          <a href="mailto:soporte@VerYGana.com" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#1EA5BD] px-4 py-2 text-xs font-semibold text-[#080f32] transition duration-200 hover:bg-[#36c4d8] hover:shadow-lg hover:shadow-[#1EA5BD]/20 active:bg-[#36c4d8] md:min-h-0">Contáctanos</a>
        </div>
      </div>
      <div className="mx-auto mt-7 max-w-7xl border-t border-white/15 px-6 pt-4 lg:px-8">
        <p className="text-center text-xs text-gray-400 md:text-left">© 2025 VerYGana. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
