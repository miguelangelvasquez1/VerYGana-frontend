'use client';

import Image from "next/image";
import { Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-blue-950 text-white py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Company Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logos/logo.png" alt="VeryGana Logo" width={60} height={60} className="object-contain" />
            <h3 className="text-xl font-bold">VerYGana</h3>
          </div>
          <p className="text-sm text-gray-200">
            Tu plataforma integral donde puedes participar en rifas emocionantes, comprar productos increíbles, 
            recargar tu celular y descubrir historias de impacto social en nuestra comunidad.
          </p>
          <p className="text-xs text-gray-300">© 2025 VerYGana. Todos los derechos reservados.</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Navegación</h4>
          <ul className="space-y-2">
            <li><a href="/" className="text-gray-200 hover:text-white transition duration-200">Inicio</a></li>
            <li><a href="/raffles" className="text-gray-200 hover:text-white transition duration-200">Rifas</a></li>
            <li><a href="/products" className="text-gray-200 hover:text-white transition duration-200">Marketplace</a></li>
            <li><a href="/plans/mobile-plans" className="text-gray-200 hover:text-white transition duration-200">Recargas</a></li>
            <li><a href="/ads" className="text-gray-200 hover:text-white transition duration-200">Anuncios</a></li>
            <li><a href="/forum" className="text-gray-200 hover:text-white transition duration-200">Historias de Impacto</a></li>
          </ul>
        </div>

        {/* Social Media & Contact */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contacto</h4>
          <div className="flex gap-4 mb-4">
            <a href="#" className="text-gray-200 hover:text-white transition duration-200">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-200 hover:text-white transition duration-200">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-gray-200 hover:text-white transition duration-200">
              <Instagram size={20} />
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-200">Email: soporte@VerYGana.com</p>
            <p className="text-sm text-gray-200">Tel: +57 (300) 123-4567</p>
            <p className="text-sm text-gray-200">Armenia, Quindío - Colombia</p>
          </div>
        </div>
      </div>
    </footer>
  );
}