'use client';

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Gift,
  Megaphone,
  Package,
  History,
  UserCircle,
  ShoppingBag,
  Settings,
  LogOut,
  Heart,
  Home,
  Ticket,
  KeyRound
} from "lucide-react";

import { getConsumerInitialData } from "@/services/ConsumerService";
import type { ConsumerInitialDataResponseDTO } from "@/types/Consumer.types";
import { CartButton } from "../consumer/cart/CartButton";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "../notifications/NotificationsPanel";
import { useLogout } from '@/hooks/useLogout';

export default function Navbar() {
  const pathname = usePathname();

  // UI state
  const [openMenu, setOpenMenu] = useState(false);
  const [isKeyWalletOpen, setIsKeyWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logout } = useLogout();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAllAsRead,
    loadMore,
  } = useNotifications();

  // Data state
  const [consumer, setConsumer] = useState<ConsumerInitialDataResponseDTO | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [errorUser, setErrorUser] = useState<string | null>(null);

  // refs independientes
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const keyWalletMenuRefDesktop = useRef<HTMLDivElement | null>(null);
  const keyWalletMenuRefMobile = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRefDesktop = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRefMobile = useRef<HTMLDivElement | null>(null);

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

  // click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target))
        setOpenMenu(false);
      if (
        keyWalletMenuRefDesktop.current && !keyWalletMenuRefDesktop.current.contains(target) &&
        keyWalletMenuRefMobile.current && !keyWalletMenuRefMobile.current.contains(target)
      )
        setIsKeyWalletOpen(false);
      if (
        notificationsMenuRefDesktop.current && !notificationsMenuRefDesktop.current.contains(target) &&
        notificationsMenuRefMobile.current && !notificationsMenuRefMobile.current.contains(target)
      )
        setIsNotificationsOpen(false);
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
      {/* ---------- DESKTOP NAV (top) ---------- */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-2">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <Image src="/logos/logo.png" alt="Logo" width={60} height={60} />
          </div>

          {/* NAV BUTTONS */}
          <div className="flex gap-3">
            <Link href={"/home"}>
              <button className={pathname === "/home" ? activeButtonStyle : buttonsStyle}>
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
              <button className={pathname === "/games" ? activeButtonStyle : buttonsStyle}>
                Juegos
              </button>
            </Link>

            <Link href={"/pet"}>
              <button className={pathname === "/pet" ? activeButtonStyle : buttonsStyle}>
                🐾 Mascota
              </button>
            </Link> 

            <Link href={"/ads"}>
              <button className={pathname === "/ads" ? activeButtonStyle : buttonsStyle}>
                Anuncios
              </button>
            </Link>

            <Link href={"/surveys"}>
              <button className={pathname === "/surveys" ? activeButtonStyle : buttonsStyle}>
                Encuestas
              </button>
            </Link>

            <Link href={"/products"}>
              <button className={pathname === "/products" ? activeButtonStyle : buttonsStyle}>
                Productos
              </button>
            </Link>

            <Link href={"/plans/mobile-plans"}>
              <button className={pathname === "/plans/mobile-plans" ? activeButtonStyle : buttonsStyle}>
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

            {/* KEY WALLET */}
            <div className="relative" ref={keyWalletMenuRefDesktop}>
              <button
                onClick={() => setIsKeyWalletOpen((v) => !v)}
                className="group flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 hover:bg-white/20 hover:scale-105 transition-all"
              >
                <Image
                  src="/logos/llave.png"
                  alt="Llaves"
                  width={28}
                  height={28}
                  className="object-contain"
                />

                <div className="flex flex-col items-start leading-tight">
                  <span className="text-yellow-300 font-extrabold text-sm">
                    {loadingUser
                      ? "..."
                      : consumer?.totalAvailableKeys?.toLocaleString("es-CO")}
                  </span>

                  <span className="text-[11px] text-gray-200">
                    Llaves disponibles
                  </span>
                </div>
              </button>

              {/* DROPDOWN */}
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute right-0 mt-3 w-[380px] overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20 transition-all duration-300 ${isKeyWalletOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                {/* HEADER */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#004b8d] via-[#116cc0] to-[#7c3aed] px-6 py-6 text-white">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                  <div className="absolute -left-8 bottom-0 w-24 h-24 bg-cyan-300/10 rounded-full blur-2xl"></div>

                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                      <Image
                        src="/logos/llave.png"
                        alt="Llaves"
                        width={58}
                        height={58}
                        className="object-contain"
                      />
                    </div>

                    <div className="mt-4 text-4xl font-black tracking-tight text-yellow-300 drop-shadow-md">
                      {loadingUser
                        ? "..."
                        : consumer?.totalAvailableKeys?.toLocaleString("es-CO")}
                    </div>

                    <div className="text-sm text-blue-100 font-medium mt-1">
                      Llaves Totales Disponibles
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-5 bg-gradient-to-b from-[#f8fbff] to-white">
                  <div className="space-y-3">

                    {/* PURCHASE KEYS */}
                    <div className="group flex items-center justify-between rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 flex items-center justify-center border border-yellow-300/30">
                          <ShoppingBag className="w-6 h-6 text-yellow-600" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Llaves de Compra
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Disponibles para productos y rifas
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-yellow-600">
                          {loadingUser
                            ? "..."
                            : consumer?.purchaseKeys?.toLocaleString("es-CO")}
                        </div>

                        {!!consumer?.blockedPurchaseKeys && (
                          <div className="text-[11px] text-red-500 font-medium mt-1">
                            {consumer.blockedPurchaseKeys} bloqueadas
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONNECTIVITY KEYS */}
                    <div className="group flex items-center justify-between rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 flex items-center justify-center border border-cyan-300/30">
                          <KeyRound className="w-6 h-6 text-cyan-600" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Llaves de Conectividad
                          </p>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Recargas, datos y servicios
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-cyan-700">
                          {loadingUser
                            ? "..."
                            : consumer?.connectivityKeys?.toLocaleString("es-CO")}
                        </div>

                        {!!consumer?.blockedConnectivityKeys && (
                          <div className="text-[11px] text-red-500 font-medium mt-1">
                            {consumer.blockedConnectivityKeys} bloqueadas
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="mt-5">
                    <Link
                      href="/explore/wallet"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#004b8d] to-[#0075c4] text-white px-4 py-4 font-semibold hover:scale-[1.02] transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                      <History className="w-5 h-5" />
                      Historial de Transacciones
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              hasMore={hasMore}
              isOpen={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen((v) => !v)}
              onMarkAllAsRead={markAllAsRead}
              onLoadMore={loadMore}
              menuRef={notificationsMenuRefDesktop}
            />

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

              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute right-0 mt-2 w-64 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${openMenu ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
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
                  <Link href="/explore/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link href="/explore/purchases" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis compras</span>
                  </Link>
                  <Link href={"/explore/favorites"} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <Heart className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis favoritos</span>
                  </Link>
                  <Link href="/explore/participations" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <Ticket className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis participaciones</span>
                  </Link>
                  <Link href="/explore/referrals" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Mis Referidos</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                    <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    <span>Configuración</span>
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
                      onClick={async () => {
                        setOpenMenu(false);
                        await logout();
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ---------- MOBILE TOP BAR ---------- */}
      <div className="lg:hidden sticky top-0 z-50 w-full bg-gradient-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logos/logo.png" alt="Logo" width={45} height={45} />
          <div className="flex items-center gap-3">
            {/* KEY WALLET */}
            <div className="relative" ref={keyWalletMenuRefMobile}>
              <button
                onClick={() => setIsKeyWalletOpen((v) => !v)}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10"
              >
                <Image
                  src="/logos/llave.png"
                  alt="Llaves"
                  width={24}
                  height={24}
                  className="object-contain"
                />

                <span className="text-yellow-300 font-extrabold text-sm">
                  {loadingUser
                    ? "..."
                    : consumer?.totalAvailableKeys?.toLocaleString("es-CO")}
                </span>
              </button>

              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`fixed inset-x-0 top-16 mx-4 overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20 transition-all duration-300 ${isKeyWalletOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                {/* HEADER */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#004b8d] via-[#116cc0] to-[#7c3aed] px-5 py-6 text-white">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
                      <Image
                        src="/logos/llave.png"
                        alt="Llaves"
                        width={56}
                        height={56}
                        className="object-contain"
                      />
                    </div>

                    <div className="mt-4 text-4xl font-black text-yellow-300 tracking-tight">
                      {loadingUser
                        ? "..."
                        : consumer?.totalAvailableKeys?.toLocaleString("es-CO")}
                    </div>

                    <div className="text-sm text-blue-100 mt-1">
                      Llaves Totales Disponibles
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-4 bg-gradient-to-b from-[#f8fbff] to-white">
                  <div className="space-y-3">

                    {/* COMPRA */}
                    <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-yellow-400/15 flex items-center justify-center border border-yellow-300/30">
                          <ShoppingBag className="w-5 h-5 text-yellow-600" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Llaves de Compra
                          </p>

                          <p className="text-[11px] text-gray-500">
                            Productos y rifas
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-yellow-600">
                          {loadingUser
                            ? "..."
                            : consumer?.purchaseKeys?.toLocaleString("es-CO")}
                        </div>

                        {!!consumer?.blockedPurchaseKeys && (
                          <div className="text-[10px] text-red-500 font-medium mt-1">
                            {consumer.blockedPurchaseKeys} bloqueadas
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONECTIVIDAD */}
                    <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-cyan-400/15 flex items-center justify-center border border-cyan-300/30">
                          <KeyRound className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            Llaves de Conectividad
                          </p>

                          <p className="text-[11px] text-gray-500">
                            Datos y servicios
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-cyan-700">
                          {loadingUser
                            ? "..."
                            : consumer?.connectivityKeys?.toLocaleString("es-CO")}
                        </div>

                        {!!consumer?.blockedConnectivityKeys && (
                          <div className="text-[10px] text-red-500 font-medium mt-1">
                            {consumer.blockedConnectivityKeys} bloqueadas
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <div className="mt-5">
                    <Link
                      href="/explore/wallet"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#004b8d] to-[#0075c4] text-white px-4 py-4 font-semibold shadow-lg"
                    >
                      <History className="w-5 h-5" />
                      Historial de Transacciones
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              hasMore={hasMore}
              isOpen={isNotificationsOpen}
              onToggle={() => setIsNotificationsOpen((v) => !v)}
              onMarkAllAsRead={markAllAsRead}
              onLoadMore={loadMore}
              menuRef={notificationsMenuRefMobile}
            />
          </div>
        </div>
      </div>

      {/* ---------- MOBILE BOTTOM NAVIGATION ---------- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-safe">
        <div className="grid grid-cols-5 h-16">

          {/* HOME — nuevo */}
          <Link href="/home" className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${pathname === "/home" ? "text-blue-600" : "text-gray-500"}`}>
              <Home className={`w-6 h-6 ${pathname === "/home" ? "scale-110" : ""}`} />
              <span className="text-xs mt-1 font-medium">Inicio</span>
            </div>
          </Link>

          {/* ANUNCIOS */}
          <Link href="/ads" className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${pathname === "/ads" ? "text-blue-600" : "text-gray-500"}`}>
              <Megaphone className={`w-6 h-6 ${pathname === "/ads" ? "scale-110" : ""}`} />
              <span className="text-xs mt-1 font-medium">Anuncios</span>
            </div>
          </Link>

          {/* RIFAS */}
          <Link href="/raffles" className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${pathname === "/raffles" ? "text-blue-600" : "text-gray-500"}`}>
              <Gift className={`w-6 h-6 ${pathname === "/raffles" ? "scale-110" : ""}`} />
              <span className="text-xs mt-1 font-medium">Rifas</span>
            </div>
          </Link>
          <Link href="/mascota" className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${
              pathname === "/mascota" ? "text-blue-600" : "text-gray-500"
            }`}>
              <span className={`text-2xl ${pathname === "/mascota" ? "scale-110" : ""}`}>
                🐾
              </span>
            <span className="text-xs mt-1 font-medium">Mascota</span>
            </div>
          </Link>
          {/* PRODUCTOS */}
          <Link href="/products" className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${pathname === "/products" ? "text-blue-600" : "text-gray-500"}`}>
              <Package className={`w-6 h-6 ${pathname === "/products" ? "scale-110" : ""}`} />
              <span className="text-xs mt-1 font-medium">Productos</span>
            </div>
          </Link>

          {/* PERFIL */}
          <button onClick={() => setOpenMenu((v) => !v)} className="flex flex-col items-center justify-center">
            <div className={`flex flex-col items-center justify-center transition-all ${openMenu ? "text-blue-600" : "text-gray-500"}`}>
              <User className={`w-6 h-6 ${openMenu ? "scale-110" : ""}`} />
              <span className="text-xs mt-1 font-medium">Perfil</span>
            </div>
          </button>

        </div>
      </nav>

      {/* MOBILE PROFILE MENU (FULL SCREEN) */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${openMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpenMenu(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300 ${openMenu ? "translate-y-0" : "translate-y-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="font-bold text-lg">
                  {loadingUser ? "Cargando..." : consumer?.name ?? "Usuario"}
                </div>
                <div className="text-sm text-blue-100">Beneficiario</div>
              </div>
            </div>
          </div>
          <div className="py-2 pb-20">
            <Link href="/explore/profile" className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 active:bg-blue-100 transition-all" onClick={() => setOpenMenu(false)}>
              <UserCircle className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Mi Perfil</span>
            </Link>
            <Link href="/purchases" className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 active:bg-blue-100 transition-all" onClick={() => setOpenMenu(false)}>
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Mis compras</span>
            </Link>
            <Link href="/explore/referrals" className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 active:bg-blue-100 transition-all" onClick={() => setOpenMenu(false)}>
              <UserCircle className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Mis Referidos</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-4 px-6 py-4 hover:bg-blue-50 active:bg-blue-100 transition-all" onClick={() => setOpenMenu(false)}>
              <Settings className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Configuración</span>
            </Link>
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer"
                onClick={async () => {
                  setOpenMenu(false);
                  await logout();
                }}
              >
                <LogOut className="w-6 h-6" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}