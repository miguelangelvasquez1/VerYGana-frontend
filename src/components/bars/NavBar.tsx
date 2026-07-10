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
  Headset,
  LogOut,
  Heart,
  Home,
  Ticket,
  KeyRound,
  Gamepad2,
  PawPrint,
  ClipboardList,
  Smartphone,
  MessageSquare,
  Zap,
} from "lucide-react";

import { useConsumerData } from "@/hooks/consumer/useConsumerData";
import { CartButton } from "../consumer/cart/CartButton";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPanel } from "../notifications/NotificationsPanel";
import { useLogout } from '@/hooks/useLogout';
import { useLevelProfile } from '@/hooks/useLevelProfile'
import { XpRewardToast } from '@/components/levels/XpRewardToast'
import { useXpReward } from '@/hooks/useXpReward'

const navItems = [
  { href: '/home',              label: 'Inicio',    Icon: Home          },
  { href: '/raffles',           label: 'Rifas',     Icon: Gift          },
  { href: '/games',             label: 'Juegos',    Icon: Gamepad2      },
  { href: '/pet',               label: '🐾 Mascota', Icon: PawPrint     },
  { href: '/ads',               label: 'Anuncios',  Icon: Megaphone     },
  { href: '/surveys',           label: 'Encuestas', Icon: ClipboardList },
  { href: '/products',          label: 'Productos', Icon: Package       },
  { href: '/plans/mobile-plans',label: 'Recargas',  Icon: Smartphone    },
  { href: '/forum',             label: 'Foro',      Icon: MessageSquare },
] as const;


