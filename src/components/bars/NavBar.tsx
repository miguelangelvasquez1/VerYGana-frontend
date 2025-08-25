'use client';

import { User, Menu, X, Wallet, Home, Gift, Megaphone, Package, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: { target: any; }) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
      if (walletRef.current && !walletRef.current.contains(event.target)) {
        setIsWalletOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const buttonsStyle = "cursor-pointer bg-white text-blue-900 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-blue-50 hover:scale-105 hover:shadow-lg transform transition-all duration-200";
  const activeButtonStyle = "cursor-pointer bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-full shadow-md border-2 border-blue-300";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <Image src="/logos/logo2.png" alt="Logo" width={80} height={80} />
          </div>

          {/* NAVIGATION BUTTONS */}
          <div className="flex gap-3">
            <Link href={"/"}>
              <button className={pathname === '/' ? activeButtonStyle : buttonsStyle}>
                Inicio
              </button>
            </Link>
            <Link href={"/raffles"}>
              <button className={pathname === '/raffles' ? 
                "cursor-pointer bg-amber-400 text-black font-bold px-4 py-2 rounded-full shadow-md border-2 border-amber-600 transform" :
                "cursor-pointer bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-sm hover:bg-amber-500 hover:scale-105 hover:shadow-lg transform transition-all duration-200"
              }>
                Rifas
              </button>
            </Link>
            <Link href={"/ads"}>
              <button className={pathname === '/ads' ? activeButtonStyle : buttonsStyle}>
                Anuncios
              </button>
            </Link>
            <Link href={"/products"}>
              <button className={pathname === '/products' ? activeButtonStyle : buttonsStyle}>
                Productos
              </button>
            </Link>
            <Link href={"/plans/mobile-plans"}>
              <button className={pathname === '/plans/mobile-plans' ? activeButtonStyle : buttonsStyle}>
                Recargas
              </button>
            </Link>
          </div>

          {/* WALLET AND PROFILE SECTION */}
          <div className="flex items-center gap-6">
            {/* Wallet Section */}
            <div className="relative" ref={walletRef}>
              <button
                onClick={() => setIsWalletOpen(!isWalletOpen)}
                className="group flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transform transition-all duration-200"
              >
                <Wallet className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                <div className="flex flex-col items-start">
                  <span className="text-yellow-400 font-bold text-sm group-hover:text-yellow-300">$10.000</span>
                  <span className="text-xs text-gray-200">Saldo disponible</span>
                </div>
              </button>

              {/* Wallet Dropdown */}
              {isWalletOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-xl z-50 border">
                  <div className="p-4">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-green-600">$10.000</div>
                      <div className="text-sm text-gray-500">Saldo actual</div>
                    </div>
                    <div className="space-y-2">
                      <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 hover:scale-105 transform transition-all duration-200 font-semibold">
                        Depositar
                      </button>
                      <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 hover:scale-105 transform transition-all duration-200 font-semibold">
                        Retirar
                      </button>
                      <Link href="/wallet/history" className="block">
                        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 hover:scale-105 transform transition-all duration-200">
                          Ver historial
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Section */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="group flex items-center gap-3 focus:outline-none hover:bg-white/10 px-3 py-2 rounded-full hover:scale-105 transform transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center group-hover:border-yellow-400 group-hover:bg-white/10 transition-all duration-200">
                  <User className="text-white w-5 h-5 group-hover:text-yellow-400" />
                </div>
                <div className="text-left">
                  <div className="font-semibold group-hover:text-yellow-400 transition-colors duration-200">Juan</div>
                  {/* <div className="text-xs text-gray-200">Usuario Premium</div> */}
                </div>
              </button>

              {/* User Menu Dropdown */}
              {openMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-xl z-50 border">
                  <ul className="py-2">
                    <li>
                      <Link href="/explore/profile" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                        Mi Perfil
                      </Link>
                    </li>
                    <li>
                      <Link href="/settings" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                        Configuración
                      </Link>
                    </li>
                    <li>
                      <Link href="/orders" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                        Mis Pedidos
                      </Link>
                    </li>
                    <li className="border-t border-gray-100">
                      <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200">
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Top Bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image src="/logos/logo2.png" alt="Logo" width={40} height={40} />
            </div>

            {/* Top Right: Wallet & Profile */}
            <div className="flex items-center gap-3">
              {/* Mobile Wallet */}
              <div className="relative" ref={walletRef}>
                <button
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                  className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">$10K</span>
                </button>

                {/* Mobile Wallet Dropdown */}
                {isWalletOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-xl z-50 border">
                    <div className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-green-600">$10.000</div>
                        <div className="text-sm text-gray-500">Saldo actual</div>
                      </div>
                      <div className="space-y-2">
                        <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 hover:scale-105 transform transition-all duration-200 font-semibold">
                          Depositar
                        </button>
                        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 hover:scale-105 transform transition-all duration-200 font-semibold">
                          Retirar
                        </button>
                        <Link href="/wallet/history">
                          <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 hover:scale-105 transform transition-all duration-200">
                            Ver historial
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Profile */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpenMenu(!openMenu)}
                  className="flex items-center gap-2 hover:bg-white/10 px-2 py-2 rounded-full transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <User className="text-white w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm">Juan</span>
                </button>

                {/* Mobile User Menu */}
                {openMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-xl z-50 border">
                    <ul className="py-2">
                      <li>
                        <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                          Mi Perfil
                        </Link>
                      </li>
                      <li>
                        <Link href="/settings" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                          Configuración
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                          Mis Pedidos
                        </Link>
                      </li>
                      <li className="border-t border-gray-100">
                        <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200">
                          Cerrar Sesión
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Estilo App */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex-1">
            <button className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/' 
                ? 'text-blue-600 bg-blue-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:rounded-lg mx-1'
            }`}>
              <Home className={`w-6 h-6 mb-1 ${pathname === '/' ? 'text-blue-600' : ''}`} />
              <span className="text-xs font-medium">Inicio</span>
            </button>
          </Link>

          <Link href="/raffles" className="flex-1">
            <button className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/raffles' 
                ? 'text-yellow-600 bg-yellow-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 hover:rounded-lg mx-1'
            }`}>
              <Gift className={`w-6 h-6 mb-1 ${pathname === '/raffles' ? 'text-yellow-600' : ''}`} />
              <span className="text-xs font-medium">Rifas</span>
            </button>
          </Link>

          <Link href="/ads" className="flex-1">
            <button className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/ads' 
                ? 'text-green-600 bg-green-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50 hover:rounded-lg mx-1'
            }`}>
              <Megaphone className={`w-6 h-6 mb-1 ${pathname === '/ads' ? 'text-green-600' : ''}`} />
              <span className="text-xs font-medium">Anuncios</span>
            </button>
          </Link>

          <Link href="/products" className="flex-1">
            <button className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/products' 
                ? 'text-purple-600 bg-purple-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:rounded-lg mx-1'
            }`}>
              <Package className={`w-6 h-6 mb-1 ${pathname === '/products' ? 'text-purple-600' : ''}`} />
              <span className="text-xs font-medium">Productos</span>
            </button>
          </Link>

          <Link href="/plans/mobile-plans" className="flex-1">
            <button className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${
              pathname === '/plans/mobile-plans' 
                ? 'text-purple-600 bg-purple-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 hover:rounded-lg mx-1'
            }`}>
              <Smartphone className={`w-6 h-6 mb-1 ${pathname === '/plans/mobile-plans' ? 'text-purple-600' : ''}`} />
              <span className="text-xs font-medium">Recargas</span>
            </button>
          </Link>

          {/* <button 
            onClick={() => setIsWalletOpen(!isWalletOpen)}
            className={`flex flex-col items-center py-2 px-1 flex-1 transition-all duration-200 ${
              isWalletOpen 
                ? 'text-orange-600 bg-orange-50 rounded-lg mx-1' 
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 hover:rounded-lg mx-1'
            }`}
          >
            <Wallet className={`w-6 h-6 mb-1 ${isWalletOpen ? 'text-orange-600' : ''}`} />
            <span className="text-xs font-medium">Monedero</span>
          </button> */}
        </div>
      </div>

      {/* Spacer for mobile bottom navigation */}
      {/* <div className="lg:hidden h-16"></div> */}
    </>
  );
}