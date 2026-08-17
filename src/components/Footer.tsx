'use client';

import Image from "next/image";
import {
  HeartHandshake,
  Home,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  ShoppingCart,
  Smartphone,
  Ticket,
} from "lucide-react";

export default function Footer() {
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
          <ul className="space-y-2.5 text-sm">
            <li><a href="/" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><Home size={15} />Inicio</a></li>
            <li><a href="/raffles" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><Ticket size={15} />Rifas</a></li>
            <li><a href="/products" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><ShoppingCart size={15} />Marketplace</a></li>
            <li><a href="/plans/mobile-plans" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><Smartphone size={15} />Recargas</a></li>
            <li><a href="/ads" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><Megaphone size={15} />Anuncios</a></li>
            <li><a href="/forum" className="flex items-center gap-2 text-gray-300 transition duration-200 hover:translate-x-1 hover:text-white"><HeartHandshake size={15} />Historias de Impacto</a></li>
          </ul>
        </div>

        {/* Social Media & Contact */}
        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#1EA5BD]">Contacto</h4>
          <div className="space-y-3 text-sm text-gray-300">
            <p className="flex items-center gap-2"><Mail size={15} className="shrink-0 text-[#1EA5BD]" />soporte@VerYGana.com</p>
            <p className="flex items-center gap-2"><Phone size={15} className="shrink-0 text-[#1EA5BD]" />+57 (300) 123-4567</p>
            <p className="flex items-center gap-2 text-xs text-gray-400"><MapPin size={15} className="shrink-0 text-[#1EA5BD]" />Armenia, Quindío - Colombia</p>
          </div>
          <a href="mailto:soporte@VerYGana.com" className="mt-5 inline-flex items-center rounded-lg bg-[#1EA5BD] px-4 py-2 text-xs font-semibold text-[#080f32] transition duration-200 hover:bg-[#36c4d8] hover:shadow-lg hover:shadow-[#1EA5BD]/20">Contáctanos</a>
        </div>
      </div>
      <div className="mx-auto mt-7 max-w-7xl border-t border-white/15 px-6 pt-4 lg:px-8">
        <p className="text-center text-xs text-gray-400 md:text-left">© 2025 VerYGana. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