export default function Navbar() {
  const pathname = usePathname();

  const { profile: levelProfile, colors: lvColors, pct: lvPct, label: lvLabel } = useLevelProfile()
  // UI state
  const [openMenu, setOpenMenu] = useState(false);
  const [isKeyWalletOpen, setIsKeyWalletOpen] = useState(false);
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

  const { data: consumer, isLoading: loadingUser } = useConsumerData();

  // refs independientes
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const keyWalletMenuRefDesktop = useRef<HTMLDivElement | null>(null);
  const keyWalletMenuRefMobile = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRefDesktop = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRefMobile = useRef<HTMLDivElement | null>(null);
  const { rewardData, dismiss } = useXpReward()



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

  const btnBase   = "cursor-pointer rounded-full transform transition-all duration-200 p-2 2xl:px-4 2xl:py-2";
  const btnNormal = `${btnBase} bg-white/15 text-white font-medium hover:bg-white/30 hover:scale-105 backdrop-blur-sm`;
  const btnActive = `${btnBase} bg-white text-[#00a4ff] font-bold shadow-lg scale-105`;

  const getNavClass = (isActive: boolean) => isActive ? btnActive : btnNormal;

  return (
    <>
      {/* ---------- DESKTOP NAV (top) ---------- */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full bg-linear-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-6 py-2">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <Image src="/logos/logoDorado.png" alt="Logo" width={60} height={60} />
          </div>

          {/* NAV BUTTONS */}
          <div className="flex gap-2 2xl:gap-3">
            {navItems.map(({ href, label, Icon }) => (
              <Link href={href} key={href}>
                <button title={label} className={getNavClass(pathname === href)}>
                  <Icon className="w-5 h-5 2xl:hidden" />
                  <span className="hidden 2xl:inline">{label}</span>
                </button>
              </Link>
            ))}
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
                  width={42}
                  height={42}
                  className="object-contain drop-shadow-md"
                />

                <div className="flex flex-col items-center leading-tight">
                  <span className="text-yellow-300 font-extrabold text-sm">
                    {loadingUser
                      ? "..."
                      : (consumer?.totalAvailableKeys ?? 0).toLocaleString("es-CO")}
                  </span>

                  <span className="text-[11px] text-gray-200">
                    Llaves disponibles
                  </span>
                </div>
              </button>

              {/* DROPDOWN */}
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute right-0 mt-3 w-95 overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/20 transition-all duration-300 ${isKeyWalletOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
                  }`}
              >
                {/* HEADER */}
                <div className="relative overflow-hidden bg-linear-to-br from-[#004b8d] via-[#116cc0] to-[#7c3aed] px-6 py-6 text-white">
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
                        : (consumer?.totalAvailableKeys ?? 0).toLocaleString("es-CO")}
                    </div>

                    <div className="text-sm text-blue-100 font-medium mt-1">
                      Llaves Totales Disponibles
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-5 bg-linear-to-b from-[#f8fbff] to-white">
                  <div className="space-y-3">

                    {/* PURCHASE KEYS */}
                    <div className="group flex items-center justify-between rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-4 hover:shadow-md transition-all">
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
                    <div className="group flex items-center justify-between rounded-2xl border border-cyan-100 bg-linear-to-r from-cyan-50 to-blue-50 px-4 py-4 hover:shadow-md transition-all">
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
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#004b8d] to-[#0075c4] text-white px-4 py-4 font-semibold hover:scale-[1.02] transition-all shadow-lg hover:shadow-blue-500/20"
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
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden flex items-center justify-center">
                  {consumer?.avatarUrl ? (
                    <Image src={consumer.avatarUrl} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <User className="text-white w-5 h-5" />
                  )}
              </div>
                <div className="min-w-0">
                <div className="font-semibold leading-tight">
                  {loadingUser ? "Cargando..." : consumer?.name ?? "Usuario"}
                </div>
                {/* Mini barra de XP */}
                {levelProfile && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${lvPct}%`, background: lvColors.bar }}
                      />
                    </div>
                    <span className="text-[10px] text-white/70 font-medium">{lvLabel}</span>
                  </div>
                )}
              </div>
              </button>

              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute right-0 mt-2 w-64 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ${openMenu ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                <div className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] p-4 rounded-t-2xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                      {consumer?.avatarUrl ? (
                        <Image src={consumer.avatarUrl} alt="Avatar" width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {loadingUser ? "..." : consumer?.name ?? "Usuario"}
                      </div>
                      <div className="text-xs text-white/70">Beneficiario</div>
                    </div>
                  </div>
                  {/* Barra de nivel */}
                  {levelProfile && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: lvColors.badge, color: lvColors.text }}
                        >
                          {lvLabel}
                        </span>
                        <span className="text-[11px] text-white/60">
                          {levelProfile.xpTotal.toLocaleString('es-CO')} XP
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${lvPct}%`, background: lvColors.bar }}
                        />
                      </div>
                      {levelProfile.currentLevel !== 'DIAMANTE' && (
                        <p className="text-[10px] text-white/50 mt-1 text-right">
                          {levelProfile.xpToNextLevel.toLocaleString('es-CO')} XP para el siguiente nivel
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="py-2">
                  <Link href="/explore/gamification" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <Zap className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mi Nivel</span>
                  </Link>
                  <Link href="/explore/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link href="/explore/purchases" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mis compras</span>
                  </Link>
                  <Link href={"/explore/favorites"} className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <Heart className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mis favoritos</span>
                  </Link>
                  <Link href="/explore/participations" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <Ticket className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mis participaciones</span>
                  </Link>
                  <Link href="/explore/referrals" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Mis Referidos</span>
                  </Link>
                  <Link href="/support" className="flex items-center gap-3 px-4 py-3 hover:bg-[#00a4ff]/10 hover:text-[#00a4ff] transition-all group">
                    <Headset className="w-5 h-5 text-gray-400 group-hover:text-[#00a4ff]" />
                    <span>Soporte</span>
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
      <div className="lg:hidden sticky top-0 z-50 w-full bg-linear-to-r from-[#004b8d] via-[#0075c4] to-[#004b8d] text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logos/logoDorado.png" alt="Logo" width={50} height={50} />
          <div className="flex items-center gap-3">
            {/* CART */}
            <CartButton />
            {/* KEY WALLET */}
            <div className="relative" ref={keyWalletMenuRefMobile}>
              <button
                onClick={() => setIsKeyWalletOpen((v) => !v)}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10"
              >
                <Image
                  src="/logos/llave.png"
                  alt="Llaves"
                  width={44}
                  height={44}
                  className="object-contain drop-shadow-md"
                />

                <span className="text-yellow-300 font-extrabold text-sm">
                  {loadingUser
                    ? "..."
                    : (consumer?.totalAvailableKeys ?? 0).toLocaleString("es-CO")}
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
                <div className="relative overflow-hidden bg-linear-to-br from-[#004b8d] via-[#116cc0] to-[#7c3aed] px-5 py-6 text-white">
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
                        : (consumer?.totalAvailableKeys ?? 0).toLocaleString("es-CO")}
                    </div>

                    <div className="text-sm text-blue-100 mt-1">
                      Llaves Totales Disponibles
                    </div>
                  </div>
                </div>

                {/* BODY */}
                <div className="p-4 bg-linear-to-b from-[#f8fbff] to-white">
                  <div className="space-y-3">

                    {/* COMPRA */}
                    <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-linear-to-r from-amber-50 to-yellow-50 px-4 py-4">
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
                    <div className="flex items-center justify-between rounded-2xl border border-cyan-100 bg-linear-to-r from-cyan-50 to-blue-50 px-4 py-4">
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
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#004b8d] to-[#0075c4] text-white px-4 py-4 font-semibold shadow-lg"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] shadow-lg pb-safe">
        <div className="grid grid-cols-6 h-16">

          {/* HOME */}
          <Link href="/home" className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${pathname === "/home" ? "bg-white/20" : ""}`}>
                <Home className={`w-5 h-5 transition-all duration-200 ${pathname === "/home" ? "text-[#00a4ff]" : "text-white/70"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${pathname === "/home" ? "text-[#00a4ff]" : "text-white/70"}`}>Inicio</span>
            </div>
          </Link>

          {/* ANUNCIOS */}
          <Link href="/ads" className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${pathname === "/ads" ? "bg-white/20" : ""}`}>
                <Megaphone className={`w-5 h-5 transition-all duration-200 ${pathname === "/ads" ? "text-[#00a4ff]" : "text-white/70"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${pathname === "/ads" ? "text-[#00a4ff]" : "text-white/70"}`}>Anuncios</span>
            </div>
          </Link>

          {/* RIFAS */}
          <Link href="/raffles" className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${pathname === "/raffles" ? "bg-white/20" : ""}`}>
                <Gift className={`w-5 h-5 transition-all duration-200 ${pathname === "/raffles" ? "text-[#00a4ff]" : "text-white/70"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${pathname === "/raffles" ? "text-[#00a4ff]" : "text-white/70"}`}>Rifas</span>
            </div>
          </Link>

          {/* MASCOTA */}
          <Link href="/mascota" className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${pathname === "/mascota" ? "bg-white/20" : ""}`}>
                <span className={`text-xl leading-none transition-all duration-200 ${pathname === "/mascota" ? "scale-110" : "opacity-70"}`}>🐾</span>
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${pathname === "/mascota" ? "text-[#00a4ff]" : "text-white/70"}`}>Mascota</span>
            </div>
          </Link>

          {/* PRODUCTOS */}
          <Link href="/products" className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${pathname === "/products" ? "bg-white/20" : ""}`}>
                <Package className={`w-5 h-5 transition-all duration-200 ${pathname === "/products" ? "text-[#00a4ff]" : "text-white/70"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${pathname === "/products" ? "text-[#00a4ff]" : "text-white/70"}`}>Productos</span>
            </div>
          </Link>

          {/* PERFIL */}
          <button onClick={() => setOpenMenu((v) => !v)} className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`p-1.5 rounded-full transition-all duration-200 ${openMenu ? "bg-white/20" : ""}`}>
                <User className={`w-5 h-5 transition-all duration-200 ${openMenu ? "text-[#00a4ff]" : "text-white/70"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 ${openMenu ? "text-[#00a4ff]" : "text-white/70"}`}>Perfil</span>
            </div>
          </button>

        </div>
      </nav>

      {/* MOBILE PROFILE MENU (FULL SCREEN) */}
      <div
        className={`lg:hidden fixed inset-0 z-60 bg-black/50 transition-opacity duration-300 ${openMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpenMenu(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300 ${openMenu ? "translate-y-0" : "translate-y-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-linear-to-r from-[#0b1440] via-[#03548C] to-[#0b1440] p-6 rounded-t-3xl text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                {consumer?.avatarUrl ? (
                  <Image src={consumer.avatarUrl} alt="Avatar" width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg truncate">
                  {loadingUser ? "Cargando..." : consumer?.name ?? "Usuario"}
                </div>
                <div className="text-sm text-white/70">Beneficiario</div>
              </div>
            </div>
            {/* Barra de nivel mobile */}
            {levelProfile && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: lvColors.badge, color: lvColors.text }}
                  >
                    {lvLabel}
                  </span>
                  <span className="text-xs text-white/60">
                    {levelProfile.xpTotal.toLocaleString('es-CO')} XP
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${lvPct}%`, background: lvColors.bar }}
                  />
                </div>
                {levelProfile.currentLevel !== 'DIAMANTE' && (
                  <p className="text-[11px] text-white/50 mt-1.5 text-right">
                    {levelProfile.xpToNextLevel.toLocaleString('es-CO')} XP para el siguiente nivel
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="py-2 pb-20">
            <Link href="/explore/gamification" className="flex items-center gap-4 px-6 py-4 hover:bg-[#00a4ff]/10 active:bg-[#00a4ff]/20 transition-all group" onClick={() => setOpenMenu(false)}>
              <Zap className="w-6 h-6 text-gray-400 group-hover:text-[#00a4ff]" />
              <span className="font-medium group-hover:text-[#00a4ff]">Mi Nivel</span>
            </Link>
            <Link href="/explore/profile" className="flex items-center gap-4 px-6 py-4 hover:bg-[#00a4ff]/10 active:bg-[#00a4ff]/20 transition-all group" onClick={() => setOpenMenu(false)}>
              <UserCircle className="w-6 h-6 text-gray-400 group-hover:text-[#00a4ff]" />
              <span className="font-medium group-hover:text-[#00a4ff]">Mi Perfil</span>
            </Link>
            <Link href="/purchases" className="flex items-center gap-4 px-6 py-4 hover:bg-[#00a4ff]/10 active:bg-[#00a4ff]/20 transition-all group" onClick={() => setOpenMenu(false)}>
              <ShoppingBag className="w-6 h-6 text-gray-400 group-hover:text-[#00a4ff]" />
              <span className="font-medium group-hover:text-[#00a4ff]">Mis compras</span>
            </Link>
            <Link href="/explore/referrals" className="flex items-center gap-4 px-6 py-4 hover:bg-[#00a4ff]/10 active:bg-[#00a4ff]/20 transition-all group" onClick={() => setOpenMenu(false)}>
              <UserCircle className="w-6 h-6 text-gray-400 group-hover:text-[#00a4ff]" />
              <span className="font-medium group-hover:text-[#00a4ff]">Mis Referidos</span>
            </Link>
            <Link href="/support" className="flex items-center gap-4 px-6 py-4 hover:bg-[#00a4ff]/10 active:bg-[#00a4ff]/20 transition-all group" onClick={() => setOpenMenu(false)}>
              <Headset className="w-6 h-6 text-gray-400 group-hover:text-[#00a4ff]" />
              <span className="font-medium group-hover:text-[#00a4ff]">Soporte</span>
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
      <XpRewardToast data={rewardData} onDismiss={dismiss} />
    </>
  );
}