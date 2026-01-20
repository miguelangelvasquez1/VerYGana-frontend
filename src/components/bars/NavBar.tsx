'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Wallet,
  Home,
  Gift,
  Megaphone,
  Package,
  Smartphone,
  History,
  UserCircle,
  ShoppingBag,
  Settings,
  LogOut,
  Plus,
  Bell,
  Heart
} from "lucide-react";

import { getConsumerInitialData } from "@/services/ConsumerService";
import type { ConsumerInitialDataResponseDTO } from "@/types/Consumer.types";
import { CartButton } from "../cart/CartButton";

export default function Navbar() {
  const pathname = usePathname();

  // UI state
  const [openMenu, setOpenMenu] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Data state
  const [consumer, setConsumer] = useState<ConsumerInitialDataResponseDTO | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  // refs independientes (corregido)
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const walletMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true);
      try {
        const data = await getConsumerInitialData();
        setConsumer(data);
      } catch (err: any) {
        console.error("Error cargando datos:", err);
        setErrorUser("No se pudieron cargar los datos del usuario");
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  // click outside (CORREGIDO)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setOpenMenu(false);
      }

      if (walletMenuRef.current && !walletMenuRef.current.contains(target)) {
        setIsWalletOpen(false);
      }

      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (value?: number) => {
    if (value == null) return "$0";
    return `$${value.toLocaleString("es-CO")}`;
  };

  const buttonsStyle =
    "cursor-pointer bg-white text-blue-900 font-semibold px-4 py-2 rounded-full shadow-md hover:bg-blue-50 hover:scale-105 hover:shadow-lg transform transition-all duration-200";

  const activeButtonStyle =
    "cursor-pointer bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-full shadow-md border-2 border-blue-300";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">

        {/* ---------- DESKTOP NAV ---------- */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2">

          {/* LOGO */}
          <div className="flex items-center gap-4">
            <Image src="/logos/logo.png" alt="Logo" width={60} height={60} />
          </div>

          {/* NAV BUTTONS */}
          <div className="flex gap-3">
            <Link href={"/"}>
              <button className={pathname === "/" ? activeButtonStyle : buttonsStyle}>
                Inicio
              </button>
            </Link>

            <Link href={"/raffles"}>
              <button
                className={
                  pathname === "/raffles"
                    ? "cursor-pointer bg-amber-400 text-black font-bold px-4 py-2 rounded-full shadow-md border-2 border-amber-600 transform"
                    : "cursor-pointer bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-sm hover:bg-amber-500 hover:scale-105 hover:shadow-lg transform transition-all duration-200"
                }
              >
                Rifas
              </button>
            </Link>

            <Link href={"/games"}>
              <button className={pathname === "/ads" ? activeButtonStyle : buttonsStyle}>
                Juegos
              </button>
            </Link>

            <Link href={"/ads"}>
              <button className={pathname === "/ads" ? activeButtonStyle : buttonsStyle}>
                Anuncios
              </button>
            </Link>

            <Link href={"/products"}>
              <button className={pathname === "/products" ? activeButtonStyle : buttonsStyle}>
                Productos
              </button>
            </Link>

            <Link href={"/plans/mobile-plans"}>
              <button
                className={pathname === "/plans/mobile-plans" ? activeButtonStyle : buttonsStyle}
              >
                Recargas
              </button>
            </Link>

            <Link href={"/forum"}>
              <button className={pathname === "/forum" ? activeButtonStyle : buttonsStyle}>
                Foro
              </button>
            </Link>
          </div>

          {/* -------- WALLET + CART + NOTIFS + USER -------- */}
          <div className="flex items-center gap-6">

            {/* CART BUTTON */}
            <CartButton />
            {/* WALLET */}
            <div className="relative" ref={walletMenuRef}>
              <button
                onClick={() => setIsWalletOpen((v) => !v)}
                className="group flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 hover:scale-105 transition-all"
              >
                <Wallet className="w-5 h-5 text-yellow-400" />
                <div className="flex flex-col items-start">
                  <span className="text-yellow-400 font-bold text-sm">
                    {loadingUser ? "..." : formatCurrency(consumer?.walletAvailableBalance)}
                  </span>
                  <span className="text-xs text-gray-200">Saldo disponible</span>
                </div>
              </button>

              {/* WALLET DROPDOWN */}
              <div
                className={`absolute right-0 mt-2 w-80 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${isWalletOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>

                    <div className="text-2xl font-bold">
                      {loadingUser ? "..." : formatCurrency(consumer?.walletAvailableBalance)}
                    </div>
                    <div className="text-sm text-blue-100">Saldo actual</div>
                  </div>
                </div>

                <div className="p-4 space-y-4">

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <div className="text-lg font-bold text-green-600">—</div>
                      <div className="text-xs text-green-700">Créditos</div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <div className="text-lg font-bold text-blue-600">—</div>
                      <div className="text-xs text-blue-700">Transacciones</div>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Depositar Fondos
                  </button>

                  <Link href="/explore/wallet">
                    <button className="w-full bg-gray-50 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-100 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <History className="w-4 h-4" />
                      Ver Historial Completo
                    </button>
                  </Link>

                </div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notificationsMenuRef}>
              <button
                onClick={() => setIsNotificationsOpen((v) => !v)}
                className="relative flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition-all"
              >
                <Bell className="w-5 h-5 text-white" />

                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>

              <div
                className={`absolute right-0 mt-2 w-80 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${isNotificationsOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl text-white">
                  <div className="text-lg font-semibold">Notificaciones</div>
                </div>

                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    No hay notificaciones aún.
                  </p>
                </div>
              </div>
            </div>

            {/* PROFILE MENU */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setOpenMenu((v) => !v)}
                className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-full transition-all"
              >
                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                  <User className="text-white w-5 h-5" />
                </div>

                <div>
                  <div className="font-semibold">
                    {loadingUser ? "Cargando..." : consumer?.name ?? "Usuario"}
                  </div>
                  <div className="text-xs text-gray-200">Beneficiario</div>
                </div>
              </button>

              {/* PROFILE DROPDOWN */}
              <div
                className={`absolute right-0 mt-2 w-64 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${openMenu
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="font-semibold">
                        {loadingUser ? "..." : consumer?.name ?? "Usuario"}
                      </div>
                      <div className="text-sm text-blue-100">Beneficiario</div>
                    </div>
                  </div>
                </div>

                <div className="py-2">

                  <Link
                    href="/explore/profile"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mi Perfil</span>
                  </Link>

                  <Link
                    href="/explore/purchases"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis compras</span>
                  </Link>

                  <Link
                    href={"/explore/favorites"}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <Heart className="w-5 h-5 text-gray-400 group-hover:text-blue-600"/>
                    <span>Mis favoritos</span>
                  </Link>

                  <Link
                    href="/explore/referrals"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis Referidos</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                  >
                    <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Configuración</span>
                  </Link>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">
                      <LogOut className="w-5 h-5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
        {/* ---------- MOBILE NAVBAR ---------- */}
        {/* (Lo dejé igual que tu versión anterior, si deseas también lo optimizo) */}

      </nav>
    </>
  );
}
