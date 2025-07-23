'use client';

import Image from "next/image";
import { Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-t from-[#014C92] via-[#1EA5BD] to-[#014C92] text-white py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Company Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logos/logo2.png" alt="Rifacel Logo" width={60} height={60} className="object-contain" />
            <h3 className="text-xl font-bold">Rifacel</h3>
          </div>
          <p className="text-sm text-gray-200">
            ¡Gana tu próximo celular con nosotros! Participa en nuestras rifas y vive la emoción de ganar.
          </p>
          <p className="text-xs text-gray-300">© 2025 Rifacel. Todos los derechos reservados.</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
          <ul className="space-y-2">
            <li><a href="#" className="text-gray-200 hover:text-white transition duration-200">Inicio</a></li>
            <li><a href="#" className="text-gray-200 hover:text-white transition duration-200">Celulares</a></li>
            <li><a href="#" className="text-gray-200 hover:text-white transition duration-200">Ganadores</a></li>
            <li><a href="#" className="text-gray-200 hover:text-white transition duration-200">Contacto</a></li>
          </ul>
        </div>

        {/* Social Media & Contact */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Síguenos</h4>
          <div className="flex gap-4 mb-4">
            <a href="#" className="text-gray-200 hover:text-white transition duration-200"><Facebook size={20} /></a>
            <a href="#" className="text-gray-200 hover:text-white transition duration-200"><Twitter size={20} /></a>
            <a href="#" className="text-gray-200 hover:text-white transition duration-200"><Instagram size={20} /></a>
          </div>
          <p className="text-sm text-gray-200">Email: soporte@rifacel.com</p>
          <p className="text-sm text-gray-200">Tel: +1 (555) 123-4567</p>
        </div>
      </div>
    </footer>
  );
}